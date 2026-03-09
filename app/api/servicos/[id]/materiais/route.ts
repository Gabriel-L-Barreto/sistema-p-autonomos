import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const servicoId = parseInt(id, 10);
    if (Number.isNaN(servicoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const servicoMateriais = await prisma.servicoMaterial.findMany({
      where: { servicoId },
      include: { material: true },
      orderBy: { material: { nome_material: "asc" } },
    });

    return NextResponse.json(servicoMateriais);
  } catch (error) {
    console.error("Erro ao buscar materiais do serviço:", error);
    return NextResponse.json(
      { error: "Erro ao buscar materiais do serviço" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const servicoId = parseInt(id, 10);
    if (Number.isNaN(servicoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();
    const { materialId, quantidade } = body;

    if (typeof materialId !== "number" || materialId <= 0) {
      return NextResponse.json(
        { error: "ID do material é obrigatório" },
        { status: 400 }
      );
    }

    if (typeof quantidade !== "number" || quantidade <= 0) {
      return NextResponse.json(
        { error: "Quantidade deve ser um número positivo" },
        { status: 400 }
      );
    }

    const servico = await prisma.servico.findUnique({
      where: { id: servicoId },
    });
    if (!servico) {
      return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
    }

    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });
    if (!material) {
      return NextResponse.json({ error: "Material não encontrado" }, { status: 404 });
    }

    const servicoMaterial = await prisma.servicoMaterial.upsert({
      where: {
        servicoId_materialId: { servicoId, materialId },
      },
      create: { servicoId, materialId, quantidade },
      update: { quantidade },
      include: { material: true },
    });

    return NextResponse.json(servicoMaterial, { status: 201 });
  } catch (error) {
    console.error("Erro ao vincular material ao serviço:", error);
    return NextResponse.json(
      { error: "Erro ao vincular material ao serviço" },
      { status: 500 }
    );
  }
}
