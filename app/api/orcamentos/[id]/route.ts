import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  atualizarOrcamentoCompleto,
  type MaterialOrcamentoInput,
  type ServicoOrcamentoInput,
} from "@/lib/salvar-orcamento-completo";
import { sanitizarHtml, truncarTexto } from "@/lib/sanitize";

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
      formaPagamentoPadrao,
      status,
      complemento,
      materiais,
      servicos,
    } = body;

    const temItensCompletos = Array.isArray(materiais) && Array.isArray(servicos);

    if (temItensCompletos) {
      if (!clienteId || !endereco) {
        return NextResponse.json(
          { error: "Cliente e endereço são obrigatórios" },
          { status: 400 }
        );
      }

      const orcamento = await atualizarOrcamentoCompleto(prisma, idNum, {
        clienteId,
        endereco,
        data,
        tempoEstimado,
        incluiMaterial,
        totalParcelas,
        formaPagamentoPadrao,
        status,
        complemento,
        materiais: materiais as MaterialOrcamentoInput[],
        servicos: servicos as ServicoOrcamentoInput[],
      });

      return NextResponse.json(orcamento);
    }

    const dataUpdate: Record<string, unknown> = {};
    if (clienteId !== undefined) dataUpdate.clienteId = clienteId;
    if (endereco !== undefined) dataUpdate.endereco = truncarTexto(endereco.trim());
    if (data !== undefined) dataUpdate.data = new Date(data);
    if (tempoEstimado !== undefined) dataUpdate.tempoEstimado = tempoEstimado || null;
    if (incluiMaterial !== undefined) dataUpdate.incluiMaterial = incluiMaterial;
    if (totalParcelas !== undefined) dataUpdate.totalParcelas = totalParcelas || null;
    if (formaPagamentoPadrao !== undefined) dataUpdate.formaPagamentoPadrao = formaPagamentoPadrao || null;
    if (status !== undefined) dataUpdate.status = status;
    if (complemento !== undefined) {
      dataUpdate.complemento = complemento && typeof complemento === "string"
        ? sanitizarHtml(complemento.trim()) || null
        : null;
    }

    if (clienteId !== undefined) {
      const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
      if (cliente) {
        dataUpdate.clienteNome = cliente.nome;
        dataUpdate.clienteTelefone = cliente.telefone;
        dataUpdate.clienteAfiliacao = cliente.afiliacao;
      }
    }

    const orcamento = await prisma.$transaction(async (tx) => {
      const statusAtual = await tx.orcamento.findUnique({
        where: { id: idNum },
        select: { status: true },
      });

      const atualizado = await tx.orcamento.update({
        where: { id: idNum },
        data: dataUpdate,
        include: {
          cliente: true,
          materiais: { include: { material: true } },
          servicos: { include: { servico: true } },
        },
      });

      if (status !== undefined && statusAtual && status !== statusAtual.status) {
        await tx.orcamentoStatusHistorico.create({
          data: {
            orcamentoId: idNum,
            status,
          },
        });
      }

      return atualizado;
    });

    return NextResponse.json(orcamento);
  } catch (error) {
    console.error("Erro ao atualizar orçamento:", error);
    const msg = error instanceof Error ? error.message : "Erro ao atualizar orçamento";
    const status = msg.includes("não encontrado") || msg.includes("Adicione") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
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
