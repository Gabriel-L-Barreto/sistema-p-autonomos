# Casos de Uso do Sistema de Orçamentos

> Modelo aplicado: Identificador, Ator Principal, Pré-condições, Pós-condições, Fluxo Principal e Fluxo Alternativo.

---

## Caso de Uso: Acessar painel inicial e indicadores
**Identificador:** V01  
**Ator Principal:** Visitante  
**Pré-condições:** Sistema disponível.  
**Pós-condições:** Indicadores e atalhos do sistema são exibidos.  
**Fluxo Principal:**
1. O usuário acessa a página inicial.
2. A ferramenta consulta os indicadores do dashboard.
3. A ferramenta exibe gráficos, alertas e atalhos de navegação.
**Fluxo Alternativo:**  
2a. Caso ocorra falha ao carregar indicadores, a ferramenta mantém a página acessível sem dados estatísticos.

## Caso de Uso: Ocultar ou exibir valores financeiros na home
**Identificador:** V02  
**Ator Principal:** Visitante  
**Pré-condições:** Painel inicial aberto.  
**Pós-condições:** Preferência de ocultação é aplicada e salva localmente.  
**Fluxo Principal:**
1. O usuário clica em "Ocultar valores" ou "Mostrar valores".
2. A ferramenta alterna a visualização dos valores monetários.
3. A ferramenta salva a preferência no armazenamento local.
**Fluxo Alternativo:**  
3a. Caso o armazenamento local não esteja disponível, a ferramenta aplica a mudança apenas na sessão atual.

## Caso de Uso: Cadastrar cliente
**Identificador:** V03  
**Ator Principal:** Visitante  
**Pré-condições:** Usuário na tela de clientes.  
**Pós-condições:** Cliente é salvo no catálogo.  
**Fluxo Principal:**
1. O usuário informa nome, afiliação e telefone.
2. O usuário confirma o cadastro.
3. A ferramenta valida os dados e cria o cliente.
4. A lista de clientes é atualizada.
**Fluxo Alternativo:**  
3a. Caso o nome esteja vazio, a ferramenta exibe erro e não salva.

## Caso de Uso: Buscar clientes
**Identificador:** V04  
**Ator Principal:** Visitante  
**Pré-condições:** Existência da tela de clientes.  
**Pós-condições:** Lista é filtrada conforme o termo pesquisado.  
**Fluxo Principal:**
1. O usuário digita um termo de busca.
2. A ferramenta consulta clientes por nome, afiliação ou telefone.
3. A ferramenta exibe os resultados filtrados.
**Fluxo Alternativo:**  
3a. Caso não haja correspondências, a ferramenta informa que nenhum cliente foi encontrado.

## Caso de Uso: Editar cliente
**Identificador:** V05  
**Ator Principal:** Visitante  
**Pré-condições:** Cliente existente no sistema.  
**Pós-condições:** Dados do cliente são atualizados.  
**Fluxo Principal:**
1. O usuário seleciona a ação de editar.
2. A ferramenta carrega os dados no formulário.
3. O usuário altera os dados e confirma.
4. A ferramenta valida e salva as alterações.
**Fluxo Alternativo:**  
4a. Caso ocorra erro de validação, a ferramenta informa o problema e mantém a edição aberta.

## Caso de Uso: Excluir cliente
**Identificador:** V06  
**Ator Principal:** Visitante  
**Pré-condições:** Cliente existente no sistema.  
**Pós-condições:** Cliente é removido do cadastro.  
**Fluxo Principal:**
1. O usuário escolhe excluir um cliente.
2. A ferramenta solicita confirmação.
3. O usuário confirma a exclusão.
4. A ferramenta remove o cliente e atualiza a lista.
**Fluxo Alternativo:**  
4a. Caso a exclusão falhe, a ferramenta exibe erro e mantém o registro.

## Caso de Uso: Cadastrar material no catálogo
**Identificador:** V07  
**Ator Principal:** Visitante  
**Pré-condições:** Usuário na tela de materiais.  
**Pós-condições:** Material é criado no catálogo.  
**Fluxo Principal:**
1. O usuário informa nome, unidade de medida e preço unitário.
2. O usuário confirma o cadastro.
3. A ferramenta valida os dados e cria o material ativo.
4. A lista de materiais é atualizada.
**Fluxo Alternativo:**  
3a. Caso já exista material com mesmo nome, a ferramenta bloqueia o cadastro e informa duplicidade.

