import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const where =
      q.length > 0
        ? {
            descricao: { contains: q, mode: "insensitive" as const },
          }
        : {};
    const servicos = await prisma.servico.findMany({
      where,
      orderBy: { descricao: "asc" },
    });
    return NextResponse.json(servicos);
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    return NextResponse.json(
      { error: "Erro ao buscar serviços" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { descricao, tipo_cobranca, precoBase } = body;

    if (
      !descricao ||
      typeof descricao !== "string" ||
      descricao.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Descrição do serviço é obrigatória" },
        { status: 400 }
      );
    }

    if (!tipo_cobranca || !["UNITARIO", "M2", "M3", "METROS"].includes(tipo_cobranca)) {
      return NextResponse.json(
        { error: "Tipo de cobrança inválido (UNITARIO, M2, M3 ou METROS)" },
        { status: 400 }
      );
    }

    if (typeof precoBase !== "number" || precoBase < 0) {
      return NextResponse.json(
        { error: "Preço base deve ser um número maior ou igual a zero" },
        { status: 400 }
      );
    }

    const servico = await prisma.servico.create({
      data: {
        descricao: descricao.trim(),
        tipo_cobranca,
        precoBase,
        servicoAtivo: true,
      },
    });

    return NextResponse.json(servico, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar serviço:", error);
    return NextResponse.json(
      { error: "Erro ao criar serviço" },
      { status: 500 }
    );
  }
}
