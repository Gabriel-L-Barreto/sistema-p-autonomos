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

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Link
            href="/orcamentos"
            className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--accent)]"
          >
            <IconArrowLeft className="h-4 w-4" /> Voltar para lista
          </Link>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">Novo orçamento</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Siga as etapas na ordem. Campos com{" "}
          <span className="text-[var(--danger)]">*</span> são obrigatórios.
        </p>

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
