"use client";

import { useState } from "react";
import { LABELS_FORMA_PAGAMENTO } from "@/lib/types";

type PagamentoItem = {
  id: number;
  valorRecebido: number;
  formaPagamento: "DINHEIRO" | "PIX" | "CARTAO";
  data: string;
};

type Props = {
  pagamento: PagamentoItem;
  valorMaximo: number;
  onSucesso: () => void;
  onFechar: () => void;
};

export function ModalEditarPagamento({
  pagamento,
  valorMaximo,
  onSucesso,
  onFechar,
}: Props) {
  const [valor, setValor] = useState(String(pagamento.valorRecebido));
  const [formaPagamento, setFormaPagamento] = useState<"DINHEIRO" | "PIX" | "CARTAO">(
    pagamento.formaPagamento
  );
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const valorNum = parseFloat(valor.replace(",", ".")) || 0;
  const valorInvalido = valorNum <= 0 || valorNum > valorMaximo;

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (valorInvalido) {
      setErro(
        valorNum <= 0
          ? "Informe um valor positivo"
          : `Valor não pode exceder R$ ${valorMaximo.toFixed(2)}`
      );
      return;
    }
    setSalvando(true);
    try {
      const res = await fetch(`/api/pagamentos/${pagamento.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valorRecebido: valorNum,
          formaPagamento,
        }),
      });
      const dados = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(dados.error || "Falha ao atualizar");
      onSucesso();
      onFechar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao atualizar pagamento");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-slate-900">Editar recebimento</h3>
        <p className="mt-1 text-sm text-slate-600">
          Pagamento #{pagamento.id}
        </p>
        <p className="mt-2 text-sm font-medium text-slate-700">
          Valor máximo permitido:{" "}
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(valorMaximo)}
        </p>

        <form onSubmit={salvar} className="mt-4 space-y-4">
          {erro && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              {erro}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Valor (R$)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={valor}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9,.]/g, "").replace(",", ".");
                setValor(v);
              }}
              placeholder="0,00"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Forma de pagamento
            </label>
            <select
              value={formaPagamento}
              onChange={(e) =>
                setFormaPagamento(e.target.value as "DINHEIRO" | "PIX" | "CARTAO")
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              {(Object.keys(LABELS_FORMA_PAGAMENTO) as ("DINHEIRO" | "PIX" | "CARTAO")[]).map(
                (k) => (
                  <option key={k} value={k}>
                    {LABELS_FORMA_PAGAMENTO[k]}
                  </option>
                )
              )}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={salvando || valorInvalido}
              className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {salvando ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={onFechar}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
