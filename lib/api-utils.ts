/**
 * Utilitários para chamadas à API e tratamento de erros.
 * Centraliza a lógica de parse de erros e evita duplicação.
 */

/**
 * Extrai a mensagem de erro de uma resposta da API.
 * Tenta ler o corpo JSON e retorna `error` ou mensagem padrão.
 */
export async function parseApiError(
  resposta: Response,
  mensagemPadrao: string = "Falha na operação"
): Promise<string> {
  try {
    const dados = await resposta.json();
    if (dados && typeof dados.error === "string") {
      return dados.error;
    }
  } catch {
    // resposta não é JSON válido
  }
  return mensagemPadrao;
}

/**
 * Lança erro com mensagem da API se a resposta não for ok.
 * Útil para padronizar o tratamento após fetch.
 */
export async function assertOk(
  resposta: Response,
  mensagemPadrao: string = "Falha na operação"
): Promise<void> {
  if (!resposta.ok) {
    const mensagem = await parseApiError(resposta, mensagemPadrao);
    throw new Error(mensagem);
  }
}

/**
 * Executa fetch e retorna JSON, lançando em caso de erro.
 */
export async function fetchJson<T>(
  url: string,
  opts?: RequestInit,
  mensagemErro: string = "Falha ao carregar"
): Promise<T> {
  const resposta = await fetch(url, opts);
  await assertOk(resposta, mensagemErro);
  return resposta.json();
}
