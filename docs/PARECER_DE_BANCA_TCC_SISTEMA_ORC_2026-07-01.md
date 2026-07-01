# Parecer técnico-acadêmico de banca: TCC e sistema-orc

**Data da auditoria:** 1º de julho de 2026  
**Documento avaliado:** `C:\Users\gabri\Downloads\TCC_GabrielBarreto (2).pdf`  
**Versão:** arquivo mais recente encontrado, gerado em 01/07/2026 às 18:06, com 70 páginas  
**Sistema confrontado:** estado atual do repositório `sistema-orc`

## 1. Delimitação solicitada

Este parecer deliberadamente:

- não avalia o Resumo nem o Abstract (páginas PDF 7 e 8);
- não penaliza a ausência de resultados empíricos;
- não avalia o trecho reservado a resultados na conclusão;
- avalia, porém, erros formais, referências quebradas e afirmações técnicas presentes fora do conteúdo de resultados;
- considera o código, o banco, as migrações, as rotas, as telas, os testes e a execução real como fontes de verdade para confrontar o texto.

## 2. Veredito geral

O trabalho tem **bom valor prático, escopo compreensível e um artefato funcional acima do nível de um simples protótipo de telas**. Há coerência real entre o problema escolhido e o núcleo implementado: clientes, catálogo, orçamentos, pagamentos, PDFs, painel e SINAPI auxiliar.

Contudo, no estado atual, eu o classificaria como **aprovável somente após correções substanciais**. O maior risco não está na ausência dos resultados, que foi excluída desta avaliação, mas na diferença entre a força das afirmações acadêmicas e a força das evidências técnicas e metodológicas apresentadas.

Em termos de banca, o texto frequentemente descreve o sistema como mais transacional, rastreável, centrado no usuário, íntegro e arquiteturalmente separado do que o código efetivamente demonstra. Isso não invalida o projeto, mas exige precisão. Um bom TCC pode assumir limitações; o que não pode é prometer propriedades que o artefato não garante.

### Avaliação indicativa por dimensão

| Dimensão | Avaliação | Observação |
|---|---:|---|
| Relevância do problema | 8,0/10 | Problema útil, concreto e adequado à Computação aplicada. |
| Escopo e produto entregue | 7,5/10 | Núcleo funcional amplo e utilizável. |
| Coerência TCC-sistema | 6,0/10 | Boa no nível funcional; fraca em garantias técnicas específicas. |
| Metodologia, sem considerar resultados | 5,5/10 | Métodos adequados, mas pouco operacionalizados e parcialmente desconectados. |
| Arquitetura e qualidade do software | 6,0/10 | Compila e possui testes, mas há riscos de consistência, histórico e concorrência. |
| Redação e rigor acadêmico | 5,5/10 | Estrutura razoável, com erros visíveis, referências incompletas e afirmações sem sustentação. |
| Reprodutibilidade | 4,5/10 | Faltam README, implantação, seed, versão da base SINAPI e protocolo completo de avaliação. |

**Faixa global indicativa, antes das correções:** 6,0 a 6,5/10.  
**Faixa plausível após as correções prioritárias:** 7,5 a 8,5/10.

## 3. Pontos fortes comprovados

1. **O sistema existe e é funcional.** A compilação de produção concluiu com sucesso.
2. **Há cobertura automatizada inicial.** Os 25 testes existentes passam, cobrindo cálculos financeiros e alguns comportamentos das APIs de status e recebimentos.
3. **O escopo está majoritariamente bem contido.** O texto afirma que não pretende ser uma plataforma completa de gestão de obras, e o produto se mantém concentrado em orçamento e recebimento.
4. **A SINAPI é tratada como referência auxiliar.** Essa delimitação é correta e evita afirmar que o sistema substitui uma composição profissional de custos.
5. **A aplicação possui consistência visual e fluxo guiado.** O formulário em quatro etapas está implementado e é coerente com o público pretendido.
6. **A responsividade básica foi comprovada.** Em teste a 390 x 844 px, as oito telas principais não produziram estouro horizontal da página.
7. **Há preocupação prática com documentos.** Cabeçalho, rodapé, logotipo, timbrado, timbrado de recebimento e QR Code PIX existem no sistema.
8. **Os cálculos principais estão centralizados em `lib/orcamento.ts`.** Isso sustenta parcialmente a afirmação de reutilização das regras de total, saldo, percentual e parcela.
9. **A modelagem separa itens de catálogo de itens de orçamento.** A decisão é conceitualmente correta, ainda que a implementação não congele todos os dados necessários.
10. **O texto reconhece limitações importantes.** A caracterização como aplicação monoinquilino e sem autenticação está correta.

## 4. Correções críticas antes da banca

### 4.1. Consistência transacional afirmada, mas não implementada

**Gravidade: crítica**  
**TCC:** requisitos não funcionais, página impressa 29; arquitetura, páginas 49-50.  
**Código:** `components/OrcamentoForm.tsx`, linhas 527-603; rotas de orçamento e itens.

