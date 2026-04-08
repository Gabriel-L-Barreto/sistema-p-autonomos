"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrcamentoForm } from "@/components/OrcamentoForm";
import { LayoutHeader } from "@/components/LayoutHeader";
import { IconArrowLeft } from "@/components/Icons";

export default function NovoOrcamentoPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <LayoutHeader paginaAtiva="orcamentos" breadcrumb={[
        { label: "Orçamentos", href: "/orcamentos" },
        { label: "Novo orçamento" },
      ]} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Link
            href="/orcamentos"
            className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--accent)]"
          >
            <IconArrowLeft className="h-4 w-4" /> Voltar para lista
          </Link>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Novo orçamento
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Preencha obrigatoriamente os campos marcados com *.
        </p>

        <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Etapas de criação do orçamento</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm">
              <p className="font-semibold text-[var(--accent)]">1. Dados do orçamento</p>
              <p className="text-xs text-[var(--muted)]">Cliente, endereço, data e status inicial.</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm">
              <p className="font-semibold text-[var(--accent)]">2. Materiais (opcional)</p>
              <p className="text-xs text-[var(--muted)]">Adicione materiais que compõem os serviços.</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm">
              <p className="font-semibold text-[var(--accent)]">3. Serviços</p>
              <p className="text-xs text-[var(--muted)]">Informe quantidade e valor de mão de obra.</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm">
              <p className="font-semibold text-[var(--accent)]">4. Revisar e salvar</p>
              <p className="text-xs text-[var(--muted)]">Confira os itens e clique em criar orçamento.</p>
            </div>
          </div>
        </section>

        <div className="mt-6">
          <OrcamentoForm
            initialData={null}
            onSuccess={() => {
              router.push("/orcamentos");
            }}
            onCancel={() => router.push("/orcamentos")}
          />
        </div>
      </main>
    </div>
  );
}
