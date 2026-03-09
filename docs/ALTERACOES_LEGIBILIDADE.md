# Alterações de Legibilidade – Sistema de Orçamentos

Este documento descreve as mudanças feitas para melhorar a legibilidade do código **sem alterar funcionalidades**.

---

## 1. Componente OrcamentoForm (`components/OrcamentoForm.tsx`)

- **removerMaterial**: usa callback de `setState` para evitar closure obsoleto.
- **LABELS_STATUS** para opções de status (sincronia com `lib/types.ts`).

---

## 2. LayoutHeader (`components/LayoutHeader.tsx`)

- **Constantes em UPPER_SNAKE_CASE**:
  - `linkBase` → `LINK_BASE`
  - `linkAtivo` → `LINK_ATIVO`

- **Template strings** para combinar classes de forma mais clara:
  - `className={\`${LINK_BASE} ${paginaAtiva === "inicio" ? LINK_ATIVO : ""}\`}`

---

## 3. Nova documentação

### `docs/FRONTEND_BACKEND_MAP.md`

Documento que mapeia:

- **Por página**: campos, ações e rotas associadas.
- **Por formulário**: origem dos dados e destino no backend.
- **APIs**: método, path e descrição.
- **Modelos Prisma**: tabelas e relações.

---

## O que NÃO foi alterado

- Comportamento e fluxos de negócio.
- Estrutura de rotas, componentes ou banco de dados.
- Validações, erros ou mensagens.
- Estilos visuais.
- Lógica de estado.
