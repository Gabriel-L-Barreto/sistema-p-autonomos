"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrcamentoForm } from "@/components/OrcamentoForm";
import { LayoutHeader } from "@/components/LayoutHeader";

export default function NovoOrcamentoPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <LayoutHeader paginaAtiva="orcamentos" />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <Link
            href="/orcamentos"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Voltar para lista
          </Link>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Novo orçamento
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Preencha os dados. O número do orçamento será gerado após salvar.
        </p>

        <div className="mt-6">
          <OrcamentoForm
            initialData={null}
            onSuccess={(orcamentoId, opts) => {
              if (!opts?.abrirPdfRecebimento) {
                window.open(`/api/orcamentos/${orcamentoId}/pdf`, "_blank");
              }
              router.push("/orcamentos");
            }}
            onCancel={() => router.push("/orcamentos")}
          />
        </div>
      </main>
    </div>
  );
}
