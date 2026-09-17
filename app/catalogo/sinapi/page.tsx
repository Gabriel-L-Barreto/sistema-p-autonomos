"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutHeader } from "@/components/LayoutHeader";
import { cardBase, hintBase } from "@/lib/page-ui";

const CHAVE_SINAPI = "sinapi_mg_campos_vertentes_ativo";

export default function SinapiPage() {
  const [ativo, setAtivo] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(CHAVE_SINAPI) === "true";
  });

  const alternar = () => {
    const novo = !ativo;
    setAtivo(novo);
    localStorage.setItem(CHAVE_SINAPI, String(novo));
  };

  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <LayoutHeader
        paginaAtiva="catalogo"
        breadcrumb={[
          { label: "Catálogo", href: "/catalogo" },
          { label: "SINAPI" },
        ]}
      />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/catalogo" className="text-sm font-medium text-[var(--accent)] hover:underline">
          ← Voltar ao catálogo
        </Link>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Tabela SINAPI (MG)</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Preços oficiais de referência do IBGE/Caixa. Quando ativa, aparecem na busca ao montar orçamentos.
        </p>

        <section className={`mt-8 ${cardBase}`}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Usar SINAPI nos orçamentos</h2>
              <p className={`mt-2 ${hintBase}`}>
                {ativo
                  ? "Ativa — ao buscar material ou serviço no orçamento, itens da SINAPI também aparecem."
                  : "Desativada — só aparecem os itens do seu catálogo pessoal."}
              </p>
              <p
                className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                  ativo
                    ? "bg-[var(--success-soft)] text-[var(--success)]"
                    : "bg-[var(--surface-elevated)] text-[var(--muted)]"
                }`}
              >
                {ativo ? "Ligado" : "Desligado"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={ativo}
              aria-label={ativo ? "Desativar SINAPI" : "Ativar SINAPI"}
              onClick={alternar}
              className={`relative inline-flex h-10 w-[4.5rem] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] ${
                ativo ? "bg-[var(--accent)]" : "bg-[var(--border)]"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-8 w-8 transform rounded-full bg-white shadow transition ${
                  ativo ? "translate-x-8" : "translate-x-0.5"
                } mt-0.5`}
              />
            </button>
          </div>
        </section>

        <section className={`mt-4 ${cardBase}`}>
          <h2 className="text-sm font-semibold">O que muda na prática?</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-[var(--accent)]">•</span>
              <span>Com SINAPI ligada, a busca de materiais e serviços no orçamento inclui itens da tabela oficial.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--accent)]">•</span>
              <span>Os preços são referência — você pode ajustar antes de salvar o orçamento.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--accent)]">•</span>
              <span>Seu catálogo pessoal continua funcionando normalmente.</span>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
