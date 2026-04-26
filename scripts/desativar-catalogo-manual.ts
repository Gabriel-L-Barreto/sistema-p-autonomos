import { prisma } from "../lib/prisma";

async function main() {
  const [materiais, servicos] = await Promise.all([
    prisma.material.updateMany({
      data: { ativo: false },
    }),
    prisma.servico.updateMany({
      data: { servicoAtivo: false },
    }),
  ]);

  console.log(`Materiais desativados: ${materiais.count}`);
  console.log(`Serviços desativados: ${servicos.count}`);
  console.log("Catálogo manual desativado. Itens SINAPI não são afetados.");
}

main()
  .catch((err) => {
    console.error("Falha ao desativar catálogo:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
