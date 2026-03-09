import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const where =
      q.length > 0
        ? {
            nome_material: { contains: q, mode: "insensitive" as const },
          }
        : {};
    const materiais = await prisma.material.findMany({
      where,
      orderBy: { nome_material: "asc" },
    });
    return NextResponse.json(materiais);
  } catch (error) {
    console.error("Erro ao buscar materiais:", error);
    return NextResponse.json(
      { error: "Erro ao buscar materiais" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome_material, unidadeMedida, precoUnitario } = body;

    if (
      !nome_material ||
      typeof nome_material !== "string" ||
      nome_material.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Nome do material é obrigatório" },
        { status: 400 }
      );
    }

    if (!unidadeMedida || !["UNITARIO", "M2"].includes(unidadeMedida)) {
      return NextResponse.json(
        { error: "Unidade de medida inválida (UNITARIO ou M2)" },
        { status: 400 }
      );
    }

    if (typeof precoUnitario !== "number" || precoUnitario < 0) {
      return NextResponse.json(
        { error: "Preço unitário deve ser um número maior ou igual a zero" },
        { status: 400 }
      );
    }

    const material = await prisma.material.create({
      data: {
        nome_material: nome_material.trim(),
        unidadeMedida,
        precoUnitario,
        ativo: true,
      },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar material:", error);
    return NextResponse.json(
      { error: "Erro ao criar material" },
      { status: 500 }
    );
  }
}