## Caso de Uso: Buscar materiais no catálogo
**Identificador:** V08  
**Ator Principal:** Visitante  
**Pré-condições:** Tela de materiais disponível.  
**Pós-condições:** Lista de materiais é filtrada.  
**Fluxo Principal:**
1. O usuário informa termo de busca.
2. A ferramenta consulta materiais por nome.
3. A ferramenta exibe materiais correspondentes.
**Fluxo Alternativo:**  
3a. Caso não haja resultados, a ferramenta informa ausência de materiais na busca.

## Caso de Uso: Editar material do catálogo
**Identificador:** V09  
**Ator Principal:** Visitante  
**Pré-condições:** Material previamente cadastrado.  
**Pós-condições:** Dados do material são atualizados.  
**Fluxo Principal:**
1. O usuário seleciona editar material.
2. A ferramenta carrega os dados no formulário.
3. O usuário altera dados e confirma.
4. A ferramenta valida e persiste a atualização.
**Fluxo Alternativo:**  
4a. Caso a atualização viole validações, a ferramenta cancela a gravação e exibe erro.

## Caso de Uso: Ativar ou desativar material
**Identificador:** V10  
**Ator Principal:** Visitante  
**Pré-condições:** Material existente na listagem.  
**Pós-condições:** Estado ativo/inativo do material é alterado.  
**Fluxo Principal:**
1. O usuário aciona o controle de ativação do material.
2. A ferramenta altera o estado do item.
3. A ferramenta recarrega a listagem.
**Fluxo Alternativo:**  
2a. Caso a atualização falhe, a ferramenta mantém o estado anterior e exibe erro.

## Caso de Uso: Excluir material do catálogo
**Identificador:** V11  
**Ator Principal:** Visitante  
**Pré-condições:** Material existente no catálogo.  
**Pós-condições:** Material é removido do catálogo.  
**Fluxo Principal:**
1. O usuário solicita exclusão do material.
2. A ferramenta pede confirmação.
3. O usuário confirma.
4. A ferramenta exclui o material e atualiza a lista.
**Fluxo Alternativo:**  
4a. Caso não seja possível excluir, a ferramenta exibe erro e preserva o registro.

## Caso de Uso: Cadastrar serviço no catálogo
**Identificador:** V12  
**Ator Principal:** Visitante  
**Pré-condições:** Usuário na tela de serviços.  
**Pós-condições:** Serviço é criado no catálogo.  
**Fluxo Principal:**
1. O usuário informa descrição, tipo de cobrança e preço base.
2. O usuário confirma o cadastro.
3. A ferramenta valida os dados e cria o serviço ativo.
4. A listagem de serviços é atualizada.
**Fluxo Alternativo:**  
3a. Caso já exista serviço com a mesma descrição, a ferramenta bloqueia a criação e informa duplicidade.

## Caso de Uso: Buscar serviços no catálogo
**Identificador:** V13  
**Ator Principal:** Visitante  
**Pré-condições:** Tela de serviços disponível.  
**Pós-condições:** Lista de serviços é filtrada.  
**Fluxo Principal:**
1. O usuário digita termo de busca.
2. A ferramenta consulta serviços por descrição.
3. A ferramenta exibe resultados encontrados.
**Fluxo Alternativo:**  
3a. Caso nenhum serviço corresponda ao termo, a ferramenta informa ausência de resultados.

## Caso de Uso: Editar serviço do catálogo
**Identificador:** V14  
**Ator Principal:** Visitante  
**Pré-condições:** Serviço cadastrado.  
**Pós-condições:** Serviço é atualizado no catálogo.  
**Fluxo Principal:**
1. O usuário seleciona a edição de um serviço.
2. A ferramenta preenche os dados atuais no formulário.
3. O usuário altera e confirma.
4. A ferramenta valida e grava as alterações.
**Fluxo Alternativo:**  
4a. Caso haja inconsistência de dados, a ferramenta rejeita a atualização e mostra o motivo.

## Caso de Uso: Ativar ou desativar serviço
**Identificador:** V15  
**Ator Principal:** Visitante  
**Pré-condições:** Serviço existente.  
**Pós-condições:** Indicador de ativo/inativo do serviço é atualizado.  
**Fluxo Principal:**
1. O usuário aciona o botão de alternância do serviço.
2. A ferramenta altera o estado do serviço.
3. A listagem é recarregada com o novo estado.
**Fluxo Alternativo:**  
2a. Caso ocorra falha no salvamento, a ferramenta mantém o estado anterior e informa erro.