O TCC afirma que operações compostas são executadas com consistência transacional e que a criação de orçamento com materiais e serviços é tratada de modo coordenado. Isso não corresponde ao fluxo real.

Na criação, a interface:

1. cria o orçamento;
2. cria cada material em requisições separadas;
3. cria cada serviço em requisições separadas;
4. só então abre o PDF.

Se a terceira requisição falhar, o orçamento já existe e pode ficar parcial. Na edição, a situação é mais grave: o sistema atualiza o orçamento, apaga os itens anteriores um a um e recria os novos. Uma falha intermediária pode destruir a composição original e deixar apenas parte da nova.

**Correção no sistema:** criar uma rota única para gravar orçamento, materiais e serviços dentro de uma transação Prisma. Na edição, substituir os itens dentro da mesma transação.  
**Correção no TCC se o código não for alterado:** remover “consistência transacional” e declarar explicitamente que o protótipo ainda usa operações sequenciais sujeitas a atualização parcial.

### 4.2. Preservação histórica afirmada, mas apenas parcial

**Gravidade: crítica**  
**TCC:** base de dados, páginas impressas 47-48.  
**Código:** `prisma/schema.prisma`, modelos `MaterialOrcamento`, `ServicoOrcamento`, `Orcamento` e `Cliente`.

O TCC afirma que alterações futuras no catálogo não modificam documentos já emitidos e que o orçamento preserva informações próprias quando um item é alterado ou excluído. Isso é verdade apenas para quantidade e preço.

- O nome de um material vinculado continua vindo de `Material.nome_material`.
- A descrição de um serviço vinculado continua vindo de `Servico.descricao`.
- Os dados do cliente continuam vindo do registro atual de `Cliente`.
- Alterar esses cadastros muda a visualização e um PDF regenerado de um orçamento antigo.
- Excluir material ou serviço usa `SetNull`, mas o nome/descrição não foi congelado; portanto, pode desaparecer.
- Excluir cliente pela API reassocia os orçamentos a “Cliente removido”, apagando a identidade histórica do contratante nos PDFs regenerados.

**Correção no sistema:** armazenar snapshots como `clienteNome`, `clienteTelefone`, `materialNome`, `servicoDescricao`, unidade e demais dados documentais no próprio orçamento/item.  
**Correção no TCC:** enquanto isso não existir, substituir “preserva” por “preserva quantidades e valores, mas nomes e dados cadastrais permanecem vinculados ao cadastro atual”.

### 4.3. Design Centrado no Usuário é reivindicado sem processo centrado no usuário demonstrado

**Gravidade: crítica acadêmica**  
**TCC:** introdução, metodologia 3.3 e diversas conclusões de projeto.

O texto invoca a ISO 9241-210 e afirma Design Centrado no Usuário, mas o levantamento inicial foi descrito como análise de sistemas relacionados e “observação das necessidades do domínio”. Não são apresentados:

- entrevistas ou observação contextual com usuários;
- personas baseadas em dados;
- análise formal de tarefas;
- protótipos avaliados antes da implementação;
- ciclos documentados de feedback e redesign;
- participação de usuários durante as decisões de projeto.

Projetar **para** um público com base em premissas não é, por si só, projetar **com** usuários. A ISO 9241-210 descreve atividades humanas ao longo do ciclo de vida, não apenas boas intenções de interface.

**Correção recomendada:** usar “orientado por princípios de usabilidade e inspirado em DCU” se não houve participação prévia. Só manter “Design Centrado no Usuário” se o processo real puder ser documentado com evidências.

### 4.4. A metodologia de avaliação ainda não é reproduzível

**Gravidade: crítica acadêmica**  
**TCC:** capítulo 3, páginas impressas 23-27.

Mesmo ignorando resultados, o protocolo precisa permitir reprodução. Estão ausentes ou vagos:

- número planejado de participantes;
- critérios de inclusão e exclusão;
- forma de recrutamento;
- definição operacional de baixa, média e alta familiaridade tecnológica;
- perfil mínimo do especialista de domínio;
- versão do sistema submetida ao teste;
- navegadores, aparelhos, resolução e condições de rede;
- treinamento inicial e instruções permitidas;
- limite de tempo por tarefa;
- definição de sucesso, sucesso parcial, abandono, pedido de ajuda e erro crítico;
- procedimento do moderador e protocolo think-aloud, caso utilizado;
- cálculo completo do SUS e tratamento de respostas ausentes;
- versão traduzida/validada do SUS;
- instrumento UTAUT, itens, escala e modo de análise;
- procedimento completo da avaliação heurística;
- quantidade e qualificação dos avaliadores;
- cálculo ou regra de severidade e consolidação dos achados;
- roteiro completo do Cognitive Walkthrough;
- termo de consentimento, anonimização, armazenamento e descarte dos dados.

