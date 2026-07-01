# Guia de correções no TCC — Parecer de banca (01/07/2026)

Este documento lista as alterações recomendadas no texto do TCC com base no parecer em `PARECER_DE_BANCA_TCC_SISTEMA_ORC_2026-07-01.md`. As correções no código do `sistema-orc` já foram aplicadas na mesma data.

> **Nota:** o arquivo `TCC_GabrielBarreto (1).zip` não foi encontrado no workspace. Aplique estas mudanças diretamente nos fontes LaTeX do TCC.

---

## 1. Correções formais imediatas

| Local | Problema | Correção |
|---|---|---|
| Objetivo 3 | “catálogo catálogo” | Remover duplicação |
| Metodologia | “Sommervile” | “Sommerville” |
| Metodologia | “SINACRO” | “ORSE” ou remover |
| Fundamentação | “Krasner descrevem” | “Krasner descreve” |
| Fundamentação | “Shneiderman defendem” | “Shneiderman et al. defendem” |
| Conclusão | `Cognitive Walkthrough40??, 3` | Corrigir citação quebrada |
| Epígrafe | “Leonardo Da Vinci” | “Leonardo da Vinci” |
| LaTeX | palavras coladas (`aplicaçãomonoinquilino`, etc.) | Inserir espaço após comandos `\textbf`, `\textit` |
| Interface (se citada) | “registar” | “registrar” |

---

## 2. Título sugerido

Substituir título que antecipa “intuitivo” por:

> **Desenvolvimento e avaliação de usabilidade de um sistema web para gestão de orçamentos na construção civil**

---

## 3. Pergunta de pesquisa (inserir na introdução/metodologia)

> Em que medida um sistema web com fluxo guiado e catálogo reutilizável permite que profissionais autônomos da construção civil, com diferentes níveis de familiaridade digital, elaborem orçamentos e registrem recebimentos com eficácia, eficiência e satisfação?

---

## 4. Objetivo específico 1 — reescrita sugerida

> Desenvolver uma interface web que permita a usuários representativos executar as tarefas essenciais de cadastro de cliente, elaboração de orçamento, geração de PDF e registro de recebimento, avaliando eficácia, eficiência e satisfação por meio de testes de usabilidade e da escala SUS.

Uniformizar o público-alvo em todo o documento (autônomos **ou** pequenas empresas — não alternar sem justificar).

---

## 5. Calibrar afirmações técnicas (alinhar ao código corrigido)

### 5.1 Consistência transacional — **agora implementada**

Pode afirmar que criação e edição de orçamento com itens ocorrem em **transação única** no servidor. Mencionar que recebimentos usam bloqueio de linha, mas que ambiente multiusuário exigiria autenticação.

### 5.2 Preservação histórica — **parcialmente implementada**

Agora o sistema congela `clienteNome`, `clienteTelefone`, `clienteAfiliacao`, `materialNome` e `servicoDescricao` no momento do salvamento. PDFs regenerados usam esses snapshots.

**Texto sugerido:** “O orçamento preserva quantidades, valores e snapshots documentais de cliente, materiais e serviços no momento da gravação; alterações posteriores no cadastro não afetam documentos já emitidos, desde que regenerados a partir dos dados congelados.”

### 5.3 Design Centrado no Usuário

Se não houver entrevistas, personas documentadas ou ciclos de avaliação pré-implementação, trocar por:

> “orientado por princípios de usabilidade e inspirado em DCU (ISO 9241-210)”

### 5.4 Isolamento por autônomo

Manter delimitação explícita:

> “Os campos de proprietário constituem preparação estrutural; o isolamento não está aplicado nas consultas, pois o protótipo opera em modo monoinquilino sem autenticação.”

### 5.5 Confiabilidade financeira

Não afirmar “confiabilidade financeira” plena enquanto valores usam ponto flutuante. Usar: “cálculos arredondados na aplicação, com armazenamento em ponto flutuante — limitação conhecida do protótipo.”

### 5.6 Proteção de valores no painel

Trocar “proteger informações financeiras” por “reduzir exposição visual momentânea”.

### 5.7 Arquitetura MVC / REST

Descrever como aplicação Next.js em camadas informais (componentes, route handlers, helpers, Prisma). Evitar caracterizar como MVC clássico ou REST rigoroso.

---

## 6. Metodologia — TAM e UTAUT

**Escolha recomendada:** remover TAM e UTAUT do núcleo metodológico e manter SUS + desempenho de tarefas + análise qualitativa.

Se mantiver, incluir instrumento completo em apêndice com itens, escala e análise.

---

## 7. Casos de uso — correções pontuais

| Caso | Correção |
|---|---|
| V03 | “catálogo” → “cadastro de clientes” |
| V06 | Documentar substituição por “Cliente removido” ou citar snapshots |
| V21/V22 | Atualizar: gravação atômica no servidor; validação de ≥1 serviço |
| V26 | Materiais só na tela detalhada se `incluiMaterial=true` |
| V27 | Quantidade decimal permitida |
| V33 | Pré-condição: status aceito, inicializado ou finalizado |
| V34 | Forma padrão agora é persistida em `formaPagamentoPadrao` |
| V40 | “configurações de identificação e documentos” (não “dados da empresa” estruturados) |

Documentar funções não citadas: relatório PDF de recebimentos, gráfico mensal ao inicializar, timbrado de recebimento, QR PIX condicional, heurística de “esperado no mês”.

---

## 8. Referências bibliográficas

Corrigir coautores omitidos (refs. 4, 14, 26, 28, 30, 39, 40). Conferir Pressman/Maxim e ISO 25010 (2011 vs 2023). Tratar limiar SUS 68 como referência comparativa, não aprovação universal.

---

## 9. Reprodutibilidade

Citar o `README.md` do repositório: pré-requisitos, `.env.example`, migrações, comandos de teste e limitações.

---

## 10. O que acrescentar no TCC

1. Tabela de requisitos com IDs verificáveis  
2. Matriz objetivo → requisito → caso de uso → rota → teste  
3. Protocolo completo de avaliação (apêndice)  
4. Definição de erro crítico e critérios de sucesso por tarefa  
5. Versão do software e ambiente de teste  
6. LGPD, consentimento e anonimização  
7. Seção de limitações técnicas (transação, snapshots, Float, monoinquilino)  
8. Ameaças à validade  

---

## 11. Demonstração à banca — o que o código já cobre

- [x] Lint (aspas em `orcamentos/page.tsx`)  
- [x] Orçamento atômico  
- [x] Quantidade decimal de materiais  
- [x] Forma de pagamento padrão nas parcelas  
- [x] Alerta 15 dias sem recebimento  
- [x] Dashboard sem corte oculto em abril  
- [x] Erro de API não vira zero financeiro  
- [x] README de reprodutibilidade  

Pendente para evolução futura: `Decimal` monetário, autenticação multiusuário, entidade de parcela com vencimento, testes de integração/PDF.
