import { NextRequest, NextResponse } from "next/server";
import {
  formaPagamentoValida,
  registrarPagamentoAbatimento,
} from "@/lib/registrar-pagamento";

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

    if (!formaPagamentoValida(formaPagamento)) {
      return NextResponse.json(
        { error: "Forma de pagamento inválida. Use DINHEIRO, PIX ou CARTAO" },
        { status: 400 }
      );
    }

    const pagamento = await registrarPagamentoAbatimento(idNum, valorNum, formaPagamento);

    return NextResponse.json(pagamento, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar pagamento:", error);
    const msg = error instanceof Error ? error.message : "Erro ao registrar pagamento";
    const status =
      msg.includes("não encontrado") ? 404 :
      msg.includes("exceder") || msg.includes("registrados") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
