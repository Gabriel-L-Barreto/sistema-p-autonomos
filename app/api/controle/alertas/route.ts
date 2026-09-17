import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { montarResumoControle } from "@/lib/controle-obra";
import { calcularTotalPago, calcularValorTotal, opcoesCalculoDoOrcamento } from "@/lib/orcamento";

/** Alertas só para obras ativas (não finalizadas / não encerradas / sem estimativa rápida). */
export async function GET() {
  try {
    const lista = await prisma.orcamento.findMany({
      where: { status: { in: ["ACEITO", "INICIALIZADO"] } },
      include: {
        cliente: true,
        materiais: true,
        servicos: true,
        pagamentos: true,
        gastosControle: true,
      },
    });

    const alertas: {
      id: number;
      cliente: string;
      endereco: string;
      tipo: "SEM_DATA_INICIO" | "DIAS_PENDENTES";
      diasPendentes: number;
      mensagem: string;
    }[] = [];

    for (const orc of lista) {
      if (orc.controleUsaEstimativa || orc.dataFimControle) continue;

      if (!orc.dataInicioControle) {
        alertas.push({
          id: orc.id,
          cliente: orc.cliente.nome,
          endereco: orc.endereco,
          tipo: "SEM_DATA_INICIO",
          diasPendentes: 0,
          mensagem: `Defina a data de início da obra nº ${orc.id} (${orc.cliente.nome}).`,
        });
        continue;
      }

      const opts = opcoesCalculoDoOrcamento(orc);
      const resumo = montarResumoControle({
        valorTotal: calcularValorTotal(orc.materiais, orc.servicos, orc.incluiMaterial, opts),
        valorRecebido: calcularTotalPago(orc.pagamentos),
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

      if (resumo.diasPendentes.length > 0) {
        alertas.push({
          id: orc.id,
          cliente: orc.cliente.nome,
          endereco: orc.endereco,
          tipo: "DIAS_PENDENTES",
          diasPendentes: resumo.diasPendentes.length,
          mensagem:
            resumo.diasPendentes.length === 1
              ? `Atualize o controle da obra nº ${orc.id} (${orc.cliente.nome}): 1 dia sem registro.`
              : `Atualize o controle da obra nº ${orc.id} (${orc.cliente.nome}): ${resumo.diasPendentes.length} dias sem registro.`,
        });
      }
    }

    return NextResponse.json({ quantidade: alertas.length, alertas });
  } catch (error) {
    console.error("Erro ao buscar alertas de controle:", error);
    return NextResponse.json({ error: "Erro ao buscar alertas" }, { status: 500 });
  }
}
