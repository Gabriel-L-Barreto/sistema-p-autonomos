import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";
import { formatarPreco } from "@/lib/format";
import { calcularValorTotal } from "@/lib/orcamento";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const anoParam = parseInt(searchParams.get("ano") ?? "", 10);
    const mesParam = parseInt(searchParams.get("mes") ?? "", 10);
    const ano = Number.isFinite(anoParam) ? anoParam : new Date().getFullYear();
    const mes = Number.isFinite(mesParam) && mesParam >= 1 && mesParam <= 12 ? mesParam : null;

    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const titulo = mes
      ? `Relatório de recebimentos - ${MESES[mes - 1]}/${ano}`
      : `Relatório de recebimentos anual - ${ano}`;

    doc.font("Helvetica-Bold").fontSize(16).text(titulo);
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(10).fillColor("#555").text(`Gerado em ${new Date().toLocaleString("pt-BR")}`);
    doc.fillColor("#000");
    doc.moveDown(1);

    const tableStartX = 50;
    const tableWidth = 495;
    const drawHeader = (columns: Array<{ label: string; width: number }>) => {
      const headerY = doc.y;
      let x = tableStartX;
      doc.font("Helvetica-Bold").fontSize(10);
      for (const col of columns) {
        doc.rect(x, headerY, col.width, 22).strokeColor("#d4d4d8").stroke();
        doc.text(col.label, x + 6, headerY + 7, { width: col.width - 12, ellipsis: true });
        x += col.width;
      }
      doc.y = headerY + 22;
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(10);
    };

    const drawRow = (values: string[], widths: number[]) => {
      if (doc.y > 760) doc.addPage();
      const rowY = doc.y;
      let x = tableStartX;
      for (let i = 0; i < values.length; i += 1) {
        doc.rect(x, rowY, widths[i], 22).strokeColor("#e4e4e7").stroke();
        doc.text(values[i], x + 6, rowY + 7, { width: widths[i] - 12, ellipsis: true });
        x += widths[i];
      }
      doc.moveDown(1.4);
    };

    if (mes) {
      const inicio = new Date(ano, mes - 1, 1);
      const fim = new Date(ano, mes, 1);
      const pagamentosMes = await prisma.pagamento.findMany({
        where: {
          data: {
            gte: inicio,
            lt: fim,
          },
        },
        include: {
          orcamento: {
            include: {
              cliente: true,
            },
          },
        },
        orderBy: {
          data: "asc",
        },
      });

      doc.font("Helvetica-Bold").fontSize(12).text("Relatório mensal");
      doc.moveDown(0.4);
      const monthlyCols = [
        { label: "Cliente", width: 220 },
        { label: "Data do recebimento", width: 140 },
        { label: "Valor do recebimento", width: 135 },
      ];
      drawHeader(monthlyCols);

      if (pagamentosMes.length === 0) {
        drawRow(["Nenhum recebimento no mês selecionado.", "-", "-"], monthlyCols.map((c) => c.width));
      } else {
        for (const pagamento of pagamentosMes) {
          drawRow(
            [
              pagamento.orcamento?.cliente?.nome ?? "Cliente não informado",
              pagamento.data.toLocaleDateString("pt-BR"),
              formatarPreco(pagamento.valorRecebido),
            ],
            monthlyCols.map((c) => c.width)
          );
        }
      }

      const totalMes = pagamentosMes.reduce((s, p) => s + p.valorRecebido, 0);
      doc.moveDown(0.7);
      doc.font("Helvetica-Bold").fontSize(12).text(`Valor total do mês: ${formatarPreco(totalMes)}`);
    } else {
      const inicioAno = new Date(ano, 0, 1);
      const inicioProximoAno = new Date(ano + 1, 0, 1);

      const [orcamentosAno, pagamentosAno] = await Promise.all([
        prisma.orcamento.findMany({
          where: {
            data: { gte: inicioAno, lt: inicioProximoAno },
          },
          include: {
            materiais: true,
            servicos: true,
          },
        }),
        prisma.pagamento.findMany({
          where: {
            data: { gte: inicioAno, lt: inicioProximoAno },
          },
        }),
      ]);

      const totaisOrcamentos = Array.from({ length: 12 }, () => 0);
      const totaisAceitos = Array.from({ length: 12 }, () => 0);
      const totaisRecebimentos = Array.from({ length: 12 }, () => 0);

      for (const orc of orcamentosAno) {
        const mesRef = orc.data.getMonth();
        const valorTotal = calcularValorTotal(orc.materiais, orc.servicos, orc.incluiMaterial);
        totaisOrcamentos[mesRef] += valorTotal;
        if (["ACEITO", "INICIALIZADO", "FINALIZADO"].includes(orc.status)) {
          totaisAceitos[mesRef] += valorTotal;
        }
      }

      for (const pagamento of pagamentosAno) {
        totaisRecebimentos[pagamento.data.getMonth()] += pagamento.valorRecebido;
      }

      doc.font("Helvetica-Bold").fontSize(12).text("Relatório anual");
      doc.moveDown(0.4);
      const yearlyCols = [
        { label: "Mês de referência", width: 125 },
        { label: "Valor orçamentos totais", width: 125 },
        { label: "Valor orçamentos aceitos", width: 125 },
        { label: "Total de recebimento", width: 120 },
      ];
      drawHeader(yearlyCols);

      for (let i = 0; i < 12; i += 1) {
        drawRow(
          [
            MESES[i],
            formatarPreco(totaisOrcamentos[i]),
            formatarPreco(totaisAceitos[i]),
            formatarPreco(totaisRecebimentos[i]),
          ],
          yearlyCols.map((c) => c.width)
        );
      }

      doc.moveDown(0.7);
      doc.font("Helvetica-Bold").fontSize(12);
      doc.text(
        `Totais do ano — Orçamentos: ${formatarPreco(totaisOrcamentos.reduce((s, v) => s + v, 0))} | Aceitos: ${formatarPreco(totaisAceitos.reduce((s, v) => s + v, 0))} | Recebimentos: ${formatarPreco(totaisRecebimentos.reduce((s, v) => s + v, 0))}`
      );
    }

    await new Promise<void>((resolve, reject) => {
      doc.on("end", () => resolve());
      doc.on("error", reject);
      doc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);
    const nomeArquivo = mes
      ? `Relatorio-Recebimentos-${ano}-${String(mes).padStart(2, "0")}.pdf`
      : `Relatorio-Recebimentos-Anual-${ano}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("Erro ao gerar relatório de recebimentos:", error);
    return NextResponse.json(
      { error: "Erro ao gerar relatório de recebimentos" },
      { status: 500 }
    );
  }
}
