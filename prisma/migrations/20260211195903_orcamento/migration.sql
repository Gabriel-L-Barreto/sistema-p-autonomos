/*
  Warnings:

  - The `medidaMaterial` column on the `materiais_orcamento` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `_MaterialToMaterialOrcamento` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_MaterialToMaterialOrcamento" DROP CONSTRAINT "_MaterialToMaterialOrcamento_A_fkey";

-- DropForeignKey
ALTER TABLE "_MaterialToMaterialOrcamento" DROP CONSTRAINT "_MaterialToMaterialOrcamento_B_fkey";

-- AlterTable
ALTER TABLE "materiais_orcamento" ADD COLUMN     "materialId" INTEGER,
DROP COLUMN "medidaMaterial",
ADD COLUMN     "medidaMaterial" "TipoMedida";

-- DropTable
DROP TABLE "_MaterialToMaterialOrcamento";

-- AddForeignKey
ALTER TABLE "materiais_orcamento" ADD CONSTRAINT "materiais_orcamento_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materiais"("id") ON DELETE SET NULL ON UPDATE CASCADE;
