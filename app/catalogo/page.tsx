"use client";

import Link from "next/link";
import { LayoutHeader } from "@/components/LayoutHeader";

export default function CatalogoPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <LayoutHeader paginaAtiva="catalogo" />

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
        <section>
          <h1 className="text-3xl font-semibold tracking-tight">
            Catálogo
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Cadastre materiais e serviços para usar ao montar orçamentos.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3 md:items-stretch">
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Materiais</h2>
            <p className="mt-1 flex-1 text-xs text-slate-600">
              Nome, unidade de medida (Unitário, M², M³ ou Metros) e preço unitário. Itens ativos aparecem no orçamento.
            </p>
            <Link
              href="/materiais"
              className="mt-4 block w-full rounded-lg bg-slate-900 px-3 py-2 text-center text-xs font-medium text-white hover:bg-slate-800"
            >
              Ir para materiais
            </Link>
          </div>

          <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Serviços</h2>
            <p className="mt-1 flex-1 text-xs text-slate-600">
              Descrição, tipo de cobrança (Unitário, M², M³ ou Metros) e preço base. Serviços ativos aparecem no orçamento.
            </p>
            <Link
              href="/servicos"
              className="mt-4 block w-full rounded-lg bg-slate-900 px-3 py-2 text-center text-xs font-medium text-white hover:bg-slate-800"
            >
              Ir para serviços
            </Link>
          </div>

          <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">SINAPI (MG)</h2>
            <p className="mt-1 flex-1 text-xs text-slate-600">
              Tabela oficial de custos. Ative ou desative o uso dos preços SINAPI Campos das Vertentes.
            </p>
            <Link
              href="/catalogo/sinapi"
              className="mt-4 block w-full rounded-lg bg-slate-900 px-3 py-2 text-center text-xs font-medium text-white hover:bg-slate-800"
            >
              Configurar SINAPI
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
