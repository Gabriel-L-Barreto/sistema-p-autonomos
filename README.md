# Sistema de Orçamentos (sistema-orc)

Aplicação web para gestão de orçamentos e recebimentos na construção civil, desenvolvida como artefato do TCC.

## Pré-requisitos

- Node.js 20+
- PostgreSQL 14+
- npm

## Instalação

```bash
npm install
cp .env.example .env
```

Edite `.env` e configure `DATABASE_URL`:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/sistema_orc?schema=public"
```

## Banco de dados

```bash
npx prisma migrate deploy
npx prisma db seed   # se existir seed configurado
```

O sistema espera ao menos um registro em `autonomos` (criado automaticamente na primeira operação, se ausente).

## Execução

```bash
npm run dev      # desenvolvimento em http://localhost:3000
npm run build    # build de produção
npm run start    # servidor de produção
npm run lint     # ESLint
npm test         # testes Vitest
```

## Estrutura resumida

- `app/` — páginas e rotas API (Next.js App Router)
- `components/` — interface (formulário de orçamento, modais, cabeçalho)
- `lib/` — regras financeiras, PDF, SINAPI, persistência transacional
- `prisma/` — schema e migrações PostgreSQL

## Base SINAPI

Os CSVs em `data/sinapi/` são importação local simplificada de itens de referência (SINAPI MG). Não substituem composição técnica de obra. Documente no TCC a competência exata dos arquivos utilizados.

## Limitações conhecidas

- Aplicação **monoinquilino** sem autenticação de usuários
- Campos `ownerAutonomoId` preparam isolamento futuro, mas consultas ainda não filtram por proprietário
- Valores monetários usam `Float` no banco (adequado ao protótipo; produção financeira exigiria `Decimal` ou centavos inteiros)
- “Ocultar valores” no painel mascara apenas a interface; a API permanece acessível localmente

## Correções aplicadas (parecer banca 2026-07-01)

- Criação/edição de orçamento em transação única (cabeçalho + itens + histórico de status)
- Snapshots documentais de cliente, material e serviço nos itens do orçamento
- Forma de pagamento padrão persistida ao configurar parcelas iguais
- Quantidade decimal de materiais (m², m³, metros)
- Alerta de 15 dias inclui orçamentos sem nenhum recebimento
- Painel sem corte oculto em abril; falha de API não exibe zeros financeiros
- Recebimentos com bloqueio de linha (`FOR UPDATE`) para reduzir corrida de concorrência

## Documentação acadêmica

- `docs/PARECER_DE_BANCA_TCC_SISTEMA_ORC_2026-07-01.md` — parecer técnico da banca
- `docs/CORRECOES_TCC_PARECER.md` — guia de correções no texto do TCC
