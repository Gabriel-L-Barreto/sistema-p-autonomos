import { PrismaClient } from "@prisma/client";

/** Limpa dados de negócio; não popula exemplo. */
const prisma = new PrismaClient();

async function main() {
  await prisma.controleGastoDia.deleteMany();
  await prisma.pagamento.deleteMany();
  await prisma.materialOrcamento.deleteMany();
  await prisma.servicoOrcamento.deleteMany();
  await prisma.orcamentoStatusHistorico.deleteMany();
  await prisma.orcamento.deleteMany();
  await prisma.servicoMaterial.deleteMany();
  await prisma.servico.deleteMany();
  await prisma.material.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.empresaConfig.deleteMany();

  await prisma.autonomo.upsert({
    where: { id: 1 },
    update: { nome: "Demo" },
    create: { id: 1, nome: "Demo" },
  });

  await prisma.empresaConfig.create({
    data: {
      cabecalho: "Sistema de Orçamentos (demo)\nContatos: / Email:\nEndereço",
      cabecalhoCor: "#5b4b8a",
      cabecalhoLocal: "meio",
      rodape: "Ambiente de demonstração do portfólio.",
      rodapeLocal: "meio",
      nomeAssinatura: "Demo",
      cidadeEmissao: "",
      logoUrl: null,
      timbradoUrl: null,
      timbradoRecebimentoUrl: null,
      pixQrCodeUrl: null,
    },
  });

  console.log(JSON.stringify({ ok: true, empty: true }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
