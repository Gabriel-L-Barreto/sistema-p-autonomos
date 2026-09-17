import PDFDocument from "pdfkit";
import extenso from "extenso";
import type { ConfigParaPdf } from "./gerar-pdf-orcamento";

export type RecebimentoParaPdf = {
  orcamentoId: number;
  pagamentoId: number;
  dataOrcamento: string;
  endereco: string;
  valorRecebido: number;
  formaPagamento: string;
  data: string;
  cliente: { nome: string };
  parcela?: { numero: number; total: number };
  incluiMaterial: boolean;
  materiais: {
    medidaMaterial: string | null;
    origemMaterial: string | null;
    quantidade: number;
    precoUnitario: number;
    material?: { nome_material: string } | null;
  }[];
  servicos: {
    descricaoLivre: string | null;
    quantidade: number;
    valorMaoObra: number;
    servico?: { descricao: string; tipo_cobranca?: string } | null;
    medidaServico?: string | null;
  }[];
};

const MARGEM_CM = 70;
const LARGURA_A4 = 595;
const ALTURA_A4 = 842;

// Mesmas zonas fixas do orçamento (padrão idêntico)
const CABECALHO_Y_MAX = 125;
const PRIMEIRO_TERCO_Y_MAX = 240;
const TERCEIRO_QUARTO_Y = 480;
const ULTIMO_QUARTO_Y_INICIO = 580;
const RODAPE_Y = 795;
const ESPACO_LINHA = 10;
const ESPACO_INFO = 22;

function unidadeParaTexto(tipo: string | null | undefined): string {
  if (tipo === "M2") return "m²";
  if (tipo === "M3") return "m³";
  if (tipo === "METROS") return "metros";
  return "un";
}

