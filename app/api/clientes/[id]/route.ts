import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { truncarTexto } from "@/lib/sanitize";

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

    const cliente = await prisma.cliente.findUnique({
      where: { id: idNum },
    });

    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    return NextResponse.json(cliente);
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao buscar cliente" },
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
    const { nome, afiliacao, telefone } = body;

    const data: { nome?: string; afiliacao?: string | null; telefone?: string | null } = {};
    if (nome !== undefined) {
      const n = typeof nome === "string" ? nome.trim() : String(nome);
      if (n === "") {
        return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
      }
      data.nome = truncarTexto(n);
    }
    if (afiliacao !== undefined) data.afiliacao = afiliacao === "" || afiliacao == null ? null : truncarTexto(String(afiliacao).trim());
    if (telefone !== undefined) data.telefone = telefone === "" || telefone == null ? null : truncarTexto(String(telefone).trim());

    const cliente = await prisma.cliente.update({
      where: { id: idNum },
      data,
    });

    return NextResponse.json(cliente);
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar cliente" },
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

    const cliente = await prisma.cliente.findUnique({
      where: { id: idNum },
      select: { id: true, ownerAutonomoId: true },
    });
    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    const clienteSubstitutoNome = "Cliente removido";

    await prisma.$transaction(async (tx) => {
      let clienteSubstituto = await tx.cliente.findFirst({
        where: {
          ownerAutonomoId: cliente.ownerAutonomoId,
          nome: clienteSubstitutoNome,
        },
        orderBy: { id: "asc" },
      });

      if (!clienteSubstituto) {
        clienteSubstituto = await tx.cliente.create({
          data: {
            ownerAutonomoId: cliente.ownerAutonomoId,
            nome: clienteSubstitutoNome,
            afiliacao: null,
            telefone: null,
          },
        });
      }

      await tx.orcamento.updateMany({
        where: { clienteId: idNum },
        data: { clienteId: clienteSubstituto.id },
      });

      await tx.cliente.delete({
        where: { id: idNum },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao deletar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao deletar cliente" },
      { status: 500 }
    );
  }
}