O critério “identificação de melhorias implementáveis” também não deve ser critério de sucesso do sistema: praticamente qualquer teste gera melhorias. Os relatos qualitativos precisam de um limiar ou regra analítica, e “erro crítico” precisa ser definido antes da coleta.

### 4.5. TAM e UTAUT estão presentes, mas não operacionalizados

**Gravidade: alta**  
**TCC:** seções 2.3.1, 3 e 3.4.

O texto introduz TAM e UTAUT e diz que serão apoio interpretativo. Porém os instrumentos enumerados na seção 3.5 são roteiro de tarefas, ficha de observação, SUS e registro de problemas. Não existe questionário TAM/UTAUT, conjunto de itens, escala, construtos selecionados ou método de análise.

Isso produz fundamentação ornamental: o modelo aparece no referencial, mas não participa verificavelmente do método.

**Escolha necessária:**

- remover TAM e UTAUT do núcleo do trabalho e manter foco em usabilidade; ou
- adotar um instrumento explícito, justificar quais construtos serão medidos e descrever a análise.

Usar simultaneamente TAM e UTAUT em amostra pequena pode aumentar complexidade sem ganho. Para este TCC, SUS + desempenho de tarefas + análise qualitativa bem executada tende a ser mais coerente.

### 4.6. Isolamento por autônomo não existe de forma efetiva

**Gravidade: crítica técnica**  
**TCC:** diagrama ER e base de dados, páginas 47-48; limitações reconhecidas na conclusão.  
**Código:** `prisma/schema.prisma`, rotas de listagem e migração `20260630130000_add_owner_autonomo_catalogo`.

Há campos `ownerAutonomoId`, mas:

- clientes, materiais e serviços não possuem relação Prisma nem chave estrangeira para `Autonomo`;
- a migração cria colunas e índices, mas não cria as respectivas FKs;
- as consultas GET não filtram por proprietário;
- verificações de nomes duplicados são globais;
- materiais podem ser vinculados a serviços de outro proprietário;
- `EmpresaConfig` é global;
- o cliente pode enviar `ownerAutonomoId` no corpo da requisição;
- não existe identidade autenticada que determine o proprietário.

Assim, o modelo não “permite separar os dados pertencentes a cada responsável” na aplicação atual. Ele apenas prepara parte da estrutura para uma separação futura.

**Correção textual:** “os campos de proprietário constituem preparação estrutural; o isolamento não está aplicado nas consultas”.  
**Correção técnica:** autenticação, owner derivado da sessão, FKs, relações Prisma e filtro obrigatório em todas as consultas e mutações.

### 4.7. Valores financeiros usam ponto flutuante e operações sujeitas a corrida

**Gravidade: crítica técnica**  
**Código:** `prisma/schema.prisma`, campos financeiros `Float`; rotas de pagamentos.

Para dinheiro, `Float`/`DOUBLE PRECISION` pode introduzir erros binários de precisão. O código arredonda vários resultados, mas o armazenamento permanece inadequado para garantia financeira.

Além disso, registrar pagamento segue o padrão “ler saldo, validar, criar”. Duas requisições simultâneas podem ler o mesmo saldo e ambas serem aceitas, gerando pagamento acima do total. O mesmo risco existe na próxima parcela.

**Correção:** usar `Decimal` com escala definida ou centavos inteiros; validar e criar o recebimento em transação com bloqueio/controle de concorrência. O TCC deve evitar a expressão “confiabilidade financeira” até isso ser garantido.

## 5. Divergências entre os 40 casos de uso e o sistema

Todos os casos V01-V40 foram confrontados. A maioria representa funções existentes, mas há divergências relevantes.

