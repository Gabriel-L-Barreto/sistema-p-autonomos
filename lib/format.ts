/**
 * Utilitários de formatação compartilhados no sistema.
 * Evita duplicação de lógica de formatação em páginas e componentes.
 */

const FORMATO_MOEDA = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const FORMATO_NUMERO_2_CASAS = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formata um número como moeda em Real (R$).
 */
export function formatarPreco(valor: number): string {
  return FORMATO_MOEDA.format(valor);
}

/**
 * Formata um número como moeda com opções customizadas.
 */
export function formatarMoeda(
  valor: number,
  opts?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: opts?.minimumFractionDigits ?? 2,
    maximumFractionDigits: opts?.maximumFractionDigits ?? 2,
  }).format(valor);
}

/**
 * Formata um número comum com separadores pt-BR.
 */
export function formatarNumero(
  valor: number,
  opts?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  if (!opts) return FORMATO_NUMERO_2_CASAS.format(valor);
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: opts.minimumFractionDigits ?? 2,
    maximumFractionDigits: opts.maximumFractionDigits ?? 2,
  }).format(valor);
}

/**
 * Formata uma data para exibição (dd/mm/aaaa).
 */
export function formatarData(data: string | Date): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formata data e hora para exibição (dd/mm/aaaa hh:mm).
 */
export function formatarDataHora(data: string | Date): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
