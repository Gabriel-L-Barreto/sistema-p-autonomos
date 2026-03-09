import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";
import { getEmpresaConfig } from "@/lib/empresa-config";
import { gerarPdf, type OrcamentoParaPdf } from "@/lib/gerar-pdf-orcamento";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const orcamento = await prisma.orcamento.findUnique({
      where: { id: idNum },
      include: {
        cliente: true,
        materiais: { include: { material: true } },
        servicos: { include: { servico: true } },
      },
    });

    if (!orcamento) {
      return NextResponse.json(
        { error: "Orçamento não encontrado" },
        { status: 404 }
      );
    }

    const config = await getEmpresaConfig();

    const orcamentoParaPdf: OrcamentoParaPdf = {
      id: orcamento.id,
      endereco: orcamento.endereco,
      data: orcamento.data.toISOString(),
      incluiMaterial: orcamento.incluiMaterial,
      cliente: {
        nome: orcamento.cliente.nome,
        afiliacao: orcamento.cliente.afiliacao,
        telefone: orcamento.cliente.telefone,
      },
      materiais: orcamento.materiais.map((m) => ({
        medidaMaterial: m.medidaMaterial != null ? String(m.medidaMaterial) : null,
        origemMaterial: m.origemMaterial,
        quantidade: m.quantidade,
        precoUnitario: m.precoUnitario,
        material: m.material ? { nome_material: m.material.nome_material } : null,
      })),
      servicos: orcamento.servicos.map((s) => ({
        descricaoLivre: s.descricaoLivre,
        quantidade: s.quantidade,
        valorMaoObra: s.valorMaoObra,
        servico: s.servico ? { descricao: s.servico.descricao, tipo_cobranca: s.servico.tipo_cobranca } : null,
      })),
    };

    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    gerarPdf(doc, orcamentoParaPdf, {
      cabecalho: config.cabecalho,
      logoUrl: config.logoUrl,
      nomeAssinatura: config.nomeAssinatura,
      cidadeEmissao: config.cidadeEmissao,
    });

    await new Promise<void>((resolve, reject) => {
      doc.on("end", () => resolve());
      doc.on("error", reject);
      doc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);
    const nomeArquivo = `Orcamento ${String(orcamento.id).padStart(3, "0")} - ${orcamento.cliente.nome}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return NextResponse.json(
      { error: "Erro ao gerar PDF do orçamento" },
      { status: 500 }
    );
  }
}
