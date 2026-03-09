import Link from "next/link";
import { LayoutHeader } from "@/components/LayoutHeader";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <LayoutHeader paginaAtiva="inicio" />

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
        <section>
          <h1 className="text-3xl font-semibold tracking-tight">
            Bem-vindo ao sistema de orçamentos
          </h1>
        </section>

        <section className="grid gap-4 md:grid-cols-3 md:items-stretch">
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Clientes</h2>
            <p className="mt-1 flex-1 text-xs text-slate-600">
              Cadastre e mantenha os dados dos seus clientes organizados.
            </p>
            <Link
              href="/clientes"
              className="mt-4 block w-full rounded-lg bg-slate-900 px-3 py-2 text-center text-xs font-medium text-white hover:bg-slate-800"
            >
              Ir para clientes
            </Link>
          </div>

          <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Orçamentos</h2>
            <p className="mt-1 flex-1 text-xs text-slate-600">
              Crie novos orçamentos e acompanhe o status de cada um.
            </p>
            <Link
              href="/orcamentos"
              className="mt-4 block w-full rounded-lg bg-slate-900 px-3 py-2 text-center text-xs font-medium text-white hover:bg-slate-800"
            >
              Ir para orçamentos
            </Link>
          </div>

          <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Catálogo</h2>
            <p className="mt-1 flex-1 text-xs text-slate-600">
              Cadastre materiais e serviços para usar ao montar orçamentos.
            </p>
            <Link
              href="/catalogo"
              className="mt-4 block w-full rounded-lg bg-slate-900 px-3 py-2 text-center text-xs font-medium text-white hover:bg-slate-800"
            >
              Ir para catálogo
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
