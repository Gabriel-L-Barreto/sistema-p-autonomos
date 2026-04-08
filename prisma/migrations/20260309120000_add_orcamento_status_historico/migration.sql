-- CreateTable
CREATE TABLE "orcamento_status_historico" (
    "id" SERIAL NOT NULL,
    "orcamentoId" INTEGER NOT NULL,
    "status" "Status" NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orcamento_status_historico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "orcamento_status_historico_orcamentoId_data_idx" ON "orcamento_status_historico"("orcamentoId", "data");

-- AddForeignKey
ALTER TABLE "orcamento_status_historico" ADD CONSTRAINT "orcamento_status_historico_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "orcamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
