import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; servicoId: string }> }
) {
  try {
    const { id, servicoId } = await params;
    const servicoOrcamentoId = parseInt(servicoId, 10);
    if (Number.isNaN(servicoOrcamentoId)) {
      return NextResponse.json({ error: "ID do serviço inválido" }, { status: 400 });
    }

    await prisma.servicoOrcamento.delete({
      where: { id: servicoOrcamentoId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao remover serviço do orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao remover serviço do orçamento" },
      { status: 500 }
    );
  }
}
