# Mapa Frontend ↔ Backend do Sistema de Orçamentos

Documento que mapeia cada formulário, campo e funcionalidade às suas localizações no frontend e backend.

---

## 1. Página Inicial (`/`)

| Elemento | Frontend | Backend |
|----------|----------|---------|
| Cards de navegação | `app/page.tsx` | — (apenas links) |

---

## 2. Clientes (`/clientes`)

| Campo / Ação | Frontend | Backend |
|--------------|----------|---------|
| Formulário (nome, afiliação, telefone) | `app/clientes/page.tsx` | — |
| Listar clientes | `app/clientes/page.tsx` → `carregarClientes()` | `GET /api/clientes` |
| Criar cliente | `salvar()` (POST) | `POST /api/clientes` |
| Atualizar cliente | `salvar()` (PUT) | `PUT /api/clientes/[id]` |
| Excluir cliente | `excluir()` | `DELETE /api/clientes/[id]` |
| Dados: nome | Campo `nome` | `clientes.nome` (Prisma) |
| Dados: afiliacao | Campo `afiliacao` | `clientes.afiliacao` |
| Dados: telefone | Campo `telefone` | `clientes.telefone` |

---

## 3. Materiais (`/materiais`)

| Campo / Ação | Frontend | Backend |
|--------------|----------|---------|
| Formulário (nome, medida, preço) | `app/materiais/page.tsx` | — |
| Listar materiais | `carregarMateriais()` | `GET /api/materiais` |
| Criar material | `salvar()` (POST) | `POST /api/materiais` |
| Atualizar material | `salvar()` (PUT) | `PUT /api/materiais/[id]` |
| Alternar ativo | `alternarAtivo()` | `PUT /api/materiais/[id]` (ativo) |
| Excluir material | `excluir()` | `DELETE /api/materiais/[id]` |
| Dados: nome_material | Campo `nome_material` | `materiais.nome_material` |
| Dados: unidadeMedida | Select UNITARIO/M2 | `materiais.unidadeMedida` |
| Dados: precoUnitario | Campo numérico | `materiais.precoUnitario` |
| Dados: ativo | Toggle na lista | `materiais.ativo` |

---

## 4. Serviços (`/servicos`)

| Campo / Ação | Frontend | Backend |
|--------------|----------|---------|
| Formulário (descrição, tipo cobrança, preço) | `app/servicos/page.tsx` | — |
| Materiais vinculados | `app/servicos/page.tsx` (sempre visível) | — |
| Listar serviços | `carregarServicos()` | `GET /api/servicos` |
| Listar materiais (para vincular) | `useEffect` | `GET /api/materiais` |
| Criar serviço | `salvar()` (POST) | `POST /api/servicos` |
| Atualizar serviço | `salvar()` (PUT) | `PUT /api/servicos/[id]` |
| Alternar ativo | `alternarAtivo()` | `PUT /api/servicos/[id]` (servicoAtivo) |
| Excluir serviço | `excluir()` | `DELETE /api/servicos/[id]` |
| Vincular material ao serviço (criar) | `adicionarMaterialVinculo()` → materiaisPendentes, salvar | `POST /api/servicos/[id]/materiais` |
| Vincular material (editar) | `adicionarMaterialVinculo()` | `POST /api/servicos/[id]/materiais` |
| Desvincular material | `removerMaterialVinculo()` | `DELETE /api/servicos/[id]/materiais/[materialId]` |
| Listar materiais do serviço | `useEffect` | `GET /api/servicos/[id]/materiais` |
| Dados: descricao | Campo `descricao` | `servicos.descricao` |
| Dados: tipo_cobranca | Select UNITARIO/M2 | `servicos.tipo_cobranca` |
| Dados: precoBase | Campo numérico | `servicos.precoBase` |
| Dados: servicoAtivo | Toggle na lista | `servicos.servicoAtivo` |
| ServicoMaterial (quantidade) | Campo "Qtd por unidade" | `servico_materiais.quantidade` |

---

## 5. Orçamentos (`/orcamentos`, `/orcamentos/novo`, `/orcamentos/[id]`)

| Campo / Ação | Frontend | Backend |
|--------------|----------|---------|
| Lista de orçamentos | `app/orcamentos/page.tsx` | `GET /api/orcamentos` |
| Alterar status na lista | `alterarStatus()` | `PUT /api/orcamentos/[id]` (status) |
| Excluir orçamento | `excluirOrcamento()` | `DELETE /api/orcamentos/[id]` |
| Formulário principal | `components/OrcamentoForm.tsx` | — |

### Formulário de Orçamento (OrcamentoForm)

