import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

type Db = Prisma.TransactionClient | PrismaClient;

type IdRow = { id: number };

async function existeAutonomo(db: Db, id: number): Promise<boolean> {
  const rows = await db.$queryRaw<IdRow[]>(
    Prisma.sql`SELECT "id" FROM "autonomos" WHERE "id" = ${id} LIMIT 1`
  );
  return rows.length > 0;
}

async function primeiroAutonomoId(db: Db): Promise<number | null> {
  const rows = await db.$queryRaw<IdRow[]>(
    Prisma.sql`SELECT "id" FROM "autonomos" ORDER BY "id" ASC LIMIT 1`
  );
  return rows[0]?.id ?? null;
}

export async function resolveOwnerAutonomoIdForCreate(db: Db, bodyOwnerId: unknown): Promise<number> {
  const parsed =
    typeof bodyOwnerId === "number"
      ? bodyOwnerId
      : typeof bodyOwnerId === "string"
        ? parseInt(bodyOwnerId, 10)
        : NaN;

  if (Number.isFinite(parsed) && parsed > 0 && (await existeAutonomo(db, parsed))) {
    return parsed;
  }

  const env = parseInt(process.env.DEFAULT_AUTONOMO_ID ?? "", 10);
  if (Number.isFinite(env) && env > 0 && (await existeAutonomo(db, env))) {
    return env;
  }

  const firstAutonomoId = await primeiroAutonomoId(db);
  if (firstAutonomoId) return firstAutonomoId;

  throw new Error(
    "Nenhum autônomo cadastrado. Execute as migrations do Prisma (tabela autonomos deve ter ao menos 1 registro)."
  );
}
