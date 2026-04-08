"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutHeader } from "@/components/LayoutHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ModalEditarPagamento } from "@/components/ModalEditarPagamento";
import type { OrcamentoFull, PagamentoItem } from "@/lib/types";
import {
  LABELS_STATUS,
  LABELS_FORMA_PAGAMENTO,
  STATUS_COLORS,
} from "@/lib/types";
import { calcularValorTotal, calcularTotalPago, calcularPorcentagemPaga, calcularValorRestante } from "@/lib/orcamento";
import { formatarData, formatarPreco } from "@/lib/format";

export default function OrcamentoVerPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [orcamento, setOrcamento] = useState<OrcamentoFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editandoPagamento, setEditandoPagamento] = useState<PagamentoItem | null>(null);
  const [confirmExcluirPag, setConfirmExcluirPag] = useState<PagamentoItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const carregarOrcamento = async () => {
    const idNum = parseInt(id, 10);
    if (Number.isNaN(idNum)) return;
    try {
      const resposta = await fetch(`/api/orcamentos/${idNum}`);
      if (resposta.ok) {
        const dados = await resposta.json();
        setOrcamento(dados);
      }
    } catch {
      setError("Erro ao recarregar");
    }
  };

  useEffect(() => {
    const idNum = parseInt(id, 10);
    if (Number.isNaN(idNum)) {
      setError("Orçamento inválido");
      setLoading(false);
      return;
    }

    const carregar = async () => {
      try {
        const resposta = await fetch(`/api/orcamentos/${idNum}`);
        if (!resposta.ok) {
          if (resposta.status === 404) {
            setError("Orçamento não encontrado");
            return;
          }
          throw new Error("Falha ao carregar orçamento");
        }
        const dados = await resposta.json();
        setOrcamento(dados);
      } catch (erro) {
        setError(erro instanceof Error ? erro.message : "Erro ao carregar");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-[var(--muted)]">Carregando orçamento…</p>
      </div>
    );
  }

  if (error || !orcamento) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-[var(--danger)]">{error || "Orçamento não encontrado"}</p>
        <Link href="/orcamentos" className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] hover:opacity-90">
          Voltar para lista
        </Link>
      </div>
    );
  }

  const valorTotal = calcularValorTotal(orcamento.materiais, orcamento.servicos, orcamento.incluiMaterial);
  const totalPago = calcularTotalPago(orcamento.pagamentos ?? []);
  const porcentagem = calcularPorcentagemPaga(valorTotal, totalPago);
  const pagamentos = orcamento.pagamentos ?? [];

  const excluirPagamento = (pag: PagamentoItem) => {
    setActionError(null);
    setConfirmExcluirPag(pag);
  };

  const executarExcluirPagamento = async () => {
    if (!confirmExcluirPag) return;
    const pag = confirmExcluirPag;
    setConfirmExcluirPag(null);
    setActionError(null);
    try {
      const res = await fetch(`/api/pagamentos/${pag.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir");
      await carregarOrcamento();
    } catch (erro) {
      setActionError(erro instanceof Error ? erro.message : "Erro ao excluir");
    }
  };

  const valorMaximoParaEdicao = (pag: PagamentoItem) => {
    const outrosPagamentos = pagamentos.filter((p) => p.id !== pag.id);
    const totalOutros = calcularTotalPago(outrosPagamentos);
    return calcularValorRestante(valorTotal, totalOutros);
  };

  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <LayoutHeader paginaAtiva="orcamentos" breadcrumb={[
        { label: "Orçamentos", href: "/orcamentos" },
        { label: `#${orcamento.id}` },
      ]} />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Link href="/orcamentos" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
            ← Voltar para lista
          </Link>
          <Link href={`/orcamentos/${orcamento.id}`} className="ml-auto rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface-elevated)]">
            Editar
          </Link>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Orçamento nº {orcamento.id}
          </h1>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-[var(--muted)]">Cliente</p>
              <p className="mt-0.5 font-medium">{orcamento.cliente.nome}</p>
              {orcamento.cliente.afiliacao && (
                <p className="text-sm text-[var(--muted)]">{orcamento.cliente.afiliacao}</p>
              )}
              {orcamento.cliente.telefone && (
                <p className="text-sm text-[var(--muted)]">{orcamento.cliente.telefone}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted)]">Endereço</p>
              <p className="mt-0.5">{orcamento.endereco}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted)]">Data</p>
              <p className="mt-0.5">{formatarData(orcamento.data)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted)]">Status</p>
              <span
                className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  STATUS_COLORS[orcamento.status]
                }`}
              >
                {LABELS_STATUS[orcamento.status]}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted)]">Inclui material</p>
              <p className="mt-0.5">{orcamento.incluiMaterial ? "Sim" : "Não"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted)]">Valor total</p>
              <p className="mt-0.5 font-semibold">
                {formatarPreco(valorTotal)}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {porcentagem}% pago (R$ {totalPago.toLocaleString("pt-BR")})
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Serviços</h2>
          {orcamento.servicos.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">Nenhum serviço</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {orcamento.servicos.map((s, idx) => (
                <li key={idx} className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
                  <p className="font-medium">
                    {s.servico?.descricao || (s.descricaoLivre ? s.descricaoLivre.replace(/<[^>]*>/g, " ").trim().slice(0, 100) : "—")}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {s.quantidade} × R$ {s.valorMaoObra.toFixed(2)} = R$ {(s.quantidade * s.valorMaoObra).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {orcamento.incluiMaterial && orcamento.materiais.length > 0 && (
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Materiais</h2>
            <ul className="mt-4 space-y-3">
              {orcamento.materiais.map((m, idx) => (
                <li key={idx} className="flex justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
                  <span>{m.material?.nome_material || m.origemMaterial || "Material"}</span>
                  <span className="text-[var(--muted)]">
                    {m.quantidade} × R$ {m.precoUnitario.toFixed(2)} = R$ {(m.quantidade * m.precoUnitario).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Comprovantes de recebimento</h2>
          {actionError && (
            <p className="mt-3 text-sm text-[var(--danger)]">{actionError}</p>
          )}
          {pagamentos.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">Nenhum comprovante registrado</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-elevated)]">
                    <th className="px-4 py-3 font-medium text-[var(--foreground)]">Valor</th>
                    <th className="px-4 py-3 font-medium text-[var(--foreground)]">Data</th>
                    <th className="px-4 py-3 font-medium text-[var(--foreground)]">Forma</th>
                    <th className="px-4 py-3 font-medium text-[var(--foreground)]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentos.map((pag) => (
                    <tr key={pag.id} className="border-b border-[var(--border)]">
                      <td className="px-4 py-3 font-medium">
                        {formatarPreco(pag.valorRecebido)}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {new Date(pag.data).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {LABELS_FORMA_PAGAMENTO[pag.formaPagamento as keyof typeof LABELS_FORMA_PAGAMENTO] ?? pag.formaPagamento}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`/api/pagamentos/${pag.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mr-3 inline-flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--accent)]"
                          title="PDF"
                        >
                          <span aria-hidden>⎙</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => setEditandoPagamento(pag)}
                          className="mr-3 inline-flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--accent)]"
                          title="Editar"
                        >
                          <span aria-hidden>✎</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => excluirPagamento(pag)}
                          className="inline-flex items-center gap-1.5 text-[var(--danger)] hover:opacity-80"
                          title="Excluir"
                        >
                          <span>🗑</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {confirmExcluirPag && (
          <ConfirmDialog
            open
            title="Excluir comprovante"
            message={`Excluir o recebimento de ${formatarPreco(confirmExcluirPag.valorRecebido)}?`}
            variant="danger"
            confirmLabel="Excluir"
            onConfirm={executarExcluirPagamento}
            onCancel={() => setConfirmExcluirPag(null)}
          />
        )}

        {editandoPagamento && (
          <ModalEditarPagamento
            pagamento={editandoPagamento}
            valorMaximo={valorMaximoParaEdicao(editandoPagamento)}
            onSucesso={carregarOrcamento}
            onFechar={() => setEditandoPagamento(null)}
          />
        )}
      </main>
    </div>
  );
}
