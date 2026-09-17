import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; materialId: string }> }
) {
  try {
    const { materialId } = await params;
    const materialOrcamentoId = parseInt(materialId, 10);
    if (Number.isNaN(materialOrcamentoId)) {
      return NextResponse.json({ error: "ID do material inválido" }, { status: 400 });
    }

    await prisma.materialOrcamento.delete({
      where: { id: materialOrcamentoId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao remover material do orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao remover material do orçamento" },
      { status: 500 }
    );
  }
}
