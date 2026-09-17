import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calcularValorTotal,
  calcularTotalPago,
  opcoesCalculoDoOrcamento,
} from "@/lib/orcamento";
import { montarResumoControle, STATUS_CONTROLE } from "@/lib/controle-obra";

export async function GET() {
  try {
    const lista = await prisma.orcamento.findMany({
      where: { status: { in: [...STATUS_CONTROLE] } },
      include: {
        cliente: true,
        materiais: true,
        servicos: true,
        pagamentos: true,
        gastosControle: true,
      },
      orderBy: [{ status: "asc" }, { id: "desc" }],
    });

    const itens = lista.map((orc) => {
      const opts = opcoesCalculoDoOrcamento(orc);
      const valorTotal = calcularValorTotal(orc.materiais, orc.servicos, orc.incluiMaterial, opts);
      const valorRecebido = calcularTotalPago(orc.pagamentos);
      const resumo = montarResumoControle({
        valorTotal,
        valorRecebido,
        dataInicio: orc.dataInicioControle,
        dataFimManual: orc.dataFimControle,
        tempoEstimadoOrcamento: orc.tempoEstimado,
        tempoEstimadoControle: orc.tempoEstimadoControle,
        contaFinsDeSemana: orc.contaFinsDeSemanaControle,
        status: orc.status,
        usaEstimativa: orc.controleUsaEstimativa,
        diasEstimativa: orc.controleDiasEstimativa,
        valorDiaEstimativa: orc.controleValorDiaEstimativa,
        gastos: orc.gastosControle,
      });

      const semDataInicio = !orc.dataInicioControle && orc.status !== "FINALIZADO";
      const pendenteAtualizacao = resumo.diasPendentes.length > 0;

      return {
        id: orc.id,
        endereco: orc.endereco,
        status: orc.status,
        tempoEstimado: orc.tempoEstimado,
        tempoEstimadoControle: orc.tempoEstimadoControle,
        cliente: { id: orc.cliente.id, nome: orc.cliente.nome },
        ...resumo,
        pendenteAtualizacao,
        semDataInicio,
      };
    });

    const alertas = itens.filter(
      (i) =>
        i.status !== "FINALIZADO" &&
        !i.obraEncerrada &&
        !i.usaEstimativa &&
        (i.pendenteAtualizacao || i.semDataInicio)
    );

    return NextResponse.json({
      itens,
      alertas: {
        quantidade: alertas.length,
        orcamentos: alertas.map((a) => ({
          id: a.id,
          cliente: a.cliente.nome,
          diasPendentes: a.diasPendentes.length,
          semDataInicio: a.semDataInicio,
        })),
      },
    });
  } catch (error) {
    console.error("Erro ao listar controle de obras:", error);
    return NextResponse.json({ error: "Erro ao listar controle de obras" }, { status: 500 });
  }
}
