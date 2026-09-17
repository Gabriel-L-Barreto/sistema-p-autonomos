import { NextRequest, NextResponse } from "next/server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { syncOrcamentosIdSequence } from "@/lib/sync-orcamentos-sequence";
import { sanitizarHtml, truncarTexto } from "@/lib/sanitize";
import { calcularValorTotal, calcularTotalPago, semRecebimentoHaMaisDeDias } from "@/lib/orcamento";
import { resolveOwnerAutonomoIdForCreate } from "@/lib/resolve-owner-autonomo";
import {
  criarOrcamentoCompleto,
  type MaterialOrcamentoInput,
  type ServicoOrcamentoInput,
} from "@/lib/salvar-orcamento-completo";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25", 10) || 25));
    const q = (searchParams.get("q") ?? "").trim();
    const statusFilter = (searchParams.get("status") ?? "").trim();
    const alerta = (searchParams.get("alerta") ?? "").trim();
    const sortBy = (searchParams.get("sortBy") ?? "createdAt").trim();
    const sortOrder = (searchParams.get("sortOrder") ?? "desc") === "asc" ? "asc" : "desc";

    const whereConditions: object[] = [];
    const statusPorAlerta: Record<string, string[] | null> = {
      SEM_DEFINICAO_FINAL: ["CADASTRADO"],
      EM_ANDAMENTO: ["INICIALIZADO"],
      PENDENTES_RECEBIMENTO: ["CADASTRADO", "ACEITO", "INICIALIZADO"],
      FINALIZADOS_NAO_QUITADOS: ["FINALIZADO"],
      ACEITOS_SEM_INICIO_5_DIAS: ["ACEITO"],
      INICIALIZADOS_SEM_RECEBIMENTO_15_DIAS: ["INICIALIZADO"],
    };
    const statusAlerta = statusPorAlerta[alerta] ?? null;
    const filtroFinalizadosNaoQuitados = alerta === "FINALIZADOS_NAO_QUITADOS";
    const filtroAceitosSemInicio = alerta === "ACEITOS_SEM_INICIO_5_DIAS";
    const filtroInicializadosSemRecebimento = alerta === "INICIALIZADOS_SEM_RECEBIMENTO_15_DIAS";

    if (q.length > 0) {
      const orConditions: object[] = [
        { endereco: { contains: q, mode: "insensitive" as const } },
        { cliente: { nome: { contains: q, mode: "insensitive" as const } } },
      ];
      const idNum = parseInt(q, 10);
      if (!Number.isNaN(idNum)) orConditions.unshift({ id: idNum });
      whereConditions.push({ OR: orConditions });
    }
    if (statusAlerta && statusAlerta.length === 1) {
      whereConditions.push({ status: statusAlerta[0] });
    } else if (statusAlerta && statusAlerta.length > 1) {
      whereConditions.push({ status: { in: statusAlerta } });
    } else if (
      statusFilter &&
      ["CADASTRADO", "NAO_ACEITO", "ACEITO", "INICIALIZADO", "FINALIZADO"].includes(statusFilter)
    ) {
      whereConditions.push({ status: statusFilter });
    }
    const where =
      whereConditions.length > 0 ? (whereConditions.length === 1 ? whereConditions[0] : { AND: whereConditions }) : undefined;

    const orderByMap: Record<string, object> = {
      id: { id: sortOrder },
      cliente: { cliente: { nome: sortOrder } },
      data: { data: sortOrder },
      status: { status: sortOrder },
      createdAt: { createdAt: sortOrder },
    };
    const orderBy = orderByMap[sortBy] ?? { createdAt: "desc" };

    if (filtroFinalizadosNaoQuitados || filtroAceitosSemInicio || filtroInicializadosSemRecebimento) {
      const listaFinalizados = await prisma.orcamento.findMany({
        where,
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
          historicoStatus: {
            orderBy: { data: "desc" },
          },
        },
        orderBy,
      });

      const agora = new Date();
      const cincoDiasMs = 5 * 24 * 60 * 60 * 1000;
      const filtrados = listaFinalizados.filter((o) => {
        const valorTotal = calcularValorTotal(o.materiais, o.servicos, o.incluiMaterial);
        const valorPago = calcularTotalPago(o.pagamentos);
        const quitado = valorPago >= valorTotal && valorTotal > 0;
        if (filtroFinalizadosNaoQuitados) return !quitado;

        if (filtroAceitosSemInicio) {
          const dataAceite = o.historicoStatus.find((h) => h.status === "ACEITO")?.data ?? null;
          return Boolean(dataAceite && agora.getTime() - dataAceite.getTime() > cincoDiasMs);
        }

        if (filtroInicializadosSemRecebimento) {
          const valorRestante = Math.max(0, valorTotal - valorPago);
          return semRecebimentoHaMaisDeDias(
            {
              status: o.status,
              valorRestante,
              pagamentos: o.pagamentos,
              historicoStatus: o.historicoStatus,
            },
            15,
            agora
          );
        }

        return true;
      });

      const total = filtrados.length;
      const inicio = (page - 1) * limit;
      const orcamentos = filtrados.slice(inicio, inicio + limit);

      return NextResponse.json({
        orcamentos,
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
        sortBy,
        sortOrder,
      });
    }

    const [orcamentos, total] = await Promise.all([
      prisma.orcamento.findMany({
        where,
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
          historicoStatus: {
            orderBy: { data: "desc" },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.orcamento.count({ where }),
    ]);

    return NextResponse.json({
      orcamentos,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
      sortBy,
      sortOrder,
    });
  } catch (error) {
    console.error("Erro ao buscar orçamentos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar orçamentos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clienteId: clienteIdRaw,
      ownerAutonomoId: ownerAutonomoIdBody,
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

    const clienteId =
      typeof clienteIdRaw === "number"
        ? clienteIdRaw
        : typeof clienteIdRaw === "string"
          ? parseInt(clienteIdRaw, 10)
          : NaN;
    if (!Number.isFinite(clienteId) || clienteId <= 0) {
      return NextResponse.json(
        { error: "ID do cliente é obrigatório" },
        { status: 400 }
      );
    }

    if (!endereco || typeof endereco !== "string" || endereco.trim() === "") {
      return NextResponse.json(
        { error: "Endereço é obrigatório" },
        { status: 400 }
      );
    }

    const temItensCompletos = Array.isArray(materiais) && Array.isArray(servicos);

    if (temItensCompletos) {
      const criarCompleto = () =>
        criarOrcamentoCompleto(
          prisma,
          {
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
          },
          ownerAutonomoIdBody
        );

      let orcamento;
      try {
        orcamento = await criarCompleto();
      } catch (first: unknown) {
        const conflitoId =
          first instanceof PrismaClientKnownRequestError &&
          first.code === "P2002" &&
          Array.isArray(first.meta?.target) &&
          first.meta.target.includes("id");
        if (!conflitoId) throw first;
        await syncOrcamentosIdSequence(prisma);
        orcamento = await criarCompleto();
      }

      return NextResponse.json(orcamento, { status: 201 });
    }

    const enderecoLimpo = truncarTexto(endereco.trim());
    const complementoLimpo = complemento && typeof complemento === "string"
      ? sanitizarHtml(complemento.trim()) || null
      : null;

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    const criar = () =>
      prisma.$transaction(async (tx) => {
        const ownerAutonomoId = await resolveOwnerAutonomoIdForCreate(tx, ownerAutonomoIdBody);
        const o = await tx.orcamento.create({
          data: {
            ownerAutonomoId,
            clienteId,
            endereco: enderecoLimpo,
            data: data ? new Date(data) : new Date(),
            tempoEstimado: tempoEstimado ?? null,
            incluiMaterial: incluiMaterial || false,
            totalParcelas: totalParcelas || null,
            status: status || "CADASTRADO",
            complemento: complementoLimpo,
          },
          include: {
            cliente: true,
            materiais: true,
            servicos: true,
          },
        });
        await tx.orcamentoStatusHistorico.create({
          data: {
            orcamentoId: o.id,
            status: o.status,
          },
        });
        return o;
      });

    let orcamento;
    try {
      orcamento = await criar();
    } catch (first: unknown) {
      const conflitoId =
        first instanceof PrismaClientKnownRequestError &&
        first.code === "P2002" &&
        Array.isArray(first.meta?.target) &&
        first.meta.target.includes("id");
      if (!conflitoId) throw first;
      await syncOrcamentosIdSequence(prisma);
      orcamento = await criar();
    }

    return NextResponse.json(orcamento, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar orçamento:", error);
    const msg =
      error instanceof Error && error.message.includes("autônomo")
        ? error.message
        : "Erro ao criar orçamento";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
