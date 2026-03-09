-- CreateTable
CREATE TABLE "empresa_config" (
    "id" SERIAL NOT NULL,
    "cabecalho" TEXT NOT NULL,
    "logoUrl" TEXT,
    "nomeAssinatura" TEXT NOT NULL,
    "cidadeEmissao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresa_config_pkey" PRIMARY KEY ("id")
);
