import { prisma } from "@/lib/prisma";
import type { EmpresaConfig } from "@prisma/client";

// Workaround: PrismaClient pode não expor empresaConfig em alguns ambientes de tipagem
const empresaConfig = (prisma as unknown as { empresaConfig: { findFirst: Function; create: Function; update: Function } }).empresaConfig;

const DEFAULT_CONFIG = {
  cabecalho: "CNPJ:\nContatos: Tel: / Email:\nEndereço",
  logoUrl: null as string | null,
  nomeAssinatura: "",
  cidadeEmissao: "",
};

export async function getEmpresaConfig(): Promise<EmpresaConfig> {
  let config = await empresaConfig.findFirst({ orderBy: { id: "asc" } });
  if (!config) {
    config = await empresaConfig.create({
      data: DEFAULT_CONFIG,
    });
  }
  return config as EmpresaConfig;
}

export async function findEmpresaConfig(): Promise<EmpresaConfig | null> {
  return empresaConfig.findFirst({ orderBy: { id: "asc" } }) as Promise<EmpresaConfig | null>;
}

export async function createEmpresaConfig(data: {
  cabecalho: string;
  logoUrl: string | null;
  nomeAssinatura: string;
  cidadeEmissao: string | null;
}): Promise<EmpresaConfig> {
  return empresaConfig.create({ data }) as Promise<EmpresaConfig>;
}

export async function updateEmpresaConfig(id: number, data: {
  cabecalho?: string;
  logoUrl?: string | null;
  nomeAssinatura?: string;
  cidadeEmissao?: string | null;
}): Promise<EmpresaConfig> {
  return empresaConfig.update({ where: { id }, data }) as Promise<EmpresaConfig>;
}
