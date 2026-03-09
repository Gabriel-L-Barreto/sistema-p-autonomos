/**
 * Funções compartilhadas para cálculos de orçamento e pagamentos.
 * Usadas em API routes, componentes e libs para evitar duplicação.
 */

export type ItemMaterial = {
  quantidade: number;
  precoUnitario: number;
};

export type ItemServico = {
  quantidade: number;
  valorMaoObra: number;
};

export type ItemPagamento = {
  valorRecebido: number;
};

/**
 * Calcula o valor total do orçamento (materiais + serviços).
 * @param materiais - Lista de materiais (considerados apenas se incluiMaterial)
 * @param servicos - Lista de serviços
 * @param incluiMaterial - Se true, soma materiais; se false, ignora
 */
export function calcularValorTotal(
  materiais: ItemMaterial[],
  servicos: ItemServico[],
  incluiMaterial: boolean
): number {
  const totalMateriais = incluiMaterial
    ? materiais.reduce((s, m) => s + m.quantidade * m.precoUnitario, 0)
    : 0;
  const totalServicos = servicos.reduce((s, srv) => s + srv.quantidade * srv.valorMaoObra, 0);
  return Math.round((totalMateriais + totalServicos) * 100) / 100;
}

/**
 * Calcula o total já pago a partir dos pagamentos.
 */
export function calcularTotalPago(pagamentos: ItemPagamento[]): number {
  return Math.round(
    pagamentos.reduce((s, p) => s + p.valorRecebido, 0) * 100
  ) / 100;
}

/**
 * Calcula o valor restante a pagar.
 */
export function calcularValorRestante(valorTotal: number, totalPago: number): number {
  return Math.max(0, Math.round((valorTotal - totalPago) * 100) / 100);
}

/**
 * Calcula a porcentagem paga (0 a 100).
 */
export function calcularPorcentagemPaga(valorTotal: number, totalPago: number): number {
  if (valorTotal <= 0) return 0;
  return Math.min(100, Math.round((totalPago / valorTotal) * 1000) / 10);
}
