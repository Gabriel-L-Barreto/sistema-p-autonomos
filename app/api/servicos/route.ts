import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveOwnerAutonomoIdForCreate } from "@/lib/resolve-owner-autonomo";

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
    const { descricao, tipo_cobranca, unidade_medida, precoBase, ownerAutonomoId: ownerAutonomoIdBody } = body;
    const tipoCobranca = tipo_cobranca ?? unidade_medida;

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

    const valoresValidos = ["UNITARIO", "M2", "M3", "METROS"];
    if (!tipoCobranca || !valoresValidos.includes(String(tipoCobranca).toUpperCase())) {
      return NextResponse.json(
        { error: "Unidade de medida inválida. Selecione Unitário, M², M³ ou Metros." },
        { status: 400 }
      );
    }

    const tipoCobrancaFinal = String(tipoCobranca).toUpperCase() as "UNITARIO" | "M2" | "M3" | "METROS";

    if (typeof precoBase !== "number" || precoBase < 0) {
      return NextResponse.json(
        { error: "Preço base deve ser um número maior ou igual a zero" },
        { status: 400 }
      );
    }

    const descricaoTrim = descricao.trim();
    const existente = await prisma.servico.findFirst({
      where: { descricao: { equals: descricaoTrim, mode: "insensitive" } },
    });
    if (existente) {
      return NextResponse.json(
        { error: "Já existe um serviço com esta descrição no catálogo" },
        { status: 409 }
      );
    }

    const servico = await prisma.$transaction(async (tx) => {
      const ownerAutonomoId = await resolveOwnerAutonomoIdForCreate(tx, ownerAutonomoIdBody);
      return tx.servico.create({
        data: {
          ownerAutonomoId,
          descricao: descricaoTrim,
          tipo_cobranca: tipoCobrancaFinal,
          precoBase,
          servicoAtivo: true,
        },
      });
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