| Caso | Situação real | Correção necessária |
|---|---|---|
| V03 | A pós-condição diz que cliente é salvo “no catálogo”. Cliente não pertence ao catálogo. | Usar “cadastro de clientes”. |
| V06 | O texto diz que o cliente é removido. A API cria/localiza “Cliente removido” e reassocia os orçamentos. | Documentar a substituição e a perda de identidade histórica, ou implementar snapshot. |
| V07/V12 | A duplicidade é verificada globalmente, não por proprietário, e não há restrição única no banco. | Delimitar ao modo monoinquilino ou corrigir modelo/API. |
| V11/V16 | Excluir item preservaria histórico, mas nomes de material/serviço podem desaparecer. | Congelar nomes nos itens do orçamento. |
| V17 | Serviço e material podem pertencer a proprietários diferentes. | Validar owner e criar FKs. |
| V21 | A UI exige serviço; a API permite orçamento vazio. A criação de itens não é atômica. | Validar no servidor e usar transação única. |
| V22 | “Regrava os itens” omite que primeiro apaga tudo e pode falhar no meio. | Transação única e restauração segura. |
| V24 | Atualização de status e histórico usa duas operações independentes. | Colocar ambas na mesma transação. |
| V26 | O caso diz que a tela exibe materiais; a tela detalhada só exibe materiais se `incluiMaterial=true`. | Exibir materiais de referência ou corrigir o caso de uso. |
| V27 | A tela aceita apenas quantidade inteira de material, apesar de unidades M², M³ e metros. | Permitir decimal; `parseInt` é inadequado ao domínio. |
| V29 | Materiais vinculados são incluídos, mas falhas são silenciosas. | Exibir erro ou tornar a inclusão atômica. |
| V30 | A remoção depende dos vínculos atuais do catálogo e falha silenciosamente; pode não ajustar os materiais corretamente. | Registrar a origem do material automático e removê-lo deterministicamente. |
| V32 | O texto diz que o conteúdo é sanitizado. O sanitizador usa lista negra e não restringe realmente às tags declaradas como seguras. | Usar sanitizador HTML robusto com allowlist ou texto simples. |
| V33 | A pré-condição omite que o orçamento deve estar aceito, inicializado ou finalizado. | Acrescentar a regra de status. |
| V34 | O caso diz que a forma de pagamento padrão é salva. A API valida `formaPagamento`, mas descarta esse valor. | Persistir a forma padrão ou retirar a afirmação. |
| V35 | Todos os pagamentos contam como parcelas; não existe tipo/índice de parcela. Abatimentos anteriores alteram a numeração. | Modelar parcela ou restringir os modos. |
| V36 | A pós-condição inclui alteração da data. A API aceita data, mas o modal não oferece esse campo. | Adicionar campo ou remover “data” do caso. |
| V38/V39 | Funcionais e coerentes, mas não há autorização para proteger documentos por ID. | Delimitar ao ambiente local ou adicionar autenticação. |
| V40 | “Dados da empresa” é amplo; não há entidade empresa nem campos estruturados como CNPJ. Há campos documentais globais. | Chamar de “configurações de identificação e documentos”. |

### Funções implementadas e pouco ou nada documentadas

- relatório mensal/anual de recebimentos em PDF;
- gráfico mensal de valores ao entrar em status Inicializado;
- timbrado exclusivo de recebimento;
- QR Code PIX condicionado à forma de pagamento;
- regra automática de “valor esperado no mês”.

Essas funções devem entrar em requisitos/casos de uso ou ser removidas do escopo apresentado. A regra de “valor esperado no mês” merece especial cuidado, pois é uma heurística interna não explicada ao usuário nem no TCC.

## 6. Problemas do painel e dos indicadores

### 6.1. Corte temporal oculto em abril

`app/api/dashboard/route.ts` ignora orçamentos anteriores a 1º de abril do ano corrente para grande parte dos indicadores. O painel, porém, não informa esse recorte. Ao mesmo tempo, contagens gerais incluem todos os registros. Isso mistura universos temporais e pode produzir indicadores contraditórios.

**Correção:** remover o corte ou mostrar claramente período e filtros. Idealmente, permitir seleção do período.

### 6.2. “Esperado no mês” é uma projeção arbitrária

Sem parcelas configuradas, o sistema infere 1, 2, 3, 4 ou 6 parcelas apenas pelo valor total do orçamento. Essa regra não tem sustentação no domínio, no TCC nem na interface. Pode induzir o usuário a interpretar uma estimativa inventada como previsão financeira.

**Correção:** projetar somente parcelas e vencimentos cadastrados ou rotular explicitamente como estimativa heurística, explicando a fórmula.

### 6.3. Alerta “sem recebimento há 15 dias” omite quem nunca recebeu

A condição exige que exista `ultimoRecebimento`. Um orçamento inicializado sem nenhum pagamento não entra no alerta, embora seja o exemplo mais literal de “sem recebimento”.

### 6.4. Falha de carregamento aparece como zero

A tela ignora silenciosamente erro do dashboard e usa `0` nos campos enquanto `stats` é nulo. Isso transforma indisponibilidade em informação financeira falsa.

### 6.5. “Ocultar valores” não protege dados

O recurso apenas mascara visualmente os números. Qualquer pessoa pode clicar em “Mostrar valores” ou consultar a API. No TCC, trocar “proteger informações financeiras” por “reduzir exposição visual momentânea”.

## 7. Modelagem e arquitetura: afirmações que precisam ser calibradas

### 7.1. Não é uma arquitetura MVC

O próprio texto admite que não há MVC clássico. A arquitetura real é mais bem descrita como aplicação Next.js em camadas informais:

- componentes cliente;
- route handlers;
- helpers compartilhados;
- Prisma/PostgreSQL.

A seção teórica de MVC adiciona pouca utilidade e cria expectativa de controllers, serviços e domínio separados que não existem. Recomendo remover MVC ou tratá-lo apenas como referência histórica, sem caracterizar o sistema por esse padrão.

### 7.2. A “camada de domínio” é fina

Há centralização dos cálculos básicos, mas regras de negócio importantes estão espalhadas:

