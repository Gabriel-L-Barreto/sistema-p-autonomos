"use client";

import Link from "next/link";
import { LayoutHeader } from "@/components/LayoutHeader";

export default function CatalogoPage() {
  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <LayoutHeader paginaAtiva="catalogo" />

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Catálogo
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Faça seu próprio catálogo adicionando serviços e materiais ao clicar nas opções abaixo. Ative ou desative a SINAPI.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3 md:items-stretch">
          <Link
            href="/materiais"
            className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-elevated)]"
          >
            <h2 className="font-semibold">Materiais</h2>
            <div className="mt-2 flex-1" />
            <span className="mt-4 text-sm font-medium text-[var(--accent)]">Abrir materiais →</span>
          </Link>

          <Link
            href="/servicos"
            className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-elevated)]"
          >
            <h2 className="font-semibold">Serviços</h2>
            <div className="mt-2 flex-1" />
            <span className="mt-4 text-sm font-medium text-[var(--accent)]">Abrir serviços →</span>
          </Link>

          <Link
            href="/catalogo/sinapi"
            className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-elevated)]"
          >
            <h2 className="font-semibold">SINAPI (MG)</h2>
            <p className="mt-2 flex-1 text-sm text-[var(--muted)]">
              Tabela oficial de custos. Ative para usar preços da região.
            </p>
            <span className="mt-4 text-sm font-medium text-[var(--accent)]">Configurar →</span>
          </Link>
        </section>
      </main>
    </div>
  );
}
