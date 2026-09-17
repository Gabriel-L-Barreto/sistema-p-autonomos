"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutHeader } from "@/components/LayoutHeader";
import { IconChart, IconChevronRight, IconPdf } from "@/components/Icons";
import { formatarPreco } from "@/lib/format";
import { LABELS_STATUS, STATUS_COLORS, type StatusOrcamento } from "@/lib/types";

type ItemControle = {
  id: number;
  endereco: string;
  status: StatusOrcamento;
  tempoEstimado: number | null;
  tempoEstimadoControle: number | null;
  cliente: { id: number; nome: string };
  valorTotal: number;
  valorRecebido: number;
  gastoTotal: number;
  resultadoEstimado: number;
  resultadoCaixa: number;
  dataInicio: string | null;
  dataFim: string | null;
  diasPendentes: string[];
  pendenteAtualizacao: boolean;
  semDataInicio: boolean;
  obraEncerrada: boolean;
  usaEstimativa: boolean;
};

type FiltroPill =
  | "todos"
  | "finalizados"
  | "atualizar"
  | "sem_inicio"
  | "andamento";

function corResultado(v: number) {
  if (v > 0) return "text-[var(--success)]";
  if (v < 0) return "text-[var(--danger)]";
  return "text-[var(--muted)]";
}

