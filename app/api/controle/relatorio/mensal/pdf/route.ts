import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";
import {
  calcularValorTotal,
  calcularTotalPago,
  opcoesCalculoDoOrcamento,
} from "@/lib/orcamento";
import { dataParaChave, montarResumoControle, STATUS_CONTROLE } from "@/lib/controle-obra";

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ano = parseInt(searchParams.get("ano") ?? String(new Date().getFullYear()), 10);
    const mes = parseInt(searchParams.get("mes") ?? String(new Date().getMonth() + 1), 10);
    if (!Number.isFinite(ano) || !Number.isFinite(mes) || mes < 1 || mes > 12) {
      return NextResponse.json({ error: "Informe ano e mês válidos." }, { status: 400 });
    }

    const inicioMes = new Date(ano, mes - 1, 1);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);

    const lista = await prisma.orcamento.findMany({
      where: {
        status: { in: [...STATUS_CONTROLE] },
        OR: [
          { dataInicioControle: { gte: inicioMes, lte: fimMes } },
          {
            gastosControle: {
              some: { data: { gte: inicioMes, lte: fimMes } },
            },
          },
        ],
      },
      include: {
        cliente: true,
        materiais: true,
        servicos: true,
        pagamentos: true,
        gastosControle: true,
      },
      orderBy: { id: "asc" },
    });

    const linhas = lista.map((orc) => {
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
      const gastosNoMes = orc.controleUsaEstimativa
        ? resumo.gastoEstimativa
        : orc.gastosControle
            .filter((g) => {
              const k = dataParaChave(g.data);
              return k.startsWith(`${ano}-${String(mes).padStart(2, "0")}`);
            })
            .reduce((s, g) => s + (g.semGastos ? 0 : g.valorPessoal + g.valorMateriais), 0);

      return {
        id: orc.id,
        cliente: orc.cliente.nome,
        valorTotal: resumo.valorTotal,
        valorRecebido: resumo.valorRecebido,
        gastoTotal: resumo.gastoTotal,
        gastosNoMes: Math.round(gastosNoMes * 100) / 100,
        resultadoEstimado: resumo.resultadoEstimado,
      };
    });

    const totGastoMes = linhas.reduce((s, l) => s + l.gastosNoMes, 0);
    const totRecebido = linhas.reduce((s, l) => s + l.valorRecebido, 0);
    const totOrc = linhas.reduce((s, l) => s + l.valorTotal, 0);

    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    doc.on("data", (c: Buffer) => chunks.push(c));

    const mesNome = new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    doc.fontSize(16).font("Helvetica-Bold").text("Relatório mensal — Controle de obras", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(11).font("Helvetica").text(mesNome, { align: "center" });
    doc.moveDown();

    doc.font("Helvetica-Bold").text("Totais do mês");
    doc.font("Helvetica");
    doc.text(`Obras no relatório: ${linhas.length}`);
    doc.text(`Soma dos valores de orçamento: ${moeda(totOrc)}`);
    doc.text(`Soma já recebida: ${moeda(totRecebido)}`);
    doc.fillColor("#b91c1c").text(`Gastos registrados no mês: ${moeda(totGastoMes)}`);
    doc.fillColor("#000000");
    doc.moveDown();

    doc.font("Helvetica-Bold").fontSize(10).text("Por obra");
    doc.font("Helvetica").fontSize(9);
    doc.moveDown(0.3);

    if (linhas.length === 0) {
      doc.text("Nenhuma obra com controle neste mês.");
    } else {
      for (const l of linhas) {
        doc.font("Helvetica-Bold").text(`#${l.id} — ${l.cliente}`);
        doc.font("Helvetica");
        doc.text(
          `Total ${moeda(l.valorTotal)}  |  Recebido ${moeda(l.valorRecebido)}  |  Gasto (obra) ${moeda(l.gastoTotal)}  |  Gasto no mês ${moeda(l.gastosNoMes)}`
        );
        doc.fillColor(l.resultadoEstimado >= 0 ? "#15803d" : "#b91c1c");
        doc.text(`Resultado estimado: ${moeda(l.resultadoEstimado)}`);
        doc.fillColor("#000000");
        doc.moveDown(0.4);
      }
    }

    await new Promise<void>((resolve, reject) => {
      doc.on("end", () => resolve());
      doc.on("error", reject);
      doc.end();
    });

    return new NextResponse(Buffer.concat(chunks), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Controle-Mensal-${ano}-${String(mes).padStart(2, "0")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar relatório mensal de controle:", error);
    return NextResponse.json({ error: "Erro ao gerar relatório mensal" }, { status: 500 });
  }
}
