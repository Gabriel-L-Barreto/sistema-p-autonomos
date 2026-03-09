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
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <LayoutHeader paginaAtiva="catalogo" />

      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-6">
          <Link
            href="/catalogo"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Voltar ao catálogo
          </Link>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Tabela SINAPI (MG - Campos das Vertentes)
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          O SINAPI é o Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil.
          Com a tabela ativa, insumos e composições (serviços) passam a aparecer na busca ao
          montar orçamentos. Insumos são tratados como materiais; composições como serviços.
        </p>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium text-slate-900">Usar tabela SINAPI</h2>
              <p className="mt-1 text-sm text-slate-600">
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
              className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 ${
                ativo ? "bg-slate-900" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition ${
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
