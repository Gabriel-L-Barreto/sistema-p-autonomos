-- CreateEnum
CREATE TYPE "TipoPagamento" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO');

-- CreateEnum
CREATE TYPE "TipoMedida" AS ENUM ('UNITARIO', 'M2');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('CADASTRADO', 'NAO_ACEITO', 'ACEITO', 'INICIALIZADO', 'FINALIZADO');

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "afiliacao" TEXT,
    "telefone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiais" (
    "id" SERIAL NOT NULL,
    "nome_material" TEXT NOT NULL,
    "unidadeMedida" "TipoMedida" NOT NULL,
    "precoUnitario" DOUBLE PRECISION NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materiais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicos" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo_cobranca" "TipoMedida" NOT NULL,
    "precoBase" DOUBLE PRECISION NOT NULL,
    "servicoAtivo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orcamentos" (
    "id" SERIAL NOT NULL,
    "endereco" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tempoEstimado" INTEGER,
    "incluiMaterial" BOOLEAN NOT NULL DEFAULT false,
    "totalParcelas" DOUBLE PRECISION,
    "status" "Status" NOT NULL DEFAULT 'CADASTRADO',
    "clienteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orcamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiais_orcamento" (
    "id" SERIAL NOT NULL,
    "medidaMaterial" TEXT,
    "origemMaterial" TEXT,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "precoUnitario" DOUBLE PRECISION NOT NULL,
    "orcamentoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materiais_orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicos_orcamento" (
    "id" SERIAL NOT NULL,
    "descricaoLivre" TEXT,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "valorMaoObra" DOUBLE PRECISION NOT NULL,
    "orcamentoId" INTEGER NOT NULL,
    "servicoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicos_orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" SERIAL NOT NULL,
    "valorRecebido" DOUBLE PRECISION NOT NULL,
    "formaPagamento" "TipoPagamento" NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orcamentoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MaterialToMaterialOrcamento" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_MaterialToMaterialOrcamento_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MaterialToMaterialOrcamento_B_index" ON "_MaterialToMaterialOrcamento"("B");

-- AddForeignKey
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiais_orcamento" ADD CONSTRAINT "materiais_orcamento_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "orcamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicos_orcamento" ADD CONSTRAINT "servicos_orcamento_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "orcamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicos_orcamento" ADD CONSTRAINT "servicos_orcamento_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "servicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "orcamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MaterialToMaterialOrcamento" ADD CONSTRAINT "_MaterialToMaterialOrcamento_A_fkey" FOREIGN KEY ("A") REFERENCES "materiais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MaterialToMaterialOrcamento" ADD CONSTRAINT "_MaterialToMaterialOrcamento_B_fkey" FOREIGN KEY ("B") REFERENCES "materiais_orcamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
