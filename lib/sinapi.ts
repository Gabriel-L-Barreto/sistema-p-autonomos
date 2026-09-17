import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Parsea um valor monetário no formato brasileiro (1.234,56 ou 16,50).
 * NÃO altera o valor - apenas converte string para number.
 */
function parsePrecoBrasileiro(str: string): number | null {
  if (!str || str.trim() === "" || str === "-") return null;
  const limpo = str.trim().replace(/\./g, "").replace(",", ".");
  const num = parseFloat(limpo);
  return Number.isNaN(num) || num < 0 ? null : num;
}

function parseCSVLinhas(conteudo: string): string[][] {
  const linhas: string[][] = [];
  let linha: string[] = [];
  let campo = "";
  let emAspas = false;
  for (let i = 0; i < conteudo.length; i++) {
    const c = conteudo[i];
    if (emAspas) {
      if (c === '"') {
        if (conteudo[i + 1] === '"') {
          campo += '"';
          i++;
        } else emAspas = false;
      } else campo += c;
    } else {
      if (c === '"') emAspas = true;
      else if (c === ",") {
        linha.push(campo);
        campo = "";
      } else if (c === "\n" || c === "\r") {
        linha.push(campo);
        campo = "";
        if (linha.length > 0) linhas.push(linha);
        linha = [];
        if (c === "\r" && conteudo[i + 1] === "\n") i++;
      } else campo += c;
    }
  }
  if (campo || linha.length > 0) {
    linha.push(campo);
    if (linha.length > 0) linhas.push(linha);
  }
  return linhas;
}

/** Mapeia unidade SINAPI para TipoMedida do sistema. Não altera preços. */
function unidadeParaTipoMedida(unidade: string): "UNITARIO" | "M2" {
  const u = (unidade || "").toUpperCase().trim();
  if (u === "M2" || u === "M²" || u === "M2XMES" || u.startsWith("M2")) return "M2";
  return "UNITARIO";
}

export type SinapiInsumo = {
  id: number;
  codigo: string;
  nome_material: string;
  unidadeMedida: "UNITARIO" | "M2";
  precoUnitario: number;
  unidadeOriginal: string;
};

export type SinapiServico = {
  id: number;
  codigo: string;
  descricao: string;
  tipo_cobranca: "UNITARIO" | "M2";
  precoBase: number;
  unidadeOriginal: string;
};

const PASTA_SINAPI = join(process.cwd(), "data", "sinapi");

export function carregarInsumosSinapi(): SinapiInsumo[] {
  const caminho = join(PASTA_SINAPI, "insumos-isd.csv");
  let conteudo: string;
  try {
    conteudo = readFileSync(caminho, "utf-8");
  } catch {
    return [];
  }

  const linhas = parseCSVLinhas(conteudo);
  const resultado: SinapiInsumo[] = [];
  let primeiraLinhaDados = 0;
  for (let i = 0; i < Math.min(5, linhas.length); i++) {
    const row = linhas[i];
    if (row.length >= 6 && /^\d+$/.test(String(row[1] || "").trim())) {
      primeiraLinhaDados = i;
      break;
    }
  }

  for (let i = primeiraLinhaDados; i < linhas.length; i++) {
    const row = linhas[i];
    if (row.length < 6) continue;
    const classificacao = String(row[0] || "").trim();
    const codigoStr = String(row[1] || "").trim();
    const descricao = String(row[2] || "").trim();
    const unidade = String(row[3] || "").trim();
    const precoStr = String(row[row.length - 1] || "").trim();
    if (!descricao || !codigoStr) continue;
    const codigo = parseInt(codigoStr, 10);
    if (Number.isNaN(codigo)) continue;
    const preco = parsePrecoBrasileiro(precoStr);
    if (preco === null) continue;
    if (classificacao !== "MATERIAL" && classificacao !== "ESPECIAIS") continue;
    resultado.push({
      id: -codigo,
      codigo: codigoStr,
      nome_material: descricao,
      unidadeMedida: unidadeParaTipoMedida(unidade),
      precoUnitario: preco,
      unidadeOriginal: unidade,
    });
  }
  return resultado;
}

export function carregarServicosSinapi(): SinapiServico[] {
  const caminho = join(PASTA_SINAPI, "servicos-csd.csv");
  let conteudo: string;
  try {
    conteudo = readFileSync(caminho, "utf-8");
  } catch {
    return [];
  }

  const linhas = parseCSVLinhas(conteudo);
  const resultado: SinapiServico[] = [];
  let primeiraLinhaDados = 0;
  for (let i = 0; i < Math.min(5, linhas.length); i++) {
    const row = linhas[i];
    if (row.length >= 5 && /^\d+$/.test(String(row[1] || "").trim())) {
      primeiraLinhaDados = i;
      break;
    }
  }

  for (let i = primeiraLinhaDados; i < linhas.length; i++) {
    const row = linhas[i];
    if (row.length < 5) continue;
    const codigoStr = String(row[1] || "").trim();
    const descricao = String(row[2] || "").trim();
    const unidade = String(row[3] || "").trim();
    const custoStr = String(row[4] || "").trim();
    if (!descricao || !codigoStr) continue;
    const codigo = parseInt(codigoStr, 10);
    if (Number.isNaN(codigo)) continue;
    const preco = parsePrecoBrasileiro(custoStr);
    if (preco === null) continue;
    resultado.push({
      id: -codigo,
      codigo: codigoStr,
      descricao,
      tipo_cobranca: unidadeParaTipoMedida(unidade),
      precoBase: preco,
      unidadeOriginal: unidade,
    });
  }
  return resultado;
}
