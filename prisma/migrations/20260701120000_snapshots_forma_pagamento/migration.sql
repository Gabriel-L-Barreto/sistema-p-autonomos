-- Snapshots documentais e forma de pagamento padrão (parecer banca TCC 2026-07-01)

ALTER TABLE "orcamentos" ADD COLUMN "formaPagamentoPadrao" "TipoPagamento";
ALTER TABLE "orcamentos" ADD COLUMN "clienteNome" TEXT;
ALTER TABLE "orcamentos" ADD COLUMN "clienteTelefone" TEXT;
ALTER TABLE "orcamentos" ADD COLUMN "clienteAfiliacao" TEXT;

ALTER TABLE "materiais_orcamento" ADD COLUMN "materialNome" TEXT;
ALTER TABLE "servicos_orcamento" ADD COLUMN "servicoDescricao" TEXT;

-- Preencher snapshots a partir dos cadastros atuais (dados legados)
UPDATE "orcamentos" o
SET
  "clienteNome" = c."nome",
  "clienteTelefone" = c."telefone",
  "clienteAfiliacao" = c."afiliacao"
FROM "clientes" c
WHERE c."id" = o."clienteId" AND o."clienteNome" IS NULL;

UPDATE "materiais_orcamento" mo
SET "materialNome" = COALESCE(m."nome_material", mo."origemMaterial")
FROM "materiais" m
WHERE m."id" = mo."materialId" AND mo."materialNome" IS NULL;

UPDATE "materiais_orcamento"
SET "materialNome" = "origemMaterial"
WHERE "materialNome" IS NULL AND "origemMaterial" IS NOT NULL;

UPDATE "servicos_orcamento" so
SET "servicoDescricao" = COALESCE(so."descricaoLivre", s."descricao")
FROM "servicos" s
WHERE s."id" = so."servicoId" AND so."servicoDescricao" IS NULL;

UPDATE "servicos_orcamento"
SET "servicoDescricao" = "descricaoLivre"
WHERE "servicoDescricao" IS NULL AND "descricaoLivre" IS NOT NULL;
