import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calcularValorTotal,
  calcularTotalPago,
} from "@/lib/orcamento";

const FORMAS_PAGAMENTO = ["DINHEIRO", "PIX", "CARTAO"] as const;

/**
 * POST - Registrar a próxima parcela (para orçamentos com parcelas iguais).
 * Cria um Pagamento com valor = total / totalParcelas.
 * Retorna o pagamento criado para gerar o PDF.
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
        pagamentos: { orderBy: { id: "asc" } },
      },
    });

    if (!orcamento) {
      return NextResponse.json(
        { error: "Orçamento não encontrado" },
        { status: 404 }
      );
    }

    const totalParcelas = orcamento.totalParcelas;
    if (totalParcelas == null || totalParcelas < 1) {
      return NextResponse.json(
        { error: "Orçamento não possui parcelas iguais configuradas" },
        { status: 400 }
      );
    }

    const qtd = Math.round(totalParcelas);
    const pagamentosExistentes = orcamento.pagamentos.length;

    const valorTotal = calcularValorTotal(
      orcamento.materiais,
      orcamento.servicos,
      orcamento.incluiMaterial
    );
    const totalPago = calcularTotalPago(orcamento.pagamentos);
    const valorRestante = valorTotal - totalPago;

    if (valorRestante <= 0) {
      return NextResponse.json(
        { error: "Não há valor restante para receber" },
        { status: 400 }
      );
    }

    const parcelasRestantes = Math.max(1, qtd - pagamentosExistentes);
    const valorParcela = Math.round((valorRestante / parcelasRestantes) * 100) / 100;

    const novaQtdParcelas = Math.max(qtd, pagamentosExistentes + 1);

    const [pagamento] = await prisma.$transaction([
      prisma.pagamento.create({
        data: {
          orcamentoId: idNum,
          valorRecebido: valorParcela,
          formaPagamento,
        },
      }),
      prisma.orcamento.update({
        where: { id: idNum },
        data: { totalParcelas: novaQtdParcelas },
      }),
    ]);

    return NextResponse.json(
      { ...pagamento, parcela: { numero: pagamentosExistentes + 1, total: novaQtdParcelas } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao registrar parcela:", error);
    return NextResponse.json(
      { error: "Erro ao registrar parcela" },
      { status: 500 }
    );
  }
}
