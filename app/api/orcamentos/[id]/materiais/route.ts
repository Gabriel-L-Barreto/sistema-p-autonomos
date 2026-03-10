import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { truncarTexto } from "@/lib/sanitize";

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
    const { materialId, medidaMaterial, origemMaterial, quantidade, precoUnitario } = body;

    if (typeof quantidade !== "number" || quantidade <= 0) {
      return NextResponse.json(
        { error: "Quantidade deve ser um número positivo" },
        { status: 400 }
      );
    }

    if (typeof precoUnitario !== "number" || precoUnitario < 0) {
      return NextResponse.json(
        { error: "Preço unitário deve ser um número positivo" },
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

    if (materialId !== undefined && materialId !== null) {
      const material = await prisma.material.findUnique({
        where: { id: materialId },
      });
      if (!material) {
        return NextResponse.json(
          { error: "Material não encontrado" },
          { status: 404 }
        );
      }
    }

    const materialOrcamento = await prisma.materialOrcamento.create({
      data: {
        orcamentoId,
        materialId: materialId || null,
        medidaMaterial: medidaMaterial || null,
        origemMaterial: origemMaterial && typeof origemMaterial === "string" ? truncarTexto(origemMaterial.trim()) || null : null,
        quantidade,
        precoUnitario,
      },
      include: {
        material: true,
        orcamento: true,
      },
    });

    return NextResponse.json(materialOrcamento, { status: 201 });
  } catch (error) {
    console.error("Erro ao adicionar material ao orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar material ao orçamento" },
      { status: 500 }
    );
  }
}
