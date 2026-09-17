import {
  calcularDataFimObra,
  dataParaChave,
  diasPendentesAtualizacao,
  chaveParaData,
  listarDiasPeriodo,
  proximoDiaUtil,
  inicioDoDiaLocal,
} from "./dias-uteis";

export const STATUS_CONTROLE = ["ACEITO", "INICIALIZADO", "FINALIZADO"] as const;
export type StatusControle = (typeof STATUS_CONTROLE)[number];

export type GastoDiaResumo = {
  data: string;
  valorPessoal: number;
  valorMateriais: number;
  semGastos: boolean;
  total: number;
  observacao?: string | null;
};

export type ResumoControleObra = {
  valorTotal: number;
  valorRecebido: number;
  gastoPessoal: number;
  gastoMateriais: number;
  gastoTotal: number;
  /** valorTotal − gastos (resultado estimado da obra) */
  resultadoEstimado: number;
  /** recebido − gastos (caixa) */
  resultadoCaixa: number;
  dataInicio: string | null;
  dataFim: string | null;
  dataFimManual: string | null;
  tempoEstimadoUsado: number | null;
  contaFinsDeSemana: boolean;
  diasPendentes: string[];
  diasObra: string[];
  obraEncerrada: boolean;
  usaEstimativa: boolean;
  diasEstimativa: number | null;
  valorDiaEstimativa: number | null;
  gastoEstimativa: number;
};

export function montarResumoControle(opts: {
  valorTotal: number;
  valorRecebido: number;
  dataInicio: Date | null;
  dataFimManual?: Date | null;
  tempoEstimadoOrcamento?: number | null;
  tempoEstimadoControle?: number | null;
  contaFinsDeSemana?: boolean;
  status?: string | null;
  usaEstimativa?: boolean;
  diasEstimativa?: number | null;
  valorDiaEstimativa?: number | null;
  gastos: {
    data: Date;
    valorPessoal: number;
    valorMateriais: number;
    semGastos: boolean;
    observacao?: string | null;
  }[];
  hoje?: Date;
}): ResumoControleObra & { gastosPorDia: GastoDiaResumo[] } {
  const contaFinsDeSemana = Boolean(opts.contaFinsDeSemana);
  const usaEstimativa = Boolean(opts.usaEstimativa);
  const diasEstimativa =
    opts.diasEstimativa != null && Number(opts.diasEstimativa) > 0
      ? Math.floor(Number(opts.diasEstimativa))
      : null;
  const valorDiaEstimativa =
    opts.valorDiaEstimativa != null && Number(opts.valorDiaEstimativa) > 0
      ? Math.round(Number(opts.valorDiaEstimativa) * 100) / 100
      : null;
  const gastoEstimativa =
    usaEstimativa && diasEstimativa && valorDiaEstimativa
      ? Math.round(diasEstimativa * valorDiaEstimativa * 100) / 100
      : 0;

  const gastoPessoalDiario = opts.gastos.reduce(
    (s, g) => s + (g.semGastos ? 0 : Number(g.valorPessoal || 0)),
    0
  );
  const gastoMateriaisDiario = opts.gastos.reduce(
    (s, g) => s + (g.semGastos ? 0 : Number(g.valorMateriais || 0)),
    0
  );

  // Estimativa rápida substitui o total de gastos diários no resultado.
  const gastoPessoal = usaEstimativa ? gastoEstimativa : gastoPessoalDiario;
  const gastoMateriais = usaEstimativa ? 0 : gastoMateriaisDiario;
  const gastoTotal = Math.round((gastoPessoal + gastoMateriais) * 100) / 100;

  const valorTotal = Math.round(Number(opts.valorTotal || 0) * 100) / 100;
  const valorRecebido = Math.round(Number(opts.valorRecebido || 0) * 100) / 100;

  const tempoEstimadoUsado =
    opts.tempoEstimadoControle != null && Number(opts.tempoEstimadoControle) > 0
      ? Math.floor(Number(opts.tempoEstimadoControle))
      : opts.tempoEstimadoOrcamento != null && Number(opts.tempoEstimadoOrcamento) > 0
        ? Math.floor(Number(opts.tempoEstimadoOrcamento))
        : null;

  const dataInicio = opts.dataInicio;
  const dataFimCalculada =
    dataInicio && tempoEstimadoUsado
      ? calcularDataFimObra(dataInicio, tempoEstimadoUsado, contaFinsDeSemana)
      : null;
  const dataFimManual = opts.dataFimManual ? inicioDoDiaLocal(opts.dataFimManual) : null;
  const dataFim = dataFimManual ?? dataFimCalculada;

  const obraEncerrada = Boolean(
    dataFimManual || opts.status === "FINALIZADO" || (usaEstimativa && gastoEstimativa > 0)
  );

  const registradas = new Set(opts.gastos.map((g) => dataParaChave(g.data)));

  // Finalizados / obra encerrada / estimativa rápida: sem alerta de dias pendentes.
  const gerarAlertasPendentes =
    Boolean(dataInicio) && !obraEncerrada && !usaEstimativa && opts.status !== "FINALIZADO";

  const pendentes = gerarAlertasPendentes
    ? diasPendentesAtualizacao(
        dataInicio!,
        dataFim,
        registradas,
        opts.hoje,
        contaFinsDeSemana
      ).map(dataParaChave)
    : [];

  const inicioLista = dataInicio
    ? contaFinsDeSemana
      ? inicioDoDiaLocal(dataInicio)
      : proximoDiaUtil(dataInicio)
    : null;
  const fimLista = dataFim ?? (opts.hoje ? inicioDoDiaLocal(opts.hoje) : inicioDoDiaLocal(new Date()));

  const diasObra =
    inicioLista && fimLista && inicioLista <= fimLista
      ? listarDiasPeriodo(inicioLista, fimLista, contaFinsDeSemana).map(dataParaChave)
      : [];

  const gastosPorDia: GastoDiaResumo[] = opts.gastos
    .map((g) => {
      const vp = g.semGastos ? 0 : Number(g.valorPessoal || 0);
      const vm = g.semGastos ? 0 : Number(g.valorMateriais || 0);
      return {
        data: dataParaChave(g.data),
        valorPessoal: vp,
        valorMateriais: vm,
        semGastos: g.semGastos,
        total: Math.round((vp + vm) * 100) / 100,
        observacao: g.observacao ?? null,
      };
    })
    .sort((a, b) => a.data.localeCompare(b.data));

  return {
    valorTotal,
    valorRecebido,
    gastoPessoal: Math.round(gastoPessoal * 100) / 100,
    gastoMateriais: Math.round(gastoMateriais * 100) / 100,
    gastoTotal,
    resultadoEstimado: Math.round((valorTotal - gastoTotal) * 100) / 100,
    resultadoCaixa: Math.round((valorRecebido - gastoTotal) * 100) / 100,
    dataInicio: dataInicio ? dataParaChave(dataInicio) : null,
    dataFim: dataFim ? dataParaChave(dataFim) : null,
    dataFimManual: dataFimManual ? dataParaChave(dataFimManual) : null,
    tempoEstimadoUsado,
    contaFinsDeSemana,
    diasPendentes: pendentes,
    diasObra,
    obraEncerrada,
    usaEstimativa,
    diasEstimativa,
    valorDiaEstimativa,
    gastoEstimativa,
    gastosPorDia,
  };
}

export { chaveParaData, dataParaChave };