- parcelamento nas rotas;
- materiais automáticos no componente React;
- regras de alertas no dashboard;
- validações duplicadas entre UI e API;
- configuração em SQL bruto.

Não afirmar que “as regras de domínio” em geral estão centralizadas. A formulação correta é: “algumas regras financeiras reutilizáveis foram extraídas para funções compartilhadas”.

### 7.3. “API REST” é uma simplificação

As rotas usam HTTP e JSON, mas incluem endpoints orientados a ações, como `parcela-igual` e `parcelas-iguais`. O sistema pode ser chamado de API HTTP ou API web. Para afirmar REST com rigor, seria necessário discutir recursos, uniformidade, semântica, idempotência e códigos de status.

### 7.4. Integridade está mais na aplicação do que no banco

O banco não garante:

- preço e quantidade positivos;
- total de parcelas inteiro e positivo;
- unicidade por proprietário;
- existência do proprietário de clientes, materiais e serviços;
- compatibilidade de proprietário entre entidades.

Logo, “integridade entre entidades” deve ser qualificada. Há FKs importantes, mas várias invariantes dependem apenas das rotas.

## 8. SINAPI: adequação e limites

O posicionamento como referência auxiliar é correto. Entretanto:

1. os CSVs não possuem documentação local sobre competência, mês, fonte exata, data de download, regime de encargos e licença;
2. o código reduz diversas unidades SINAPI a `UNITARIO` ou `M2`, mesmo que o modelo suporte M³ e metros;
3. o sistema usa “SINAPI (MG)” e a chave menciona Campos das Vertentes, mas o TCC não registra a competência da base;
4. não existe atualização automática;
5. serviços SINAPI são transformados em descrição livre, não em composição técnica com coeficientes e insumos;
6. o nome “integração” pode sugerir API/sincronização; “importação local simplificada de itens de referência” é mais exato.

Não afirmar conformidade orçamentária, orçamento de engenharia, BDI, encargos ou composição completa. O sistema apoia precificação informal; não substitui orçamento técnico de obra.

## 9. Usabilidade, acessibilidade e responsividade

### Evidências positivas

- fluxo de orçamento em quatro etapas;
- rótulos claros e exemplos;
- botões com área de toque adequada;
- ausência de estouro horizontal geral em 390 px;
- estados visuais e barra de progresso;
- autocompletar com papéis ARIA;
- confirmação para ações destrutivas em vários fluxos.

### Fragilidades

1. **Menu móvel:** a navegação é horizontal e deixa itens parcialmente escondidos; usuários pouco familiarizados podem não perceber que devem arrastar.
2. **Modais de pagamento:** não possuem semântica de diálogo, foco inicial controlado, aprisionamento de foco ou retorno de foco.
3. **Confirmações nativas:** a aplicação mistura `window.confirm` com diálogo próprio, reduzindo consistência.
4. **Erros silenciosos:** SINAPI, materiais vinculados e dashboard podem falhar sem feedback.
5. **Quantidade de material:** apenas inteiro, incompatível com M², M³ e metros.
6. **Tabelas no celular:** dependem de rolagem horizontal interna, funcional porém cognitivamente mais exigente.
7. **Acessibilidade não é demonstrada:** não há auditoria WCAG, teste com teclado, leitor de tela ou contraste documentado.
8. **“Intuitivo” permanece hipótese:** o título atribui ao sistema uma qualidade que deveria ser avaliada. Um título mais científico evita antecipar a conclusão.

### Título recomendado

> Desenvolvimento e avaliação de usabilidade de um sistema web para gestão de orçamentos na construção civil

É mais neutro e descreve a contribuição sem declarar previamente que o sistema é intuitivo.

## 10. Qualidade do código e dos testes

### Verificações executadas

- **Build de produção:** aprovado.
- **Testes automatizados:** 25/25 aprovados em 3 arquivos.
- **Lint:** reprovado, com 6 erros e 9 avisos.

Os 6 erros estão em `app/orcamentos/page.tsx` por aspas não escapadas. Os avisos incluem dependências ausentes em `useEffect` e uso de `<img>` sem otimização.

### Cobertura insuficiente para a afirmação “regras críticas”

Os testes existentes são úteis, mas não cobrem:

- criação/edição atômica de orçamento;
- parcelamento igual e concorrência;
- edição e exclusão de pagamentos;
- PDFs;
- configuração da empresa;
- dashboard e seus períodos;
- SINAPI e unidades;
- isolamento por proprietário;
- snapshots históricos;
- rotas CRUD de clientes, materiais e serviços;
- acessibilidade e fluxos ponta a ponta.

No texto, prefira “testes automatizados iniciais para cálculos e algumas regras de API” em vez de sugerir cobertura ampla das regras críticas.

## 11. Problemas acadêmicos e de redação

### 11.1. Erros objetivos que devem ser corrigidos

