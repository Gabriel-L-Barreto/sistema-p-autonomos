-- CreateTable
CREATE TABLE "servico_materiais" (
    "id" SERIAL NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "servicoId" INTEGER NOT NULL,
    "materialId" INTEGER NOT NULL,

    CONSTRAINT "servico_materiais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "servico_materiais_servicoId_materialId_key" ON "servico_materiais"("servicoId", "materialId");

-- AddForeignKey
ALTER TABLE "servico_materiais" ADD CONSTRAINT "servico_materiais_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "servicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servico_materiais" ADD CONSTRAINT "servico_materiais_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materiais"("id") ON DELETE CASCADE ON UPDATE CASCADE;
