import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calcularValorTotal,
  calcularTotalPago,
} from "@/lib/orcamento";

const FORMAS_PAGAMENTO = ["DINHEIRO", "PIX", "CARTAO"] as const;

/**
 * POST - Configurar parcelas iguais (apenas define totalParcelas, não cria Pagamentos).
 * Os pagamentos são criados um a um quando o usuário clica em "Abater parcela".
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
    const { qtdParcelas, formaPagamento } = body;

    const qtd = parseInt(String(qtdParcelas), 10);
    if (Number.isNaN(qtd) || qtd < 1 || !Number.isInteger(qtd)) {
      return NextResponse.json(
        { error: "Quantidade de parcelas deve ser um número inteiro positivo" },
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
    });

    if (!orcamento) {
      return NextResponse.json(
        { error: "Orçamento não encontrado" },
        { status: 404 }
      );
    }

    await prisma.orcamento.update({
      where: { id: idNum },
      data: { totalParcelas: qtd },
    });

    return NextResponse.json({ ok: true, totalParcelas: qtd }, { status: 200 });
  } catch (error) {
    console.error("Erro ao configurar parcelas iguais:", error);
    return NextResponse.json(
      { error: "Erro ao configurar parcelas" },
      { status: 500 }
    );
  }
}