| Local | Problema | Correção |
|---|---|---|
| Folha de rosto | “requisito da disciplina de Metodologia” pode não corresponder à natureza final do TCC. | Conferir o modelo oficial da UFSJ e o nome da atividade curricular. |
| Folha de aprovação | “Professor Convidado 1” e “Professor Convidado 2” ainda são placeholders. | Inserir banca ou deixar conforme modelo institucional para preenchimento. |
| Epígrafe | Aspas de abertura/fechamento inconsistentes e autoria “Leonardo Da Vinci” discutível. | Confirmar fonte; usar “Leonardo da Vinci” e padrão tipográfico institucional. |
| Objetivo 3, p. 15 | “catálogo catálogo”. | Remover duplicação. |
| Metodologia, p. 24 | “Sommervile”. | “Sommerville”. |
| Metodologia, p. 24 | “SINACRO” não corresponde a um sistema identificado. | Provavelmente “ORSE” ou remover. |
| Fundamentação, p. 19 | “Krasner descrevem”. | “Krasner descreve” ou ajustar autores. |
| Fundamentação, p. 20 | “Shneiderman defendem”. | “Shneiderman et al. defendem” com referência completa. |
| SUS, p. 21 | “Bangor analisou ... discutiram”. | Uniformizar sujeito e verbo; referência tem três autores. |
| Conclusão, p. 64 | `Cognitive Walkthrough40??, 3`. | Corrigir a citação quebrada imediatamente. |
| Listagem de orçamentos | Interface usa “registar”, enquanto o restante usa “registrar”. | Uniformizar português brasileiro. |

### 11.2. Objetivos precisam ser mensuráveis e paralelos

O objetivo específico 1, “proporcionar o sistema como sendo de fácil utilização”, é circular e gramaticalmente fraco. “Design intuitivo” também não é medida.

Sugestão:

> Desenvolver uma interface web que permita a usuários representativos executar as tarefas essenciais de cadastro de cliente, elaboração de orçamento, geração de PDF e registro de recebimento, avaliando eficácia, eficiência e satisfação por meio de testes de usabilidade e da escala SUS.

O objetivo 3 muda para “empresas de construção”, enquanto o restante enfatiza autônomos e pequenos empreendedores. Uniformizar o público em todo o documento.

### 11.3. Falta uma pergunta de pesquisa explícita

O texto tem problema e objetivos, mas não formula claramente a pergunta central até muito tarde. Sugestão:

> Em que medida um sistema web com fluxo guiado e catálogo reutilizável permite que profissionais autônomos da construção civil, com diferentes níveis de familiaridade digital, elaborem orçamentos e registrem recebimentos com eficácia, eficiência e satisfação?

### 11.4. A caracterização do público é uma premissa pouco sustentada

O trabalho associa autônomos da construção civil a baixa familiaridade tecnológica, mas não apresenta dados empíricos específicos desse público. A referência sobre usuários iletrados ou semiletrados é válida, porém não demonstra que o público do estudo tenha esse perfil.

Evitar generalização ou estigma. Usar “o estudo inclui usuários com diferentes níveis de familiaridade digital” e sustentar a distribuição real dos participantes quando disponível.

### 11.5. A lacuna de mercado não foi demonstrada sistematicamente

Joist, Buildertrend, Obra Prima, Sienge e OrçaFascio são descritos principalmente com base em páginas dos próprios produtos. Falta uma matriz comparativa com critérios comuns:

- público-alvo;
- preço;
- idioma;
- complexidade de configuração;
- orçamento;
- recebimentos;
- catálogo próprio;
- SINAPI;
- modo offline;
- autenticação;
- recursos móveis;
- limitações para autônomos.

Sem isso, “há uma lacuna” parece conclusão intuitiva, não resultado da revisão.

### 11.6. Há excesso de descrição genérica de tecnologias

HTML, CSS, JavaScript, TypeScript, Next.js, Prisma e PostgreSQL ocupam espaço com definições básicas. Para uma banca de Ciência da Computação, é mais valioso explicar decisões:

- por que Next.js em vez de arquitetura separada;
- por que PostgreSQL;
- por que Prisma;
- consequências da escolha monolítica;
- como foram tratadas validação, transação, segurança e implantação.

Reduzir definições de manual e ampliar justificativas ligadas ao artefato.

### 11.7. Casos de uso ocupam espaço excessivo e repetem CRUD

Os 40 casos consomem aproximadamente 17 páginas, com muito espaço em branco e fluxos previsíveis. Isso dilui as partes mais importantes do trabalho.

**Recomendação:** manter no capítulo apenas 8-12 casos centrais e mover a especificação completa para apêndice. No corpo, incluir uma matriz de rastreabilidade entre objetivos, requisitos, casos de uso, telas, rotas e testes.

### 11.8. Figuras técnicas estão pequenas

O diagrama de casos de uso e o ER concentram muitos elementos e ficam difíceis de ler na página. A arquitetura é mais legível, mas ainda simplifica demais a distribuição real das regras.

