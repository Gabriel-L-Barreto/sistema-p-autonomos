import type { Status, TipoMedida, TipoPagamento } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { sanitizarHtml, truncarTexto } from "@/lib/sanitize";
import { resolveOwnerAutonomoIdForCreate } from "@/lib/resolve-owner-autonomo";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export type MaterialOrcamentoInput = {
  materialId?: number | null;
  medidaMaterial?: TipoMedida | string | null;
  origemMaterial?: string | null;
  quantidade: number;
  precoUnitario: number;
};

export type ServicoOrcamentoInput = {
  servicoId?: number | null;
  descricaoLivre?: string | null;
  medidaServico?: TipoMedida | string | null;
  quantidade: number;
  valorMaoObra: number;
};

export type OrcamentoCompletoInput = {
  clienteId: number;
  ownerAutonomoId?: number | null;
  endereco: string;
  data?: string | Date;
  tempoEstimado?: number | null;
  incluiMaterial?: boolean;
  totalParcelas?: number | null;
  formaPagamentoPadrao?: TipoPagamento | null;
  status?: Status;
  complemento?: string | null;
  materiais: MaterialOrcamentoInput[];
  servicos: ServicoOrcamentoInput[];
};

const MEDIDAS_VALIDAS = ["UNITARIO", "M2", "M3", "METROS"] as const;

function medidaValida(valor: string | null | undefined): TipoMedida | null {
  if (!valor) return null;
  return MEDIDAS_VALIDAS.includes(valor as (typeof MEDIDAS_VALIDAS)[number])
    ? (valor as TipoMedida)
    : null;
}

function validarItens(materiais: MaterialOrcamentoInput[], servicos: ServicoOrcamentoInput[]) {
  if (!Array.isArray(servicos) || servicos.length === 0) {
    throw new Error("Adicione pelo menos um serviço ao orçamento");
  }
  for (const mat of materiais) {
    if (typeof mat.quantidade !== "number" || mat.quantidade <= 0) {
      throw new Error("Quantidade de material deve ser um número positivo");
    }
    if (typeof mat.precoUnitario !== "number" || mat.precoUnitario < 0) {
      throw new Error("Preço unitário de material inválido");
    }
  }
  for (const serv of servicos) {
    if (typeof serv.quantidade !== "number" || serv.quantidade <= 0) {
      throw new Error("Quantidade de serviço deve ser um número positivo");
    }
    if (typeof serv.valorMaoObra !== "number" || serv.valorMaoObra < 0) {
      throw new Error("Valor da mão de obra inválido");
    }
  }
}

async function resolverMaterialSnapshot(
  tx: Tx,
  mat: MaterialOrcamentoInput
): Promise<{
  materialId: number | null;
  materialNome: string;
  medidaMaterial: TipoMedida | null;
  origemMaterial: string | null;
  quantidade: number;
  precoUnitario: number;
}> {
  let materialNome = mat.origemMaterial?.trim() || "Material";
  let medidaMaterial = medidaValida(mat.medidaMaterial ?? null);

  if (mat.materialId) {
    const material = await tx.material.findUnique({ where: { id: mat.materialId } });
    if (!material) throw new Error("Material não encontrado");
    materialNome = material.nome_material;
    if (!medidaMaterial) medidaMaterial = material.unidadeMedida;
  }

  const origemMaterial =
    mat.origemMaterial && typeof mat.origemMaterial === "string"
      ? truncarTexto(mat.origemMaterial.trim()) || null
      : null;

  return {
    materialId: mat.materialId ?? null,
    materialNome: truncarTexto(materialNome),
    medidaMaterial,
    origemMaterial,
    quantidade: mat.quantidade,
    precoUnitario: mat.precoUnitario,
  };
}

async function resolverServicoSnapshot(
  tx: Tx,
  serv: ServicoOrcamentoInput
): Promise<{
  servicoId: number | null;
  servicoDescricao: string;
  descricaoLivre: string | null;
  medidaServico: TipoMedida | null;
  quantidade: number;
  valorMaoObra: number;
}> {
  const descricaoLivreLimpa =
    serv.descricaoLivre && typeof serv.descricaoLivre === "string"
      ? sanitizarHtml(serv.descricaoLivre.trim()) || null
      : null;

  let servicoDescricao = descricaoLivreLimpa || "Serviço";
  let medidaServico: TipoMedida | null = null;

  if (serv.servicoId) {
    const servico = await tx.servico.findUnique({ where: { id: serv.servicoId } });
    if (!servico) throw new Error("Serviço não encontrado");
    servicoDescricao = servico.descricao;
    medidaServico = servico.tipo_cobranca;
  } else {
    medidaServico = medidaValida(serv.medidaServico ?? null) ?? "UNITARIO";
  }

  return {
    servicoId: serv.servicoId ?? null,
    servicoDescricao: truncarTexto(servicoDescricao.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()),
    descricaoLivre: descricaoLivreLimpa,
    medidaServico,
    quantidade: serv.quantidade,
    valorMaoObra: serv.valorMaoObra,
  };
}

