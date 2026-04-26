import { PrismaClient } from "@prisma/client";
import { syncOrcamentosIdSequence } from "../lib/sync-orcamentos-sequence";

const prisma = new PrismaClient();

async function main() {
  await syncOrcamentosIdSequence(prisma);
  console.log("Sequência de orcamentos.id sincronizada com MAX(id).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
