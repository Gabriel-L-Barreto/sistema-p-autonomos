"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { LayoutHeader } from "@/components/LayoutHeader";
import { IconArrowLeft, IconPdf, IconCheck } from "@/components/Icons";
import { formatarPreco } from "@/lib/format";
import { dataParaChave } from "@/lib/dias-uteis";
import { LABELS_STATUS, STATUS_COLORS, type StatusOrcamento } from "@/lib/types";

type GastoDia = {
  data: string;
  valorPessoal: number;
  valorMateriais: number;
  semGastos: boolean;
  total: number;
  observacao?: string | null;
};

type PessoalPlanilhaDia = {
  data: string;
  total: number;
  nomes: string[];
};

type Detalhe = {
  id: number;
  endereco: string;
  status: StatusOrcamento;
  tempoEstimado: number | null;
  tempoEstimadoControle: number | null;
  tempoEstimadoUsado: number | null;
  cliente: { id: number; nome: string };
  valorTotal: number;
  valorRecebido: number;
  gastoPessoal: number;
  gastoMateriais: number;
  gastoTotal: number;
  resultadoEstimado: number;
  resultadoCaixa: number;
  dataInicio: string | null;
  dataFim: string | null;
  dataFimManual: string | null;
  contaFinsDeSemana: boolean;
  diasPendentes: string[];
  diasObra: string[];
  gastosPorDia: GastoDia[];
  obraEncerrada: boolean;
  usaEstimativa: boolean;
  diasEstimativa: number | null;
  valorDiaEstimativa: number | null;
  gastoEstimativa: number;
  pessoalDaPlanilha?: PessoalPlanilhaDia[];
};

function corResultado(v: number) {
  if (v > 0) return "text-[var(--success)]";
  if (v < 0) return "text-[var(--danger)]";
  return "text-[var(--muted)]";
}