## Caso de Uso: Excluir serviço do catálogo
**Identificador:** V16  
**Ator Principal:** Visitante  
**Pré-condições:** Serviço existente no catálogo.  
**Pós-condições:** Serviço é removido da base.  
**Fluxo Principal:**
1. O usuário solicita a exclusão.
2. A ferramenta pede confirmação.
3. O usuário confirma.
4. A ferramenta exclui e atualiza a listagem.
**Fluxo Alternativo:**  
4a. Caso a exclusão falhe, a ferramenta mantém o serviço e exibe erro.

## Caso de Uso: Vincular material a serviço
**Identificador:** V17  
**Ator Principal:** Visitante  
**Pré-condições:** Serviço e material existentes.  
**Pós-condições:** Vínculo material-serviço é salvo com quantidade por unidade.  
**Fluxo Principal:**
1. O usuário seleciona material e define quantidade por unidade do serviço.
2. O usuário confirma o vínculo.
3. A ferramenta cria ou atualiza o vínculo do material no serviço.
4. A ferramenta exibe o material vinculado na lista do serviço.
**Fluxo Alternativo:**  
3a. Caso serviço ou material não exista, a ferramenta cancela a operação e informa erro.

## Caso de Uso: Desvincular material de serviço
**Identificador:** V18  
**Ator Principal:** Visitante  
**Pré-condições:** Existência de vínculo material-serviço.  
**Pós-condições:** Vínculo é removido do serviço.  
**Fluxo Principal:**
1. O usuário seleciona remover vínculo.
2. A ferramenta exclui o vínculo.
3. A lista de materiais vinculados é atualizada.
**Fluxo Alternativo:**  
2a. Caso a remoção falhe, a ferramenta exibe erro e mantém o vínculo.

## Caso de Uso: Ativar ou desativar uso da SINAPI
**Identificador:** V19  
**Ator Principal:** Visitante  
**Pré-condições:** Tela de configuração SINAPI acessível.  
**Pós-condições:** Preferência de uso da SINAPI é salva localmente.  
**Fluxo Principal:**
1. O usuário acessa a tela SINAPI.
2. O usuário alterna o seletor "Usar tabela SINAPI".
3. A ferramenta salva o estado no armazenamento local.
4. Na criação/edição de orçamento, itens SINAPI passam a aparecer ou deixam de aparecer na busca.
**Fluxo Alternativo:**  
3a. Caso não seja possível salvar localmente, a ferramenta mantém o estado apenas na sessão atual.

## Caso de Uso: Consultar itens SINAPI (insumos e serviços)
**Identificador:** V20  
**Ator Principal:** Visitante  
**Pré-condições:** SINAPI ativada nas preferências locais.  
**Pós-condições:** Itens de referência SINAPI ficam disponíveis para seleção em orçamento.  
**Fluxo Principal:**
1. O usuário abre o formulário de orçamento.
2. A ferramenta consulta insumos e serviços SINAPI.
3. A ferramenta incorpora os itens SINAPI nas buscas de materiais e serviços.
**Fluxo Alternativo:**  
2a. Caso haja falha ao carregar tabelas SINAPI, a ferramenta segue com os catálogos internos.

## Caso de Uso: Criar orçamento
**Identificador:** V21  
**Ator Principal:** Visitante  
**Pré-condições:** Cliente existente e pelo menos um serviço informado.  
**Pós-condições:** Orçamento é criado com histórico inicial de status.  
**Fluxo Principal:**
1. O usuário preenche dados gerais do orçamento.
2. O usuário adiciona serviços e, opcionalmente, materiais.
3. O usuário confirma a criação.
4. A ferramenta valida dados e cria o orçamento.
5. A ferramenta salva serviços e materiais vinculados ao orçamento.
6. A ferramenta abre o PDF do orçamento gerado.
**Fluxo Alternativo:**  
4a. Caso dados obrigatórios estejam ausentes (cliente, endereço ou serviços), a ferramenta bloqueia o salvamento e informa erro.

