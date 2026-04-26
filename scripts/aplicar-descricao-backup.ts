import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

type CliArgs = {
  source: string;
  dryRun: boolean;
};

type Row = {
  number: number;
  description: string;
};

const prisma = new PrismaClient();

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { source: "", dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--source") args.source = argv[i + 1] ?? "";
    if (argv[i] === "--dry-run") args.dryRun = true;
  }
  if (!args.source) {
    throw new Error(
      'Uso: npx tsx scripts/aplicar-descricao-backup.ts --source "C:\\caminho\\orcamentos_backup.db" [--dry-run]'
    );
  }
  return args;
}

function readRowsFromBackup(dbPath: string): Row[] {
  const py = `
import sqlite3, json, sys
db = sys.argv[1]
con = sqlite3.connect(db)
con.row_factory = sqlite3.Row
cur = con.cursor()
cur.execute("SELECT number, description FROM budgets")
rows = []
for r in cur.fetchall():
  n = r["number"]
  d = r["description"]
  if n is None or d is None:
    continue
  d = str(d).strip()
  if not d:
    continue
  rows.append({"number": int(n), "description": d})
print(json.dumps(rows, ensure_ascii=False))
`.trim();

  const res = spawnSync("python", ["-c", py, dbPath], { encoding: "utf-8" });
  if (res.status !== 0) {
    throw new Error(`Falha ao ler backup: ${(res.stderr || "").trim() || "erro desconhecido"}`);
  }
  return JSON.parse(res.stdout) as Row[];
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const backupPath = path.resolve(args.source);
  if (!existsSync(backupPath)) {
    throw new Error(`Arquivo não encontrado: ${backupPath}`);
  }

  const rawRows = readRowsFromBackup(backupPath);
  const dedup = new Map<number, string>();
  for (const row of rawRows) {
    const prev = dedup.get(row.number);
    if (!prev || row.description.length > prev.length) {
      dedup.set(row.number, row.description);
    }
  }
  const rows = Array.from(dedup.entries()).map(([number, description]) => ({ number, description }));

  let matched = 0;
  let noBudget = 0;
  let noServiceLine = 0;
  let updated = 0;

  console.log(`Linhas no backup com descrição válida: ${rows.length}`);
  console.log(`Modo: ${args.dryRun ? "DRY RUN" : "EXECUÇÃO REAL"}`);

  if (args.dryRun) {
    for (const row of rows) {
      const orc =
        (await prisma.orcamento.findUnique({
          where: { id: row.number },
          include: { servicos: true },
        })) ||
        (await prisma.orcamento.findFirst({
          where: { complemento: { contains: `Número legado: ${row.number}` } },
          include: { servicos: true },
        }));
      if (!orc) {
        noBudget += 1;
        continue;
      }
      matched += 1;
      const line = orc.servicos.find((s) => s.servicoId !== null) ?? orc.servicos[0];
      if (!line) noServiceLine += 1;
    }
    console.log(`Orçamentos encontrados para atualização: ${matched}`);
    console.log(`Sem orçamento correspondente: ${noBudget}`);
    console.log(`Sem linha de serviço para atualizar: ${noServiceLine}`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const orc =
        (await tx.orcamento.findUnique({
          where: { id: row.number },
          include: { servicos: true },
        })) ||
        (await tx.orcamento.findFirst({
          where: { complemento: { contains: `Número legado: ${row.number}` } },
          include: { servicos: true },
        }));

      if (!orc) {
        noBudget += 1;
        continue;
      }
      matched += 1;

      const line = orc.servicos.find((s) => s.servicoId !== null) ?? orc.servicos[0];
      if (!line) {
        noServiceLine += 1;
        continue;
      }

      await tx.servicoOrcamento.update({
        where: { id: line.id },
        data: {
          servicoId: null,
          descricaoLivre: row.description,
        },
      });
      updated += 1;
    }
  });

  console.log(`Orçamentos encontrados: ${matched}`);
  console.log(`Atualizações aplicadas: ${updated}`);
  console.log(`Sem orçamento correspondente: ${noBudget}`);
  console.log(`Sem linha de serviço para atualizar: ${noServiceLine}`);
}

run()
  .catch((e) => {
    console.error(`Erro: ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