async function montarDadosCabecalho(
  tx: Tx,
  input: OrcamentoCompletoInput,
  ownerAutonomoId: number
) {
  const cliente = await tx.cliente.findUnique({ where: { id: input.clienteId } });
  if (!cliente) throw new Error("Cliente não encontrado");

  const enderecoLimpo = truncarTexto(input.endereco.trim());
  const complementoLimpo =
    input.complemento && typeof input.complemento === "string"
      ? sanitizarHtml(input.complemento.trim()) || null
      : null;

  return {
    ownerAutonomoId,
    clienteId: input.clienteId,
    clienteNome: cliente.nome,
    clienteTelefone: cliente.telefone,
    clienteAfiliacao: cliente.afiliacao,
    endereco: enderecoLimpo,
    data: input.data ? new Date(input.data) : new Date(),
    tempoEstimado: input.tempoEstimado ?? null,
    incluiMaterial: input.incluiMaterial || false,
    totalParcelas: input.totalParcelas ?? null,
    formaPagamentoPadrao: input.formaPagamentoPadrao ?? null,
    status: input.status || "CADASTRADO",
    complemento: complementoLimpo,
  };
}

export async function criarOrcamentoCompleto(
  prisma: PrismaClient,
  input: OrcamentoCompletoInput,
  ownerAutonomoIdBody?: number | null
) {
  validarItens(input.materiais ?? [], input.servicos);

  return prisma.$transaction(async (tx) => {
    const ownerAutonomoId = await resolveOwnerAutonomoIdForCreate(tx, ownerAutonomoIdBody);
    const cabecalho = await montarDadosCabecalho(tx, input, ownerAutonomoId);

    const materiaisResolvidos = await Promise.all(
      (input.materiais ?? []).map((mat) => resolverMaterialSnapshot(tx, mat))
    );
    const servicosResolvidos = await Promise.all(
      input.servicos.map((serv) => resolverServicoSnapshot(tx, serv))
    );

    const orcamento = await tx.orcamento.create({
      data: {
        ...cabecalho,
        materiais: { create: materiaisResolvidos },
        servicos: { create: servicosResolvidos },
      },
      include: {
        cliente: true,
        materiais: { include: { material: true } },
        servicos: { include: { servico: true } },
      },
    });

    await tx.orcamentoStatusHistorico.create({
      data: {
        orcamentoId: orcamento.id,
        status: orcamento.status,
      },
    });

    return orcamento;
  });
}

export async function atualizarOrcamentoCompleto(
  prisma: PrismaClient,
  orcamentoId: number,
  input: Omit<OrcamentoCompletoInput, "ownerAutonomoId">
) {
  validarItens(input.materiais ?? [], input.servicos);

  return prisma.$transaction(async (tx) => {
    const existente = await tx.orcamento.findUnique({
      where: { id: orcamentoId },
      select: { status: true, ownerAutonomoId: true },
    });
    if (!existente) throw new Error("Orçamento não encontrado");

    const cabecalho = await montarDadosCabecalho(tx, input, existente.ownerAutonomoId);

    const materiaisResolvidos = await Promise.all(
      (input.materiais ?? []).map((mat) => resolverMaterialSnapshot(tx, mat))
    );
    const servicosResolvidos = await Promise.all(
      input.servicos.map((serv) => resolverServicoSnapshot(tx, serv))
    );

    await tx.materialOrcamento.deleteMany({ where: { orcamentoId } });
    await tx.servicoOrcamento.deleteMany({ where: { orcamentoId } });

    const statusAnterior = existente.status;
    const novoStatus = input.status ?? statusAnterior;

    const orcamento = await tx.orcamento.update({
      where: { id: orcamentoId },
      data: {
        clienteId: cabecalho.clienteId,
        clienteNome: cabecalho.clienteNome,
        clienteTelefone: cabecalho.clienteTelefone,
        clienteAfiliacao: cabecalho.clienteAfiliacao,
        endereco: cabecalho.endereco,
        data: cabecalho.data,
        tempoEstimado: cabecalho.tempoEstimado,
        incluiMaterial: cabecalho.incluiMaterial,
        totalParcelas: input.totalParcelas !== undefined ? input.totalParcelas : undefined,
        formaPagamentoPadrao:
          input.formaPagamentoPadrao !== undefined ? input.formaPagamentoPadrao : undefined,
        status: novoStatus,
        complemento: cabecalho.complemento,
        materiais: { create: materiaisResolvidos },
        servicos: { create: servicosResolvidos },
      },
      include: {
        cliente: true,
        materiais: { include: { material: true } },
        servicos: { include: { servico: true } },
      },
    });

    if (novoStatus !== statusAnterior) {
      await tx.orcamentoStatusHistorico.create({
        data: {
          orcamentoId,
          status: novoStatus,
        },
      });
    }

    return orcamento;
  });
}
