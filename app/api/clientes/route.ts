import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const where =
      q.length > 0
        ? {
            OR: [
              { nome: { contains: q, mode: "insensitive" as const } },
              { afiliacao: { contains: q, mode: "insensitive" as const } },
              { telefone: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {};
    const clientes = await prisma.cliente.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(clientes);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return NextResponse.json(
      { error: "Erro ao buscar clientes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, afiliacao, telefone } = body;

    if (!nome || typeof nome !== "string" || nome.trim() === "") {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.create({
      data: {
        nome: nome.trim(),
        afiliacao: afiliacao?.trim() || null,
        telefone: telefone?.trim() || null,
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao criar cliente" },
      { status: 500 }
    );
  }
}
