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

    const orcamento = await prisma.orcamento.findUnique({
      where: { id: idNum },
      include: {
        cliente: true,
        materiais: {
          include: {
            material: true,
          },
        },
        servicos: {
          include: {
            servico: true,
          },
        },
        pagamentos: true,
      },
    });

    if (!orcamento) {
      return NextResponse.json(
        { error: "Orçamento não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(orcamento);
  } catch (error) {
    console.error("Erro ao buscar orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao buscar orçamento" },
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
    const {
      clienteId,
      endereco,
      data,
      tempoEstimado,
      incluiMaterial,
      totalParcelas,
      status,
    } = body;

    const dataUpdate: any = {};
    if (clienteId !== undefined) dataUpdate.clienteId = clienteId;
    if (endereco !== undefined) dataUpdate.endereco = endereco.trim();
    if (data !== undefined) dataUpdate.data = new Date(data);
    if (tempoEstimado !== undefined) dataUpdate.tempoEstimado = tempoEstimado || null;
    if (incluiMaterial !== undefined) dataUpdate.incluiMaterial = incluiMaterial;
    if (totalParcelas !== undefined) dataUpdate.totalParcelas = totalParcelas || null;
    if (status !== undefined) dataUpdate.status = status;

    const orcamento = await prisma.orcamento.update({
      where: { id: idNum },
      data: dataUpdate,
      include: {
        cliente: true,
        materiais: {
          include: {
            material: true,
          },
        },
        servicos: {
          include: {
            servico: true,
          },
        },
      },
    });

    return NextResponse.json(orcamento);
  } catch (error) {
    console.error("Erro ao atualizar orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar orçamento" },
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

    await prisma.orcamento.delete({
      where: { id: idNum },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao deletar orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao deletar orçamento" },
      { status: 500 }
    );
  }
}
