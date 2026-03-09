"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutHeader } from "@/components/LayoutHeader";
import { ModalEditarPagamento } from "@/components/ModalEditarPagamento";
import type { OrcamentoFull, PagamentoItem } from "@/lib/types";
import { LABELS_STATUS, LABELS_FORMA_PAGAMENTO } from "@/lib/types";
import { calcularValorTotal, calcularTotalPago, calcularPorcentagemPaga, calcularValorRestante } from "@/lib/orcamento";

export default function OrcamentoVerPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [orcamento, setOrcamento] = useState<OrcamentoFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editandoPagamento, setEditandoPagamento] = useState<PagamentoItem | null>(null);

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
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Carregando orçamento…</p>
      </div>
    );
  }

  if (error || !orcamento) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100">
        <p className="text-sm text-red-600">{error || "Orçamento não encontrado"}</p>
        <Link
          href="/orcamentos"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Voltar para lista
        </Link>
      </div>
    );
  }

  const valorTotal = calcularValorTotal(orcamento.materiais, orcamento.servicos, orcamento.incluiMaterial);
  const totalPago = calcularTotalPago(orcamento.pagamentos ?? []);
  const porcentagem = calcularPorcentagemPaga(valorTotal, totalPago);
  const pagamentos = orcamento.pagamentos ?? [];

  const excluirPagamento = async (pag: PagamentoItem) => {
    if (!confirm(`Excluir o recebimento de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pag.valorRecebido)}?`)) return;
    try {
      const res = await fetch(`/api/pagamentos/${pag.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir");
      await carregarOrcamento();
    } catch (erro) {
      alert(erro instanceof Error ? erro.message : "Erro ao excluir");
    }
  };

  const valorMaximoParaEdicao = (pag: PagamentoItem) => {
    const outrosPagamentos = pagamentos.filter((p) => p.id !== pag.id);
    const totalOutros = calcularTotalPago(outrosPagamentos);
    return calcularValorRestante(valorTotal, totalOutros);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <LayoutHeader paginaAtiva="orcamentos" />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Link href="/orcamentos" className="text-sm text-slate-600 hover:text-slate-900">
            ← Voltar para lista
          </Link>
          <Link
            href={`/orcamentos/${orcamento.id}`}
            className="ml-auto rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Editar
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">
            Orçamento nº {orcamento.id}
          </h1>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Cliente</p>
              <p className="mt-0.5 font-medium">{orcamento.cliente.nome}</p>
              {orcamento.cliente.afiliacao && (
                <p className="text-sm text-slate-600">{orcamento.cliente.afiliacao}</p>
              )}
              {orcamento.cliente.telefone && (
                <p className="text-sm text-slate-600">{orcamento.cliente.telefone}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Endereço</p>
              <p className="mt-0.5">{orcamento.endereco}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Data</p>
              <p className="mt-0.5">
                {new Date(orcamento.data).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Status</p>
              <p className="mt-0.5">{LABELS_STATUS[orcamento.status]}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Inclui material</p>
              <p className="mt-0.5">{orcamento.incluiMaterial ? "Sim" : "Não"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Valor total</p>
              <p className="mt-0.5 font-semibold">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valorTotal)}
              </p>
              <p className="text-xs text-slate-600">
                {porcentagem}% pago (R$ {totalPago.toLocaleString("pt-BR")})
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Serviços</h2>
          {orcamento.servicos.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Nenhum serviço</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {orcamento.servicos.map((s, idx) => (
                <li key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="font-medium">
                    {s.servico?.descricao || (s.descricaoLivre ? s.descricaoLivre.replace(/<[^>]*>/g, " ").trim().slice(0, 100) : "—")}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {s.quantidade} × R$ {s.valorMaoObra.toFixed(2)} = R$ {(s.quantidade * s.valorMaoObra).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {orcamento.incluiMaterial && orcamento.materiais.length > 0 && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Materiais</h2>
            <ul className="mt-4 space-y-3">
              {orcamento.materiais.map((m, idx) => (
                <li key={idx} className="flex justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span>{m.material?.nome_material || m.origemMaterial || "Material"}</span>
                  <span className="text-slate-600">
                    {m.quantidade} × R$ {m.precoUnitario.toFixed(2)} = R$ {(m.quantidade * m.precoUnitario).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Comprovantes de recebimento</h2>
          {pagamentos.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Nenhum comprovante registrado</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 font-medium text-slate-700">Valor</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Data</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Forma</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentos.map((pag) => (
                    <tr key={pag.id} className="border-b border-slate-100">
                      <td className="px-4 py-3 font-medium">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pag.valorRecebido)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(pag.data).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {LABELS_FORMA_PAGAMENTO[pag.formaPagamento as keyof typeof LABELS_FORMA_PAGAMENTO] ?? pag.formaPagamento}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`/api/pagamentos/${pag.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mr-3 text-slate-600 underline hover:text-slate-900"
                        >
                          PDF
                        </a>
                        <button
                          type="button"
                          onClick={() => setEditandoPagamento(pag)}
                          className="mr-3 text-slate-600 underline hover:text-slate-900"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => excluirPagamento(pag)}
                          className="text-red-600 underline hover:text-red-800"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {editandoPagamento && (
          <ModalEditarPagamento
            pagamento={editandoPagamento}
            valorMaximo={valorMaximoParaEdicao(editandoPagamento)}
            onSucesso={carregarOrcamento}
            onFechar={() => setEditandoPagamento(null)}
          />
        )}

        <div className="mt-6 flex gap-2">
          <a
            href={`/api/orcamentos/${orcamento.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            PDF Orçamento
          </a>
        </div>
      </main>
    </div>
  );
}