function valorPorExtenso(valor: number): string {
  try {
    const valorStr = valor.toFixed(2).replace(".", ",");
    return extenso(valorStr, { mode: "currency" });
  } catch {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
}

function formatarServicoUnitario(desc: string, qtd: number): string {
  const descLimpa = desc.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return qtd === 1 ? descLimpa : `${descLimpa} (${Math.round(qtd)})`;
}

function formatarServicoMedida(desc: string, qtd: number, un: string): string {
  const descLimpa = desc.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return `${qtd} ${un} de ${descLimpa}`;
}

function construirLinhasServicos(rec: RecebimentoParaPdf): string[] {
  const linhas: string[] = [];
  for (const serv of rec.servicos) {
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

export function gerarPdfRecebimento(
  doc: InstanceType<typeof PDFDocument>,
  rec: RecebimentoParaPdf,
  config: ConfigParaPdf
): void {
  const totalServicos = rec.servicos.reduce((s, i) => s + i.quantidade * i.valorMaoObra, 0);
  const totalMateriais = rec.incluiMaterial
    ? rec.materiais.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0)
    : 0;
  const totalOrcamento = totalServicos + totalMateriais;
  const percentualRecebido = totalOrcamento > 0 ? (rec.valorRecebido / totalOrcamento) * 100 : 0;
  const valorExtenso = valorPorExtenso(rec.valorRecebido);
  const dataObj = new Date(rec.data);
  const dataOrcamentoObj = new Date(rec.dataOrcamento);
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

  // ========== TIMBRADO PNG (fundo) ==========
  if (config.timbradoUrl && config.timbradoUrl.trim()) {
    try {
      doc.image(config.timbradoUrl, 0, 0, { fit: [LARGURA_A4, ALTURA_A4], align: "center", valign: "center" });
    } catch {
      // ignora
    }
  }

  // ========== CABEÇALHO (igual ao orçamento) ==========
  let y = 40;
  const cfg = config as Record<string, unknown>;
  const cabecalhoCorValida = (cfg.cabecalhoCor ?? cfg.cabecalhocor ?? config.cabecalhoCor) && /^#[0-9A-Fa-f]{3,8}$/.test(String(cfg.cabecalhoCor ?? cfg.cabecalhocor ?? config.cabecalhoCor ?? ""))
    ? String(cfg.cabecalhoCor ?? cfg.cabecalhocor ?? config.cabecalhoCor)
    : "#000000";
  doc.fontSize(12).font("Helvetica-Bold").fillColor(cabecalhoCorValida);
  if (config.logoUrl && config.logoUrl.trim()) {
    try {
      doc.image(config.logoUrl, MARGEM_CM, y, { fit: [60, 60] });
    } catch {
      // ignora
    }
  }
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

  // ========== PRIMEIRO TERÇO: Recebimento Nº, Ref. Orçamento, Cliente, Local (igual ao orçamento) ==========
  const ESPACO_ABAIXO_CABECALHO = 35;
  y += ESPACO_ABAIXO_CABECALHO;
  const enter = ESPACO_LINHA * 2.5;
  doc.fontSize(12).font("Helvetica-Bold");
  doc.text(
    `DECLARAÇÃO DE RECEBIMENTO Nº ${String(rec.pagamentoId).padStart(3, "0")}/${dataObj.getFullYear()}`,
    MARGEM_CM,
    y,
    { width: zonaLargura, align: "center" }
  );
  y = (doc as { y: number }).y + 4;
  doc.fontSize(7).font("Helvetica").fillColor("#555555");
  doc.text(
    `Ref. Orçamento Nº ${String(rec.orcamentoId).padStart(3, "0")}/${dataObj.getFullYear()}`,
    MARGEM_CM,
    y,
    { width: zonaLargura, align: "center" }
  );
  y = (doc as { y: number }).y + 18;
  doc.fontSize(12).font("Helvetica-Bold").fillColor("#000000");
  doc.text(`Cliente: ${rec.cliente.nome}`, MARGEM_CM, y, { width: zonaLargura, align: "center" });
  y += enter;
  doc.font("Helvetica");
  doc.text(rec.endereco, MARGEM_CM, y, { width: zonaLargura, align: "center" });
  y = PRIMEIRO_TERCO_Y_MAX + 25;

  // ========== CONTEÚDO: declaração de recebimento + serviços prestados ==========
  const conteudoYMax = TERCEIRO_QUARTO_Y - 30;
  doc.font("Helvetica-Bold");
  doc.text("Declaração:", MARGEM_CM, y);
  y += ESPACO_INFO;

  const referenciaOrcamento = `${String(rec.orcamentoId).padStart(3, "0")}/${dataOrcamentoObj.getFullYear()}`;
  const clausulaRecebimento = rec.parcela
    ? `Por meio deste, declaro ter recebido a parcela ${rec.parcela.numero}/${rec.parcela.total} referente ao orçamento nº ${referenciaOrcamento}.`
    : `Por meio deste, declaro ter recebido ${percentualRecebido.toFixed(2).replace(".", ",")}% do orçamento nº ${referenciaOrcamento}.`;

  doc.font("Helvetica");
  doc.text(clausulaRecebimento, MARGEM_CM, y, { width: zonaLargura });
  y = (doc as { y: number }).y + 10;

  doc.font("Helvetica-Bold");
  doc.text("Serviços prestados:", MARGEM_CM, y);
  y += ESPACO_INFO;

  const linhasServicos = construirLinhasServicos(rec);
  doc.font("Helvetica");
  for (const linha of linhasServicos) {
    if (y > conteudoYMax) break;
    doc.text(linha, MARGEM_CM, y, { width: zonaLargura });
    y = (doc as { y: number }).y + 6;
  }

  // ========== VALOR recebido no terceiro quarto (igual ao Valor Total do orçamento) ==========
  let yValor = TERCEIRO_QUARTO_Y;
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#000000");
  doc.text(
    `Valor recebido: ${rec.valorRecebido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} (${valorExtenso})`,
    MARGEM_CM,
    yValor
  );
  if (rec.parcela) {
    yValor = (doc as { y: number }).y + 4;
    doc.fontSize(7).font("Helvetica").fillColor("#555555");
    doc.text(
      `Parcela ${rec.parcela.numero}/${rec.parcela.total}`,
      MARGEM_CM,
      yValor,
      { width: zonaLargura, align: "left" }
    );
  } else {
    yValor = (doc as { y: number }).y + 4;
    doc.fontSize(7).font("Helvetica").fillColor("#555555");
    doc.text(
      `Percentual deste recebimento: ${percentualRecebido.toFixed(2).replace(".", ",")}% do orçamento`,
      MARGEM_CM,
      yValor,
      { width: zonaLargura, align: "left" }
    );
  }
  doc.fontSize(12).font("Helvetica").fillColor("#000000");

  const pixQrCodeUrl = (config as { pixQrCodeUrl?: string | null }).pixQrCodeUrl ?? null;
  if (rec.formaPagamento.toUpperCase().includes("PIX") && pixQrCodeUrl) {
    const qrSize = 95;
    const qrX = MARGEM_CM + zonaLargura - qrSize;
    const qrY = TERCEIRO_QUARTO_Y + 32;
    try {
      doc.fontSize(8).font("Helvetica").fillColor("#555555");
      doc.text("QR Code PIX", qrX, qrY - 12, { width: qrSize, align: "center" });
      doc.image(pixQrCodeUrl, qrX, qrY, { fit: [qrSize, qrSize], align: "center", valign: "center" });
      doc.fillColor("#000000");
    } catch {
      doc.fillColor("#000000");
    }
  }

  // ========== ÚLTIMO QUARTO: Data e Assinaturas (duas: Autônomo | Cliente) ==========
  const dataY = ULTIMO_QUARTO_Y_INICIO - 15;
  doc.text(dataFormatada, MARGEM_CM, dataY, { width: zonaLargura, align: "center" });

  const ESPACO_DATA_ASSINATURA = 50;
  const assinaturaY = dataY + ESPACO_DATA_ASSINATURA;
  const nomeY = assinaturaY + 24;
  const metadeLargura = zonaLargura / 2;
  const col1X = MARGEM_CM;
  const col2X = MARGEM_CM + metadeLargura;
  const linhaLargura = metadeLargura * 0.6;
  const linha1X = col1X + (metadeLargura - linhaLargura) / 2;
  const linha2X = col2X + (metadeLargura - linhaLargura) / 2;
  doc.moveTo(linha1X, assinaturaY).lineTo(linha1X + linhaLargura, assinaturaY).stroke();
  doc.moveTo(linha2X, assinaturaY).lineTo(linha2X + linhaLargura, assinaturaY).stroke();
  doc.fontSize(9);
  doc.text(config.nomeAssinatura || "_______________________", col1X, nomeY, { width: metadeLargura, align: "center" });
  doc.text(rec.cliente.nome, col2X, nomeY, { width: metadeLargura, align: "center" });

  // ========== RODAPÉ (igual ao orçamento) ==========
  const rodapeLocal = config.rodapeLocal ?? "meio";
  const rodapeAlign = rodapeLocal === "fim" ? "right" : rodapeLocal === "inicio" ? "left" : "center";
  const rodapeWidth = zonaLargura / 2;
  const rodapeX = rodapeLocal === "inicio" ? MARGEM_CM : rodapeLocal === "fim" ? MARGEM_CM + zonaLargura / 2 : MARGEM_CM + zonaLargura / 4;
  const rodapeTexto = (config.rodape ?? "").trim();
  doc.fontSize(8).fillColor(cabecalhoCorValida);
  doc.text(rodapeTexto, rodapeX, RODAPE_Y, { width: rodapeWidth, align: rodapeAlign });
  doc.fillColor("#000000");
}
