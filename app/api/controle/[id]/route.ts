import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calcularValorTotal,
  calcularTotalPago,
  opcoesCalculoDoOrcamento,
} from "@/lib/orcamento";
import { chaveParaData, montarResumoControle, STATUS_CONTROLE } from "@/lib/controle-obra";
import { calcularDataFimObra } from "@/lib/dias-uteis";
import { totaisPessoalPlanilhaPorObra } from "@/lib/pessoal-sync";

type Ctx = { params: Promise<{ id: string }> };

function resumoDoOrcamento(orc: {
  materiais: { quantidade: number; precoUnitario: number }[];
  servicos: { quantidade: number; valorMaoObra: number }[];
  pagamentos: { valorRecebido: number }[];
  incluiMaterial: boolean;
  tipoOrcamento?: string | null;
  valorDiaria?: number | null;
  diasTrabalhados?: number | null;
  descontoValor?: number | null;
  descontoPercentual?: number | null;
  dataInicioControle: Date | null;
  dataFimControle: Date | null;
  tempoEstimado: number | null;
  tempoEstimadoControle: number | null;
  contaFinsDeSemanaControle: boolean;
  status: string;
  controleUsaEstimativa: boolean;
  controleDiasEstimativa: number | null;
  controleValorDiaEstimativa: number | null;
  gastosControle: {
    data: Date;
    valorPessoal: number;
    valorMateriais: number;
    semGastos: boolean;
    observacao: string | null;
  }[];
  id: number;
  endereco: string;
  cliente: { id: number; nome: string };
}) {
  const opts = opcoesCalculoDoOrcamento(orc);
  const valorTotal = calcularValorTotal(orc.materiais, orc.servicos, orc.incluiMaterial, opts);
  const valorRecebido = calcularTotalPago(orc.pagamentos);
  const resumo = montarResumoControle({
    valorTotal,
    valorRecebido,
    dataInicio: orc.dataInicioControle,
    dataFimManual: orc.dataFimControle,
    tempoEstimadoOrcamento: orc.tempoEstimado,
    tempoEstimadoControle: orc.tempoEstimadoControle,
    contaFinsDeSemana: orc.contaFinsDeSemanaControle,
    status: orc.status,
    usaEstimativa: orc.controleUsaEstimativa,
    diasEstimativa: orc.controleDiasEstimativa,
    valorDiaEstimativa: orc.controleValorDiaEstimativa,
    gastos: orc.gastosControle,
  });

  return {
    id: orc.id,
    endereco: orc.endereco,
    status: orc.status,
    tempoEstimado: orc.tempoEstimado,
    tempoEstimadoControle: orc.tempoEstimadoControle,
    cliente: { id: orc.cliente.id, nome: orc.cliente.nome },
    ...resumo,
  };
}

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const idNum = parseInt((await params).id, 10);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const orc = await prisma.orcamento.findUnique({
      where: { id: idNum },
      include: {
        cliente: true,
        materiais: true,
        servicos: true,
        pagamentos: true,
        gastosControle: { orderBy: { data: "asc" } },
      },
    });

    if (!orc) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
    }
    if (!STATUS_CONTROLE.includes(orc.status as (typeof STATUS_CONTROLE)[number])) {
      return NextResponse.json(
        { error: "Controle disponível apenas para orçamentos aceitos, inicializados ou finalizados." },
        { status: 400 }
      );
    }

    const pessoalDaPlanilha = await totaisPessoalPlanilhaPorObra(prisma, idNum);
    return NextResponse.json({
      ...resumoDoOrcamento(orc),
      pessoalDaPlanilha,
    });
  } catch (error) {
    console.error("Erro ao buscar controle da obra:", error);
    return NextResponse.json({ error: "Erro ao buscar controle da obra" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const idNum = parseInt((await params).id, 10);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();
    const orc = await prisma.orcamento.findUnique({ where: { id: idNum } });
    if (!orc) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
    }
    if (!STATUS_CONTROLE.includes(orc.status as (typeof STATUS_CONTROLE)[number])) {
      return NextResponse.json(
        { error: "Controle disponível apenas para orçamentos aceitos, inicializados ou finalizados." },
        { status: 400 }
      );
    }

    const data: {
      dataInicioControle?: Date | null;
      dataFimControle?: Date | null;
      tempoEstimadoControle?: number | null;
      contaFinsDeSemanaControle?: boolean;
      controleUsaEstimativa?: boolean;
      controleDiasEstimativa?: number | null;
      controleValorDiaEstimativa?: number | null;
    } = {};

    if (body.dataInicioControle !== undefined) {
      if (body.dataInicioControle === null || body.dataInicioControle === "") {
        data.dataInicioControle = null;
      } else if (
        typeof body.dataInicioControle === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(body.dataInicioControle)
      ) {
        data.dataInicioControle = chaveParaData(body.dataInicioControle);
      } else {
        return NextResponse.json(
          { error: "Informe a data de início no formato AAAA-MM-DD." },
          { status: 400 }
        );
      }
    }

    if (body.dataFimControle !== undefined) {
      if (body.dataFimControle === null || body.dataFimControle === "") {
        data.dataFimControle = null;
      } else if (
        typeof body.dataFimControle === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(body.dataFimControle)
      ) {
        data.dataFimControle = chaveParaData(body.dataFimControle);
      } else {
        return NextResponse.json(
          { error: "Informe a data de fim no formato AAAA-MM-DD." },
          { status: 400 }
        );
      }
    }

    if (body.tempoEstimadoControle !== undefined) {
      if (body.tempoEstimadoControle === null || body.tempoEstimadoControle === "") {
        data.tempoEstimadoControle = null;
      } else {
        const n = Math.floor(Number(body.tempoEstimadoControle));
        if (!Number.isFinite(n) || n <= 0) {
          return NextResponse.json(
            { error: "Informe uma estimativa de dias maior que zero." },
            { status: 400 }
          );
        }
        data.tempoEstimadoControle = n;
      }
    }

    if (body.contaFinsDeSemanaControle !== undefined) {
      data.contaFinsDeSemanaControle = Boolean(body.contaFinsDeSemanaControle);
    }

    if (body.controleUsaEstimativa !== undefined) {
      data.controleUsaEstimativa = Boolean(body.controleUsaEstimativa);
      if (!data.controleUsaEstimativa) {
        data.controleDiasEstimativa = null;
        data.controleValorDiaEstimativa = null;
      }
    }

    if (body.controleDiasEstimativa !== undefined && body.controleUsaEstimativa !== false) {
      const n = Math.floor(Number(body.controleDiasEstimativa));
      if (!Number.isFinite(n) || n <= 0) {
        return NextResponse.json(
          { error: "Informe a quantidade de dias da estimativa." },
          { status: 400 }
        );
      }
      data.controleDiasEstimativa = n;
    }

    if (body.controleValorDiaEstimativa !== undefined && body.controleUsaEstimativa !== false) {
      const v = Number(body.controleValorDiaEstimativa);
      if (!Number.isFinite(v) || v < 0) {
        return NextResponse.json(
          { error: "Informe o valor estimado de gasto por dia." },
          { status: 400 }
        );
      }
      data.controleValorDiaEstimativa = Math.round(v * 100) / 100;
    }

    // Atalho: aplicar estimativa rápida em uma chamada
    if (body.aplicarEstimativaRapida) {
      const inicio =
        typeof body.dataInicioControle === "string"
          ? body.dataInicioControle
          : orc.dataInicioControle
            ? orc.dataInicioControle.toISOString().slice(0, 10)
            : null;
      const dias = Math.floor(Number(body.controleDiasEstimativa ?? body.dias));
      const valorDia = Number(body.controleValorDiaEstimativa ?? body.valorDia);
      if (!inicio || !/^\d{4}-\d{2}-\d{2}$/.test(inicio)) {
        return NextResponse.json({ error: "Informe a data de início." }, { status: 400 });
      }
      if (!Number.isFinite(dias) || dias <= 0) {
        return NextResponse.json({ error: "Informe os dias gastos." }, { status: 400 });
      }
      if (!Number.isFinite(valorDia) || valorDia < 0) {
        return NextResponse.json({ error: "Informe o valor por dia." }, { status: 400 });
      }
      data.dataInicioControle = chaveParaData(inicio);
      data.controleUsaEstimativa = true;
      data.controleDiasEstimativa = dias;
      data.controleValorDiaEstimativa = Math.round(valorDia * 100) / 100;
      data.tempoEstimadoControle = dias;
      data.contaFinsDeSemanaControle = false;
      // Fecha o período na data fim calculada (só dias úteis)
      data.dataFimControle = calcularDataFimObra(chaveParaData(inicio), dias, false);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 400 });
    }

    await prisma.orcamento.update({ where: { id: idNum }, data });

    const atualizado = await prisma.orcamento.findUnique({
      where: { id: idNum },
      include: {
        cliente: true,
        materiais: true,
        servicos: true,
        pagamentos: true,
        gastosControle: { orderBy: { data: "asc" } },
      },
    });

    const pessoalDaPlanilha = await totaisPessoalPlanilhaPorObra(prisma, idNum);
    return NextResponse.json({
      ...resumoDoOrcamento(atualizado!),
      pessoalDaPlanilha,
    });
  } catch (error) {
    console.error("Erro ao atualizar controle da obra:", error);
    return NextResponse.json({ error: "Erro ao atualizar controle" }, { status: 500 });
  }
}
