import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

type Db = Prisma.TransactionClient | PrismaClient;

type IdRow = { id: number };

async function existeIdNaTabela(db: Db, tabela: "users" | "autonomos", id: number): Promise<boolean> {
  const rows = await db.$queryRaw<IdRow[]>(
    Prisma.sql`SELECT "id" FROM ${Prisma.raw(`"${tabela}"`)} WHERE "id" = ${id} LIMIT 1`
  );
  return rows.length > 0;
}

async function primeiroIdDaTabela(db: Db, tabela: "users" | "autonomos"): Promise<number | null> {
  const rows = await db.$queryRaw<IdRow[]>(
    Prisma.sql`SELECT "id" FROM ${Prisma.raw(`"${tabela}"`)} ORDER BY "id" ASC LIMIT 1`
  );
  return rows[0]?.id ?? null;
}

async function resolveOwnerNoBanco(db: Db, preferido: number): Promise<number | null> {
  if (await existeIdNaTabela(db, "users", preferido)) return preferido;
  if (await existeIdNaTabela(db, "autonomos", preferido)) return preferido;
  return null;
}

export async function resolveOwnerAutonomoIdForCreate(db: Db, bodyOwnerId: unknown): Promise<number> {
  const parsed =
    typeof bodyOwnerId === "number"
      ? bodyOwnerId
      : typeof bodyOwnerId === "string"
        ? parseInt(bodyOwnerId, 10)
        : NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    const owner = await resolveOwnerNoBanco(db, parsed);
    if (owner) return owner;
  }

  const env = parseInt(process.env.DEFAULT_AUTONOMO_ID ?? "", 10);
  if (Number.isFinite(env) && env > 0) {
    const owner = await resolveOwnerNoBanco(db, env);
    if (owner) return owner;
  }

  const firstUserId = await primeiroIdDaTabela(db, "users");
  if (firstUserId) return firstUserId;

  const firstAutonomoId = await primeiroIdDaTabela(db, "autonomos");
  if (firstAutonomoId) return firstAutonomoId;

  throw new Error(
    "Nenhum owner disponível em users/autonomos. Verifique as migrations e se existe ao menos 1 usuário ativo."
  );
}
