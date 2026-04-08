"use client";

import { useState } from "react";
import { LABELS_FORMA_PAGAMENTO } from "@/lib/types";

type Props = {
  orcamentoId: number;
  clienteNome: string;
  valorRestante: number;
  onSucesso: () => void;
  onFechar: () => void;
};

export function ModalAbaterParcela({
  orcamentoId,
  clienteNome,
  valorRestante,
  onSucesso,
  onFechar,
}: Props) {
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<"DINHEIRO" | "PIX" | "CARTAO">("PIX");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const valorNum = parseFloat(valor.replace(",", ".")) || 0;
  const valorInvalido = valorNum <= 0 || valorNum > valorRestante;

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (valorInvalido) {
      setErro(
        valorNum <= 0
          ? "Informe um valor positivo"
          : `Valor não pode exceder R$ ${valorRestante.toFixed(2)}`
      );
      return;
    }
    setSalvando(true);
    try {
      const res = await fetch(`/api/orcamentos/${orcamentoId}/pagamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valorRecebido: valorNum,
          formaPagamento,
        }),
      });
      const dados = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(dados.error || "Falha ao registrar");
      onSucesso();
      onFechar();
      window.open(`/api/pagamentos/${dados.id}/pdf`, "_blank");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao registrar pagamento");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Registrar recebimento</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Orçamento #{orcamentoId} — {clienteNome}
        </p>
        <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
          Valor restante:{" "}
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(valorRestante)}
        </p>

        <form onSubmit={salvar} className="mt-4 space-y-4">
          {erro && (
            <div className="rounded-lg border border-[var(--danger)]/50 bg-[var(--danger-soft)] p-2 text-sm text-[var(--danger)]">
              {erro}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
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
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
              Forma de pagamento
            </label>
            <select
              value={formaPagamento}
              onChange={(e) =>
                setFormaPagamento(e.target.value as "DINHEIRO" | "PIX" | "CARTAO")
              }
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
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
              className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] hover:opacity-90 disabled:opacity-50"
            >
              {salvando ? "Registrando…" : "Registrar"}
            </button>
            <button
              type="button"
              onClick={onFechar}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-elevated)]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
