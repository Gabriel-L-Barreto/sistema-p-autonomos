import PDFDocument from "pdfkit";
import extenso from "extenso";

export type OrcamentoParaPdf = {
  id: number;
  endereco: string;
  data: string;
  incluiMaterial: boolean;
  complemento?: string | null;
  cliente: { nome: string; afiliacao: string | null; telefone: string | null };
  materiais: {
    medidaMaterial: string | null;
    origemMaterial: string | null;
    quantidade: number;
    precoUnitario: number;
    material?: { nome_material: string } | null;
  }[];
  servicos: {
    descricaoLivre: string | null;
    medidaServico?: string | null;
    quantidade: number;
    valorMaoObra: number;
    servico?: { descricao: string; tipo_cobranca?: string } | null;
  }[];
};

export type ConfigParaPdf = {
  cabecalho: string;
  logoUrl: string | null;
  timbradoUrl: string | null;
  timbradoRecebimentoUrl?: string | null;
  pixQrCodeUrl?: string | null;
  cabecalhoCor: string | null;
  cabecalhoLocal?: string | null; // inicio, meio, fim
  rodape?: string | null;
  rodapeLocal?: string | null;   // inicio, meio, fim
  nomeAssinatura: string;
  cidadeEmissao: string | null;
};

const MARGEM_CM = 70; // reduzido para menor margem esquerda
const LARGURA_A4 = 595;
const ALTURA_A4 = 842;

// Zonas fixas da folha A4
const CABECALHO_Y_MAX = 125; // fim do cabeçalho (logo + info empresa)
const PRIMEIRO_TERCO_Y_MAX = 240; // fim do primeiro terço (Nº, Cliente, Local) - mais espaço entre linhas
const TERCEIRO_QUARTO_Y = 480; // valores (mão de obra, total) ficam no terceiro quarto da folha
const ULTIMO_QUARTO_Y_INICIO = 580; // início do bloco data + assinatura (data mais pra cima)
const RODAPE_Y = 795; // início do rodapé
const ESPACO_LINHA = 10; // base para espaçamento
const ESPACO_INFO = 22; // espaço maior entre Orçamento N°, Cliente, Local

