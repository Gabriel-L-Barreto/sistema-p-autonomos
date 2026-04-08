import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizarHtml, truncarTexto } from "@/lib/sanitize";
import { calcularValorTotal, calcularTotalPago } from "@/lib/orcamento";
import { Prisma } from "@prisma/client";

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
    };
    const statusAlerta = statusPorAlerta[alerta] ?? null;
    const filtroFinalizadosNaoQuitados = alerta === "FINALIZADOS_NAO_QUITADOS";

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

    if (filtroFinalizadosNaoQuitados) {
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
        },
        orderBy,
      });

      const filtrados = listaFinalizados.filter((o) => {
        const valorTotal = calcularValorTotal(o.materiais, o.servicos, o.incluiMaterial);
        const valorPago = calcularTotalPago(o.pagamentos);
        const quitado = valorPago >= valorTotal && valorTotal > 0;
        return !quitado;
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
      clienteId,
      endereco,
      data,
      tempoEstimado,
      incluiMaterial,
      totalParcelas,
      status,
      complemento,
    } = body;

    if (!clienteId || typeof clienteId !== "number") {
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

    const orcamento = await prisma.orcamento.create({
      data: {
        clienteId,
        endereco: enderecoLimpo,
        data: data ? new Date(data) : new Date(),
        tempoEstimado: tempoEstimado || null,
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

    await prisma.$executeRaw(
      Prisma.sql`INSERT INTO "orcamento_status_historico" ("orcamentoId", "status", "data") VALUES (${orcamento.id}, ${orcamento.status}::"Status", NOW())`
    );

    return NextResponse.json(orcamento, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao criar orçamento" },
      { status: 500 }
    );
  }
}