| Campo / Ação | Frontend | Backend |
|--------------|----------|---------|
| **Dados do Orçamento** | | |
| clienteId | Select `clientes` | `orcamentos.clienteId` |
| endereco | Input texto | `orcamentos.endereco` |
| data | Input date | `orcamentos.data` |
| tempoEstimado | Input numérico | `orcamentos.tempoEstimado` |
| totalParcelas | Input numérico | `orcamentos.totalParcelas` |
| incluiMaterial | Checkbox | `orcamentos.incluiMaterial` |
| status | Select | `orcamentos.status` |
| **Materiais** | | |
| Busca/catálogo | `AutocompleteCatalogo` | `GET /api/materiais` |
| materialId, medidaMaterial, origemMaterial | Estados + selects | `material_orcamento.*` |
| quantidade, precoUnitario | Inputs | `material_orcamento.quantidade`, `precoUnitario` |
| Adicionar material (catálogo) | `adicionarMaterial()` | — (estado local até salvar) |
| Adicionar material (novo no catálogo) | `adicionarMaterial()` | `POST /api/materiais` + estado |
| **Serviços** | | |
| Busca/catálogo | `AutocompleteCatalogo` | `GET /api/servicos` |
| servicoId, descricaoLivre | Estados + RichTextEditor | `servico_orcamento.*` |
| quantidade, valorMaoObra | Inputs | `servico_orcamento.quantidade`, `valorMaoObra` |
| Materiais vinculados (auto) | `adicionarServico()` | `GET /api/servicos/[id]` (servicoMateriais) |
| Adicionar serviço (catálogo) | `adicionarServico()` | — (estado local até salvar) |
| Adicionar serviço (novo no catálogo) | `adicionarServico()` | `POST /api/servicos` + estado |
| Remover serviço | `removerServico()` | — (estado) + subtrai materiais vinculados |
| **Salvar** | | |
| Criar orçamento | `salvar()` | `POST /api/orcamentos` |
| Atualizar orçamento | `salvar()` | `PUT /api/orcamentos/[id]` |
| Adicionar materiais ao orçamento | `salvar()` loop | `POST /api/orcamentos/[id]/materiais` |
| Adicionar serviços ao orçamento | `salvar()` loop | `POST /api/orcamentos/[id]/servicos` |
| Remover linhas antigas (edição) | `salvar()` | `DELETE /api/orcamentos/[id]/materiais/[id]`, `.../servicos/[id]` |

---

## 6. Catálogo (`/catalogo`, `/catalogo/sinapi`)

| Elemento | Frontend | Backend |
|----------|----------|---------|
| Hub (links Materiais, Serviços, SINAPI) | `app/catalogo/page.tsx` | — |
| Config SINAPI (toggle on/off) | `app/catalogo/sinapi/page.tsx` | localStorage `sinapi_mg_campos_vertentes_ativo` |

---

## 7. Componentes Reutilizáveis

| Componente | Arquivo | Usado em |
|------------|---------|----------|
| LayoutHeader | `components/LayoutHeader.tsx` | Todas as páginas |
| OrcamentoForm | `components/OrcamentoForm.tsx` | `/orcamentos/novo`, `/orcamentos/[id]` |
| AutocompleteCatalogo | `components/AutocompleteCatalogo.tsx` | OrcamentoForm (materiais, serviços) |
| RichTextEditor | `components/RichTextEditor.tsx` | OrcamentoForm (descrição serviço custom) |
| InputNumero | `components/InputNumero.tsx` | — (não utilizado) |

---

## 8. APIs Resumidas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/clientes` | Lista clientes |
| POST | `/api/clientes` | Cria cliente |
| GET | `/api/clientes/[id]` | Obtém cliente |
| PUT | `/api/clientes/[id]` | Atualiza cliente |
| DELETE | `/api/clientes/[id]` | Exclui cliente |
| GET | `/api/materiais` | Lista materiais |
| POST | `/api/materiais` | Cria material |
| GET | `/api/materiais/[id]` | Obtém material |
| PUT | `/api/materiais/[id]` | Atualiza material |
| DELETE | `/api/materiais/[id]` | Exclui material |
| GET | `/api/servicos` | Lista serviços |
| POST | `/api/servicos` | Cria serviço |
| GET | `/api/servicos/[id]` | Obtém serviço + servicoMateriais |
| PUT | `/api/servicos/[id]` | Atualiza serviço |
| DELETE | `/api/servicos/[id]` | Exclui serviço |
| GET | `/api/servicos/[id]/materiais` | Lista materiais vinculados |
| POST | `/api/servicos/[id]/materiais` | Vincula material |
| DELETE | `/api/servicos/[id]/materiais/[materialId]` | Desvincula material |
| GET | `/api/orcamentos` | Lista orçamentos |
| POST | `/api/orcamentos` | Cria orçamento |
| GET | `/api/orcamentos/[id]` | Obtém orçamento completo |
| PUT | `/api/orcamentos/[id]` | Atualiza orçamento |
| DELETE | `/api/orcamentos/[id]` | Exclui orçamento |
| POST | `/api/orcamentos/[id]/materiais` | Adiciona material ao orçamento |
| DELETE | `/api/orcamentos/[id]/materiais/[materialId]` | Remove material |
| POST | `/api/orcamentos/[id]/servicos` | Adiciona serviço ao orçamento |
| DELETE | `/api/orcamentos/[id]/servicos/[servicoId]` | Remove serviço |

---

## 9. Modelos de Dados (Prisma)

| Modelo | Tabela | Relações |
|--------|--------|----------|
| Cliente | clientes | orcamentos |
| Material | materiais | materiaisOrcamento, servicoMateriais |
| Servico | servicos | servicosOrcamento, servicoMateriais |
| ServicoMaterial | servico_materiais | servico, material |
| Orcamento | orcamentos | cliente, materiais, servicos |
| MaterialOrcamento | materiais_orcamento | orcamento, material |
| ServicoOrcamento | servicos_orcamento | orcamento, servico |
| Pagamento | pagamentos | orcamento |
