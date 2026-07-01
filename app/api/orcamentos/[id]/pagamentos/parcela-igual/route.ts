import { NextRequest, NextResponse } from "next/server";
import {
  formaPagamentoValida,
  registrarParcelaIgual,
} from "@/lib/registrar-pagamento";

/**
 * POST - Registrar a próxima parcela (para orçamentos com parcelas iguais).
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
    const { formaPagamento } = body;

    if (!formaPagamentoValida(formaPagamento)) {
      return NextResponse.json(
        { error: "Forma de pagamento inválida. Use DINHEIRO, PIX ou CARTAO" },
        { status: 400 }
      );
    }

    const pagamento = await registrarParcelaIgual(idNum, formaPagamento);

    return NextResponse.json(pagamento, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar parcela:", error);
    const msg = error instanceof Error ? error.message : "Erro ao registrar parcela";
    const status =
      msg.includes("não encontrado") ? 404 :
      msg.includes("parcelas") || msg.includes("restante") || msg.includes("registrados") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
