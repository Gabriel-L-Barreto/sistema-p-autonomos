"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutHeader } from "@/components/LayoutHeader";
import { IconCatalog, IconChevronRight } from "@/components/Icons";
import { cardBase, hintBase } from "@/lib/page-ui";

const CHAVE_SINAPI = "sinapi_mg_campos_vertentes_ativo";

export default function CatalogoPage() {
  const [totais, setTotais] = useState({ materiais: 0, servicos: 0, carregando: true });
  const [sinapiAtivo] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(CHAVE_SINAPI) === "true";
  });

  useEffect(() => {
    Promise.all([fetch("/api/materiais"), fetch("/api/servicos")])
      .then(async ([mRes, sRes]) => {
        const materiais = mRes.ok ? await mRes.json() : [];
        const servicos = sRes.ok ? await sRes.json() : [];
        setTotais({
          materiais: Array.isArray(materiais) ? materiais.length : 0,
          servicos: Array.isArray(servicos) ? servicos.length : 0,
          carregando: false,
        });
      })
      .catch(() => setTotais((t) => ({ ...t, carregando: false })));
  }, []);

  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <LayoutHeader paginaAtiva="catalogo" />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="flex items-start gap-4">
          <span className="hidden rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent)] sm:block">
            <IconCatalog className="h-8 w-8" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Catálogo</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Cadastre aqui o que você usa com frequência. Na hora de montar um orçamento, basta buscar e escolher.
            </p>
          </div>
        </div>

        {/* Como funciona */}
        <section className={`mt-8 ${cardBase}`}>
          <h2 className="text-lg font-semibold">Como usar</h2>
          <ol className="mt-4 space-y-3">
            {[
              { passo: "1", texto: "Cadastre seus materiais (cimento, tinta…) e serviços (pintura, alvenaria…)." },
              { passo: "2", texto: "Ao criar um orçamento, busque pelo nome — o preço já vem preenchido." },
              { passo: "3", texto: "Opcional: ative a SINAPI para consultar preços oficiais de MG." },
            ].map((item) => (
              <li key={item.passo} className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--on-accent)]">
                  {item.passo}
                </span>
                <p className="text-sm leading-relaxed text-[var(--foreground)]">{item.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Cards principais */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <CardCatalogo
            href="/materiais"
            titulo="Materiais"
            descricao="Itens que você compra ou usa na obra: cimento, areia, tinta…"
            badge={totais.carregando ? "…" : `${totais.materiais} cadastrado${totais.materiais === 1 ? "" : "s"}`}
            emoji="🧱"
            corBorda="hover:border-[var(--warning)]/50"
            corFundo="bg-[var(--warning)]/8"
          />
          <CardCatalogo
            href="/servicos"
            titulo="Serviços"
            descricao="O que você executa e cobra: mão de obra, instalações, acabamentos…"
            badge={totais.carregando ? "…" : `${totais.servicos} cadastrado${totais.servicos === 1 ? "" : "s"}`}
            emoji="🔧"
            corBorda="hover:border-[var(--success)]/50"
            corFundo="bg-[var(--success)]/8"
          />
        </section>

        {/* SINAPI */}
        <Link
          href="/catalogo/sinapi"
          className={`mt-4 block ${cardBase} transition hover:border-[var(--accent)] hover:shadow-md`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-xl">
                📊
              </span>
              <div>
                <h2 className="text-lg font-semibold">Tabela SINAPI (MG)</h2>
                <p className={hintBase}>
                  Preços oficiais de referência. Útil para comparar ou preencher orçamentos.
                </p>
                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    sinapiAtivo
                      ? "bg-[var(--success-soft)] text-[var(--success)]"
                      : "bg-[var(--surface-elevated)] text-[var(--muted)]"
                  }`}
                >
                  {sinapiAtivo ? "Ativa nos orçamentos" : "Desativada"}
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)]">
              Configurar <IconChevronRight className="h-4 w-4" />
            </span>
          </div>
        </Link>

        {/* Dica */}
        <p className="mt-6 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-elevated)]/60 px-4 py-3 text-center text-sm text-[var(--muted)]">
          Dica: quanto mais itens no catálogo, mais rápido fica montar um orçamento.
        </p>
      </main>
    </div>
  );
}

function CardCatalogo({
  href,
  titulo,
  descricao,
  badge,
  emoji,
  corBorda,
  corFundo,
}: {
  href: string;
  titulo: string;
  descricao: string;
  badge: string;
  emoji: string;
  corBorda: string;
  corFundo: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:shadow-md ${corBorda}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${corFundo}`}>
          {emoji}
        </span>
        <span className="rounded-full bg-[var(--surface-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--muted)]">
          {badge}
        </span>
      </div>
      <h2 className="mt-4 text-lg font-semibold">{titulo}</h2>
      <p className="mt-1 flex-1 text-sm text-[var(--muted)]">{descricao}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] transition group-hover:gap-2">
        Abrir <IconChevronRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
