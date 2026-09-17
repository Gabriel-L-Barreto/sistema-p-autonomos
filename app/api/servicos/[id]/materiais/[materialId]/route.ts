import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; materialId: string }> }
) {
  try {
    const { id, materialId } = await params;
    const servicoId = parseInt(id, 10);
    const materialIdNum = parseInt(materialId, 10);
    if (Number.isNaN(servicoId) || Number.isNaN(materialIdNum)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    await prisma.servicoMaterial.delete({
      where: {
        servicoId_materialId: { servicoId, materialId: materialIdNum },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao desvincular material do serviço:", error);
    return NextResponse.json(
      { error: "Erro ao desvincular material do serviço" },
      { status: 500 }
    );
  }
}