export default function ControlePage() {
  const [itens, setItens] = useState<ItemControle[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroPill>("todos");
  const [busca, setBusca] = useState("");
  const [mesRelatorio, setMesRelatorio] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const carregar = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch("/api/controle");
      if (!res.ok) throw new Error("Falha ao carregar");
      const data = await res.json();
      setItens(data.itens ?? []);
    } catch {
      setErro("Não foi possível carregar o controle de obras.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    try {
      const f = new URLSearchParams(window.location.search).get("filtro");
      if (
        f === "finalizados" ||
        f === "atualizar" ||
        f === "sem_inicio" ||
        f === "andamento" ||
        f === "pendentes" ||
        f === "todos"
      ) {
        setFiltro(f === "pendentes" ? "atualizar" : f);
      }
    } catch {
      // ignore
    }
    carregar();
  }, []);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    let lista = itens;

    if (filtro === "finalizados") lista = lista.filter((i) => i.status === "FINALIZADO");
    else if (filtro === "atualizar") {
      lista = lista.filter(
        (i) => i.status !== "FINALIZADO" && !i.obraEncerrada && (i.pendenteAtualizacao || i.semDataInicio)
      );
    } else if (filtro === "sem_inicio") {
      lista = lista.filter((i) => i.status !== "FINALIZADO" && i.semDataInicio);
    } else if (filtro === "andamento") {
      // Só obras que já tiveram algo preenchido no controle (início, gasto ou estimativa).
      lista = lista.filter(
        (i) =>
          i.status !== "FINALIZADO" &&
          !i.obraEncerrada &&
          Boolean(i.dataInicio || i.usaEstimativa || i.gastoTotal > 0)
      );
    }

    if (q) {
      lista = lista.filter((i) => {
        const idStr = String(i.id);
        return (
          idStr.includes(q) ||
          i.cliente.nome.toLowerCase().includes(q) ||
          i.endereco.toLowerCase().includes(q)
        );
      });
    }
    return lista;
  }, [itens, filtro, busca]);

  const alertas = itens.filter(
    (i) =>
      i.status !== "FINALIZADO" &&
      !i.obraEncerrada &&
      !i.usaEstimativa &&
      (i.pendenteAtualizacao || i.semDataInicio)
  );

  const baixarMensal = () => {
    const [ano, mes] = mesRelatorio.split("-");
    window.open(`/api/controle/relatorio/mensal/pdf?ano=${ano}&mes=${mes}`, "_blank");
  };

  const pills: { id: FiltroPill; label: string }[] = [
    { id: "todos", label: "Todas" },
    { id: "finalizados", label: "Orçamentos finalizados" },
    { id: "atualizar", label: "Precisam atualizar" },
    { id: "sem_inicio", label: "Sem data de início" },
    { id: "andamento", label: "Em andamento" },
  ];

  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <LayoutHeader paginaAtiva="controle" breadcrumb={[{ label: "Controle de obras" }]} />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <IconChart className="h-7 w-7 text-[var(--accent)]" />
              Controle de obras
            </h1>
            <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
              Acompanhe gastos diários, compare com o orçamento e com o que já foi recebido — sem
              alterar recebimentos nem o valor do orçamento.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs text-[var(--muted)]">
              Relatório mensal
              <input
                type="month"
                value={mesRelatorio}
                onChange={(e) => setMesRelatorio(e.target.value)}
                className="mt-1 block rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={baixarMensal}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm hover:border-[var(--accent)]"
            >
              <IconPdf className="h-4 w-4" /> PDF do mês
            </button>
          </div>
        </div>

        {alertas.length > 0 && (
          <div className="mt-6 rounded-xl border border-[var(--warning)]/40 bg-[var(--warning-soft)] p-4">
            <p className="text-sm font-semibold text-[var(--warning)]">
              Atualize o controle — {alertas.length} obra(s) ativas precisam da sua atenção
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
              {alertas.slice(0, 5).map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/controle/${a.id}`}
                    className="text-[var(--foreground)] underline-offset-2 hover:underline"
                  >
                    #{a.id} {a.cliente.nome}
                  </Link>
                  {a.semDataInicio
                    ? " — defina a data de início"
                    : ` — ${a.diasPendentes.length} dia(s) sem registro`}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6">
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por cliente, endereço ou nº do orçamento…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {pills.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setFiltro(p.id)}
              className={
                "rounded-full px-3 py-1.5 text-xs font-medium transition " +
                (filtro === p.id
                  ? "bg-[var(--accent)] text-[var(--on-accent)]"
                  : "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]")
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        {carregando && <p className="mt-8 text-sm text-[var(--muted)]">Carregando…</p>}
        {erro && <p className="mt-8 text-sm text-[var(--danger)]">{erro}</p>}

        {!carregando && !erro && filtrados.length === 0 && (
          <div className="mt-10 rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
            <p className="text-sm text-[var(--muted)]">
              Nenhuma obra neste filtro. Só aparecem orçamentos aceitos, inicializados ou finalizados.
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-3">
          {filtrados.map((item) => (
            <Link
              key={item.id}
              href={`/controle/${item.id}`}
              className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)] hover:shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      #{item.id} — {item.cliente.nome}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[item.status]}`}>
                      {LABELS_STATUS[item.status]}
                    </span>
                    {item.usaEstimativa && (
                      <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs text-[var(--accent)]">
                        Estimativa rápida
                      </span>
                    )}
                    {item.status !== "FINALIZADO" &&
                      !item.obraEncerrada &&
                      (item.pendenteAtualizacao || item.semDataInicio) && (
                        <span className="rounded-full bg-[var(--warning-soft)] px-2 py-0.5 text-xs text-[var(--warning)]">
                          {item.semDataInicio ? "Sem data de início" : "Atualizar gastos"}
                        </span>
                      )}
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">{item.endereco}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Início: {item.dataInicio ?? "—"} · Fim: {item.dataFim ?? "—"}
                  </p>
                </div>
                <IconChevronRight className="h-5 w-5 text-[var(--muted)] transition group-hover:text-[var(--accent)]" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-lg bg-[var(--surface-elevated)] p-2">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Total obra</p>
                  <p className="text-sm font-semibold">{formatarPreco(item.valorTotal)}</p>
                </div>
                <div className="rounded-lg bg-[var(--surface-elevated)] p-2">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Recebido</p>
                  <p className="text-sm font-semibold text-[var(--success)]">
                    {formatarPreco(item.valorRecebido)}
                  </p>
                </div>
                <div className="rounded-lg bg-[var(--surface-elevated)] p-2">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Gasto</p>
                  <p className="text-sm font-semibold text-[var(--danger)]">
                    {formatarPreco(item.gastoTotal)}
                  </p>
                </div>
                <div className="rounded-lg bg-[var(--surface-elevated)] p-2">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Resultado</p>
                  <p className={`text-sm font-semibold ${corResultado(item.resultadoEstimado)}`}>
                    {formatarPreco(item.resultadoEstimado)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
