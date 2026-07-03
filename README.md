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

