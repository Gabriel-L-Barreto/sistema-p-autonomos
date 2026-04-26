"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LayoutHeader } from "@/components/LayoutHeader";
import { ModalAbaterParcela } from "@/components/ModalAbaterParcela";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { OrcamentoLista, StatusOrcamento } from "@/lib/types";
import {
  LABELS_STATUS,
  LABELS_FORMA_PAGAMENTO,
  STATUS_COLORS,
} from "@/lib/types";
import {
  calcularValorTotal,
  calcularTotalPago,
  calcularPorcentagemPaga,
  calcularValorRestante,
} from "@/lib/orcamento";
import { formatarData, formatarPreco } from "@/lib/format";
import {
  IconFilter,
  IconPdf,
  IconEye,
  IconPencil,
  IconTrash,
  IconCurrency,
} from "@/components/Icons";

const LIMITE_POR_PAGINA = 25;

type ConfigParcelasModal = {
  orcamentoId: number;
  clienteNome: string;
  open: boolean;
};

type AlertaOrcamentos =
  | "SEM_DEFINICAO_FINAL"
  | "FINALIZADOS_NAO_QUITADOS"
  | "EM_ANDAMENTO"
  | "PENDENTES_RECEBIMENTO"
  | "ACEITOS_SEM_INICIO_5_DIAS"
  | "INICIALIZADOS_SEM_RECEBIMENTO_15_DIAS";

function isStatusOrcamento(value: string): value is StatusOrcamento {
  return ["CADASTRADO", "NAO_ACEITO", "ACEITO", "INICIALIZADO", "FINALIZADO"].includes(value);
}

function isAlertaOrcamentos(value: string): value is AlertaOrcamentos {
  return [
    "SEM_DEFINICAO_FINAL",
    "FINALIZADOS_NAO_QUITADOS",
    "EM_ANDAMENTO",
    "PENDENTES_RECEBIMENTO",
    "ACEITOS_SEM_INICIO_5_DIAS",
    "INICIALIZADOS_SEM_RECEBIMENTO_15_DIAS",
  ].includes(value);
}

function statusInicialPorAlerta(alerta: AlertaOrcamentos): string {
  if (alerta === "SEM_DEFINICAO_FINAL") return "CADASTRADO";
  if (alerta === "EM_ANDAMENTO") return "INICIALIZADO";
  if (alerta === "ACEITOS_SEM_INICIO_5_DIAS") return "ACEITO";
  if (alerta === "INICIALIZADOS_SEM_RECEBIMENTO_15_DIAS") return "INICIALIZADO";
  if (alerta === "FINALIZADOS_NAO_QUITADOS") return "FINALIZADO";
  return "";
}

