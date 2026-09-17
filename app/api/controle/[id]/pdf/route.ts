import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";
import {
  calcularValorTotal,
  calcularTotalPago,
  opcoesCalculoDoOrcamento,
} from "@/lib/orcamento";
import { montarResumoControle, STATUS_CONTROLE } from "@/lib/controle-obra";

type Ctx = { params: Promise<{ id: string }> };

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const idNum = parseInt((await params).id, 10);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const orc = await prisma.orcamento.findUnique({
      where: { id: idNum },
      include: {
        cliente: true,
        materiais: true,
        servicos: true,
        pagamentos: true,
        gastosControle: { orderBy: { data: "asc" } },
      },
    });

    if (!orc || !STATUS_CONTROLE.includes(orc.status as (typeof STATUS_CONTROLE)[number])) {
      return NextResponse.json({ error: "Obra não encontrada para controle" }, { status: 404 });
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

    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.on("data", (c: Buffer) => chunks.push(c));

    doc.fontSize(16).font("Helvetica-Bold").text("Relatório de controle da obra", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(11).font("Helvetica");
    doc.text(`Orçamento Nº ${String(orc.id).padStart(3, "0")}`);
    doc.text(`Cliente: ${orc.cliente.nome}`);
    doc.text(`Local: ${orc.endereco}`);
    doc.text(`Status: ${orc.status}`);
    doc.text(`Início: ${resumo.dataInicio ?? "—"}  |  Fim previsto: ${resumo.dataFim ?? "—"}`);
    doc.moveDown();

    doc.font("Helvetica-Bold").text("Resumo financeiro");
    doc.font("Helvetica");
    doc.text(`Valor total do orçamento: ${moeda(resumo.valorTotal)}`);
    doc.text(`Valor já recebido: ${moeda(resumo.valorRecebido)}`);
    doc.fillColor("#b91c1c").text(`Gastos (pessoal): ${moeda(resumo.gastoPessoal)}`);
    doc.text(`Gastos (materiais): ${moeda(resumo.gastoMateriais)}`);
    doc.text(`Total gasto: ${moeda(resumo.gastoTotal)}`);
    doc.fillColor(resumo.resultadoEstimado >= 0 ? "#15803d" : "#b91c1c");
    doc.text(
      `Resultado estimado (total − gastos): ${moeda(resumo.resultadoEstimado)} (${resumo.resultadoEstimado >= 0 ? "lucro" : "prejuízo"})`
    );
    doc.fillColor(resumo.resultadoCaixa >= 0 ? "#15803d" : "#b91c1c");
    doc.text(
      `Resultado em caixa (recebido − gastos): ${moeda(resumo.resultadoCaixa)} (${resumo.resultadoCaixa >= 0 ? "lucro" : "prejuízo"})`
    );
    doc.fillColor("#000000");
    doc.moveDown();

    doc.font("Helvetica-Bold").text("Gastos por dia");
    doc.font("Helvetica").fontSize(9);
    doc.moveDown(0.3);

    if (resumo.gastosPorDia.length === 0) {
      doc.text("Nenhum gasto registrado.");
    } else {
      for (const g of resumo.gastosPorDia) {
        const linha = g.semGastos
          ? `${g.data}  —  sem gastos`
          : `${g.data}  —  pessoal ${moeda(g.valorPessoal)}  |  materiais ${moeda(g.valorMateriais)}  |  total ${moeda(g.total)}`;
        doc.text(linha);
      }
    }

    if (resumo.diasPendentes.length > 0) {
      doc.moveDown();
      doc.fontSize(10).fillColor("#b45309");
      doc.text(`Dias úteis sem atualização: ${resumo.diasPendentes.join(", ")}`);
      doc.fillColor("#000000");
    }

    await new Promise<void>((resolve, reject) => {
      doc.on("end", () => resolve());
      doc.on("error", reject);
      doc.end();
    });

    const nome = `Controle-Obra-${orc.id}-${orc.cliente.nome}.pdf`;
    return new NextResponse(Buffer.concat(chunks), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nome}"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF do controle:", error);
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
}
