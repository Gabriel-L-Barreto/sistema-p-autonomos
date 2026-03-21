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
  timbradoUrl: null as string | null,
  nomeAssinatura: "",
  cidadeEmissao: "",
  cabecalhoCor: "#000000",
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
    const { cabecalho, logoUrl, timbradoUrl, nomeAssinatura, cidadeEmissao, cabecalhoCor, cabecalhoLocal, rodape, rodapeLocal } = body;

    let config = await findEmpresaConfig();

    const data: { cabecalho?: string; logoUrl?: string | null; timbradoUrl?: string | null; nomeAssinatura?: string; cidadeEmissao?: string | null; cabecalhoCor?: string | null; cabecalhoLocal?: string | null; rodape?: string | null; rodapeLocal?: string | null } = {};
    if (cabecalho !== undefined) data.cabecalho = String(cabecalho);
    if (logoUrl !== undefined) data.logoUrl = logoUrl === "" || logoUrl === null ? null : String(logoUrl);
    if (timbradoUrl !== undefined) data.timbradoUrl = timbradoUrl === "" || timbradoUrl === null ? null : String(timbradoUrl);
    if (nomeAssinatura !== undefined) data.nomeAssinatura = String(nomeAssinatura);
    if (cidadeEmissao !== undefined) data.cidadeEmissao = cidadeEmissao === "" || cidadeEmissao === null ? null : String(cidadeEmissao);
    if (cabecalhoCor !== undefined) data.cabecalhoCor = cabecalhoCor === "" || cabecalhoCor === null ? null : String(cabecalhoCor);
    if (cabecalhoLocal !== undefined) data.cabecalhoLocal = ["inicio", "meio", "fim"].includes(cabecalhoLocal) ? cabecalhoLocal : null;
    if (rodape !== undefined) data.rodape = rodape === "" || rodape === null ? null : String(rodape);
    if (rodapeLocal !== undefined) data.rodapeLocal = ["inicio", "meio", "fim"].includes(rodapeLocal) ? rodapeLocal : null;

    if (!config) {
      config = await createEmpresaConfig({
        cabecalho: data.cabecalho ?? DEFAULT_CONFIG.cabecalho,
        logoUrl: data.logoUrl ?? DEFAULT_CONFIG.logoUrl,
        timbradoUrl: data.timbradoUrl ?? DEFAULT_CONFIG.timbradoUrl,
        nomeAssinatura: data.nomeAssinatura ?? DEFAULT_CONFIG.nomeAssinatura,
        cidadeEmissao: data.cidadeEmissao ?? DEFAULT_CONFIG.cidadeEmissao,
        cabecalhoCor: data.cabecalhoCor ?? DEFAULT_CONFIG.cabecalhoCor,
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
