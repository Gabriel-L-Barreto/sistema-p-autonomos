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

    const servico = await prisma.servico.findUnique({
      where: { id: idNum },
      include: {
        servicoMateriais: { include: { material: true } },
      },
    });

    if (!servico) {
      return NextResponse.json(
        { error: "Serviço não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(servico);
  } catch (error) {
    console.error("Erro ao buscar serviço:", error);
    return NextResponse.json(
      { error: "Erro ao buscar serviço" },
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
    const { descricao, tipo_cobranca, precoBase, servicoAtivo } = body;

    const data: {
      descricao?: string;
      tipo_cobranca?: "UNITARIO" | "M2" | "M3" | "METROS";
      precoBase?: number;
      servicoAtivo?: boolean;
    } = {};

    if (descricao !== undefined) {
      if (typeof descricao !== "string" || descricao.trim() === "") {
        return NextResponse.json(
          { error: "Descrição do serviço é obrigatória" },
          { status: 400 }
        );
      }
      data.descricao = descricao.trim();
    }
    if (tipo_cobranca !== undefined) {
      if (!["UNITARIO", "M2", "M3", "METROS"].includes(tipo_cobranca)) {
        return NextResponse.json(
          { error: "Tipo de cobrança inválido (UNITARIO, M2, M3 ou METROS)" },
          { status: 400 }
        );
      }
      data.tipo_cobranca = tipo_cobranca;
    }
    if (precoBase !== undefined) {
      if (typeof precoBase !== "number" || precoBase < 0) {
        return NextResponse.json(
          { error: "Preço base deve ser um número maior ou igual a zero" },
          { status: 400 }
        );
      }
      data.precoBase = precoBase;
    }
    if (typeof servicoAtivo === "boolean") data.servicoAtivo = servicoAtivo;

    const servico = await prisma.servico.update({
      where: { id: idNum },
      data,
    });

    return NextResponse.json(servico);
  } catch (error) {
    console.error("Erro ao atualizar serviço:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar serviço" },
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

    await prisma.servico.delete({
      where: { id: idNum },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir serviço:", error);
    return NextResponse.json(
      { error: "Erro ao excluir serviço" },
      { status: 500 }
    );
  }
}
