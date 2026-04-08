import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcularValorTotal, calcularTotalPago } from "@/lib/orcamento";

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
        },
      }),
    ]);

    let cadastrados = 0;
    let inicializados = 0;
    let finalizadosNaoQuitados = 0;
    let pendentes = 0;
    let totalValorOrcamentos = 0;
    let totalValorRecebimentos = 0;
    let valorInicializados = 0;
    let valorEmAberto = 0;
    let valorFinalizados = 0;
    let recebidoNoMes = 0;
    let esperadoNoMes = 0;
    let valorTotalAnual = 0;

    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const inicioProximoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);
    const inicioAno = new Date(agora.getFullYear(), 0, 1);
    const inicioProximoAno = new Date(agora.getFullYear() + 1, 0, 1);
    const valoresMensaisInicializados = Array.from({ length: 12 }, () => 0);

    const valorTotalPorOrcamento = new Map<number, number>();

    const orcamentosPorStatus = {
      CADASTRADO: { quantidade: 0, valor: 0 },
      NAO_ACEITO: { quantidade: 0, valor: 0 },
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
      const statusKey = o.status as keyof typeof orcamentosPorStatus;

      if (o.status === "CADASTRADO") cadastrados += 1;
      if (o.status === "INICIALIZADO") inicializados += 1;
      if (o.status === "FINALIZADO" && !quitado) finalizadosNaoQuitados += 1;
      if (["CADASTRADO", "ACEITO", "INICIALIZADO"].includes(o.status)) pendentes += 1;
      if (o.status === "INICIALIZADO") valorInicializados += valorTotal;
      if (o.status === "FINALIZADO") valorFinalizados += valorTotal;
      if (valorRestante > 0) valorEmAberto += valorRestante;
      valorTotalPorOrcamento.set(o.id, valorTotal);

      if (statusKey in orcamentosPorStatus) {
        orcamentosPorStatus[statusKey].quantidade += 1;
        orcamentosPorStatus[statusKey].valor += valorTotal;
      }

      totalValorOrcamentos += valorTotal;
      totalValorRecebimentos += valorPago;
      if (o.data >= inicioAno && o.data < inicioProximoAno) valorTotalAnual += valorTotal;
      if (o.data >= inicioMes && o.data < inicioProximoMes) esperadoNoMes += valorRestante;

      for (const pagamento of o.pagamentos) {
        if (pagamento.data >= inicioMes && pagamento.data < inicioProximoMes) {
          recebidoNoMes += pagamento.valorRecebido;
        }
      }

      if (valorPago <= 0) {
        recebimentosPorStatus.PENDENTE.quantidade += 1;
        recebimentosPorStatus.PENDENTE.valor += valorRestante;
      } else if (valorRestante > 0) {
        recebimentosPorStatus.PARCIAL.quantidade += 1;
        recebimentosPorStatus.PARCIAL.valor += valorRestante;
      } else {
        recebimentosPorStatus.QUITADO.quantidade += 1;
        recebimentosPorStatus.QUITADO.valor += valorPago;
      }
    }

    // Gráfico mensal (jan-dez): soma de valores quando o orçamento entra em INICIALIZADO
    // (ex.: alteração de CADASTRADO -> INICIALIZADO)
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
      const mes = data.getMonth(); // 0-11
      const valor = valorTotalPorOrcamento.get(item.orcamentoId) ?? 0;
      valoresMensaisInicializados[mes] += valor;
    }

    return NextResponse.json({
      totalClientes,
      totalOrcamentos,
      totalRecebimentos,
      totalValorOrcamentos,
      totalValorRecebimentos,
      valorInicializados,
      valorEmAberto,
      valorFinalizados,
      recebidoNoMes,
      esperadoNoMes,
      valorTotalAnual,
      valoresMensaisInicializados,
      cadastrados,
      inicializados,
      finalizadosNaoQuitados,
      orcamentosPendentes: pendentes,
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