## Caso de Uso: Editar orçamento
**Identificador:** V22  
**Ator Principal:** Visitante  
**Pré-condições:** Orçamento existente.  
**Pós-condições:** Dados e composição do orçamento são atualizados.  
**Fluxo Principal:**
1. O usuário acessa o orçamento para edição.
2. A ferramenta carrega dados e itens atuais.
3. O usuário altera dados, serviços e materiais.
4. O usuário confirma atualização.
5. A ferramenta atualiza o orçamento e regrava os itens.
**Fluxo Alternativo:**  
1a. Caso o orçamento não exista, a ferramenta informa que o registro não foi encontrado.

## Caso de Uso: Listar, filtrar, ordenar e paginar orçamentos
**Identificador:** V23  
**Ator Principal:** Visitante  
**Pré-condições:** Módulo de orçamentos acessível.  
**Pós-condições:** Usuário visualiza lista conforme critérios aplicados.  
**Fluxo Principal:**
1. O usuário abre a lista de orçamentos.
2. O usuário aplica busca, filtro de status/alerta, ordenação e/ou paginação.
3. A ferramenta consulta e retorna os orçamentos correspondentes.
4. A ferramenta exibe a lista atualizada.
**Fluxo Alternativo:**  
3a. Caso nenhum orçamento corresponda aos filtros, a ferramenta informa lista vazia.

## Caso de Uso: Alterar status de orçamento
**Identificador:** V24  
**Ator Principal:** Visitante  
**Pré-condições:** Orçamento existente na listagem.  
**Pós-condições:** Status do orçamento é atualizado e registrado no histórico quando houver mudança.  
**Fluxo Principal:**
1. O usuário seleciona novo status na lista.
2. A ferramenta atualiza o orçamento.
3. A ferramenta registra a mudança no histórico de status.
4. A lista é recarregada com o novo estado.
**Fluxo Alternativo:**  
2a. Caso a atualização falhe, a ferramenta mantém o status anterior e exibe erro.

## Caso de Uso: Excluir orçamento
**Identificador:** V25  
**Ator Principal:** Visitante  
**Pré-condições:** Orçamento existente.  
**Pós-condições:** Orçamento e seus registros relacionados são removidos.  
**Fluxo Principal:**
1. O usuário solicita exclusão de orçamento.
2. A ferramenta pede confirmação.
3. O usuário confirma.
4. A ferramenta exclui o orçamento.
5. A ferramenta recarrega a listagem.
**Fluxo Alternativo:**  
4a. Caso a exclusão falhe, a ferramenta exibe erro e não altera a lista.

## Caso de Uso: Visualizar orçamento detalhado
**Identificador:** V26  
**Ator Principal:** Visitante  
**Pré-condições:** Orçamento existente.  
**Pós-condições:** Dados completos do orçamento são exibidos para consulta.  
**Fluxo Principal:**
1. O usuário abre a visualização de um orçamento.
2. A ferramenta exibe dados do cliente, endereço, status e totais.
3. A ferramenta exibe serviços, materiais e comprovantes de recebimento.
**Fluxo Alternativo:**  
1a. Caso o orçamento não seja encontrado, a ferramenta mostra mensagem de inexistência.

## Caso de Uso: Adicionar material ao orçamento
**Identificador:** V27  
**Ator Principal:** Visitante  
**Pré-condições:** Formulário de orçamento aberto.  
**Pós-condições:** Material é incluído nos itens do orçamento.  
**Fluxo Principal:**
1. O usuário informa material, medida, quantidade e preço unitário.
2. O usuário adiciona o item ao orçamento.
3. A ferramenta inclui o material na composição.
**Fluxo Alternativo:**  
2a. Caso o usuário escolha cadastrar novo material no catálogo, a ferramenta cria o material e o adiciona ao orçamento.  
2b. Caso o item seja selecionado da SINAPI, a ferramenta adiciona como origem SINAPI no orçamento.  
2c. Caso dados obrigatórios estejam inválidos, a ferramenta bloqueia a inclusão e exibe erro.

## Caso de Uso: Remover material do orçamento
**Identificador:** V28  
**Ator Principal:** Visitante  
**Pré-condições:** Existência de material na composição do orçamento.  
**Pós-condições:** Material é removido da composição.  
**Fluxo Principal:**
1. O usuário seleciona remover material.
2. A ferramenta exclui o item da composição.
3. Totais são recalculados.
**Fluxo Alternativo:**  
2a. Caso a operação ocorra durante edição persistida e haja falha na remoção, a ferramenta informa erro.

