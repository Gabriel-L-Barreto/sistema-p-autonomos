-- ownerAutonomoId em clientes, materiais e servicos (idempotente)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'ownerAutonomoId'
  ) THEN
    ALTER TABLE "clientes" ADD COLUMN "ownerAutonomoId" INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'materiais' AND column_name = 'ownerAutonomoId'
  ) THEN
    ALTER TABLE "materiais" ADD COLUMN "ownerAutonomoId" INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'servicos' AND column_name = 'ownerAutonomoId'
  ) THEN
    ALTER TABLE "servicos" ADD COLUMN "ownerAutonomoId" INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

UPDATE "clientes" SET "ownerAutonomoId" = 1 WHERE "ownerAutonomoId" IS NULL;
UPDATE "materiais" SET "ownerAutonomoId" = 1 WHERE "ownerAutonomoId" IS NULL;
UPDATE "servicos" SET "ownerAutonomoId" = 1 WHERE "ownerAutonomoId" IS NULL;

CREATE INDEX IF NOT EXISTS "clientes_ownerAutonomoId_idx" ON "clientes"("ownerAutonomoId");
CREATE INDEX IF NOT EXISTS "materiais_ownerAutonomoId_idx" ON "materiais"("ownerAutonomoId");
CREATE INDEX IF NOT EXISTS "servicos_ownerAutonomoId_idx" ON "servicos"("ownerAutonomoId");
