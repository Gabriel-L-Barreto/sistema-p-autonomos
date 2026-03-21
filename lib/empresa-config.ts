import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { EmpresaConfig } from "@prisma/client";

// Workaround: PrismaClient pode não expor empresaConfig em alguns ambientes de tipagem
const empresaConfig = (prisma as unknown as { empresaConfig: { findFirst: Function; create: Function; update: Function } }).empresaConfig;

const DEFAULT_CONFIG = {
  cabecalho: "CNPJ:\nContatos: Tel: / Email:\nEndereço",
  logoUrl: null as string | null,
  timbradoUrl: null as string | null,
  cabecalhoCor: "#000000",
  nomeAssinatura: "",
  cidadeEmissao: "",
};

export async function getEmpresaConfig(): Promise<EmpresaConfig> {
  let config = await empresaConfig.findFirst({ orderBy: { id: "asc" } });
  if (!config) {
    config = await createEmpresaConfig({
      cabecalho: DEFAULT_CONFIG.cabecalho,
      logoUrl: DEFAULT_CONFIG.logoUrl,
      timbradoUrl: DEFAULT_CONFIG.timbradoUrl,
      cabecalhoCor: DEFAULT_CONFIG.cabecalhoCor,
      nomeAssinatura: DEFAULT_CONFIG.nomeAssinatura,
      cidadeEmissao: DEFAULT_CONFIG.cidadeEmissao,
    });
  }
  // Busca com raw para incluir cabecalhoCor se o client estiver desatualizado
  const rows = await prisma.$queryRaw`SELECT * FROM empresa_config WHERE id = ${config.id}`;
  return (rows as Record<string, unknown>[])[0] as EmpresaConfig;
}

export async function findEmpresaConfig(): Promise<EmpresaConfig | null> {
  return empresaConfig.findFirst({ orderBy: { id: "asc" } }) as Promise<EmpresaConfig | null>;
}

export async function createEmpresaConfig(data: {
  cabecalho: string;
  logoUrl: string | null;
  timbradoUrl?: string | null;
  cabecalhoCor?: string | null;
  nomeAssinatura: string;
  cidadeEmissao: string | null;
}): Promise<EmpresaConfig> {
  // Contorno: não passar cabecalhoCor ao create (Prisma Client pode estar desatualizado).
  const { cabecalhoCor, ...rest } = data;
  const config = await empresaConfig.create({
    data: {
      ...rest,
      timbradoUrl: rest.timbradoUrl ?? null,
    },
  }) as EmpresaConfig;
  // Define cabecalhoCor via SQL raw se fornecido.
  if (cabecalhoCor !== undefined) {
    await prisma.$executeRaw(Prisma.sql`UPDATE empresa_config SET "cabecalhoCor" = ${cabecalhoCor ?? "#000000"} WHERE id = ${config.id}`);
  }
  return config;
}

export async function updateEmpresaConfig(id: number, data: {
  cabecalho?: string;
  logoUrl?: string | null;
  timbradoUrl?: string | null;
  cabecalhoCor?: string | null;
  cabecalhoLocal?: string | null;
  rodape?: string | null;
  rodapeLocal?: string | null;
  nomeAssinatura?: string;
  cidadeEmissao?: string | null;
}): Promise<EmpresaConfig> {
  // Contorno: Prisma Client pode estar desatualizado e não reconhecer cabecalhoCor.
  // Usamos SQL raw para garantir que todos os campos sejam atualizados.
  const rows = await prisma.$queryRaw`SELECT * FROM empresa_config WHERE id = ${id}`;
  const existing = (rows as Record<string, unknown>[])[0];
  if (!existing) throw new Error("Config não encontrada");

  const cabecalho = data.cabecalho ?? (existing.cabecalho as string);
  const logoUrl = data.logoUrl !== undefined ? data.logoUrl : (existing.logoUrl as string | null);
  const timbradoUrl = data.timbradoUrl !== undefined ? data.timbradoUrl : (existing.timbradoUrl as string | null);
  const nomeAssinatura = data.nomeAssinatura ?? (existing.nomeAssinatura as string);
  const cidadeEmissao = data.cidadeEmissao !== undefined ? data.cidadeEmissao : (existing.cidadeEmissao as string | null);
  const cabecalhoCor = data.cabecalhoCor !== undefined ? data.cabecalhoCor : (existing.cabecalhoCor as string | null) ?? "#000000";
  const cabecalhoLocal = data.cabecalhoLocal !== undefined ? data.cabecalhoLocal : (existing.cabecalhoLocal as string | null);
  const rodape = data.rodape !== undefined ? data.rodape : (existing.rodape as string | null);
  const rodapeLocal = data.rodapeLocal !== undefined ? data.rodapeLocal : (existing.rodapeLocal as string | null);

  await prisma.$executeRaw(Prisma.sql`
    UPDATE empresa_config
    SET "cabecalho" = ${cabecalho},
        "logoUrl" = ${logoUrl},
        "timbradoUrl" = ${timbradoUrl},
        "nomeAssinatura" = ${nomeAssinatura},
        "cidadeEmissao" = ${cidadeEmissao},
        "cabecalhoCor" = ${cabecalhoCor},
        "cabecalhoLocal" = ${cabecalhoLocal},
        "rodape" = ${rodape},
        "rodapeLocal" = ${rodapeLocal}
    WHERE id = ${id}
  `);

  const updated = await prisma.$queryRaw`SELECT * FROM empresa_config WHERE id = ${id}`;
  return (updated as Record<string, unknown>[])[0] as EmpresaConfig;
}
