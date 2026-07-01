import type { TipoPagamento } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  calcularValorTotal,
  calcularTotalPago,
  calcularValorParcela,
} from "@/lib/orcamento";
import { formatarPreco } from "@/lib/format";

const FORMAS_PAGAMENTO = ["DINHEIRO", "PIX", "CARTAO"] as const;

export function formaPagamentoValida(
  forma: unknown
): forma is (typeof FORMAS_PAGAMENTO)[number] {
  return typeof forma === "string" && FORMAS_PAGAMENTO.includes(forma as (typeof FORMAS_PAGAMENTO)[number]);
}

export async function registrarPagamentoAbatimento(
  orcamentoId: number,
  valorNum: number,
  formaPagamento: TipoPagamento
) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT id FROM orcamentos WHERE id = ${orcamentoId} FOR UPDATE`;

    const orcamento = await tx.orcamento.findUnique({
      where: { id: orcamentoId },
      include: {
        materiais: true,
        servicos: true,
        pagamentos: true,
      },
    });

    if (!orcamento) throw new Error("Orçamento não encontrado");
    if (["CADASTRADO", "NAO_ACEITO"].includes(orcamento.status)) {
      throw new Error(
        "Recebimentos só podem ser registrados para orçamentos aceitos, inicializados ou finalizados."
      );
    }

    const valorTotal = calcularValorTotal(
      orcamento.materiais,
      orcamento.servicos,
      orcamento.incluiMaterial
    );
    const totalPago = calcularTotalPago(orcamento.pagamentos);
    const valorRestante = valorTotal - totalPago;

    if (valorNum > valorRestante) {
      throw new Error(
        `Valor não pode exceder o restante do orçamento (${formatarPreco(valorRestante)})`
      );
    }

    return tx.pagamento.create({
      data: {
        orcamentoId,
        valorRecebido: valorNum,
        formaPagamento,
      },
    });
  });
}

export async function registrarParcelaIgual(
  orcamentoId: number,
  formaPagamento: TipoPagamento
) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT id FROM orcamentos WHERE id = ${orcamentoId} FOR UPDATE`;

    const orcamento = await tx.orcamento.findUnique({
      where: { id: orcamentoId },
      include: {
        materiais: true,
        servicos: true,
        pagamentos: { orderBy: { id: "asc" } },
      },
    });

    if (!orcamento) throw new Error("Orçamento não encontrado");
    if (["CADASTRADO", "NAO_ACEITO"].includes(orcamento.status)) {
      throw new Error(
        "Recebimentos só podem ser registrados para orçamentos aceitos, inicializados ou finalizados."
      );
    }

    const totalParcelas = orcamento.totalParcelas;
    if (totalParcelas == null || totalParcelas < 1) {
      throw new Error("Orçamento não possui parcelas iguais configuradas");
    }

    const qtd = Math.round(totalParcelas);
    const pagamentosExistentes = orcamento.pagamentos.length;

    const valorTotal = calcularValorTotal(
      orcamento.materiais,
      orcamento.servicos,
      orcamento.incluiMaterial
    );
    const totalPago = calcularTotalPago(orcamento.pagamentos);
    const valorRestante = valorTotal - totalPago;

    if (valorRestante <= 0) {
      throw new Error("Não há valor restante para receber");
    }

    const parcelasRestantes = Math.max(1, qtd - pagamentosExistentes);
    const valorParcela = calcularValorParcela(valorRestante, parcelasRestantes);
    const novaQtdParcelas = Math.max(qtd, pagamentosExistentes + 1);

    const pagamento = await tx.pagamento.create({
      data: {
        orcamentoId,
        valorRecebido: valorParcela,
        formaPagamento,
      },
    });

    await tx.orcamento.update({
      where: { id: orcamentoId },
      data: { totalParcelas: novaQtdParcelas },
    });

    return {
      ...pagamento,
      parcela: { numero: pagamentosExistentes + 1, total: novaQtdParcelas },
    };
  });
}
