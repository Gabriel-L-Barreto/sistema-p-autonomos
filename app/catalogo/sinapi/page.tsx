"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutHeader } from "@/components/LayoutHeader";

const CHAVE_SINAPI = "sinapi_mg_campos_vertentes_ativo";

export default function SinapiPage() {
  const [ativo, setAtivo] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const salvo = localStorage.getItem(CHAVE_SINAPI);
      setAtivo(salvo === "true");
    }
  }, []);

  const alternar = () => {
    const novo = !ativo;
    setAtivo(novo);
    if (typeof window !== "undefined") {
      localStorage.setItem(CHAVE_SINAPI, String(novo));
    }
  };

  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <LayoutHeader paginaAtiva="catalogo" />

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <Link
            href="/catalogo"
            className="text-sm text-[var(--muted)] hover:text-[var(--accent)]"
          >
            ← Voltar ao catálogo
          </Link>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">Tabela SINAPI/MG</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Útil para consultar e usar preços de referência oficiais em materiais e serviços na montagem dos orçamentos.
        </p>

        <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">Usar tabela SINAPI</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {ativo
                  ? "Tabela ativa. Insumos e serviços SINAPI aparecem na busca ao criar/editar orçamentos."
                  : "Desativado. Utilize apenas seus preços cadastrados no catálogo."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={ativo}
              onClick={alternar}
              className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 ${
                ativo ? "bg-[var(--accent)]" : "bg-[var(--border)]"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-[var(--surface)] shadow ring-0 transition ${
                  ativo ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
