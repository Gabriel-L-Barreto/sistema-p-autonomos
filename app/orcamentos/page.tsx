"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutHeader } from "@/components/LayoutHeader";
import { ModalAbaterParcela } from "@/components/ModalAbaterParcela";
import type { OrcamentoLista, StatusOrcamento } from "@/lib/types";
import { LABELS_STATUS, STATUS_COLORS } from "@/lib/types";
import {
  calcularValorTotal,
  calcularTotalPago,
  calcularPorcentagemPaga,
  calcularValorRestante,
} from "@/lib/orcamento";

const LIMITE_POR_PAGINA = 25;

export default function OrcamentosListaPage() {
  const [orcamentos, setOrcamentos] = useState<OrcamentoLista[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abaterOrcamento, setAbaterOrcamento] = useState<OrcamentoLista | null>(null);
  const [recebendoParcela, setRecebendoParcela] = useState<number | null>(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const [busca, setBusca] = useState("");
  const [buscaDebounce, setBuscaDebounce] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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
    carregarOrcamentos();
  }, [pagina, buscaDebounce, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounce(busca), 400);
    return () => clearTimeout(t);
  }, [busca]);

  const excluirOrcamento = async (id: number, numero: number) => {
    if (!confirm(`Excluir o orçamento nº ${numero}?`)) return;
    try {
      const resposta = await fetch(`/api/orcamentos/${id}`, { method: "DELETE" });
      if (!resposta.ok) throw new Error("Falha ao excluir");
      await carregarOrcamentos();
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao excluir orçamento");
    }
  };

  const receberParcelaIgual = async (
    orcamentoId: number,
    formaPagamento: "DINHEIRO" | "PIX" | "CARTAO"
  ) => {
    setRecebendoParcela(orcamentoId);
    try {
      const res = await fetch(
        `/api/orcamentos/${orcamentoId}/pagamentos/parcela-igual`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formaPagamento }),
        }
      );
      const dados = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(dados.error || "Falha ao receber parcela");
      await carregarOrcamentos();
      window.open(`/api/pagamentos/${dados.id}/pdf`, "_blank");
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
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <LayoutHeader paginaAtiva="orcamentos" />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Orçamentos</h1>
          </div>
          <Link
            href="/orcamentos/novo"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Novo orçamento
          </Link>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-sm font-semibold">Lista de orçamentos</h2>
              <input
                type="search"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPagina(1);
                }}
                placeholder="Buscar por nº, cliente ou endereço..."
                className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagina(1);
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="">Todos os status</option>
                {(Object.keys(LABELS_STATUS) as StatusOrcamento[]).map((s) => (
                  <option key={s} value={s}>
                    {LABELS_STATUS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Carregando…</p>
          ) : orcamentos.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">
                {buscaDebounce || statusFilter
                  ? "Nenhum orçamento encontrado para os filtros aplicados."
                  : "Nenhum orçamento cadastrado."}
              </p>
              <Link
                href="/orcamentos/novo"
                className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Cadastrar orçamento
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("id")}
                        className="flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900"
                      >
                        Nº {sortBy === "id" && (sortOrder === "asc" ? "▲" : "▼")}
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("cliente")}
                        className="flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900"
                      >
                        Cliente {sortBy === "cliente" && (sortOrder === "asc" ? "▲" : "▼")}
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("data")}
                        className="flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900"
                      >
                        Data {sortBy === "data" && (sortOrder === "asc" ? "▲" : "▼")}
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-700">Valor total</th>
                    <th className="px-4 py-3 font-medium text-slate-700">% Pago</th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("status")}
                        className="flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900"
                      >
                        Status {sortBy === "status" && (sortOrder === "asc" ? "▲" : "▼")}
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-700">Ações</th>
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
                    const totalParcelasConfig = orcamento.totalParcelas;
                    const qtdParcelasBase =
                      totalParcelasConfig != null && totalParcelasConfig >= 1
                        ? Math.round(totalParcelasConfig)
                        : 0;
                    const parcelasRecebidas = orcamento.pagamentos?.length ?? 0;
                    const proximaParcela = parcelasRecebidas + 1;
                    const qtdParcelas = Math.max(qtdParcelasBase, proximaParcela, 1);
                    const isParcelasIguais = qtdParcelasBase > 0;
                    return (
                    <tr key={orcamento.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900">#{orcamento.id}</span>
                      </td>
                      <td className="px-4 py-3">{orcamento.cliente.nome}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(orcamento.data).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(valorTotal)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full bg-emerald-500 transition-all"
                              style={{ width: `${porcentagem}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600">{porcentagem}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={orcamento.status}
                          onChange={(e) =>
                            alterarStatus(orcamento.id, e.target.value as StatusOrcamento)
                          }
                          className={`rounded-full border-0 px-2 py-1 text-xs font-medium focus:ring-2 focus:ring-slate-400 ${
                            STATUS_COLORS[orcamento.status as StatusOrcamento] ?? "bg-slate-200 text-slate-800"
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
                        {valorRestante > 0 && (
                          isParcelasIguais ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Confirmar recebimento da parcela ${proximaParcela}/${qtdParcelas}?\n\nEsta ação não pode ser desfeita.`)) {
                                  receberParcelaIgual(orcamento.id, "PIX");
                                }
                              }}
                              disabled={recebendoParcela === orcamento.id}
                              className="mr-3 text-emerald-600 underline hover:text-emerald-800 disabled:opacity-50"
                            >
                              Receber parcela {proximaParcela}/{qtdParcelas}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAbaterOrcamento(orcamento)}
                              className="mr-3 text-emerald-600 underline hover:text-emerald-800"
                            >
                              Abater parcela
                            </button>
                          )
                        )}
                        <a
                          href={`/api/orcamentos/${orcamento.id}/pdf`}
                          download={`Orcamento-${orcamento.id}-${orcamento.cliente.nome}.pdf`}
                          className="mr-3 text-slate-600 underline hover:text-slate-900"
                        >
                          PDF Orçamento
                        </a>
                        <Link
                          href={`/orcamentos/${orcamento.id}/ver`}
                          className="mr-3 text-slate-600 underline hover:text-slate-900"
                        >
                          Visualizar
                        </Link>
                        <Link
                          href={`/orcamentos/${orcamento.id}`}
                          className="mr-3 text-slate-600 underline hover:text-slate-900"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => excluirOrcamento(orcamento.id, orcamento.id)}
                          className="text-red-600 underline hover:text-red-800"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && orcamentos.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-600">
                Página {pagina} de {totalPaginas} • {total} orçamento(s) no total
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina <= 1}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina >= totalPaginas || totalPaginas <= 1}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </section>

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
