-- AlterTable
ALTER TABLE "orcamentos" ADD COLUMN "dataInicioControle" DATE,
ADD COLUMN "dataFimControle" DATE,
ADD COLUMN "tempoEstimadoControle" INTEGER,
ADD COLUMN "contaFinsDeSemanaControle" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "controleUsaEstimativa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "controleDiasEstimativa" INTEGER,
ADD COLUMN "controleValorDiaEstimativa" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "controle_gasto_dia" (
    "id" SERIAL NOT NULL,
    "orcamentoId" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "valorPessoal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorMateriais" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "semGastos" BOOLEAN NOT NULL DEFAULT false,
    "observacao" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "controle_gasto_dia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "controle_gasto_dia_orcamentoId_data_key" ON "controle_gasto_dia"("orcamentoId", "data");

-- CreateIndex
CREATE INDEX "controle_gasto_dia_orcamentoId_data_idx" ON "controle_gasto_dia"("orcamentoId", "data");

-- AddForeignKey
ALTER TABLE "controle_gasto_dia" ADD CONSTRAINT "controle_gasto_dia_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "orcamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
