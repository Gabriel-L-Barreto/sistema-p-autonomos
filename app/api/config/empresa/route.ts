import { NextRequest, NextResponse } from "next/server";
import {
  getEmpresaConfig,
  findEmpresaConfig,
  createEmpresaConfig,
  updateEmpresaConfig,
} from "@/lib/empresa-config";

const DEFAULT_CONFIG = {
  cabecalho: "CNPJ:\nContatos: Tel: / Email:\nEndereço",
  logoUrl: null as string | null,
  nomeAssinatura: "",
  cidadeEmissao: "",
};

export async function GET() {
  try {
    const config = await getEmpresaConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("Erro ao buscar config:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configuração" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { cabecalho, logoUrl, nomeAssinatura, cidadeEmissao } = body;

    let config = await findEmpresaConfig();

    const data: { cabecalho?: string; logoUrl?: string | null; nomeAssinatura?: string; cidadeEmissao?: string | null } = {};
    if (cabecalho !== undefined) data.cabecalho = String(cabecalho);
    if (logoUrl !== undefined) data.logoUrl = logoUrl === "" || logoUrl === null ? null : String(logoUrl);
    if (nomeAssinatura !== undefined) data.nomeAssinatura = String(nomeAssinatura);
    if (cidadeEmissao !== undefined) data.cidadeEmissao = cidadeEmissao === "" || cidadeEmissao === null ? null : String(cidadeEmissao);

    if (!config) {
      config = await createEmpresaConfig({
        cabecalho: data.cabecalho ?? DEFAULT_CONFIG.cabecalho,
        logoUrl: data.logoUrl ?? DEFAULT_CONFIG.logoUrl,
        nomeAssinatura: data.nomeAssinatura ?? DEFAULT_CONFIG.nomeAssinatura,
        cidadeEmissao: data.cidadeEmissao ?? DEFAULT_CONFIG.cidadeEmissao,
      });
    } else {
      config = await updateEmpresaConfig(config.id, data);
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error("Erro ao atualizar config:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar configuração" },
      { status: 500 }
    );
  }
}
