import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orcamentoId = parseInt(id, 10);
    if (Number.isNaN(orcamentoId)) {
      return NextResponse.json({ error: "ID do orçamento inválido" }, { status: 400 });
    }

    const body = await request.json();
    const { servicoId, descricaoLivre, quantidade, valorMaoObra } = body;

    if (typeof quantidade !== "number" || quantidade <= 0) {
      return NextResponse.json(
        { error: "Quantidade deve ser um número positivo" },
        { status: 400 }
      );
    }

    if (typeof valorMaoObra !== "number" || valorMaoObra < 0) {
      return NextResponse.json(
        { error: "Valor da mão de obra deve ser um número positivo" },
        { status: 400 }
      );
    }

    const orcamento = await prisma.orcamento.findUnique({
      where: { id: orcamentoId },
    });

    if (!orcamento) {
      return NextResponse.json(
        { error: "Orçamento não encontrado" },
        { status: 404 }
      );
    }

    if (servicoId !== undefined && servicoId !== null) {
      const servico = await prisma.servico.findUnique({
        where: { id: servicoId },
      });
      if (!servico) {
        return NextResponse.json(
          { error: "Serviço não encontrado" },
          { status: 404 }
        );
      }
    }

    const servicoOrcamento = await prisma.servicoOrcamento.create({
      data: {
        orcamentoId,
        servicoId: servicoId || null,
        descricaoLivre: descricaoLivre?.trim() || null,
        quantidade,
        valorMaoObra,
      },
      include: {
        servico: true,
        orcamento: true,
      },
    });

    return NextResponse.json(servicoOrcamento, { status: 201 });
  } catch (error) {
    console.error("Erro ao adicionar serviço ao orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar serviço ao orçamento" },
      { status: 500 }
    );
  }
}
