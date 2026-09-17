/**
 * Sanitização de strings para armazenamento seguro.
 * Evita XSS e payloads maliciosos em campos de texto.
 */

/** Tamanho máximo para campos de texto longo (complemento, descricao) */
export const MAX_LENGTH_TEXTO_LONGO = 50000;

/** Tamanho máximo para campos de texto curto (nome, endereço) */
export const MAX_LENGTH_TEXTO_CURTO = 2000;

/**
 * Remove conteúdo HTML perigoso (script, event handlers, javascript:).
 * Mantém tags seguras usadas pelo RichTextEditor: strong, em, ul, ol, li, br.
 */
export function sanitizarHtml(html: string | null | undefined): string {
  if (html == null || typeof html !== "string") return "";
  const resultado = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\bon\w+\s*=\s*[^\s>]+/gi, "");
  return resultado.slice(0, MAX_LENGTH_TEXTO_LONGO);
}

/**
 * Limita o tamanho de uma string.
 */
export function truncarTexto(texto: string, max: number = MAX_LENGTH_TEXTO_CURTO): string {
  if (typeof texto !== "string") return "";
  return texto.slice(0, max);
}
