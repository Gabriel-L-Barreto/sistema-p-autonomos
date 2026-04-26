import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calcularValorTotal,
  calcularTotalPago,
} from "@/lib/orcamento";
import { formatarPreco } from "@/lib/format";

const FORMAS_PAGAMENTO = ["DINHEIRO", "PIX", "CARTAO"] as const;

/**
 * PUT - Editar um pagamento (valor, forma de pagamento).
 */
export async function PUT(
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
    const { valorRecebido, formaPagamento, data } = body;

    const pagamentoAtual = await prisma.pagamento.findUnique({
      where: { id: idNum },
      include: {
        orcamento: {
          include: { materiais: true, servicos: true, pagamentos: true },
        },
      },
    });

    if (!pagamentoAtual?.orcamento) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      );
    }

    const orcamento = pagamentoAtual.orcamento;
    const valorTotal = calcularValorTotal(
      orcamento.materiais,
      orcamento.servicos,
      orcamento.incluiMaterial
    );
    const totalPagoAtual = calcularTotalPago(orcamento.pagamentos);
    const valorRestanteMaisEste =
      valorTotal - totalPagoAtual + pagamentoAtual.valorRecebido;

    let valorRecebidoNum = pagamentoAtual.valorRecebido;
    if (valorRecebido !== undefined) {
      valorRecebidoNum = parseFloat(String(valorRecebido).replace(",", "."));
      if (Number.isNaN(valorRecebidoNum) || valorRecebidoNum <= 0) {
        return NextResponse.json(
          { error: "Valor deve ser um número positivo" },
          { status: 400 }
        );
      }
      if (valorRecebidoNum > valorRestanteMaisEste) {
        return NextResponse.json(
          {
            error: `Valor não pode exceder o restante do orçamento (${formatarPreco(valorRestanteMaisEste)})`,
          },
          { status: 400 }
        );
      }
    }

    const dataUpdate: {
      valorRecebido?: number;
      formaPagamento?: "DINHEIRO" | "PIX" | "CARTAO";
      data?: Date;
    } = { valorRecebido: valorRecebidoNum };
    if (formaPagamento && FORMAS_PAGAMENTO.includes(formaPagamento)) {
      dataUpdate.formaPagamento = formaPagamento;
    }
    if (data) {
      dataUpdate.data = new Date(data);
    }

    const pagamento = await prisma.pagamento.update({
      where: { id: idNum },
      data: dataUpdate,
    });

    return NextResponse.json(pagamento);
  } catch (error) {
    console.error("Erro ao atualizar pagamento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar pagamento" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Excluir um pagamento/recebimento.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await prisma.pagamento.delete({
      where: { id: idNum },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir pagamento:", error);
    return NextResponse.json(
      { error: "Erro ao excluir pagamento" },
      { status: 500 }
    );
  }
}
