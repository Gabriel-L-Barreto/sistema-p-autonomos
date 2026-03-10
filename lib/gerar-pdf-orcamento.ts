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
    quantidade: number;
    valorMaoObra: number;
    servico?: { descricao: string; tipo_cobranca?: string } | null;
  }[];
};

export type ConfigParaPdf = {
  cabecalho: string;
  logoUrl: string | null;
  nomeAssinatura: string;
  cidadeEmissao: string | null;
};

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
  if (tipo === "METROS") return "m";
  return "un";
}

function construirLinhasServicos(orc: OrcamentoParaPdf): string[] {
  const linhas: string[] = [];
  for (const serv of orc.servicos) {
    const desc = serv.descricaoLivre || serv.servico?.descricao || "Serviço";
    const qtd = serv.quantidade;
    const un = unidadeParaTexto(serv.servico?.tipo_cobranca);
    const valorTotal = qtd * serv.valorMaoObra;
    linhas.push(`${qtd} ${un} ${desc} ${valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`);
  }
  return linhas;
}

function construirLinhasMateriais(orc: OrcamentoParaPdf, incluiMaterial: boolean): string[] {
  if (!incluiMaterial) return [];
  const linhas: string[] = [];
  for (const mat of orc.materiais) {
    const desc = mat.material?.nome_material || mat.origemMaterial || "Material";
    const qtd = mat.quantidade;
    const un = unidadeParaTexto(mat.medidaMaterial);
    const valorTotal = qtd * mat.precoUnitario;
    linhas.push(`${qtd} ${un} ${desc} ${valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`);
  }
  return linhas;
}

export function montarConteudoPdf(
  orc: OrcamentoParaPdf,
  config: ConfigParaPdf
): { descricao: string; totalMaoObra: number; totalGeral: number; valorExtenso: string; dataFormatada: string } {
  const totalServicos = orc.servicos.reduce((s, i) => s + i.quantidade * i.valorMaoObra, 0);
  const totalMateriais = orc.incluiMaterial
    ? orc.materiais.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0)
    : 0;
  const totalGeral = totalServicos + totalMateriais;

  const linhasServicos = construirLinhasServicos(orc);
  const linhasMateriais = construirLinhasMateriais(orc, orc.incluiMaterial);
  const descricao = [...linhasServicos, ...linhasMateriais].join("\n");
  const valorExtenso = valorPorExtenso(totalGeral);
  const dataObj = new Date(orc.data);
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];
  const dataFormatada = `${config.cidadeEmissao || "Barroso"}, ${dataObj.getDate()} de ${meses[dataObj.getMonth()]} de ${dataObj.getFullYear()}`;

  return {
    descricao,
    totalMaoObra: totalServicos,
    totalGeral,
    valorExtenso,
    dataFormatada,
  };
}

export function gerarPdf(
  doc: InstanceType<typeof PDFDocument>,
  orc: OrcamentoParaPdf,
  config: ConfigParaPdf
): void {
  const { descricao, totalMaoObra, totalGeral, valorExtenso, dataFormatada } = montarConteudoPdf(orc, config);

  const margem = 50;
  const largura = 595;
  let y = 40;

  const cabecalhoLinhas = config.cabecalho.split("\n");
  doc.fontSize(9).font("Helvetica");
  for (const linha of cabecalhoLinhas) {
    doc.text(linha, margem, y, { width: largura - 2 * margem });
    y += 14;
  }
  y += 10;

  if (config.logoUrl && config.logoUrl.trim()) {
    try {
      doc.image(config.logoUrl, margem, y, { width: 80, height: 40 });
      y += 50;
    } catch {
      // ignora erro de logo (URL inválida ou formato não suportado)
    }
  }
  y += 5;

  doc.fontSize(14).font("Helvetica-Bold");
  doc.text(`Orçamento Nº ${String(orc.id).padStart(3, "0")}/${new Date(orc.data).getFullYear()}`, margem, y);
  y += 22;

  doc.fontSize(10).font("Helvetica");
  doc.text(`Cliente: ${orc.cliente.nome}`, margem, y);
  y += 14;
  doc.text(orc.endereco, margem, y);
  y += 14;
  if (orc.cliente.afiliacao) {
    doc.text(orc.cliente.afiliacao, margem, y);
    y += 14;
  }
  y += 8;

  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("Descrição do Orçamento:", margem, y);
  y += 16;
  doc.font("Helvetica");
  doc.text(descricao, margem, y, { width: largura - 2 * margem });
  y = (doc as { y: number }).y + 10;
  if (orc.complemento && orc.complemento.trim()) {
    const complementoLimpo = orc.complemento.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (complementoLimpo) {
      doc.text(complementoLimpo, margem, y, { width: largura - 2 * margem });
      y = (doc as { y: number }).y + 10;
    }
  }

  doc.font("Helvetica-Bold");
  doc.text(`Valor da mão de Obra: ${totalMaoObra.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, margem, y);
  y += 14;
  if (orc.incluiMaterial && orc.materiais.length > 0) {
    const totalMat = orc.materiais.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0);
    doc.text(`Valor dos Materiais: ${totalMat.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, margem, y);
    y += 14;
  }
  doc.text(`Valor Total: ${totalGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} (${valorExtenso})`, margem, y);
  y += 20;

  doc.font("Helvetica");
  doc.text(dataFormatada, margem, y);
  y += 25;
  doc.moveTo(margem, y).lineTo(largura - margem, y).stroke();
  y += 18;
  doc.text(config.nomeAssinatura || "_______________________", margem, y);
  y += 25;

  doc.fontSize(8).fillColor("#666666");
  doc.text(
    "Documento válido por 30 dias a partir da data de emissão apenas para os serviços descritos acima. " +
    "Quaisquer modificações ou acréscimo de serviços serão cobrados à parte.",
    margem,
    y,
    { width: largura - 2 * margem }
  );
  y += 30;
  const contatoLinhas = config.cabecalho.split("\n").filter((l) => /contato|tel|email/i.test(l));
  if (contatoLinhas.length > 0) {
    doc.text(contatoLinhas.join(" | "), margem, y);
  }
}
