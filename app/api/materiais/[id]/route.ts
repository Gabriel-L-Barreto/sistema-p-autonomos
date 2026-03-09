import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const material = await prisma.material.findUnique({
      where: { id: idNum },
    });
    if (!material) {
      return NextResponse.json(
        { error: "Material não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(material);
  } catch (error) {
    console.error("Erro ao buscar material:", error);
    return NextResponse.json(
      { error: "Erro ao buscar material" },
      { status: 500 }
    );
  }
}

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
    const { nome_material, unidadeMedida, precoUnitario, ativo } = body;
    const data: {
      nome_material?: string;
      unidadeMedida?: "UNITARIO" | "M2";
      precoUnitario?: number;
      ativo?: boolean;
    } = {};
    if (nome_material !== undefined) {
      if (typeof nome_material !== "string" || nome_material.trim() === "") {
        return NextResponse.json(
          { error: "Nome do material é obrigatório" },
          { status: 400 }
        );
      }
      data.nome_material = nome_material.trim();
    }
    if (unidadeMedida !== undefined) {
      if (!["UNITARIO", "M2"].includes(unidadeMedida)) {
        return NextResponse.json(
          { error: "Unidade de medida inválida (UNITARIO ou M2)" },
          { status: 400 }
        );
      }
      data.unidadeMedida = unidadeMedida;
    }
    if (precoUnitario !== undefined) {
      if (typeof precoUnitario !== "number" || precoUnitario < 0) {
        return NextResponse.json(
          { error: "Preço unitário deve ser um número maior ou igual a zero" },
          { status: 400 }
        );
      }
      data.precoUnitario = precoUnitario;
    }
    if (typeof ativo === "boolean") data.ativo = ativo;
    const material = await prisma.material.update({
      where: { id: idNum },
      data,
    });
    return NextResponse.json(material);
  } catch (error) {
    console.error("Erro ao atualizar material:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar material" },
      { status: 500 }
    );
  }
}

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
    await prisma.material.delete({ where: { id: idNum } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir material:", error);
    return NextResponse.json(
      { error: "Erro ao excluir material" },
      { status: 500 }
    );
  }
}
