"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { OrcamentoForm } from "@/components/OrcamentoForm";
import { LayoutHeader } from "@/components/LayoutHeader";
import { IconArrowLeft } from "@/components/Icons";
import type { OrcamentoFull } from "@/lib/types";

export default function OrcamentoDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [orcamento, setOrcamento] = useState<OrcamentoFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError(
          erro instanceof Error ? erro.message : "Erro ao carregar"
        );
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-[var(--muted)]">Carregando orçamento…</p>
      </div>
    );
  }

  if (error || !orcamento) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-[var(--danger)]">{error || "Orçamento não encontrado"}</p>
        <Link href="/orcamentos" className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] hover:opacity-90">
          Voltar para lista
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <LayoutHeader paginaAtiva="orcamentos" breadcrumb={[
        { label: "Orçamentos", href: "/orcamentos" },
        { label: `#${orcamento.id}`, href: `/orcamentos/${orcamento.id}/ver` },
        { label: "Editar" },
      ]} />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Link href="/orcamentos" className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--accent)]">
            <IconArrowLeft className="h-4 w-4" /> Voltar para lista
          </Link>
          <Link href={`/orcamentos/${orcamento.id}/ver`} className="text-sm text-[var(--accent)] underline hover:no-underline">
            Visualizar
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            Orçamento nº {orcamento.id}
          </h1>
        </div>

        <div className="mt-6">
          <OrcamentoForm
            initialData={orcamento}
            onSuccess={() => router.push("/orcamentos")}
            onCancel={() => router.push("/orcamentos")}
          />
        </div>
      </main>
    </div>
  );
}