## Caso de Uso: Adicionar serviço ao orçamento
**Identificador:** V29  
**Ator Principal:** Visitante  
**Pré-condições:** Formulário de orçamento aberto.  
**Pós-condições:** Serviço é incluído no orçamento.  
**Fluxo Principal:**
1. O usuário seleciona ou digita um serviço.
2. O usuário informa quantidade e valor de mão de obra.
3. O usuário adiciona o serviço.
4. A ferramenta inclui o serviço na composição do orçamento.
5. Se o serviço vier do catálogo e possuir materiais vinculados, a ferramenta acrescenta esses materiais automaticamente.
**Fluxo Alternativo:**  
4a. Caso o usuário escolha cadastrar novo serviço no catálogo, a ferramenta cria o serviço e o adiciona ao orçamento.  
4b. Caso o serviço seja SINAPI, a ferramenta registra como descrição livre com origem SINAPI.  
4c. Caso campos obrigatórios estejam inválidos, a ferramenta impede a inclusão e exibe erro.

## Caso de Uso: Remover serviço do orçamento
**Identificador:** V30  
**Ator Principal:** Visitante  
**Pré-condições:** Existência de serviço na composição do orçamento.  
**Pós-condições:** Serviço é removido e totais são recalculados.  
**Fluxo Principal:**
1. O usuário seleciona remover serviço.
2. A ferramenta remove o serviço da composição.
3. A ferramenta recalcula o total de serviços.
4. A ferramenta também ajusta materiais vinculados automaticamente adicionados por esse serviço.
**Fluxo Alternativo:**  
4a. Caso não seja possível recalcular materiais vinculados, a ferramenta mantém os itens restantes válidos.

## Caso de Uso: Definir se materiais entram no valor total
**Identificador:** V31  
**Ator Principal:** Visitante  
**Pré-condições:** Formulário de orçamento aberto com materiais cadastrados.  
**Pós-condições:** Regra de composição de total do orçamento é atualizada.  
**Fluxo Principal:**
1. O usuário marca ou desmarca "Incluir materiais no valor total".
2. A ferramenta recalcula o valor total do orçamento.
3. A configuração é salva ao confirmar o orçamento.
**Fluxo Alternativo:**  
2a. Caso não existam materiais no orçamento, a ferramenta mantém total baseado apenas em serviços.

## Caso de Uso: Registrar complemento textual do orçamento
**Identificador:** V32  
**Ator Principal:** Visitante  
**Pré-condições:** Formulário de orçamento aberto.  
**Pós-condições:** Complemento é salvo e incluído no documento do orçamento.  
**Fluxo Principal:**
1. O usuário abre a seção de complemento.
2. O usuário descreve observações e condições.
3. A ferramenta sanitiza e salva o conteúdo ao gravar o orçamento.
**Fluxo Alternativo:**  
3a. Caso o campo esteja vazio, a ferramenta salva o orçamento sem complemento.

## Caso de Uso: Registrar recebimento por abatimento de valor livre
**Identificador:** V33  
**Ator Principal:** Visitante  
**Pré-condições:** Orçamento com saldo restante maior que zero.  
**Pós-condições:** Pagamento é criado e comprovante pode ser emitido.  
**Fluxo Principal:**
1. O usuário seleciona "Recebimento" e escolhe "Abater valor".
2. O usuário informa valor e forma de pagamento.
3. A ferramenta valida limite de valor pelo saldo restante.
4. A ferramenta cria o pagamento.
5. A ferramenta atualiza a listagem e abre o PDF do comprovante.
**Fluxo Alternativo:**  
3a. Caso o valor informado exceda o saldo restante, a ferramenta bloqueia o registro e informa o limite.

## Caso de Uso: Configurar recebimento em parcelas iguais
**Identificador:** V34  
**Ator Principal:** Visitante  
**Pré-condições:** Orçamento selecionado para recebimento.  
**Pós-condições:** Quantidade total de parcelas é definida no orçamento.  
**Fluxo Principal:**
1. O usuário abre menu de recebimento e escolhe "Parcelas iguais".
2. O usuário informa quantidade de parcelas e forma padrão.
3. A ferramenta valida a quantidade.
4. A ferramenta salva a configuração de parcelas no orçamento.
**Fluxo Alternativo:**  
3a. Caso a quantidade seja inválida, a ferramenta impede o salvamento e exibe erro.

