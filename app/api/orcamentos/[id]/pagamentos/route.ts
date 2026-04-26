import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calcularValorTotal,
  calcularTotalPago,
} from "@/lib/orcamento";
import { formatarPreco } from "@/lib/format";

const FORMAS_PAGAMENTO = ["DINHEIRO", "PIX", "CARTAO"] as const;

/**
 * POST - Registrar um recebimento (abater parcela).
 * Valida que o valor não exceda o restante do orçamento.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();
    const { valorRecebido, formaPagamento } = body;

    const valorNum = parseFloat(String(valorRecebido).replace(",", "."));
    if (Number.isNaN(valorNum) || valorNum <= 0) {
      return NextResponse.json(
        { error: "Valor deve ser um número positivo" },
        { status: 400 }
      );
    }

    if (!FORMAS_PAGAMENTO.includes(formaPagamento)) {
      return NextResponse.json(
        { error: "Forma de pagamento inválida. Use DINHEIRO, PIX ou CARTAO" },
        { status: 400 }
      );
    }

    const orcamento = await prisma.orcamento.findUnique({
      where: { id: idNum },
      include: {
        materiais: true,
        servicos: true,
        pagamentos: true,
      },
    });

    if (!orcamento) {
      return NextResponse.json(
        { error: "Orçamento não encontrado" },
        { status: 404 }
      );
    }
    if (["CADASTRADO", "NAO_ACEITO"].includes(orcamento.status)) {
      return NextResponse.json(
        { error: "Recebimentos só podem ser registrados para orçamentos aceitos, inicializados ou finalizados." },
        { status: 400 }
      );
    }

    const valorTotal = calcularValorTotal(
      orcamento.materiais,
      orcamento.servicos,
      orcamento.incluiMaterial
    );
    const totalPago = calcularTotalPago(orcamento.pagamentos);
    const valorRestante = valorTotal - totalPago;

    if (valorNum > valorRestante) {
      return NextResponse.json(
        {
          error: `Valor não pode exceder o restante do orçamento (${formatarPreco(valorRestante)})`,
        },
        { status: 400 }
      );
    }

    const pagamento = await prisma.pagamento.create({
      data: {
        orcamentoId: idNum,
        valorRecebido: valorNum,
        formaPagamento,
      },
    });

    return NextResponse.json(pagamento, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar pagamento:", error);
    return NextResponse.json(
      { error: "Erro ao registrar pagamento" },
      { status: 500 }
    );
  }
}
