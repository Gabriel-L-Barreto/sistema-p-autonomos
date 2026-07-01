import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";
import { getEmpresaConfig } from "@/lib/empresa-config";
import { gerarPdfRecebimento, type RecebimentoParaPdf } from "@/lib/gerar-pdf-recebimento";
import { LABELS_FORMA_PAGAMENTO } from "@/lib/types";

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

    const pagamento = await prisma.pagamento.findUnique({
      where: { id: idNum },
      include: {
        orcamento: {
          include: {
            cliente: true,
            materiais: { include: { material: true } },
            servicos: { include: { servico: true } },
            pagamentos: { orderBy: { id: "asc" } },
          },
        },
      },
    });

    if (!pagamento || !pagamento.orcamento) {
      return NextResponse.json(
        { error: "Recebimento não encontrado" },
        { status: 404 }
      );
    }

    const orc = pagamento.orcamento;
    const totalParcelas = orc.totalParcelas;
    const pagamentosOrdenados = orc.pagamentos;
    const indiceParcela = pagamentosOrdenados.findIndex((p) => p.id === pagamento.id);
    const parcelaInfo =
      totalParcelas != null &&
      totalParcelas >= 1 &&
      indiceParcela >= 0
        ? { numero: indiceParcela + 1, total: Math.round(totalParcelas) }
        : undefined;

    const config = await getEmpresaConfig();

    const formaPagamentoLabel =
      LABELS_FORMA_PAGAMENTO[pagamento.formaPagamento as keyof typeof LABELS_FORMA_PAGAMENTO] ??
      pagamento.formaPagamento;

    const rec: RecebimentoParaPdf = {
      orcamentoId: orc.id,
      pagamentoId: pagamento.id,
      dataOrcamento: orc.data.toISOString(),
      endereco: orc.endereco,
      valorRecebido: pagamento.valorRecebido,
      formaPagamento: formaPagamentoLabel,
      data: pagamento.data.toISOString(),
      cliente: { nome: orc.cliente.nome },
      parcela: parcelaInfo,
      incluiMaterial: orc.incluiMaterial,
      materiais: orc.materiais.map((m) => ({
        medidaMaterial: m.medidaMaterial != null ? String(m.medidaMaterial) : null,
        origemMaterial: m.origemMaterial,
        quantidade: m.quantidade,
        precoUnitario: m.precoUnitario,
        material: m.material ? { nome_material: m.material.nome_material } : null,
      })),
      servicos: orc.servicos.map((s) => ({
        descricaoLivre: s.descricaoLivre,
        medidaServico: s.medidaServico != null ? String(s.medidaServico) : null,
        quantidade: s.quantidade,
        valorMaoObra: s.valorMaoObra,
        servico: s.servico ? { descricao: s.servico.descricao, tipo_cobranca: s.servico.tipo_cobranca } : null,
      })),
    };

    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: "A4", margin: 0 });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    gerarPdfRecebimento(doc, rec, {
      cabecalho: config.cabecalho,
      logoUrl: config.logoUrl,
      timbradoUrl: (config as { timbradoRecebimentoUrl?: string | null }).timbradoRecebimentoUrl
        ?? config.timbradoUrl
        ?? null,
      timbradoRecebimentoUrl:
        (config as { timbradoRecebimentoUrl?: string | null }).timbradoRecebimentoUrl ?? null,
      pixQrCodeUrl:
        (config as { pixQrCodeUrl?: string | null }).pixQrCodeUrl ?? null,
      cabecalhoCor: config.cabecalhoCor ?? null,
      cabecalhoLocal: typeof (config as { cabecalhoLocal?: unknown }).cabecalhoLocal === "string" ? (config as { cabecalhoLocal?: string }).cabecalhoLocal : null,
      rodape: typeof (config as { rodape?: unknown }).rodape === "string" ? (config as { rodape?: string }).rodape : null,
      rodapeLocal: typeof (config as { rodapeLocal?: unknown }).rodapeLocal === "string" ? (config as { rodapeLocal?: string }).rodapeLocal : null,
      nomeAssinatura: config.nomeAssinatura,
      cidadeEmissao: config.cidadeEmissao,
    });

    await new Promise<void>((resolve, reject) => {
      doc.on("end", () => resolve());
      doc.on("error", reject);
      doc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);
    const nomeArquivo = `Recebimento-${orc.id}-${parcelaInfo ? `P${parcelaInfo.numero}-${parcelaInfo.total}` : "unico"}-${orc.cliente.nome}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF do recebimento:", error);
    return NextResponse.json(
      { error: "Erro ao gerar PDF do recebimento" },
      { status: 500 }
    );
  }
}