Dividir o ER por contexto ou aumentar para página paisagem. Verificar legibilidade a 100% de zoom e em impressão A4.

### 11.9. Problemas visuais de espaçamento no PDF

Há várias palavras visualmente coladas, especialmente quando trechos em negrito/itálico se encontram com texto comum, por exemplo:

- “literaturaemInteraçãoHumano-Computador”;
- “Cognitive Walkthrough40??”;
- “aplicaçãomonoinquilino”;
- “Ascontribuições”, “aslimitações” e “detrabalhos futuros”.

Isso sugere comandos LaTeX sem espaço de separação. Inserir espaço explícito após comandos ou usar chaves corretamente.

### 11.10. Lista de abreviaturas está inflada e inconsistente

“Web” não é sigla. Métodos HTTP só precisam constar se forem usados como siglas relevantes no texto. Em contrapartida, termos usados posteriormente, como IA, CRM, PWA, NF-e/NFS-e, não aparecem.

Manter somente abreviaturas efetivamente usadas e necessárias à leitura.

## 12. Auditoria das referências

Foram identificados problemas bibliográficos concretos:

1. A referência 14 atribui a RFC 9110 apenas a Fielding. O documento tem Roy Fielding, Mark Nottingham e Julian Reschke como editores.
2. A referência 26 omite Bruno Santana da Silva em *Interação Humano-Computador*.
3. A referência 28 de UTAUT omite Morris, Davis e Davis.
4. A referência 30 omite Philip Kortum e James Miller.
5. A referência 39 omite Vicki L. Plano Clark.
6. A referência 40 do Cognitive Walkthrough omite John Rieman, Clayton Lewis e Peter Polson.
7. A referência 4 da 6ª edição de *Designing the User Interface* lista apenas Shneiderman e omite os coautores da edição.
8. Conferir a referência de Pressman: a 8ª edição é normalmente associada também a Bruce Maxim, e o ano precisa corresponder à edição efetivamente consultada.
9. A ISO/IEC 25010:2011 está retirada e foi substituída pela ISO/IEC 25010:2023. É possível citar 2011 se foi a edição usada, mas o TCC de 2026 deveria justificar ou atualizar o modelo.
10. O limiar SUS 68 não deve ser tratado como aprovação universal. É referência comparativa, dependente de contexto e distribuição normativa.

Referências verificadas como existentes:

- o artigo de Elias sobre adoção de sistema de biblioteca existe, mas sua aderência ao contexto da construção civil é indireta;
- o artigo de Islam et al. de 2023 existe, mas trata usuários iletrados/semiletrados em geral;
- o CSS Snapshot 2026 existe e foi publicado pelo W3C em março de 2026;
- a ISO 9241-210:2019 permanece vigente.

