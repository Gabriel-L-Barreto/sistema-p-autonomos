export type Cliente = {
  id: number;
  nome: string;
  afiliacao: string | null;
  telefone: string | null;
};

export type TipoMedida = "UNITARIO" | "M2" | "M3" | "METROS";

export type Material = {
  id: number;
  nome_material: string;
  unidadeMedida: TipoMedida;
  precoUnitario: number;
};

export type Servico = {
  id: number;
  descricao: string;
  tipo_cobranca: TipoMedida;
  precoBase: number;
};

export type MaterialOrcamento = {
  id?: number;
  materialId: number | null;
  material: Material | null;
  medidaMaterial: TipoMedida | null;
  origemMaterial: string | null;
  quantidade: number;
  precoUnitario: number;
};

export type ServicoOrcamento = {
  id?: number;
  servicoId: number | null;
  servico: Servico | null;
  descricaoLivre: string | null;
  quantidade: number;
  valorMaoObra: number;
};

export type StatusOrcamento =
  | "CADASTRADO"
  | "NAO_ACEITO"
  | "ACEITO"
  | "INICIALIZADO"
  | "FINALIZADO";

export type OrcamentoFull = {
  id: number;
  clienteId: number;
  cliente: Cliente;
  endereco: string;
  data: string;
  tempoEstimado: number | null;
  incluiMaterial: boolean;
  totalParcelas: number | null;
  status: StatusOrcamento;
  complemento: string | null;
  materiais: (MaterialOrcamento & { id: number })[];
  servicos: (ServicoOrcamento & { id: number })[];
  pagamentos?: PagamentoItem[];
};

export const LABELS_MEDIDA: Record<TipoMedida, string> = {
  UNITARIO: "Unitário",
  M2: "m²",
  M3: "m³",
  METROS: "Metros",
};

export type PagamentoItem = {
  id: number;
  valorRecebido: number;
  formaPagamento: "DINHEIRO" | "PIX" | "CARTAO";
  data: string;
};

export type OrcamentoLista = {
  id: number;
  clienteId: number;
  cliente: Cliente;
  endereco: string;
  data: string;
  tempoEstimado: number | null;
  incluiMaterial: boolean;
  totalParcelas: number | null;
  status: string;
  materiais: { id: number; quantidade: number; precoUnitario: number }[];
  servicos: { id: number; quantidade: number; valorMaoObra: number }[];
  pagamentos?: PagamentoItem[];
};

export const LABELS_FORMA_PAGAMENTO: Record<"DINHEIRO" | "PIX" | "CARTAO", string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO: "Cartão",
};

export const LABELS_STATUS: Record<StatusOrcamento, string> = {
  CADASTRADO: "Cadastrado",
  NAO_ACEITO: "Não Aceito",
  ACEITO: "Aceito",
  INICIALIZADO: "Inicializado",
  FINALIZADO: "Finalizado",
};

export const STATUS_COLORS: Record<StatusOrcamento, string> = {
  CADASTRADO: "bg-slate-200 text-slate-800",
  NAO_ACEITO: "bg-red-100 text-red-800",
  ACEITO: "bg-green-100 text-green-800",
  INICIALIZADO: "bg-amber-100 text-amber-800",
  FINALIZADO: "bg-emerald-200 text-emerald-900",
};
