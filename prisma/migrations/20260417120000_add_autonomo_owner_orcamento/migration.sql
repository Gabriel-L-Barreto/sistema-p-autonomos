-- Tabela de autônomos (dono dos orçamentos). Idempotente para bancos que já tinham a coluna em orcamentos.

CREATE TABLE IF NOT EXISTS "autonomos" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autonomos_pkey" PRIMARY KEY ("id")
);

INSERT INTO "autonomos" ("id", "nome", "createdAt", "updatedAt")
VALUES (1, 'Principal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('autonomos', 'id'),
    (SELECT COALESCE(MAX("id"), 1) FROM "autonomos")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orcamentos' AND column_name = 'ownerAutonomoId'
  ) THEN
    ALTER TABLE "orcamentos" ADD COLUMN "ownerAutonomoId" INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

UPDATE "orcamentos" SET "ownerAutonomoId" = 1 WHERE "ownerAutonomoId" IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orcamentos' AND column_name = 'ownerAutonomoId'
  ) THEN
    ALTER TABLE "orcamentos" ALTER COLUMN "ownerAutonomoId" SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orcamentos_ownerAutonomoId_fkey'
  ) THEN
    ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_ownerAutonomoId_fkey"
      FOREIGN KEY ("ownerAutonomoId") REFERENCES "autonomos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "orcamentos_ownerAutonomoId_idx" ON "orcamentos"("ownerAutonomoId");
