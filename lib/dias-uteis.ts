/** Utilitários de calendário / dias úteis para o controle de obras. */

export function inicioDoDiaLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Normaliza para YYYY-MM-DD (calendário local). */
export function dataParaChave(d: Date): string {
  const x = inicioDoDiaLocal(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Interpreta YYYY-MM-DD como data local (meio-dia evita edge de fuso). */
export function chaveParaData(chave: string): Date {
  const [y, m, d] = chave.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

export function isDiaUtil(d: Date): boolean {
  const day = inicioDoDiaLocal(d).getDay();
  return day !== 0 && day !== 6;
}

/** Avança para o próximo dia útil (ou mantém se já for útil). */
export function proximoDiaUtil(d: Date): Date {
  const x = inicioDoDiaLocal(d);
  while (!isDiaUtil(x)) {
    x.setDate(x.getDate() + 1);
  }
  return x;
}

/**
 * Data final a partir do início contando `dias` (incluindo o início).
 * Se `incluirFinsDeSemana` for false, conta só dias úteis e começa no próximo útil.
 */
export function calcularDataFimObra(
  dataInicio: Date,
  dias: number,
  incluirFinsDeSemana = false
): Date | null {
  const n = Math.floor(Number(dias));
  if (!Number.isFinite(n) || n <= 0) return null;

  if (incluirFinsDeSemana) {
    const atual = inicioDoDiaLocal(dataInicio);
    atual.setDate(atual.getDate() + (n - 1));
    return atual;
  }

  let atual = proximoDiaUtil(dataInicio);
  let restantes = n - 1;
  while (restantes > 0) {
    atual.setDate(atual.getDate() + 1);
    if (isDiaUtil(atual)) restantes -= 1;
  }
  return inicioDoDiaLocal(atual);
}

/** Lista dias inclusivos entre início e fim (úteis ou todos, conforme flag). */
export function listarDiasPeriodo(
  inicio: Date,
  fim: Date,
  incluirFinsDeSemana = false
): Date[] {
  const out: Date[] = [];
  const a = inicioDoDiaLocal(inicio);
  const b = inicioDoDiaLocal(fim);
  if (a > b) return out;
  const cur = new Date(a);
  while (cur <= b) {
    if (incluirFinsDeSemana || isDiaUtil(cur)) out.push(inicioDoDiaLocal(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** @deprecated use listarDiasPeriodo */
export function listarDiasUteis(inicio: Date, fim: Date): Date[] {
  return listarDiasPeriodo(inicio, fim, false);
}

/**
 * Dias de [inicio .. min(hoje, fim)] que ainda não têm registro.
 * Não gera pendências futuras nem após a data fim.
 */
export function diasPendentesAtualizacao(
  dataInicio: Date,
  dataFim: Date | null,
  datasRegistradas: Set<string>,
  hoje = new Date(),
  incluirFinsDeSemana = false
): Date[] {
  const limite = inicioDoDiaLocal(hoje);
  const fimEfetivo = dataFim
    ? inicioDoDiaLocal(dataFim) < limite
      ? inicioDoDiaLocal(dataFim)
      : limite
    : limite;
  const inicioEfetivo = incluirFinsDeSemana
    ? inicioDoDiaLocal(dataInicio)
    : proximoDiaUtil(dataInicio);
  if (inicioEfetivo > fimEfetivo) return [];
  return listarDiasPeriodo(inicioEfetivo, fimEfetivo, incluirFinsDeSemana).filter(
    (d) => !datasRegistradas.has(dataParaChave(d))
  );
}

/** Quantidade de dias úteis em N dias corridos a partir do início (para estimativa rápida). */
export function contarDiasUteisEmPeriodo(dataInicio: Date, quantidadeDias: number): number {
  const n = Math.floor(Number(quantidadeDias));
  if (!Number.isFinite(n) || n <= 0) return 0;
  const inicio = proximoDiaUtil(dataInicio);
  const fim = calcularDataFimObra(inicio, n, false);
  if (!fim) return 0;
  return listarDiasPeriodo(inicio, fim, false).length;
}