function valorPorExtenso(valor: number): string {
  try {
    const valorStr = valor.toFixed(2).replace(".", ",");
    return extenso(valorStr, { mode: "currency" });
  } catch {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
}

function unidadeParaTexto(tipo: string | null | undefined): string {
  if (tipo === "M2") return "m²";
  if (tipo === "M3") return "m³";
  if (tipo === "METROS") return "metros";
  return "un";
}

function formatarServicoUnitario(desc: string, qtd: number): string {
  const descLimpa = desc.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return qtd === 1 ? descLimpa : `${descLimpa} (${Math.round(qtd)})`;
}

function formatarServicoMedida(desc: string, qtd: number, un: string): string {
  const descLimpa = desc.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return `${qtd} ${un} de ${descLimpa}`;
}

function htmlParaTextoPdf(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|ul|ol)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function construirLinhasServicos(orc: OrcamentoParaPdf): string[] {
  const linhas: string[] = [];
  for (const serv of orc.servicos) {
    const desc = serv.descricaoLivre || serv.servico?.descricao || "Serviço";
    const qtd = serv.quantidade;
    const un = unidadeParaTexto(serv.servico?.tipo_cobranca ?? serv.medidaServico);
    if (un === "un") {
      linhas.push(formatarServicoUnitario(desc, qtd));
    } else {
      linhas.push(formatarServicoMedida(desc, qtd, un));
    }
  }
  return linhas;
}

export function gerarPdf(
  doc: InstanceType<typeof PDFDocument>,
  orc: OrcamentoParaPdf,
  config: ConfigParaPdf
): void {
  const totalServicos = orc.servicos.reduce((s, i) => s + i.quantidade * i.valorMaoObra, 0);
  const totalMateriais = orc.incluiMaterial
    ? orc.materiais.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0)
    : 0;
  const totalGeral = totalServicos + totalMateriais;
  const valorExtenso = valorPorExtenso(totalGeral);

  const dataObj = new Date(orc.data);
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  const cidade = config.cidadeEmissao || "Barroso";
  const dataFormatada = `${cidade}, ${dataObj.getDate()} de ${meses[dataObj.getMonth()]} de ${dataObj.getFullYear()}`;

  const zonaLargura = LARGURA_A4 - 2 * MARGEM_CM;
  const logoLargura = 90;
  const zonaInfoLargura = zonaLargura - logoLargura;
  const infoX = MARGEM_CM + logoLargura;
  const cabecalhoLinhas = config.cabecalho.split("\n").filter((l) => l.trim());

  // ========== TIMBRADO PNG (fundo - 100%, exatamente como é) ==========
  if (config.timbradoUrl && config.timbradoUrl.trim()) {
    try {
      doc.image(config.timbradoUrl, 0, 0, { fit: [LARGURA_A4, ALTURA_A4], align: "center", valign: "center" });
    } catch {
    }
  }

  // ========== CABEÇALHO (área fixa no topo - fonte maior, cor configurável) ==========
  let y = 40;
  const cfg = config as Record<string, unknown>;
  const cabecalhoCorValida = (cfg.cabecalhoCor ?? cfg.cabecalhocor ?? config.cabecalhoCor) && /^#[0-9A-Fa-f]{3,8}$/.test(String(cfg.cabecalhoCor ?? cfg.cabecalhocor ?? config.cabecalhoCor ?? ""))
    ? String(cfg.cabecalhoCor ?? cfg.cabecalhocor ?? config.cabecalhoCor)
    : "#000000";
  doc.fontSize(12).font("Helvetica-Bold").fillColor(cabecalhoCorValida);
  if (config.logoUrl && config.logoUrl.trim()) {
    try {
      // Logo quadrada: fit preserva proporção dentro de 60x60 pt
      doc.image(config.logoUrl, MARGEM_CM, y, { fit: [60, 60] });
    } catch {
      // ignora
    }
  }
  // Cor do cabeçalho aplicada antes de cada linha (evita reset por imagem)
  doc.fillColor(cabecalhoCorValida);
  const cabecalhoLocal = config.cabecalhoLocal ?? "meio";
  const cabecalhoAlign = cabecalhoLocal === "fim" ? "right" : cabecalhoLocal === "inicio" ? "left" : "center";
  const cabecalhoWidth = cabecalhoLocal === "meio" ? zonaLargura : zonaInfoLargura;
  const cabecalhoTextX = cabecalhoLocal === "meio" ? MARGEM_CM : infoX;
  for (const linha of cabecalhoLinhas) {
    doc.text(linha.trim(), cabecalhoTextX, y, { width: cabecalhoWidth, align: cabecalhoAlign });
    y += 14;
  }
  doc.fillColor("#000000");
  y = CABECALHO_Y_MAX;

  // ========== PRIMEIRO TERÇO: Nº orçamento, Cliente, Local (espaço reduzido abaixo do cabeçalho) ==========
  const ESPACO_ABAIXO_CABECALHO = 35; // reduzido (~1,2 cm)
  y += ESPACO_ABAIXO_CABECALHO;
  const enter = ESPACO_LINHA * 2.5; // espaço maior entre as informações (Nº, Cliente, Local)
  doc.fontSize(12).font("Helvetica-Bold");
  doc.text(
    `Orçamento Nº ${String(orc.id).padStart(3, "0")}/${dataObj.getFullYear()}`,
    MARGEM_CM,
    y,
    { width: zonaLargura, align: "center" }
  );
  y += enter;
  doc.font("Helvetica-Bold");
  doc.text(`Cliente: ${orc.cliente.nome}`, MARGEM_CM, y, { width: zonaLargura, align: "center" });
  y += enter;
  if (orc.cliente.afiliacao && orc.cliente.afiliacao.trim()) {
    doc.text(`At. ${orc.cliente.afiliacao.trim()}`, MARGEM_CM, y, { width: zonaLargura, align: "center" });
    y += enter;
  }
  doc.font("Helvetica");
  doc.text(orc.endereco, MARGEM_CM, y, { width: zonaLargura, align: "center" });
  y = PRIMEIRO_TERCO_Y_MAX + 25; // início da zona de conteúdo (mais espaço)

  // ========== CONTEÚDO (descrição, serviços, materiais - para antes dos valores) ==========
  const conteudoYMax = TERCEIRO_QUARTO_Y - 30; // conteúdo para antes do terceiro quarto (valores)
  doc.font("Helvetica-Bold");
  doc.text("Descrição do Orçamento:", MARGEM_CM, y);
  y += ESPACO_INFO; // mais espaço entre descrição e conteúdo

  if (orc.complemento && orc.complemento.trim()) {
    doc.font("Helvetica");
    const complementoTexto = htmlParaTextoPdf(orc.complemento);
    if (complementoTexto) {
      const linhas = complementoTexto.split("\n").filter((l) => l.trim());
      for (const linha of linhas) {
        if (y > conteudoYMax) break;
        doc.text(linha.trim(), MARGEM_CM, y, { width: zonaLargura });
        y = (doc as { y: number }).y + 6;
      }
      y += 4;
    }
  }

  const linhasServicos = construirLinhasServicos(orc);
  doc.font("Helvetica");
  for (const linha of linhasServicos) {
    if (y > conteudoYMax) break;
    doc.text(linha, MARGEM_CM, y, { width: zonaLargura });
    y = (doc as { y: number }).y + 6;
  }

  if (orc.incluiMaterial && orc.materiais.length > 0) {
    const MATERIAIS_POR_TABELA = 8;
    const colW = [zonaLargura * 0.5, zonaLargura * 0.15, zonaLargura * 0.2, zonaLargura * 0.15];
    const grupos: OrcamentoParaPdf["materiais"][] = [];
    for (let i = 0; i < orc.materiais.length; i += MATERIAIS_POR_TABELA) {
      grupos.push(orc.materiais.slice(i, i + MATERIAIS_POR_TABELA));
    }
    for (const grupo of grupos) {
      if (y > conteudoYMax) break;
      doc.font("Helvetica-Bold").fontSize(9);
      doc.text("Material", MARGEM_CM, y);
      doc.text("Qtd", MARGEM_CM + colW[0], y);
      doc.text("Preço un.", MARGEM_CM + colW[0] + colW[1], y);
      doc.text("Total", MARGEM_CM + colW[0] + colW[1] + colW[2], y);
      y += 12;
      doc.font("Helvetica");
      for (const mat of grupo) {
        const desc = mat.material?.nome_material || mat.origemMaterial || "Material";
        const un = mat.medidaMaterial === "M2" ? "m²" : mat.medidaMaterial === "M3" ? "m³" : mat.medidaMaterial === "METROS" ? "m" : "un";
        const total = mat.quantidade * mat.precoUnitario;
        doc.text(desc, MARGEM_CM, y, { width: colW[0], ellipsis: true });
        doc.text(`${mat.quantidade} ${un}`, MARGEM_CM + colW[0], y);
        doc.text(mat.precoUnitario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), MARGEM_CM + colW[0] + colW[1], y);
        doc.text(total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), MARGEM_CM + colW[0] + colW[1] + colW[2], y);
        y += 10;
      }
      y += 12;
    }
  }

  // ========== VALORES no terceiro quarto da folha (posição fixa) ==========
  const valoresY = TERCEIRO_QUARTO_Y;
  doc.font("Helvetica");
  if (totalServicos > 0) {
    doc.text(
      `Valor da mão de Obra: ${totalServicos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
      MARGEM_CM,
      valoresY
    );
  }
  doc.font("Helvetica-Bold");
  doc.text(
    `Valor Total: ${totalGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} (${valorExtenso})`,
    MARGEM_CM,
    valoresY + (totalServicos > 0 ? 18 : 0)
  );

  // ========== ÚLTIMO QUARTO: Data e Assinatura (dois blocos bem separados) ==========
  // Primeiro retângulo: bloco da data
  const dataY = ULTIMO_QUARTO_Y_INICIO - 15;
  doc.font("Helvetica");
  doc.text(dataFormatada, MARGEM_CM, dataY, { width: zonaLargura, align: "center" });

  // Segundo retângulo: bloco da assinatura (linha + nome) - mais espaço entre os blocos
  const ESPACO_DATA_ASSINATURA = 50; // separação clara entre data e assinatura
  const assinaturaY = dataY + ESPACO_DATA_ASSINATURA;
  const nomeAssinaturaY = assinaturaY + 24; // mais espaço entre linha e nome
  const linhaLargura = zonaLargura / 2;
  const linhaX = MARGEM_CM + (zonaLargura - linhaLargura) / 2;
  doc.moveTo(linhaX, assinaturaY).lineTo(linhaX + linhaLargura, assinaturaY).stroke();
  doc.text(config.nomeAssinatura || "_______________________", linhaX, nomeAssinaturaY, {
    width: linhaLargura,
    align: "center",
  });

  // ========== RODAPÉ (fixo no fim - largura metade da zona, texto configurável) ==========
  const rodapeLocal = config.rodapeLocal ?? "meio";
  const rodapeAlign = rodapeLocal === "fim" ? "right" : rodapeLocal === "inicio" ? "left" : "center";
  const rodapeWidth = zonaLargura / 2;
  const rodapeX = rodapeLocal === "inicio" ? MARGEM_CM : rodapeLocal === "fim" ? MARGEM_CM + zonaLargura / 2 : MARGEM_CM + zonaLargura / 4;
  const rodapeTexto = (config.rodape ?? "").trim();
  doc.fontSize(8).fillColor(cabecalhoCorValida);
  doc.text(rodapeTexto, rodapeX, RODAPE_Y, { width: rodapeWidth, align: rodapeAlign });
  doc.fillColor("#000000");
}
