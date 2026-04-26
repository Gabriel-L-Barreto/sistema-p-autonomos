import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient, TipoMedida, Status } from "@prisma/client";
import { syncOrcamentosIdSequence } from "../lib/sync-orcamentos-sequence";

type CliArgs = {
  source: string;
  table?: string;
  dryRun: boolean;
};

type LegacyRow = {
  numero: string | number | null;
  cliente: string | null;
  data: string | null;
  valor: string | number | null;
};

type LegacyExtract = {
  selectedTable: string;
  mapping: Record<string, string>;
  totalRows: number;
  rows: LegacyRow[];
};

const prisma = new PrismaClient();

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { source: "", dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--source") args.source = argv[i + 1] ?? "";
    if (token === "--table") args.table = argv[i + 1] ?? "";
    if (token === "--dry-run") args.dryRun = true;
  }
  if (!args.source) {
    throw new Error(
      'Uso: npx tsx scripts/import-legacy-orcamentos.ts --source "C:\\caminho\\orcamentos.db" [--table nome_tabela] [--dry-run]'
    );
  }
  return args;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v) return null;

  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const m = v.match(br);
  if (m) {
    const d = Number(m[1]);
    const mo = Number(m[2]);
    const y = Number(m[3]);
    const dt = new Date(y, mo - 1, d);
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  const direct = new Date(v);
  if (!Number.isNaN(direct.getTime())) return direct;
  return null;
}

function normalizeClientName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > 0 ? trimmed : null;
}

function runPythonExtract(dbPath: string, table?: string): LegacyExtract {
  const pythonScript = `
import sqlite3, json, sys

db_path = sys.argv[1]
table_forced = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else None

aliases = {
  "numero": ["numero","num_orcamento","numero_orcamento","orcamento","orcamento_numero","id_orcamento","nr_orcamento","codigo","cod_orcamento","number","budget_number"],
  "cliente": ["cliente","nome_cliente","cliente_nome","nome","nm_cliente","razao_social","contratante","client","client_name","customer","customer_name"],
  "data": ["data","data_orcamento","dt_orcamento","dataorcamento","dt_emissao","emissao","created_at","date","budget_date"],
  "valor": ["valor","valor_total","total","valor_orcamento","vl_total","vl_orcamento","preco_total","valorfinal","amount","total_cost","budget_total","total_value"]
}

def score_column(col, target):
  col_l = col.lower()
  score = 0
  for idx, alias in enumerate(aliases[target]):
    if col_l == alias:
      score = max(score, 100 - idx)
    elif alias in col_l:
      score = max(score, 60 - idx)
  return score

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
tables = [r[0] for r in cur.fetchall()]

if not tables:
  raise Exception("Nenhuma tabela encontrada no arquivo legado.")

def columns_of(table_name):
  cur.execute(f"PRAGMA table_info('{table_name}')")
  return [r[1] for r in cur.fetchall()]

def has_table(table_name):
  return table_name in tables

def best_col(cols, key):
  scored = sorted([(score_column(c, key), c) for c in cols], reverse=True)
  return scored[0][1] if scored and scored[0][0] > 0 else None

selected_table = None
selected_mapping = None
best_score = -1

if table_forced:
  if table_forced not in tables:
    raise Exception(f"Tabela forçada '{table_forced}' não existe no banco legado.")
  selected_table = table_forced
  cols = columns_of(table_forced)
  mapping = {}
  for key in aliases.keys():
    mapping[key] = best_col(cols, key)
  if "client_id" in [c.lower() for c in cols] and has_table("clients"):
    clients_cols = columns_of("clients")
    if any(c.lower() == "name" for c in clients_cols):
      mapping["cliente"] = "__JOIN_CLIENTS_NAME__"
  if not all(mapping.get(k) for k in ("cliente","data","valor")):
    raise Exception("Mapeamento automático insuficiente na tabela forçada. Necessário pelo menos cliente, data e valor.")
  selected_mapping = mapping
else:
  for t in tables:
    cols = columns_of(t)
    local = {}
    total = 0
    for key in aliases.keys():
      col = best_col(cols, key)
      if col:
        local[key] = col
        total += score_column(col, key)
      else:
        local[key] = None
    if "client_id" in [c.lower() for c in cols] and has_table("clients"):
      clients_cols = columns_of("clients")
      if any(c.lower() == "name" for c in clients_cols):
        local["cliente"] = "__JOIN_CLIENTS_NAME__"
        total += 180
    if local["cliente"] and local["data"] and local["valor"]:
      total += 500
    if total > best_score:
      best_score = total
      selected_table = t
      selected_mapping = local

if not selected_table or not selected_mapping:
  raise Exception("Não foi possível identificar uma tabela de orçamentos no legado.")

if not selected_mapping.get("cliente") or not selected_mapping.get("data") or not selected_mapping.get("valor"):
  raise Exception(f"Tabela escolhida '{selected_table}' não possui colunas mínimas (cliente/data/valor) identificáveis.")

select_cols = []
for key in ("numero","cliente","data","valor"):
  col = selected_mapping.get(key)
  if col and col != "__JOIN_CLIENTS_NAME__":
    select_cols.append(f'"{col}" AS "{key}"')
  elif key == "cliente" and col == "__JOIN_CLIENTS_NAME__":
    select_cols.append('clients.name AS "cliente"')
  else:
    select_cols.append(f"NULL AS '{key}'")

join_clause = ""
if selected_mapping.get("cliente") == "__JOIN_CLIENTS_NAME__":
  join_clause = " LEFT JOIN clients ON clients.id = main.client_id "

sql = f"SELECT {', '.join(select_cols)} FROM '{selected_table}' main{join_clause}"
cur.execute(sql)
rows = [dict(r) for r in cur.fetchall()]

print(json.dumps({
  "selectedTable": selected_table,
  "mapping": selected_mapping,
  "totalRows": len(rows),
  "rows": rows
}, ensure_ascii=False))
`.trim();

  const run = spawnSync(
    "python",
    ["-c", pythonScript, dbPath, table ?? ""],
    { encoding: "utf-8" }
  );

  if (run.status !== 0) {
    const stderr = (run.stderr || "").trim();
    throw new Error(
      `Falha ao ler banco legado com Python. Detalhe: ${stderr || "erro desconhecido"}`
    );
  }

  return JSON.parse(run.stdout) as LegacyExtract;
}

