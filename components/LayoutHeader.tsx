"use client";

import Link from "next/link";

type PaginaAtiva = "inicio" | "clientes" | "orcamentos" | "catalogo" | "configuracoes";

type Props = {
  paginaAtiva?: PaginaAtiva;
  className?: string;
};

const LINK_BASE = "rounded-full px-3 py-1 text-sm font-medium transition-colors hover:bg-slate-100";
const LINK_ATIVO = "bg-slate-200 text-slate-900";

export function LayoutHeader({ paginaAtiva = "inicio", className = "" }: Props) {
  return (
    <header
      className={
        "border-b border-slate-200 bg-white " + (className || "")
      }
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-slate-900 hover:text-slate-600"
        >
          Sistema de Orçamentos
        </Link>
        <nav className="flex gap-4 text-slate-600">
          <Link href="/" className={`${LINK_BASE} ${paginaAtiva === "inicio" ? LINK_ATIVO : ""}`}>
            Início
          </Link>
          <Link href="/clientes" className={`${LINK_BASE} ${paginaAtiva === "clientes" ? LINK_ATIVO : ""}`}>
            Clientes
          </Link>
          <Link href="/orcamentos" className={`${LINK_BASE} ${paginaAtiva === "orcamentos" ? LINK_ATIVO : ""}`}>
            Orçamentos
          </Link>
          <Link href="/catalogo" className={`${LINK_BASE} ${paginaAtiva === "catalogo" ? LINK_ATIVO : ""}`}>
            Catálogo
          </Link>
          <Link href="/configuracoes" className={`${LINK_BASE} ${paginaAtiva === "configuracoes" ? LINK_ATIVO : ""}`}>
            Configurações
          </Link>
        </nav>
      </div>
    </header>
  );
}
