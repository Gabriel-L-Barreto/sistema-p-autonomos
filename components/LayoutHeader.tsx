"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  IconHome,
  IconUsers,
  IconFileText,
  IconCatalog,
  IconSettings,
  IconChevronRight,
} from "./Icons";

type PaginaAtiva = "inicio" | "clientes" | "orcamentos" | "catalogo" | "configuracoes";

type Props = {
  paginaAtiva?: PaginaAtiva;
  className?: string;
  breadcrumb?: { label: string; href?: string }[];
};

const navItems: { id: PaginaAtiva; href: string; label: string; icon: React.ReactNode }[] = [
  { id: "inicio", href: "/", label: "Início", icon: <IconHome className="h-5 w-5" /> },
  { id: "clientes", href: "/clientes", label: "Clientes", icon: <IconUsers className="h-5 w-5" /> },
  { id: "orcamentos", href: "/orcamentos", label: "Orçamentos", icon: <IconFileText className="h-5 w-5" /> },
  { id: "catalogo", href: "/catalogo", label: "Catálogo", icon: <IconCatalog className="h-5 w-5" /> },
  { id: "configuracoes", href: "/configuracoes", label: "Configurações", icon: <IconSettings className="h-5 w-5" /> },
];

export function LayoutHeader({ paginaAtiva = "inicio", className = "", breadcrumb }: Props) {
  const [branding, setBranding] = useState<{ nome: string; logoUrl: string | null }>({
    nome: "Orçamentos",
    logoUrl: null,
  });

  useEffect(() => {
    const carregarBranding = async () => {
      try {
        const res = await fetch("/api/config/empresa");
        if (!res.ok) return;
        const data = await res.json();
        const nome =
          typeof data?.nomeAssinatura === "string" && data.nomeAssinatura.trim()
            ? data.nomeAssinatura.trim()
            : "Orçamentos";
        const logoUrl =
          typeof data?.logoUrl === "string" && data.logoUrl.trim()
            ? data.logoUrl.trim()
            : null;
        setBranding({ nome, logoUrl });
      } catch {
        // Falha silenciosa: mantém fallback
      }
    };
    carregarBranding();
  }, []);

  return (
    <header
      className={
        "border-b border-[var(--border)] bg-[var(--surface)] " + (className || "")
      }
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
          >
            {branding.logoUrl ? (
              <span className="h-9 w-9 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)]">
                <img src={branding.logoUrl} alt="Logo" className="h-full w-full object-cover" />
              </span>
            ) : (
              <span className="rounded-lg bg-[var(--accent-soft)] p-1.5 text-[var(--accent)]">
                <IconFileText className="h-6 w-6" />
              </span>
            )}
            <span className="hidden sm:inline">{branding.nome}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Navegação principal">
            {navItems.map((item) => {
              const isActive = paginaAtiva === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2" />
      </div>

      {breadcrumb && breadcrumb.length > 0 && (
        <div className="border-t border-[var(--border)] bg-[var(--surface-elevated)]/50">
          <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]" aria-label="Navegação do caminho">
              {breadcrumb.map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  {i > 0 && <IconChevronRight className="h-4 w-4 shrink-0" />}
                  {item.href ? (
                    <Link href={item.href} className="hover:text-[var(--foreground)] transition-colors">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-[var(--foreground)]">{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Menu mobile compacto */}
      <div className="md:hidden border-t border-[var(--border)] overflow-x-auto">
        <nav className="flex gap-1 px-2 py-2" aria-label="Navegação mobile">
          {navItems.map((item) => {
            const isActive = paginaAtiva === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  isActive ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--muted)] hover:bg-[var(--surface-elevated)]"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