function OrcamentosListaContent() {
  const searchParams = useSearchParams();
  const [orcamentos, setOrcamentos] = useState<OrcamentoLista[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abaterOrcamento, setAbaterOrcamento] = useState<OrcamentoLista | null>(null);
  const [recebendoParcela, setRecebendoParcela] = useState<number | null>(null);
  const [confirmExcluir, setConfirmExcluir] = useState<{ id: number; numero: number } | null>(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const [busca, setBusca] = useState("");
  const [buscaDebounce, setBuscaDebounce] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [alertaFilter, setAlertaFilter] = useState<AlertaOrcamentos | "">("");
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filtrosInicializados, setFiltrosInicializados] = useState(false);

  const [configParcelasModal, setConfigParcelasModal] = useState<ConfigParcelasModal>({
    orcamentoId: 0,
    clienteNome: "",
    open: false,
  });
  const [qtdParcelas, setQtdParcelas] = useState("3");
  const [formaParcelas, setFormaParcelas] = useState<"DINHEIRO" | "PIX" | "CARTAO">("PIX");
  const [salvandoParcelas, setSalvandoParcelas] = useState(false);
  const [menuRecebimentoOrcamento, setMenuRecebimentoOrcamento] = useState<OrcamentoLista | null>(null);

  const toggleSort = (coluna: string) => {
    if (sortBy === coluna) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(coluna);
      setSortOrder("asc");
    }
    setPagina(1);
  };

  const carregarOrcamentos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagina),
        limit: String(LIMITE_POR_PAGINA),
        sortBy,
        sortOrder,
      });
      if (buscaDebounce) params.set("q", buscaDebounce);
      if (statusFilter) params.set("status", statusFilter);
      if (alertaFilter) params.set("alerta", alertaFilter);
      const resposta = await fetch(`/api/orcamentos?${params}`);
      if (!resposta.ok) throw new Error("Falha ao carregar orçamentos");
      const dados = await resposta.json();
      setOrcamentos(dados.orcamentos ?? []);
      setTotal(dados.total ?? 0);
      setTotalPaginas(dados.totalPages ?? 1);
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const statusUrl = params.get("status") ?? "";
    const alertaUrl = params.get("alerta") ?? "";
    const buscaUrl = params.get("q") ?? "";

    if (isAlertaOrcamentos(alertaUrl)) {
      setAlertaFilter(alertaUrl);
      setStatusFilter(statusInicialPorAlerta(alertaUrl));
    } else {
      setAlertaFilter("");
      setStatusFilter(isStatusOrcamento(statusUrl) ? statusUrl : "");
    }

    setBusca(buscaUrl);
    setBuscaDebounce(buscaUrl);
    setPagina(1);
    setFiltrosInicializados(true);
  }, [searchParams]);

  useEffect(() => {
    if (!filtrosInicializados) return;
    carregarOrcamentos();
  }, [pagina, buscaDebounce, statusFilter, alertaFilter, sortBy, sortOrder, filtrosInicializados]);

  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounce(busca), 400);
    return () => clearTimeout(t);
  }, [busca]);

  const executarExcluirOrcamento = async () => {
    if (!confirmExcluir) return;
    const { id } = confirmExcluir;
    setConfirmExcluir(null);
    try {
      const resposta = await fetch(`/api/orcamentos/${id}`, { method: "DELETE" });
      if (!resposta.ok) throw new Error("Falha ao excluir");
      await carregarOrcamentos();
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao excluir orçamento");
    }
  };

  const configurarParcelasIguais = async () => {
    const qtd = parseInt(qtdParcelas, 10);
    if (Number.isNaN(qtd) || qtd < 1) {
      setError("Informe a quantidade de parcelas (mínimo 1).");
      return;
    }
    if (!window.confirm(`Confirmar configuração de ${qtd} parcelas iguais para este orçamento?`)) return;
    setSalvandoParcelas(true);
    try {
      const res = await fetch(
        `/api/orcamentos/${configParcelasModal.orcamentoId}/pagamentos/parcelas-iguais`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qtdParcelas: qtd, formaPagamento: formaParcelas }),
        }
      );
      const dados = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(dados.error || "Falha ao configurar parcelas");
      setConfigParcelasModal({ orcamentoId: 0, clienteNome: "", open: false });
      await carregarOrcamentos();
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao configurar parcelas");
    } finally {
      setSalvandoParcelas(false);
    }
  };

  const receberParcelaIgual = async (
    orcamentoId: number,
    formaPagamento: "DINHEIRO" | "PIX" | "CARTAO"
  ) => {
    if (!window.confirm("Confirmar registro de recebimento da próxima parcela?")) return;
    setRecebendoParcela(orcamentoId);
    try {
      const res = await fetch(`/api/orcamentos/${orcamentoId}/pagamentos/parcela-igual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formaPagamento }),
      });
      const dados = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(dados.error || "Falha ao receber parcela");
      await carregarOrcamentos();
      window.open(`/api/pagamentos/${dados.id}/pdf`, "_blank", "noopener,noreferrer");
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao receber parcela");
    } finally {
      setRecebendoParcela(null);
    }
  };

  const alterarStatus = async (id: number, novoStatus: StatusOrcamento) => {
    try {
      const resposta = await fetch(`/api/orcamentos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!resposta.ok) throw new Error("Falha ao alterar status");
      await carregarOrcamentos();
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao alterar status");
    }
  };

  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <LayoutHeader paginaAtiva="orcamentos" />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Orçamentos</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">Gerencie orçamentos e recebimentos.</p>
          </div>
          <Link
            href="/orcamentos/novo"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] hover:opacity-90"
          >
            Novo orçamento
          </Link>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-[var(--danger)]/50 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--muted)]">Orçamentos cadastrados</h2>
            <div className="relative flex items-center gap-2">
              {filtroAberto && (
                <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-xl">
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Busca</label>
                      <input
                        type="search"
                        value={busca}
                        onChange={(e) => {
                          setBusca(e.target.value);
                          setPagina(1);
                        }}
                        placeholder="Número, nome ou data"
                        className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setAlertaFilter("");
                          setPagina(1);
                        }}
                        className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"
                      >
                        <option value="">Todos</option>
                        {(Object.keys(LABELS_STATUS) as StatusOrcamento[]).map((s) => (
                          <option key={s} value={s}>
                            {LABELS_STATUS[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => setFiltroAberto((v) => !v)}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border ${
                  filtroAberto
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-elevated)]"
                }`}
                title="Filtros"
              >
                <IconFilter className="h-5 w-5" />
              </button>
              <span className="text-sm text-[var(--muted)]">Filtro</span>
            </div>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-[var(--muted)]">Carregando…</p>
          ) : orcamentos.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[var(--muted)]">
                {buscaDebounce || statusFilter
                  ? "Nenhum orçamento encontrado para os filtros aplicados."
                  : "Nenhum orçamento cadastrado."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-elevated)]">
                    <th className="px-4 py-3">
                      <button type="button" onClick={() => toggleSort("id")} className="font-medium">
                        Nº {sortBy === "id" && (sortOrder === "asc" ? "▲" : "▼")}
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button type="button" onClick={() => toggleSort("cliente")} className="font-medium">
                        Cliente {sortBy === "cliente" && (sortOrder === "asc" ? "▲" : "▼")}
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button type="button" onClick={() => toggleSort("data")} className="font-medium">
                        Data {sortBy === "data" && (sortOrder === "asc" ? "▲" : "▼")}
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Restante</th>
                    <th className="px-4 py-3 font-medium">% pago</th>
                    <th className="px-4 py-3">
                      <button type="button" onClick={() => toggleSort("status")} className="font-medium">
                        Status {sortBy === "status" && (sortOrder === "asc" ? "▲" : "▼")}
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {orcamentos.map((orcamento) => {
                    const valorTotal = calcularValorTotal(
                      orcamento.materiais,
                      orcamento.servicos,
                      orcamento.incluiMaterial
                    );
                    const totalPago = calcularTotalPago(orcamento.pagamentos ?? []);
                    const porcentagem = calcularPorcentagemPaga(valorTotal, totalPago);
                    const valorRestante = calcularValorRestante(valorTotal, totalPago);
                    const parcelasRecebidas = orcamento.pagamentos?.length ?? 0;
                    const totalParcelas = orcamento.totalParcelas ?? 0;
                    const proximaParcela = parcelasRecebidas + 1;
                    const temParcelasIguais = totalParcelas > 0;

                    return (
                      <tr key={orcamento.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-elevated)]/40">
                        <td className="px-4 py-3 font-semibold">#{orcamento.id}</td>
                        <td className="px-4 py-3">{orcamento.cliente.nome}</td>
                        <td className="px-4 py-3 text-[var(--muted)]">{formatarData(orcamento.data)}</td>
                        <td className="px-4 py-3 font-medium">
                          {formatarPreco(valorTotal)}
                        </td>
                        <td className="px-4 py-3 text-[var(--muted)]">
                          {formatarPreco(valorRestante)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 overflow-hidden rounded-full bg-[var(--surface-elevated)]">
                              <div className="h-full bg-[var(--success)]" style={{ width: `${porcentagem}%` }} />
                            </div>
                            <span className="text-xs text-[var(--muted)]">{porcentagem}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={orcamento.status}
                            onChange={(e) => alterarStatus(orcamento.id, e.target.value as StatusOrcamento)}
                            className={`rounded-lg border px-2 py-1 text-xs font-medium ${
                              STATUS_COLORS[orcamento.status as StatusOrcamento]
                            }`}
                          >
                            {(Object.keys(LABELS_STATUS) as StatusOrcamento[]).map((s) => (
                              <option key={s} value={s}>
                                {LABELS_STATUS[s]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {valorRestante > 0 &&
                              !["CADASTRADO", "NAO_ACEITO"].includes(orcamento.status) && (
                              <>
                                {!temParcelasIguais ? (
                                  <button
                                    type="button"
                                    onClick={() => setMenuRecebimentoOrcamento(orcamento)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--success)] hover:bg-[var(--success-soft)]"
                                    title="Recebimento"
                                  >
                                    <IconCurrency className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => receberParcelaIgual(orcamento.id, "PIX")}
                                    disabled={recebendoParcela === orcamento.id}
                                    className="inline-flex h-9 items-center rounded-lg border border-[var(--success)]/50 px-2 text-xs text-[var(--success)] hover:bg-[var(--success-soft)] disabled:opacity-50"
                                    title="Receber próxima parcela"
                                  >
                                    {proximaParcela}/{totalParcelas}
                                  </button>
                                )}
                              </>
                            )}
                            <a
                              href={`/api/orcamentos/${orcamento.id}/pdf`}
                              download={`Orcamento-${orcamento.id}-${orcamento.cliente.nome}.pdf`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                              title="PDF"
                            >
                              <IconPdf />
                            </a>
                            <Link
                              href={`/orcamentos/${orcamento.id}/ver`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                              title="Visualizar"
                            >
                              <IconEye />
                            </Link>
                            <Link
                              href={`/orcamentos/${orcamento.id}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                              title="Editar"
                            >
                              <IconPencil />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setConfirmExcluir({ id: orcamento.id, numero: Number(orcamento.id) })}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                              title="Excluir"
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && orcamentos.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[var(--muted)]">
                Página {pagina} de {totalPaginas} • {total} orçamento(s)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina <= 1}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface-elevated)] disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina >= totalPaginas || totalPaginas <= 1}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface-elevated)] disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </section>

        {confirmExcluir && (
          <ConfirmDialog
            open
            title="Excluir orçamento"
            message={`Excluir o orçamento nº ${confirmExcluir.numero}?`}
            confirmLabel="Excluir"
            variant="danger"
            onConfirm={executarExcluirOrcamento}
            onCancel={() => setConfirmExcluir(null)}
          />
        )}

        {configParcelasModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-soft)] p-4">
            <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
              <h3 className="text-lg font-semibold">Configurar parcelas iguais</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Orçamento #{configParcelasModal.orcamentoId} — {configParcelasModal.clienteNome}
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--muted)]">Quantidade de parcelas</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={qtdParcelas}
                    onChange={(e) => setQtdParcelas(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--muted)]">Forma padrão</label>
                  <select
                    value={formaParcelas}
                    onChange={(e) => setFormaParcelas(e.target.value as "DINHEIRO" | "PIX" | "CARTAO")}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                  >
                    {(Object.keys(LABELS_FORMA_PAGAMENTO) as ("DINHEIRO" | "PIX" | "CARTAO")[]).map((k) => (
                      <option key={k} value={k}>
                        {LABELS_FORMA_PAGAMENTO[k]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfigParcelasModal({ orcamentoId: 0, clienteNome: "", open: false })}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-elevated)]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={configurarParcelasIguais}
                  disabled={salvandoParcelas}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] hover:opacity-90 disabled:opacity-50"
                >
                  {salvandoParcelas ? "Salvando..." : "Salvar parcelas"}
                </button>
              </div>
            </div>
          </div>
        )}

        {menuRecebimentoOrcamento && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-soft)] p-4">
            <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
              <h3 className="text-lg font-semibold">Recebimento</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Orçamento #{menuRecebimentoOrcamento.id} — {menuRecebimentoOrcamento.cliente.nome}
              </p>
              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setConfigParcelasModal({
                      orcamentoId: menuRecebimentoOrcamento.id,
                      clienteNome: menuRecebimentoOrcamento.cliente.nome,
                      open: true,
                    });
                    setMenuRecebimentoOrcamento(null);
                  }}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-left text-sm hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                >
                  <span className="block font-medium">Parcelas iguais</span>
                  <span className="text-xs text-[var(--muted)]">Define o número de parcelas para receber em sequência.</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAbaterOrcamento(menuRecebimentoOrcamento);
                    setMenuRecebimentoOrcamento(null);
                  }}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-left text-sm hover:border-[var(--success)] hover:bg-[var(--success-soft)]"
                >
                  <span className="block font-medium">Abater valor</span>
                  <span className="text-xs text-[var(--muted)]">Registra recebimento de valor livre.</span>
                </button>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setMenuRecebimentoOrcamento(null)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-elevated)]"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {abaterOrcamento && (
          <ModalAbaterParcela
            orcamentoId={abaterOrcamento.id}
            clienteNome={abaterOrcamento.cliente.nome}
            valorRestante={calcularValorRestante(
              calcularValorTotal(
                abaterOrcamento.materiais,
                abaterOrcamento.servicos,
                abaterOrcamento.incluiMaterial
              ),
              calcularTotalPago(abaterOrcamento.pagamentos ?? [])
            )}
            onSucesso={carregarOrcamentos}
            onFechar={() => setAbaterOrcamento(null)}
          />
        )}
      </main>
    </div>
  );
}

export default function OrcamentosListaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen text-[var(--foreground)]" />}>
      <OrcamentosListaContent />
    </Suspense>
  );
}
