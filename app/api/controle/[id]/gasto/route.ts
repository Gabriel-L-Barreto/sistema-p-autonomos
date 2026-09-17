import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chaveParaData, STATUS_CONTROLE } from "@/lib/controle-obra";
import { isDiaUtil } from "@/lib/dias-uteis";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const idNum = parseInt((await params).id, 10);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();
    const dataRaw = body?.data;
    if (typeof dataRaw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dataRaw)) {
      return NextResponse.json({ error: "Informe a data no formato AAAA-MM-DD." }, { status: 400 });
    }

    const data = chaveParaData(dataRaw);

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
    if (!orc.dataInicioControle) {
      return NextResponse.json(
        { error: "Defina a data de início da obra antes de registrar gastos." },
        { status: 400 }
      );
    }
    if (orc.controleUsaEstimativa) {
      return NextResponse.json(
        { error: "Esta obra usa estimativa rápida. Desative a estimativa para registrar dias." },
        { status: 400 }
      );
    }
    if (!orc.contaFinsDeSemanaControle && !isDiaUtil(data)) {
      return NextResponse.json(
        { error: "Só é possível registrar gastos em dias úteis (segunda a sexta), ou ative “contabilizar fins de semana”." },
        { status: 400 }
      );
    }

    const semGastos = Boolean(body?.semGastos);
    const valorPessoal = semGastos ? 0 : Math.max(0, Number(body?.valorPessoal ?? 0));
    const valorMateriais = semGastos ? 0 : Math.max(0, Number(body?.valorMateriais ?? 0));
    const observacao =
      typeof body?.observacao === "string" && body.observacao.trim()
        ? body.observacao.trim().slice(0, 300)
        : null;

    if (!semGastos && valorPessoal <= 0 && valorMateriais <= 0) {
      return NextResponse.json(
        { error: "Informe um valor de pessoal e/ou materiais, ou marque “sem gastos”." },
        { status: 400 }
      );
    }

    const gasto = await prisma.controleGastoDia.upsert({
      where: {
        orcamentoId_data: { orcamentoId: idNum, data },
      },
      create: {
        orcamentoId: idNum,
        data,
        valorPessoal,
        valorMateriais,
        semGastos,
        observacao,
      },
      update: {
        valorPessoal,
        valorMateriais,
        semGastos,
        observacao,
      },
    });

    return NextResponse.json({
      id: gasto.id,
      data: dataRaw,
      valorPessoal: gasto.valorPessoal,
      valorMateriais: gasto.valorMateriais,
      semGastos: gasto.semGastos,
      observacao: gasto.observacao,
      total: gasto.semGastos ? 0 : gasto.valorPessoal + gasto.valorMateriais,
    });
  } catch (error) {
    console.error("Erro ao salvar gasto do dia:", error);
    return NextResponse.json({ error: "Erro ao salvar gasto do dia" }, { status: 500 });
  }
}