function formatarDataBr(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function ControleObraDetalhePage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const [detalhe, setDetalhe] = useState<Detalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [mostrarEstimativa, setMostrarEstimativa] = useState(false);

  const hojeKey = dataParaChave(new Date());
  const [dataInicioInput, setDataInicioInput] = useState("");
  const [dataFimInput, setDataFimInput] = useState("");
  const [diasEstimadosInput, setDiasEstimadosInput] = useState("");
  const [contaFds, setContaFds] = useState(false);
  const [dataGasto, setDataGasto] = useState(hojeKey);
  const [valorPessoal, setValorPessoal] = useState("");
  const [valorMateriais, setValorMateriais] = useState("");
  const [semGastos, setSemGastos] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [estDias, setEstDias] = useState("");
  const [estValorDia, setEstValorDia] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/controle/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao carregar");
      setDetalhe(data);
      setDataInicioInput(data.dataInicio ?? "");
      setDataFimInput(data.dataFimManual ?? "");
      setDiasEstimadosInput(
        data.tempoEstimadoControle != null
          ? String(data.tempoEstimadoControle)
          : data.tempoEstimado != null
            ? String(data.tempoEstimado)
            : ""
      );
      setContaFds(Boolean(data.contaFinsDeSemana));
      setMostrarEstimativa(Boolean(data.usaEstimativa));
      setEstDias(data.diasEstimativa != null ? String(data.diasEstimativa) : "");
      setEstValorDia(data.valorDiaEstimativa != null ? String(data.valorDiaEstimativa) : "");

      const alvo =
        data.diasPendentes?.length > 0 ? data.diasPendentes[0] : data.dataInicio ? hojeKey : hojeKey;
      setDataGasto(alvo);
      const existente = (data.gastosPorDia as GastoDia[] | undefined)?.find((g) => g.data === alvo);
      if (existente) {
        setSemGastos(existente.semGastos);
        setValorPessoal(existente.semGastos ? "" : String(existente.valorPessoal || ""));
        setValorMateriais(existente.semGastos ? "" : String(existente.valorMateriais || ""));
        setObservacao(existente.observacao ?? "");
      } else {
        setSemGastos(false);
        setValorPessoal("");
        setValorMateriais("");
        setObservacao("");
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setCarregando(false);
    }
  }, [id, hojeKey]);

  useEffect(() => {
    if (id) carregar();
  }, [id, carregar]);

  const mapaGastos = useMemo(() => {
    const m = new Map<string, GastoDia>();
    for (const g of detalhe?.gastosPorDia ?? []) m.set(g.data, g);
    return m;
  }, [detalhe]);

  const mapaPessoalPlanilha = useMemo(() => {
    const m = new Map<string, PessoalPlanilhaDia>();
    for (const p of detalhe?.pessoalDaPlanilha ?? []) m.set(p.data, p);
    return m;
  }, [detalhe]);

  const pessoalPlanilhaDia = mapaPessoalPlanilha.get(dataGasto);

  const salvarPeriodo = async () => {
    setSalvando(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/controle/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataInicioControle: dataInicioInput || null,
          dataFimControle: dataFimInput || null,
          tempoEstimadoControle: diasEstimadosInput ? Number(diasEstimadosInput) : null,
          contaFinsDeSemanaControle: contaFds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao salvar");
      setDetalhe(data);
      setMsg("Período do controle salvo.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  const aplicarEstimativaRapida = async () => {
    setSalvando(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/controle/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aplicarEstimativaRapida: true,
          dataInicioControle: dataInicioInput || detalhe?.dataInicio,
          controleDiasEstimativa: Number(String(estDias).replace(",", ".")),
          controleValorDiaEstimativa: Number(String(estValorDia).replace(",", ".")),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao salvar");
      setDetalhe(data);
      setMostrarEstimativa(true);
      setMsg("Estimativa rápida aplicada (não é valor real diário). Relatório fechado.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  const limparEstimativa = async () => {
    setSalvando(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/controle/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ controleUsaEstimativa: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao salvar");
      setDetalhe(data);
      setMostrarEstimativa(false);
      setMsg("Estimativa removida. Você pode registrar os dias normalmente.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  const salvarGasto = async () => {
    setSalvando(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/controle/${id}/gasto`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: dataGasto,
          semGastos,
          valorPessoal: semGastos ? 0 : Number(String(valorPessoal).replace(",", ".")),
          valorMateriais: semGastos ? 0 : Number(String(valorMateriais).replace(",", ".")),
          observacao: observacao || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao salvar");
      setMsg(semGastos ? "Dia marcado como sem gastos." : "Gastos do dia salvos.");
      await carregar();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen">
        <LayoutHeader paginaAtiva="controle" />
        <main className="mx-auto max-w-3xl px-4 py-10 text-sm text-[var(--muted)]">Carregando…</main>
      </div>
    );
  }

  if (erro || !detalhe) {
    return (
      <div className="min-h-screen">
        <LayoutHeader paginaAtiva="controle" />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-sm text-[var(--danger)]">{erro ?? "Obra não encontrada"}</p>
          <Link href="/controle" className="mt-4 inline-flex items-center gap-1 text-sm text-[var(--accent)]">
            <IconArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </main>
      </div>
    );
  }

  const previewEstimativa =
    Number(estDias) > 0 && Number(String(estValorDia).replace(",", ".")) >= 0
      ? Number(estDias) * Number(String(estValorDia).replace(",", "."))
      : null;

  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <LayoutHeader
        paginaAtiva="controle"
        breadcrumb={[
          { label: "Controle", href: "/controle" },
          { label: `#${detalhe.id} ${detalhe.cliente.nome}` },
        ]}
      />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link
              href="/controle"
              className="inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--accent)]"
            >
              <IconArrowLeft className="h-3.5 w-3.5" /> Todas as obras
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              #{detalhe.id} — {detalhe.cliente.nome}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">{detalhe.endereco}</p>
            <span
              className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[detalhe.status]}`}
            >
              {LABELS_STATUS[detalhe.status]}
            </span>
          </div>
          <a
            href={`/api/controle/${detalhe.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:border-[var(--accent)]"
          >
            <IconPdf className="h-4 w-4" /> Relatório PDF
          </a>
        </div>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-xs text-[var(--muted)]">Valor total</p>
            <p className="mt-1 text-lg font-semibold">{formatarPreco(detalhe.valorTotal)}</p>
          </div>
          <div className="rounded-xl border border-[var(--success)]/30 bg-[var(--success-soft)] p-4">
            <p className="text-xs text-[var(--success)]">Já recebido</p>
            <p className="mt-1 text-lg font-semibold text-[var(--success)]">
              {formatarPreco(detalhe.valorRecebido)}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-4">
            <p className="text-xs text-[var(--danger)]">
              {detalhe.usaEstimativa ? "Gasto estimado" : "Total gasto"}
            </p>
            <p className="mt-1 text-lg font-semibold text-[var(--danger)]">
              {formatarPreco(detalhe.gastoTotal)}
            </p>
            {!detalhe.usaEstimativa && (
              <p className="mt-1 text-[10px] text-[var(--muted)]">
                Pessoal {formatarPreco(detalhe.gastoPessoal)} · Materiais{" "}
                {formatarPreco(detalhe.gastoMateriais)}
              </p>
            )}
          </div>
        </section>

        <section className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-xs text-[var(--muted)]">Resultado da obra (total − gastos)</p>
            <p className={`mt-1 text-xl font-semibold ${corResultado(detalhe.resultadoEstimado)}`}>
              {formatarPreco(detalhe.resultadoEstimado)}
              <span className="ml-2 text-sm font-normal">
                {detalhe.resultadoEstimado > 0
                  ? "lucro"
                  : detalhe.resultadoEstimado < 0
                    ? "prejuízo"
                    : "empatado"}
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-xs text-[var(--muted)]">Resultado em caixa (recebido − gastos)</p>
            <p className={`mt-1 text-xl font-semibold ${corResultado(detalhe.resultadoCaixa)}`}>
              {formatarPreco(detalhe.resultadoCaixa)}
            </p>
          </div>
        </section>

        {/* Período */}
        <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="text-sm font-semibold">Período da obra</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Defina início, estimativa de dias e, se quiser, a data de fim para fechar o relatório e
            parar os alertas.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-[var(--muted)]">
              Data de início
              <input
                type="date"
                value={dataInicioInput}
                onChange={(e) => setDataInicioInput(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
              />
            </label>
            <label className="flex items-end gap-2 text-xs text-[var(--muted)]">
              <span className="flex-1">
                Estimativa de dias (no controle)
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={diasEstimadosInput}
                  onChange={(e) => setDiasEstimadosInput(e.target.value)}
                  placeholder={
                    detalhe.tempoEstimado != null
                      ? `Orçamento: ${detalhe.tempoEstimado}`
                      : "Ex.: 10"
                  }
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                />
              </span>
            </label>
            <label className="text-xs text-[var(--muted)]">
              Data de fim (fecha o relatório)
              <input
                type="date"
                value={dataFimInput}
                onChange={(e) => setDataFimInput(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 self-end rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                checked={contaFds}
                onChange={(e) => setContaFds(e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Contabilizar fins de semana
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={salvando}
              onClick={salvarPeriodo}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] disabled:opacity-60"
            >
              Salvar período
            </button>
            <p className="text-sm text-[var(--muted)]">
              Fim usado:{" "}
              <span className="font-medium text-[var(--foreground)]">
                {detalhe.dataFim ? formatarDataBr(detalhe.dataFim) : "—"}
              </span>
              {detalhe.dataFimManual
                ? " (manual)"
                : detalhe.tempoEstimadoUsado
                  ? ` (${detalhe.tempoEstimadoUsado} dia(s)${detalhe.contaFinsDeSemana ? "" : " úteis"})`
                  : ""}
            </p>
          </div>
        </section>

        {/* Estimativa rápida */}
        <section className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4">
          {!mostrarEstimativa ? (
            <button
              type="button"
              onClick={() => setMostrarEstimativa(true)}
              className="text-left text-sm text-[var(--accent)] underline-offset-2 hover:underline"
            >
              Obra já finalizada sem registro diário? Use uma estimativa rápida (dias × gasto/dia,
              sem fins de semana) — só para ter uma ideia de lucro ou prejuízo.
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium">Estimativa rápida (não é valor real)</p>
              <p className="text-xs text-[var(--muted)]">
                Ideal para orçamentos finalizados que não tiveram controle dia a dia. Fins de
                semana são ignorados. Prefira o registro diário nas obras novas.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-xs text-[var(--muted)]">
                  Data de início
                  <input
                    type="date"
                    value={dataInicioInput}
                    onChange={(e) => setDataInicioInput(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-[var(--muted)]">
                  Dias gastos
                  <input
                    type="number"
                    min={1}
                    value={estDias}
                    onChange={(e) => setEstDias(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-[var(--muted)]">
                  Gasto estimado / dia
                  <input
                    type="text"
                    inputMode="decimal"
                    value={estValorDia}
                    onChange={(e) => setEstValorDia(e.target.value)}
                    placeholder="0,00"
                    className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                  />
                </label>
              </div>
              {previewEstimativa != null && Number.isFinite(previewEstimativa) && (
                <p className="text-sm">
                  Gasto estimado:{" "}
                  <span className="font-semibold text-[var(--danger)]">
                    {formatarPreco(previewEstimativa)}
                  </span>
                  {" · "}
                  Resultado:{" "}
                  <span className={corResultado(detalhe.valorTotal - previewEstimativa)}>
                    {formatarPreco(detalhe.valorTotal - previewEstimativa)}
                  </span>
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={salvando}
                  onClick={aplicarEstimativaRapida}
                  className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--on-accent)] disabled:opacity-60"
                >
                  Aplicar estimativa
                </button>
                {detalhe.usaEstimativa && (
                  <button
                    type="button"
                    disabled={salvando}
                    onClick={limparEstimativa}
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                  >
                    Remover estimativa
                  </button>
                )}
                {!detalhe.usaEstimativa && (
                  <button
                    type="button"
                    onClick={() => setMostrarEstimativa(false)}
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Registro diário */}
        {!detalhe.usaEstimativa && (
          <section className="mt-6 rounded-xl border-2 border-[var(--accent)]/40 bg-[var(--accent-soft)] p-5">
            <h2 className="text-base font-semibold">Registrar o dia</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Leva menos de 30 segundos. Se não teve gasto, marque a opção abaixo.
            </p>

            {detalhe.diasPendentes.length > 0 && (
              <p className="mt-3 rounded-lg border border-[var(--warning)]/40 bg-[var(--warning-soft)] px-3 py-2 text-xs text-[var(--warning)]">
                {detalhe.diasPendentes.length === 1
                  ? "Há 1 dia sem atualização."
                  : `Há ${detalhe.diasPendentes.length} dias sem atualização.`}{" "}
                Começando pelo mais antigo: {formatarDataBr(detalhe.diasPendentes[0])}.
              </p>
            )}

            {!detalhe.dataInicio ? (
              <p className="mt-4 text-sm text-[var(--muted)]">
                Defina a data de início acima para liberar o registro diário.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="block text-xs text-[var(--muted)]">
                    Dia
                    <input
                      type="date"
                      value={dataGasto}
                      onChange={(e) => {
                        const d = e.target.value;
                        setDataGasto(d);
                        const existente = mapaGastos.get(d);
                        if (existente) {
                          setSemGastos(existente.semGastos);
                          setValorPessoal(
                            existente.semGastos ? "" : String(existente.valorPessoal || "")
                          );
                          setValorMateriais(
                            existente.semGastos ? "" : String(existente.valorMateriais || "")
                          );
                          setObservacao(existente.observacao ?? "");
                        } else {
                          setSemGastos(false);
                          setValorPessoal("");
                          setValorMateriais("");
                          setObservacao("");
                        }
                      }}
                      className="mt-1 block w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={contaFds}
                      onChange={async (e) => {
                        const v = e.target.checked;
                        setContaFds(v);
                        setSalvando(true);
                        try {
                          const res = await fetch(`/api/controle/${id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ contaFinsDeSemanaControle: v }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data?.error || "Erro");
                          setDetalhe(data);
                        } catch (err) {
                          setMsg(err instanceof Error ? err.message : "Erro ao salvar");
                          setContaFds(!v);
                        } finally {
                          setSalvando(false);
                        }
                      }}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    Contabilizar fins de semana
                  </label>
                </div>

                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={semGastos}
                    onChange={(e) => setSemGastos(e.target.checked)}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  Sem gastos neste dia
                </label>

                {!semGastos && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-[var(--muted)]">
                      Pessoal (mão de obra / equipe)
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={valorPessoal}
                        onChange={(e) => setValorPessoal(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      />
                      {pessoalPlanilhaDia && pessoalPlanilhaDia.total > 0 && (
                        <span className="mt-1 block text-[11px] leading-snug text-[var(--accent)]">
                          Sugestão da planilha de pessoal (
                          {formatarPreco(pessoalPlanilhaDia.total)}
                          {pessoalPlanilhaDia.nomes.length > 0
                            ? `: ${pessoalPlanilhaDia.nomes.join(", ")}`
                            : ""}
                          ). Módulo Pessoal não está disponível neste ambiente — preencha manualmente se necessário.
                        </span>
                      )}
                    </label>
                    <label className="text-xs text-[var(--muted)]">
                      Materiais
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={valorMateriais}
                        onChange={(e) => setValorMateriais(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                )}

                <label className="block text-xs text-[var(--muted)]">
                  Observação (opcional)
                  <input
                    type="text"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    maxLength={300}
                    className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  />
                </label>

                <button
                  type="button"
                  disabled={salvando}
                  onClick={salvarGasto}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--on-accent)] disabled:opacity-60"
                >
                  <IconCheck className="h-4 w-4" />
                  {salvando ? "Salvando…" : "Salvar dia"}
                </button>
              </div>
            )}
          </section>
        )}

        {msg && <p className="mt-4 text-sm text-[var(--foreground)]">{msg}</p>}

        {!detalhe.usaEstimativa && detalhe.diasObra.length > 0 && (
          <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-sm font-semibold">Dias da obra</h2>
            <ul className="mt-3 max-h-80 space-y-1.5 overflow-y-auto">
              {detalhe.diasObra.map((dia) => {
                const g = mapaGastos.get(dia);
                const pendente = detalhe.diasPendentes.includes(dia);
                return (
                  <li
                    key={dia}
                    className={
                      "flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm " +
                      (pendente ? "bg-[var(--warning-soft)]" : "bg-[var(--surface-elevated)]")
                    }
                  >
                    <button
                      type="button"
                      className="text-left font-medium hover:underline"
                      onClick={() => {
                        setDataGasto(dia);
                        if (g) {
                          setSemGastos(g.semGastos);
                          setValorPessoal(g.semGastos ? "" : String(g.valorPessoal || ""));
                          setValorMateriais(g.semGastos ? "" : String(g.valorMateriais || ""));
                          setObservacao(g.observacao ?? "");
                        } else {
                          setSemGastos(false);
                          setValorPessoal("");
                          setValorMateriais("");
                          setObservacao("");
                        }
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      {formatarDataBr(dia)}
                      {dia === hojeKey ? " (hoje)" : ""}
                    </button>
                    <span className="text-xs">
                      {pendente && <span className="text-[var(--warning)]">Pendente</span>}
                      {!pendente && g?.semGastos && (
                        <span className="text-[var(--muted)]">Sem gastos</span>
                      )}
                      {!pendente && g && !g.semGastos && (
                        <span className="text-[var(--danger)]">{formatarPreco(g.total)}</span>
                      )}
                      {!pendente && !g && dia > hojeKey && (
                        <span className="text-[var(--muted)]">Futuro</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