async function ensureOwnerAutonomoId(): Promise<number> {
  const first = await prisma.autonomo.findFirst({ orderBy: { id: "asc" } });
  if (first) return first.id;
  const created = await prisma.autonomo.create({
    data: { nome: "Importação Legado" },
  });
  return created.id;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const dbPath = path.resolve(args.source);

  if (!existsSync(dbPath)) {
    throw new Error(`Arquivo legado não encontrado: ${dbPath}`);
  }

  const extracted = runPythonExtract(dbPath, args.table);
  const ownerAutonomoId = await ensureOwnerAutonomoId();

  const sanitized = extracted.rows
    .map((r) => {
      const cliente = normalizeClientName(r.cliente);
      const data = toDate(r.data);
      const valor = toNumber(r.valor);
      const numero = toNumber(r.numero);
      if (!cliente || !data || valor == null || valor < 0) return null;
      return { cliente, data, valor, numero };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (sanitized.length === 0) {
    throw new Error("Nenhum orçamento válido encontrado após sanitização.");
  }

  const uniqueClients = Array.from(new Set(sanitized.map((r) => r.cliente)));
  const numeroSet = new Set<number>();
  let validNumeroCount = 0;
  for (const row of sanitized) {
    if (row.numero && Number.isInteger(row.numero) && row.numero > 0 && !numeroSet.has(row.numero)) {
      validNumeroCount += 1;
      numeroSet.add(row.numero);
    }
  }

  console.log("=== Prévia da importação ===");
  console.log(`Arquivo legado: ${dbPath}`);
  console.log(`Tabela detectada: ${extracted.selectedTable}`);
  console.log(`Mapeamento detectado: ${JSON.stringify(extracted.mapping)}`);
  console.log(`Linhas lidas: ${extracted.totalRows}`);
  console.log(`Orçamentos válidos: ${sanitized.length}`);
  console.log(`Clientes únicos válidos: ${uniqueClients.length}`);
  console.log(`Números legados reaproveitáveis como ID: ${validNumeroCount}`);
  console.log(`Modo: ${args.dryRun ? "DRY RUN (sem alterações)" : "EXECUÇÃO REAL"}`);

  if (args.dryRun) return;

  await prisma.$transaction(async (tx) => {
    await tx.pagamento.deleteMany();
    await tx.materialOrcamento.deleteMany();
    await tx.servicoOrcamento.deleteMany();
    await tx.orcamentoStatusHistorico.deleteMany();
    await tx.orcamento.deleteMany();
    await tx.cliente.deleteMany();

    const existingGenericService = await tx.servico.findFirst({
      where: {
        ownerAutonomoId,
        descricao: "Serviço importado (legado)",
      },
    });

    const genericService = existingGenericService
      ? await tx.servico.update({
          where: { id: existingGenericService.id },
          data: {
            tipo_cobranca: TipoMedida.UNITARIO,
            precoBase: 0,
            servicoAtivo: true,
          },
        })
      : await tx.servico.create({
          data: {
            ownerAutonomoId,
            descricao: "Serviço importado (legado)",
            tipo_cobranca: TipoMedida.UNITARIO,
            precoBase: 0,
            servicoAtivo: true,
          },
        });

    const clientMap = new Map<string, number>();
    for (const nome of uniqueClients) {
      const c = await tx.cliente.create({
        data: { nome, afiliacao: null, telefone: null, ownerAutonomoId },
      });
      clientMap.set(nome, c.id);
    }

    const usedIds = new Set<number>();
    for (const row of sanitized) {
      const clienteId = clientMap.get(row.cliente);
      if (!clienteId) continue;

      const maybeLegacyId =
        row.numero && Number.isInteger(row.numero) && row.numero > 0 && !usedIds.has(row.numero)
          ? row.numero
          : undefined;
      if (maybeLegacyId) usedIds.add(maybeLegacyId);

      const orcamento = await tx.orcamento.create({
        data: {
          ...(maybeLegacyId ? { id: maybeLegacyId } : {}),
          ownerAutonomoId,
          clienteId,
          endereco: "Importado do sistema legado",
          data: row.data,
          tempoEstimado: null,
          incluiMaterial: false,
          totalParcelas: null,
          status: Status.CADASTRADO,
          complemento: row.numero
            ? `Importado do sistema legado. Número legado: ${row.numero}`
            : "Importado do sistema legado.",
        },
      });

      await tx.servicoOrcamento.create({
        data: {
          orcamentoId: orcamento.id,
          servicoId: genericService.id,
          descricaoLivre: "Serviço genérico para importação de orçamento legado.",
          quantidade: 1,
          valorMaoObra: row.valor,
        },
      });

      await tx.orcamentoStatusHistorico.create({
        data: { orcamentoId: orcamento.id, status: Status.CADASTRADO },
      });
    }
  });

  await syncOrcamentosIdSequence(prisma);

  console.log("Importação concluída com sucesso.");
}

run()
  .catch((error) => {
    console.error(`Erro na importação: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
