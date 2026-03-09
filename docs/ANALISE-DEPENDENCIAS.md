# Análise de Dependências — Sistema Orçamentos

Análise baseada na documentação oficial do **Next.js** e **Prisma**, sem assumir que libs são dispensáveis.

---

## Dependencies (produção)

| Pacote | Uso no projeto | Documentação | Conclusão |
|--------|----------------|--------------|-----------|
| **@prisma/client** | `lib/prisma.ts`, `lib/empresa-config.ts`, todas as API routes | Prisma: deve ser **dependency** (runtime). Next.js: listado em `serverExternalPackages` automáticos | **Manter** — obrigatório em produção |
| **extenso** | `lib/gerar-pdf-orcamento.ts` — converte valor para extenso em português ("cento e cinquenta reais") | Não há equivalente nativo em JS/Intl para número-por-extenso em PT-BR | **Manter** — necessário para o PDF |
| **next** | Framework principal | Next.js Installation: `next`, `react`, `react-dom` são obrigatórios | **Manter** |
| **pdfkit** | `app/api/orcamentos/[id]/pdf/route.ts` — geração de PDF | Next.js Bundle Analyzer: pacotes com features Node.js devem usar `serverExternalPackages` | **Manter** — já em `serverExternalPackages` |
| **prisma** | CLI: `prisma generate` (postinstall), `db:seed`, migrations | Prisma: CLI deve ser **devDependency** — só usado em desenvolvimento | **Mover para devDependencies** |
| **react** | App Router | Next.js: obrigatório | **Manter** |
| **react-dom** | App Router | Next.js: obrigatório | **Manter** |

---

## DevDependencies

| Pacote | Uso | Documentação | Conclusão |
|--------|-----|--------------|-----------|
| **@tailwindcss/postcss** | PostCSS para Tailwind | Next.js CSS: usa `@tailwindcss/postcss` com Tailwind v4 | **Manter** |
| **@types/node** | Tipos TypeScript | Padrão para Node | **Manter** |
| **@types/pdfkit** | Tipos para pdfkit | Tipagem de libs JS | **Manter** |
| **@types/react** | Tipos React | Padrão com TypeScript | **Manter** |
| **@types/react-dom** | Tipos React DOM | Padrão com TypeScript | **Manter** |
| **eslint** | Linting | Next.js: "Use ESLint (comprehensive rules)" | **Manter** |
| **eslint-config-next** | Config ESLint | Next.js: recomendado | **Manter** |
| **tailwindcss** | CSS | Next.js: suporta Tailwind | **Manter** |
| **tsx** | Executar `prisma/seed.ts` | Script `db:seed` | **Manter** |
| **typescript** | Compilação | Next.js: mínimo v5.1.0 | **Manter** |

---

## Pacotes não listados no package.json

- **fontkit** — dependência transitiva de `pdfkit`. Incluída em `serverExternalPackages` para evitar conflito com `@swc/helpers`. Não precisa ser instalada diretamente.

---

## Alteração recomendada pela documentação

**Prisma** — A documentação do Prisma indica que o pacote `prisma` (CLI) deve ser **devDependency** — usado apenas para `prisma generate`, migrations e seed. O `@prisma/client` permanece como **dependency** porque é necessário em runtime.

---

## Referências

- [Next.js Installation](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js Bundle Analyzer / serverExternalPackages](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)
- [serverExternalPackages](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages)
- [Prisma CLI](https://www.prisma.io/docs/orm/tools/prisma-cli)
- [Prisma Client Setup](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/generating-prisma-client)
