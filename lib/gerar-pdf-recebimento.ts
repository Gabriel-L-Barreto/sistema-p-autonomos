import type PDFDocument from "pdfkit";
import extenso from "extenso";
import type { ConfigParaPdf } from "./gerar-pdf-orcamento";

export type RecebimentoParaPdf = {
  orcamentoId: number;
  pagamentoId: number;
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
  }[];
};

function unidadeParaTexto(tipo: string | null | undefined): string {
  return tipo === "M2" ? "m²" : "un";
}

function construirDescricaoRecebimento(rec: RecebimentoParaPdf): string {
  const linhas: string[] = [];
  for (const serv of rec.servicos) {
    const desc = serv.descricaoLivre || serv.servico?.descricao || "Serviço";
    const qtd = serv.quantidade;
    const un = unidadeParaTexto(serv.servico?.tipo_cobranca);
    const valorTotal = qtd * serv.valorMaoObra;
    linhas.push(`${qtd} ${un} ${desc} ${valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`);
  }
  if (rec.incluiMaterial) {
    for (const mat of rec.materiais) {
      const desc = mat.material?.nome_material || mat.origemMaterial || "Material";
      const qtd = mat.quantidade;
      const un = unidadeParaTexto(mat.medidaMaterial);
      const valorTotal = qtd * mat.precoUnitario;
      linhas.push(`${qtd} ${un} ${desc} ${valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`);
    }
  }
  return linhas.join("\n");
}

function valorPorExtenso(valor: number): string {
  try {
    const valorStr = valor.toFixed(2).replace(".", ",");
    return extenso(valorStr, { mode: "currency" });
  } catch {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
}

/**
 * Gera PDF de comprovante de recebimento (diferente do orçamento).
 * Layout focado em: valor, parcela, forma de pagamento, data.
 */
export function gerarPdfRecebimento(
  doc: PDFDocument,
  rec: RecebimentoParaPdf,
  config: ConfigParaPdf
): void {
  const valorExtenso = valorPorExtenso(rec.valorRecebido);
  const dataObj = new Date(rec.data);
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];
  const dataFormatada = `${config.cidadeEmissao || "Barroso"}, ${dataObj.getDate()} de ${meses[dataObj.getMonth()]} de ${dataObj.getFullYear()}`;

  const margem = 50;
  const largura = 595;
  let y = 50;

  const cabecalhoLinhas = config.cabecalho.split("\n");
  doc.fontSize(9).font("Helvetica");
  for (const linha of cabecalhoLinhas) {
    doc.text(linha, margem, y, { width: largura - 2 * margem });
    y += 14;
  }
  y += 20;

  doc.fontSize(18).font("Helvetica-Bold");
  doc.fillColor("#166534");
  doc.text("COMPROVANTE DE RECEBIMENTO", margem, y);
  doc.fillColor("#000000");
  y += 30;

  doc.fontSize(10).font("Helvetica");
  doc.text(`Referente ao Orçamento Nº ${String(rec.orcamentoId).padStart(3, "0")}/${dataObj.getFullYear()}`, margem, y);
  y += 18;

  if (rec.parcela) {
    doc.font("Helvetica-Bold");
    doc.text(`Parcela ${rec.parcela.numero}/${rec.parcela.total}`, margem, y);
    doc.font("Helvetica");
    y += 18;
  }

  doc.fontSize(14).font("Helvetica-Bold");
  doc.text(`Valor recebido: ${rec.valorRecebido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, margem, y);
  y += 22;

  doc.fontSize(10).font("Helvetica");
  doc.text(`(${valorExtenso})`, margem, y);
  y += 18;

  doc.text(`Cliente: ${rec.cliente.nome}`, margem, y);
  y += 14;
  doc.text(`Forma de pagamento: ${rec.formaPagamento}`, margem, y);
  y += 14;
  doc.text(`Data: ${dataFormatada}`, margem, y);
  y += 20;

  const descricao = construirDescricaoRecebimento(rec);
  if (descricao) {
    doc.font("Helvetica-Bold");
    doc.text("Descrição do Orçamento:", margem, y);
    y += 16;
    doc.font("Helvetica");
    doc.fontSize(9);
    doc.text(descricao, margem, y, { width: largura - 2 * margem });
    y = (doc as { y: number }).y + 14;
    doc.fontSize(10);
  }

  y += 10;

  doc.moveTo(margem, y).lineTo(largura - margem, y).stroke();
  y += 18;
  doc.text(config.nomeAssinatura || "_______________________", margem, y);
  y += 30;

  doc.fontSize(8).fillColor("#666666");
  doc.text(
    "Este comprovante atesta o recebimento do valor acima referente ao orçamento citado.",
    margem,
    y,
    { width: largura - 2 * margem }
  );
}