Fontes de conferência: [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html), [ISO/IEC 25010:2023](https://www.iso.org/standard/78176.html), [ISO 9241-210:2019](https://www.iso.org/standard/77520.html), [CSS Snapshot 2026](https://www.w3.org/TR/css-2026/), [Bangor, Kortum e Miller](https://dblp.org/rec/journals/ijhci/BangorKM08), [livro de Creswell e Plano Clark](https://collegepublishing.sagepub.com/products/designing-and-conducting-mixed-methods-research-3-241842).

## 13. Reprodutibilidade e engenharia do projeto

O repositório não possui documentação de entrada suficiente para outro avaliador executar o sistema com segurança. Faltam:

- README principal;
- pré-requisitos e versões;
- instalação;
- exemplo de `.env` sem credenciais;
- criação e migração do banco;
- seed do autônomo principal;
- origem e competência dos CSVs SINAPI;
- comandos de teste, lint, build e execução;
- arquitetura resumida;
- limitações conhecidas;
- política de backup;
- dados de demonstração;
- licença, se houver distribuição.

Para um TCC de Computação, a reprodutibilidade do artefato deve ser parte da entrega acadêmica, mesmo que o sistema não seja publicado comercialmente.

## 14. O que retirar ou reduzir

1. Reduzir definições elementares de HTML/CSS/JavaScript.
2. Remover ou encurtar MVC, já que a arquitetura real é em camadas informais.
3. Remover TAM/UTAUT se não forem aplicados de forma explícita.
4. Mover os 40 casos de uso completos para apêndice.
5. Enxugar a lista de siglas.
6. Evitar expressões promocionais como “intuitivo”, “profissional”, “confiável” e “protege” sem métrica ou garantia.
7. Evitar listar trabalhos futuros excessivamente amplos, como IA, voz, gateways, NFS-e, CRM, WhatsApp, PWA e previsão, sem priorização. Três linhas coerentes são mais fortes que um catálogo de possibilidades.

## 15. O que acrescentar

### No TCC

1. Pergunta de pesquisa explícita.
2. Tabela de requisitos funcionais e não funcionais com IDs e critérios verificáveis.
3. Matriz de rastreabilidade: objetivo → requisito → caso de uso → implementação → teste.
4. Tabela comparativa dos trabalhos/sistemas relacionados.
5. Protocolo completo de avaliação e instrumentos em apêndice.
6. Definição de erro crítico e critérios de sucesso de cada tarefa.
7. Descrição da versão do software e ambiente de teste.
8. Discussão de LGPD, consentimento e anonimização.
9. Limitações técnicas já comprovadas neste parecer.
10. Seção curta de ameaças à validade: interna, externa, de construto e de conclusão.

### No sistema

1. Transação única para criar/editar orçamento e itens.
2. Snapshots documentais de cliente, material e serviço.
3. `Decimal` ou centavos inteiros para dinheiro.
4. Controle concorrente dos recebimentos.
5. Autenticação e isolamento por proprietário, ou remoção temporária da aparência multiusuário.
6. FKs e constraints no banco.
7. Datas de vencimento e entidade de parcela, se o parcelamento for mantido.
8. Correção dos indicadores e períodos do dashboard.
9. Feedback explícito para falhas hoje silenciosas.
10. Testes de integração e ponta a ponta.
11. Auditoria de acessibilidade.
12. Documentação reprodutível do projeto e da base SINAPI.

## 16. Ordem recomendada de correção

### Antes de entregar o texto

1. Corrigir `40??`, “SINACRO”, “Sommervile”, “catálogo catálogo”, concordâncias e placeholders.
2. Corrigir referências e coautores.
3. Reescrever objetivos e inserir pergunta de pesquisa.
4. Calibrar afirmações sobre transação, histórico, DCU, isolamento, proteção e REST.
5. Completar o protocolo metodológico.
6. Mover casos de uso extensos para apêndice e inserir rastreabilidade.
7. Documentar a competência e a natureza da base SINAPI.
8. Revisar os espaços quebrados no LaTeX e a legibilidade das figuras.

### Antes de demonstrar o sistema à banca

1. Corrigir o lint.
2. Tornar criação/edição de orçamento atômica.
3. Corrigir quantidade decimal de materiais.
4. Corrigir V34 ou persistir forma padrão.
5. Corrigir o alerta de 15 dias e o corte oculto em abril.
6. Garantir que falha de API não apareça como zero financeiro.
7. Preparar banco demonstrativo pequeno e coerente.
8. Testar o fluxo completo em celular e desktop.

### Evolução posterior

1. Snapshots históricos e moeda decimal.
2. Autenticação/multiusuário.
3. Entidade de parcela com vencimento e estado.
4. Testes de concorrência, integração, PDF e acessibilidade.

## 17. Perguntas que eu faria na banca

1. Em que evidência você baseou a premissa de baixa familiaridade digital do público?
2. O que torna o processo verdadeiramente centrado no usuário, e não apenas inspirado em heurísticas?
3. Por que usar TAM e UTAUT se o instrumento descrito não mede seus construtos?
4. O que acontece se a criação do terceiro item de um orçamento falhar?
5. Um orçamento antigo permanece idêntico após editar o nome do cliente ou de um serviço?
6. Por que valores monetários são armazenados em ponto flutuante?
7. Como o sistema impede dois recebimentos simultâneos de ultrapassarem o saldo?
8. Qual é a competência exata da base SINAPI e como as unidades foram mapeadas?
9. Por que o dashboard ignora janeiro, fevereiro e março?
10. Como foi calculado “esperado no mês” quando não há parcelas cadastradas?
11. Qual é a diferença, no seu sistema, entre “Inicializado” e “Em andamento”?
12. Como os critérios de sucesso foram definidos e o que é um erro crítico?
13. Quantos avaliadores realizarão a inspeção heurística e como divergências serão consolidadas?
14. Que medidas foram tomadas para privacidade e consentimento dos participantes?
15. O sistema é para autônomos, pequenas empresas ou ambos? Que recursos efetivamente atendem uma empresa com mais de um operador?

O candidato deve preparar respostas honestas e tecnicamente delimitadas. Reconhecer uma limitação com clareza é melhor do que defender uma garantia que o código contradiz.

## 18. Parecer final

O sistema-orc constitui uma entrega relevante e funcional, e o TCC possui uma estrutura aproveitável. O trabalho demonstra capacidade de desenvolvimento full-stack, modelagem relacional, construção de interface, geração de documentos e criação de regras de negócio. Isso é mérito real.

O texto, entretanto, precisa trocar parte de sua linguagem afirmativa por uma descrição mais precisa do protótipo. As correções mais importantes são: alinhar as garantias de transação e histórico ao código, tornar a metodologia reproduzível, resolver a desconexão TAM/UTAUT, corrigir referências e erros formais e documentar claramente a condição monoinquilino.

Minha recomendação de banca seria **aprovação condicionada a revisão substancial**, não rejeição. Há um bom TCC dentro deste material. Para que ele apareça, o autor deve ser menos promocional, mais verificável e mais explícito sobre os limites do artefato.
