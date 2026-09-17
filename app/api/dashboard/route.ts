import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calcularValorTotal,
  calcularTotalPago,
  semRecebimentoHaMaisDeDias,
} from "@/lib/orcamento";

function calcularParcelasPadrao(valorTotal: number): number {
  if (valorTotal <= 5000) return 1;
  if (valorTotal <= 10000) return 2;
  if (valorTotal <= 15000) return 3;
  if (valorTotal <= 20000) return 4;
  return 6;
}

export async function GET() {
  try {
    const [totalClientes, totalOrcamentos, totalRecebimentos, lista] = await Promise.all([
      prisma.cliente.count(),
      prisma.orcamento.count(),
      prisma.pagamento.count(),
      prisma.orcamento.findMany({
        include: {
          materiais: true,
          servicos: true,
          pagamentos: true,
          historicoStatus: {
            orderBy: { data: "desc" },
          },
        },
      }),
    ]);

    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const inicioProximoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);
    const inicioAno = new Date(agora.getFullYear(), 0, 1);
    const inicioProximoAno = new Date(agora.getFullYear() + 1, 0, 1);
    const cincoDiasMs = 5 * 24 * 60 * 60 * 1000;

    let cadastrados = 0;
    let inicializados = 0;
    let orcamentosPendentes = 0;
    let finalizadosNaoQuitados = 0;
    let aceitosAguardandoInicio = 0;
    let inicializadosSemRecebimento15Dias = 0;
    let totalValorOrcamentos = 0;
    let totalValorRecebimentos = 0;
    let valorInicializados = 0;
    let valorAceitos = 0;
    let valorFinalizados = 0;
    let recebidoNoMes = 0;
    let esperadoNoMes = 0;
    let esperadoNoMesHeuristica = false;
    let valorTotalAnual = 0;
    let levantamentoRecebimentosMensal = 0;

    const recebimentosMensais = Array.from({ length: 12 }, () => 0);
    const valoresMensaisInicializados = Array.from({ length: 12 }, () => 0);

    const valorTotalPorOrcamento = new Map<number, number>();

    const orcamentosPorStatus = {
      ACEITO: { quantidade: 0, valor: 0 },
      INICIALIZADO: { quantidade: 0, valor: 0 },
      FINALIZADO: { quantidade: 0, valor: 0 },
    };

    const recebimentosPorStatus = {
      PENDENTE: { quantidade: 0, valor: 0 },
      PARCIAL: { quantidade: 0, valor: 0 },
      QUITADO: { quantidade: 0, valor: 0 },
    };

    for (const o of lista) {
      const valorTotal = calcularValorTotal(o.materiais, o.servicos, o.incluiMaterial);
      const valorPago = calcularTotalPago(o.pagamentos);
      const valorRestante = Math.max(0, valorTotal - valorPago);
      const quitado = valorPago >= valorTotal && valorTotal > 0;

      if (o.status === "CADASTRADO") cadastrados += 1;
      if (o.status === "INICIALIZADO") inicializados += 1;
      if (["CADASTRADO", "ACEITO", "INICIALIZADO"].includes(o.status) && valorRestante > 0) {
        orcamentosPendentes += 1;
      }

      const statusRelevante = ["ACEITO", "INICIALIZADO", "FINALIZADO"].includes(o.status);
      if (!statusRelevante) continue;

      const statusKey = o.status as keyof typeof orcamentosPorStatus;

      if (o.status === "FINALIZADO" && !quitado) finalizadosNaoQuitados += 1;
      if (o.status === "ACEITO") valorAceitos += valorTotal;
      if (o.status === "INICIALIZADO") valorInicializados += valorTotal;
      if (o.status === "FINALIZADO") valorFinalizados += valorTotal;
      valorTotalPorOrcamento.set(o.id, valorTotal);

      if (statusKey in orcamentosPorStatus) {
        orcamentosPorStatus[statusKey].quantidade += 1;
        orcamentosPorStatus[statusKey].valor += valorTotal;
      }

      if (quitado) {
        recebimentosPorStatus.QUITADO.quantidade += 1;
        recebimentosPorStatus.QUITADO.valor += valorTotal;
      } else if (valorPago > 0) {
        recebimentosPorStatus.PARCIAL.quantidade += 1;
        recebimentosPorStatus.PARCIAL.valor += valorRestante;
      } else {
        recebimentosPorStatus.PENDENTE.quantidade += 1;
        recebimentosPorStatus.PENDENTE.valor += valorTotal;
      }

      totalValorOrcamentos += valorTotal;
      totalValorRecebimentos += valorPago;
      if (o.data >= inicioAno && o.data < inicioProximoAno) valorTotalAnual += valorTotal;

      const totalParcelasInformadas = o.totalParcelas && o.totalParcelas > 0 ? Math.round(o.totalParcelas) : null;
      const usaHeuristica = totalParcelasInformadas === null;
      const totalParcelasEsperadas = totalParcelasInformadas ?? calcularParcelasPadrao(valorTotal);
      const valorParcelaEsperada = totalParcelasEsperadas > 0 ? valorTotal / totalParcelasEsperadas : valorTotal;
      if ((o.status === "INICIALIZADO" || (o.status === "FINALIZADO" && valorRestante > 0)) && valorRestante > 0) {
        esperadoNoMes += Math.min(valorRestante, valorParcelaEsperada);
        if (usaHeuristica) esperadoNoMesHeuristica = true;
      }

      const statusAceitoData = o.historicoStatus.find((h) => h.status === "ACEITO")?.data ?? null;
      if (o.status === "ACEITO" && statusAceitoData && agora.getTime() - statusAceitoData.getTime() > cincoDiasMs) {
        aceitosAguardandoInicio += 1;
      }

      if (
        semRecebimentoHaMaisDeDias(
          {
            status: o.status,
            valorRestante,
            pagamentos: o.pagamentos,
            historicoStatus: o.historicoStatus,
          },
          15,
          agora
        )
      ) {
        inicializadosSemRecebimento15Dias += 1;
      }

      for (const pagamento of o.pagamentos) {
        if (pagamento.data >= inicioMes && pagamento.data < inicioProximoMes) {
          recebidoNoMes += pagamento.valorRecebido;
        }
        if (pagamento.data >= inicioAno && pagamento.data < inicioProximoAno) {
          recebimentosMensais[pagamento.data.getMonth()] += pagamento.valorRecebido;
        }
      }
    }
    levantamentoRecebimentosMensal = recebidoNoMes;

    let historicoInicializados: Array<{ orcamentoId: number; data: Date }> = [];
    try {
      historicoInicializados = await prisma.$queryRaw<
        Array<{ orcamentoId: number; data: Date }>
      >`
        SELECT "orcamentoId", "data"
        FROM "orcamento_status_historico"
        WHERE "status" = 'INICIALIZADO'
          AND "data" >= ${inicioAno}
          AND "data" < ${inicioProximoAno}
      `;
    } catch {
      historicoInicializados = [];
    }

    for (const item of historicoInicializados) {
      const data = new Date(item.data);
      const mes = data.getMonth();
      const valor = valorTotalPorOrcamento.get(item.orcamentoId) ?? 0;
      valoresMensaisInicializados[mes] += valor;
    }

    return NextResponse.json({
      totalClientes,
      totalOrcamentos,
      totalRecebimentos,
      totalValorOrcamentos,
      totalValorRecebimentos,
      valorAceitos,
      valorInicializados,
      valorFinalizados,
      recebidoNoMes,
      esperadoNoMes,
      esperadoNoMesHeuristica,
      periodoIndicadores: `Ano ${agora.getFullYear()} (todos os orçamentos)`,
      valorTotalAnual,
      valoresMensaisInicializados,
      recebimentosMensais,
      levantamentoRecebimentosMensal,
      cadastrados,
      inicializados,
      orcamentosPendentes,
      finalizadosNaoQuitados,
      aceitosAguardandoInicio,
      inicializadosSemRecebimento15Dias,
      orcamentosPorStatus,
      recebimentosPorStatus,
    });
  } catch (error) {
    console.error("Erro ao buscar dashboard:", error);
    return NextResponse.json(
      { error: "Erro ao carregar dados" },
      { status: 500 }
    );
  }
}
