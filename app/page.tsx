"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutHeader } from "@/components/LayoutHeader";
import {
  IconUsers,
  IconFileText,
  IconCatalog,
  IconChevronRight,
  IconSettings,
  IconEye,
} from "@/components/Icons";

type Stats = {
  totalOrcamentos: number;
  totalRecebimentos: number;
  totalValorOrcamentos: number;
  totalValorRecebimentos: number;
  valorInicializados: number;
  valorEmAberto: number;
  valorFinalizados: number;
  recebidoNoMes: number;
  esperadoNoMes: number;
  valorTotalAnual: number;
  valoresMensaisInicializados: number[];
  cadastrados: number;
  inicializados: number;
  finalizadosNaoQuitados: number;
  orcamentosPendentes: number;
};

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [ocultarValores, setOcultarValores] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setStats(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem("home_ocultar_valores");
      if (salvo === "1") setOcultarValores(true);
    } catch {
      // fallback silencioso
    }
  }, []);

  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
  const exibirMoeda = (valor: number) => (ocultarValores ? "••••••" : formatarMoeda(valor));

  const graficoMaximo = Math.max(
    1,
    stats?.recebidoNoMes ?? 0,
    stats?.esperadoNoMes ?? 0,
    stats?.valorTotalAnual ?? 0
  );
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const maxMensalInicializado = Math.max(1, ...(stats?.valoresMensaisInicializados ?? [0]));

  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <LayoutHeader paginaAtiva="inicio" />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Bem-vindo(a)</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Crie orçamentos e e recebimentos
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const novo = !ocultarValores;
              setOcultarValores(novo);
              try {
                localStorage.setItem("home_ocultar_valores", novo ? "1" : "0");
              } catch {
                // fallback silencioso
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <IconEye className="h-4 w-4" />
            {ocultarValores ? "Mostrar valores" : "Ocultar valores"}
          </button>
        </div>

        <section className="mt-8">
          <Link
            href="/orcamentos/novo"
            className="home-hero-card group relative block overflow-hidden rounded-2xl border border-[var(--accent)] bg-[var(--accent)] p-6 text-[var(--on-accent)] shadow-sm transition hover:shadow-md"
          >
            <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-white/10 blur-2xl transition group-hover:bg-white/15" />
            <div className="relative grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Novo orçamento</h2>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-white/30 bg-white/10 px-2 py-1">Cliente</span>
                  <span className="rounded-full border border-white/30 bg-white/10 px-2 py-1">Servicos</span>
                  <span className="rounded-full border border-white/30 bg-white/10 px-2 py-1">Materiais</span>
                </div>
              </div>
              <div className="relative inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[var(--accent)] transition group-hover:translate-x-0.5">
                Cadastrar novo <IconChevronRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        </section>

        <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="text-base font-semibold">Indicadores</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
              <p className="text-xs text-[var(--muted)]">Inicializados</p>
              <p className="mt-1 text-xl font-semibold">{exibirMoeda(stats?.valorInicializados ?? 0)}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
              <p className="text-xs text-[var(--muted)]">Em aberto</p>
              <p className="mt-1 text-xl font-semibold">{exibirMoeda(stats?.valorEmAberto ?? 0)}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
              <p className="text-xs text-[var(--muted)]">Finalizados</p>
              <p className="mt-1 text-xl font-semibold">{exibirMoeda(stats?.valorFinalizados ?? 0)}</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <p className="text-sm font-semibold">Gráfico financeiro</p>
            <p className="text-xs text-[var(--muted)]">
              Recebido no mês, esperado para o mês e valor total anual.
            </p>
            <div className="mt-4 space-y-3">
              {[
                { id: "recebido", label: "Recebido no mês", valor: stats?.recebidoNoMes ?? 0, cor: "bg-[var(--success)]" },
                { id: "esperado", label: "Esperado no mês", valor: stats?.esperadoNoMes ?? 0, cor: "bg-[var(--warning)]" },
                { id: "anual", label: "Valor total anual", valor: stats?.valorTotalAnual ?? 0, cor: "bg-[var(--accent)]" },
              ].map((item) => (
                <div key={item.id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-[var(--muted)]">{item.label}</span>
                    <span className="font-semibold text-[var(--foreground)]">{exibirMoeda(item.valor)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[var(--surface)]">
                    <div
                      className={`h-full rounded-full ${item.cor}`}
                      style={{ width: `${Math.max(4, (item.valor / graficoMaximo) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <p className="text-sm font-semibold">Valores mensais por entrada em Inicializado</p>
            <p className="text-xs text-[var(--muted)]">
              Quando um orçamento muda para status Inicializado, seu valor entra no mês correspondente.
            </p>
            <div className="mt-4 grid grid-cols-12 gap-2">
              {meses.map((mes, idx) => {
                const valor = stats?.valoresMensaisInicializados?.[idx] ?? 0;
                const altura = Math.max(8, Math.round((valor / maxMensalInicializado) * 100));
                return (
                  <div key={mes} className="flex flex-col items-center">
                    <div className="flex h-28 w-full items-end">
                      <div
                        className="w-full rounded-t-md bg-[var(--accent)]"
                        style={{ height: `${altura}%` }}
                        title={`${mes}: ${ocultarValores ? "••••••" : formatarMoeda(valor)}`}
                      />
                    </div>
                    <span className="mt-1 text-[10px] text-[var(--muted)]">{mes}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="text-base font-semibold">Alertas</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Link
              href="/orcamentos?status=CADASTRADO"
              className="rounded-lg border border-[var(--warning)]/40 bg-[var(--warning-soft)] p-3 transition hover:opacity-90"
            >
              <p className="text-sm font-medium">Sem definição final</p>
              <p className="text-sm text-[var(--muted)]">
                {stats?.cadastrados ?? 0} orçamento(s) com status cadastrado.
              </p>
            </Link>
            <Link
              href="/orcamentos?status=FINALIZADO&alerta=FINALIZADOS_NAO_QUITADOS"
              className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-3 transition hover:opacity-90"
            >
              <p className="text-sm font-medium">Finalizados não quitados</p>
              <p className="text-sm text-[var(--muted)]">
                {stats?.finalizadosNaoQuitados ?? 0} orçamento(s) finalizados com pendência.
              </p>
            </Link>
            <Link
              href="/orcamentos?status=INICIALIZADO"
              className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-3 transition hover:opacity-90"
            >
              <p className="text-sm font-medium">Em andamento</p>
              <p className="text-sm text-[var(--muted)]">
                {stats?.inicializados ?? 0} orçamento(s) inicializados.
              </p>
            </Link>
            <Link
              href="/orcamentos?alerta=PENDENTES_RECEBIMENTO"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-3 transition hover:opacity-90"
            >
              <p className="text-sm font-medium">Pendentes de recebimento</p>
              <p className="text-sm text-[var(--muted)]">
                {stats?.orcamentosPendentes ?? 0} orçamento(s) em aberto.
              </p>
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AtalhoPrincipal
            href="/orcamentos"
            titulo="Orçamentos"
            descricao="Lista, edição e recebimentos"
            icone={<IconFileText className="h-6 w-6 text-[var(--success)]" />}
          />
          <AtalhoPrincipal
            href="/clientes"
            titulo="Clientes"
            descricao="Cadastro e contatos"
            icone={<IconUsers className="h-6 w-6 text-[var(--accent)]" />}
          />
          <AtalhoPrincipal
            href="/catalogo"
            titulo="Catálogo"
            descricao="Serviços, materiais e SINAPI"
            icone={<IconCatalog className="h-6 w-6 text-[var(--muted)]" />}
          />
        </section>

        <div className="mt-8 flex justify-center">
          <Link
            href="/configuracoes"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <IconSettings className="h-4 w-4" />
            Configurações do PDF
          </Link>
        </div>
      </main>
    </div>
  );
}

function AtalhoPrincipal({
  href,
  titulo,
  descricao,
  icone,
}: {
  href: string;
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:border-[var(--accent)] hover:bg-[var(--surface-elevated)]"
    >
      <div>
        <div className="inline-flex rounded-lg bg-[var(--surface-elevated)] p-2.5">{icone}</div>
        <p className="mt-3 text-sm font-semibold">{titulo}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">{descricao}</p>
      </div>
      <span className="mt-4 text-sm font-medium text-[var(--accent)]">
        Acessar <IconChevronRight className="ml-1 inline h-4 w-4" />
      </span>
    </Link>
  );
}
