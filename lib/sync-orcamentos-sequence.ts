import type { PrismaClient } from "@prisma/client";

type DbClient = Pick<PrismaClient, "$executeRaw">;

/**
 * Alinha a sequência SERIAL de `orcamentos.id` com o maior ID existente.
 * Necessário após inserções com `id` explícito (ex.: importação legada), senão
 * novos INSERTs podem gerar P2002 (id duplicado).
 */
export async function syncOrcamentosIdSequence(client: DbClient): Promise<void> {
  await client.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('orcamentos', 'id'),
      COALESCE((SELECT MAX(id) FROM orcamentos), 1),
      (SELECT MAX(id) FROM orcamentos) IS NOT NULL
    )
  `;
}