## Caso de Uso: Registrar próxima parcela de parcelas iguais
**Identificador:** V35  
**Ator Principal:** Visitante  
**Pré-condições:** Orçamento com parcelas iguais configuradas e saldo restante.  
**Pós-condições:** Próxima parcela é registrada e comprovante pode ser emitido.  
**Fluxo Principal:**
1. O usuário aciona recebimento da próxima parcela.
2. A ferramenta calcula automaticamente o valor da parcela com base no saldo e parcelas restantes.
3. A ferramenta cria o pagamento.
4. A ferramenta atualiza contadores de parcelas.
5. A ferramenta abre o PDF do comprovante.
**Fluxo Alternativo:**  
2a. Caso não haja saldo restante, a ferramenta bloqueia nova parcela e informa quitação.

## Caso de Uso: Editar comprovante de recebimento
**Identificador:** V36  
**Ator Principal:** Visitante  
**Pré-condições:** Existência de pagamento registrado.  
**Pós-condições:** Pagamento é atualizado com novo valor/forma/data válidos.  
**Fluxo Principal:**
1. O usuário abre a edição de um pagamento.
2. O usuário ajusta valor e forma de pagamento.
3. A ferramenta valida o valor máximo permitido.
4. A ferramenta salva a atualização e recarrega o orçamento.
**Fluxo Alternativo:**  
3a. Caso o novo valor exceda o limite permitido, a ferramenta rejeita a alteração e mostra erro.

## Caso de Uso: Excluir comprovante de recebimento
**Identificador:** V37  
**Ator Principal:** Visitante  
**Pré-condições:** Existência de pagamento registrado.  
**Pós-condições:** Pagamento é removido do orçamento.  
**Fluxo Principal:**
1. O usuário solicita excluir um comprovante.
2. A ferramenta pede confirmação.
3. O usuário confirma.
4. A ferramenta remove o pagamento e atualiza os totais.
**Fluxo Alternativo:**  
4a. Caso a exclusão falhe, a ferramenta mantém o comprovante e exibe erro.

## Caso de Uso: Gerar PDF de orçamento
**Identificador:** V38  
**Ator Principal:** Visitante  
**Pré-condições:** Orçamento existente e acessível.  
**Pós-condições:** Arquivo PDF do orçamento é disponibilizado para download/abertura.  
**Fluxo Principal:**
1. O usuário solicita o PDF do orçamento.
2. A ferramenta carrega dados do orçamento e configuração de empresa.
3. A ferramenta monta o documento PDF.
4. A ferramenta entrega o arquivo para visualização/download.
**Fluxo Alternativo:**  
2a. Caso o orçamento não exista, a ferramenta retorna erro de não encontrado.

## Caso de Uso: Gerar PDF de comprovante de recebimento
**Identificador:** V39  
**Ator Principal:** Visitante  
**Pré-condições:** Pagamento existente.  
**Pós-condições:** PDF do comprovante é gerado e disponibilizado.  
**Fluxo Principal:**
1. O usuário solicita o PDF de um recebimento.
2. A ferramenta carrega pagamento, orçamento associado e dados da empresa.
3. A ferramenta identifica informação de parcela quando aplicável.
4. A ferramenta gera e entrega o PDF do comprovante.
**Fluxo Alternativo:**  
2a. Caso o pagamento não exista, a ferramenta informa que o recebimento não foi encontrado.

## Caso de Uso: Configurar dados da empresa e layout dos documentos
**Identificador:** V40  
**Ator Principal:** Visitante  
**Pré-condições:** Tela de configurações acessível.  
**Pós-condições:** Configurações de identidade e layout são persistidas.  
**Fluxo Principal:**
1. O usuário acessa configurações.
2. O usuário altera dados da empresa, cabeçalho, rodapé, logo, timbrado e opções visuais.
3. O usuário salva as alterações.
4. A ferramenta persiste os dados de configuração.
5. Os próximos PDFs passam a usar a configuração atualizada.
**Fluxo Alternativo:**  
4a. Caso não exista configuração prévia, a ferramenta cria uma configuração inicial e aplica os novos valores.  
4b. Caso ocorra falha no salvamento, a ferramenta exibe erro e mantém os dados anteriores.
