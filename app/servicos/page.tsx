"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutHeader } from "@/components/LayoutHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { IconPencil, IconTrash, IconToggleOn, IconToggleOff } from "@/components/Icons";
import { formatarPreco } from "@/lib/format";

type ServicoCatalogo = {
  id: number;
  descricao: string;
  tipo_cobranca?: "UNITARIO" | "M2" | "M3" | "METROS";
  unidade_medida?: "UNITARIO" | "M2" | "M3" | "METROS";
  precoBase: number;
  servicoAtivo: boolean;
};

type MaterialCatalogo = {
  id: number;
  nome_material: string;
  unidadeMedida: string;
  precoUnitario: number;
  ativo?: boolean;
};

type ServicoMaterialVinculo = {
  id: number;
  quantidade: number;
  materialId: number;
  material: MaterialCatalogo | null;
};

export default function ServicosPage() {
  const [servicos, setServicos] = useState<ServicoCatalogo[]>([]);
  const [materiais, setMateriais] = useState<MaterialCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [descricao, setDescricao] = useState("");
  const [unidade_medida, setTipoCobranca] = useState<"UNITARIO" | "M2" | "M3" | "METROS">("UNITARIO");
  const [precoBase, setPrecoBase] = useState("");
  const [editando, setEditando] = useState<ServicoCatalogo | null>(null);
  const [editPreco, setEditPreco] = useState("");
  const [editServicoMateriais, setEditServicoMateriais] = useState<ServicoMaterialVinculo[]>([]);
  const [editNovoMaterialVinculo, setEditNovoMaterialVinculo] = useState<{ materialId: number | ""; quantidade: string }>({ materialId: "", quantidade: "" });
  const [editBuscaMaterialVinculo, setEditBuscaMaterialVinculo] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [erroEdit, setErroEdit] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [materiaisPendentes, setMateriaisPendentes] = useState<{ materialId: number; quantidade: number; material: MaterialCatalogo }[]>([]);
  const [novoMaterialVinculo, setNovoMaterialVinculo] = useState({ materialId: "" as number | "", quantidade: "" });
  const [buscaMaterialVinculo, setBuscaMaterialVinculo] = useState("");

  const [busca, setBusca] = useState("");
  const [buscaDebounce, setBuscaDebounce] = useState("");
  const [confirmExcluir, setConfirmExcluir] = useState<{ id: number; desc: string } | null>(null);
  const normalizarDecimal = (valor: string) => {
    let limpo = valor.replace(/[^0-9,.\s]/g, "").replace(/\s/g, "").replace(/\./g, ",");
    const partes = limpo.split(",");
    if (partes.length > 2) limpo = partes[0] + "," + partes.slice(1).join("");
    return limpo;
  };

  const carregarServicos = async () => {
    setLoading(true);
    try {
      const params = buscaDebounce ? `?q=${encodeURIComponent(buscaDebounce)}` : "";
      const resposta = await fetch(`/api/servicos${params}`);
      if (!resposta.ok) throw new Error("Falha ao carregar serviços");
      setServicos(await resposta.json());
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarServicos();
  }, [buscaDebounce]);

  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounce(busca), 400);
    return () => clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    const carregarMateriais = async () => {
      const res = await fetch("/api/materiais");
      if (res.ok) setMateriais(await res.json());
    };
    carregarMateriais();
  }, []);

  const limparFormulario = () => {
    setDescricao("");
    setTipoCobranca("UNITARIO");
    setPrecoBase("");
    setError(null);
    setMateriaisPendentes([]);
    setNovoMaterialVinculo({ materialId: "" as number | "", quantidade: "" });
  };

  const adicionarMaterialVinculo = async () => {
    if (!novoMaterialVinculo.materialId || !novoMaterialVinculo.quantidade) return;
    const qtd = parseFloat(String(novoMaterialVinculo.quantidade).replace(",", "."));
    if (Number.isNaN(qtd) || qtd <= 0) return;
    const materialId = novoMaterialVinculo.materialId;
    const material = materiais.find((m) => m.id === materialId);
    if (!material) return;
    setNovoMaterialVinculo({ materialId: "" as number | "", quantidade: "" });
    setMateriaisPendentes((prev) => [...prev, { materialId, quantidade: qtd, material }]);
  };

  const removerMaterialVinculo = async (materialId: number) => {
    setMateriaisPendentes((prev) => prev.filter((p) => p.materialId !== materialId));
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const preco = parseFloat(precoBase.replace(",", "."));
    if (!descricao.trim()) {
      setError("Descrição do serviço é obrigatória.");
      return;
    }
    if (Number.isNaN(preco) || preco < 0) {
      setError("Preço base deve ser um número maior ou igual a zero.");
      return;
    }
    setSaving(true);
    try {
      const corpo = {
        descricao: descricao.trim(),
        tipo_cobranca: unidade_medida,
        precoBase: preco,
      };
      const resposta = await fetch("/api/servicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}));
        throw new Error(dados.error || "Falha ao criar");
      }
      const servicoCriado = await resposta.json();
      for (const p of materiaisPendentes) {
        await fetch(`/api/servicos/${servicoCriado.id}/materiais`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materialId: p.materialId, quantidade: p.quantidade }),
        });
      }
      limparFormulario();
      await carregarServicos();
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const editar = (s: ServicoCatalogo) => {
    setErroEdit(null);
    setEditando(s);
    setEditPreco(String(s.precoBase).replace(".", ","));
    setEditNovoMaterialVinculo({ materialId: "", quantidade: "" });
    setEditBuscaMaterialVinculo("");
    fetch(`/api/servicos/${s.id}/materiais`)
      .then((res) => (res.ok ? res.json() : []))
      .then((dados) => setEditServicoMateriais(Array.isArray(dados) ? dados : []))
      .catch(() => setEditServicoMateriais([]));
  };

  const adicionarMaterialVinculoEdicao = async () => {
    if (!editando || !editNovoMaterialVinculo.materialId || !editNovoMaterialVinculo.quantidade) return;
    const qtd = parseFloat(String(editNovoMaterialVinculo.quantidade).replace(",", "."));
    if (Number.isNaN(qtd) || qtd <= 0) return;
    setErroEdit(null);
    try {
      const resposta = await fetch(`/api/servicos/${editando.id}/materiais`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: editNovoMaterialVinculo.materialId,
          quantidade: qtd,
        }),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.error || "Falha ao vincular material");
      setEditServicoMateriais((prev) => {
        const semMesmo = prev.filter((v) => v.materialId !== dados.materialId);
        return [...semMesmo, dados];
      });
      setEditNovoMaterialVinculo({ materialId: "", quantidade: "" });
    } catch (erro) {
      setErroEdit(erro instanceof Error ? erro.message : "Erro ao vincular material");
    }
  };

  const removerMaterialVinculoEdicao = async (materialId: number) => {
    if (!editando) return;
    setErroEdit(null);
    try {
      const resposta = await fetch(`/api/servicos/${editando.id}/materiais/${materialId}`, { method: "DELETE" });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.error || "Falha ao remover material");
      setEditServicoMateriais((prev) => prev.filter((v) => v.materialId !== materialId));
    } catch (erro) {
      setErroEdit(erro instanceof Error ? erro.message : "Erro ao remover material");
    }
  };

  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    setErroEdit(null);
    const preco = parseFloat(editPreco.replace(",", "."));
    if (!editando.descricao.trim()) {
      setErroEdit("Descrição do serviço é obrigatória.");
      return;
    }
    if (Number.isNaN(preco) || preco < 0) {
      setErroEdit("Preço base deve ser um número maior ou igual a zero.");
      return;
    }
    setSavingEdit(true);
    try {
      const resposta = await fetch(`/api/servicos/${editando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: editando.descricao.trim(),
          tipo_cobranca: editando.tipo_cobranca ?? editando.unidade_medida ?? "UNITARIO",
          precoBase: preco,
        }),
      });
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}));
        throw new Error(dados.error || "Falha ao atualizar");
      }
      setEditando(null);
      setEditPreco("");
      setEditServicoMateriais([]);
      await carregarServicos();
    } catch (erro) {
      setErroEdit(erro instanceof Error ? erro.message : "Erro ao salvar");
    } finally {
      setSavingEdit(false);
    }
  };

  const alternarAtivo = async (s: ServicoCatalogo) => {
    try {
      const resposta = await fetch(`/api/servicos/${s.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servicoAtivo: !s.servicoAtivo }),
      });
      if (!resposta.ok) throw new Error("Falha ao atualizar");
      await carregarServicos();
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao atualizar");
    }
  };

  const excluir = (id: number, desc: string) => {
    setConfirmExcluir({ id, desc });
  };

  const executarExcluir = async () => {
    if (!confirmExcluir) return;
    const { id } = confirmExcluir;
    setConfirmExcluir(null);
    try {
      const resposta = await fetch(`/api/servicos/${id}`, { method: "DELETE" });
      if (!resposta.ok) throw new Error("Falha ao excluir");
      if (editando?.id === id) {
        setEditando(null);
        setEditPreco("");
        setEditServicoMateriais([]);
      }
      await carregarServicos();
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao excluir");
    }
  };

  const materiaisFiltradosVinculo = materiais.filter(
    (m) =>
      m.ativo !== false &&
      m.nome_material.toLowerCase().includes(buscaMaterialVinculo.toLowerCase().trim())
  );
  const materiaisFiltradosVinculoEdicao = materiais.filter(
    (m) =>
      m.ativo !== false &&
      m.nome_material.toLowerCase().includes(editBuscaMaterialVinculo.toLowerCase().trim())
  );

  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <LayoutHeader paginaAtiva="catalogo" />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Catálogo de serviços</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Catálogo de serviços, você pode cadastrar um novo seguindo os seguintes passos: descrição, unidade, valor e (opcionalmente) vincular materiais.
        </p>

        <form
          onSubmit={salvar}
          className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="descricao" className="block text-sm font-medium text-[var(--muted)]">
                Descrição do serviço *
              </label>
              <input
                id="descricao"
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                placeholder="Ex.: Instalação elétrica, Pintura"
              />
            </div>
            <div>
              <label htmlFor="unidade_medida" className="block text-sm font-medium text-[var(--muted)]">
                Unidade de medida
              </label>
              <select
                id="unidade_medida"
                value={unidade_medida}
                onChange={(e) => setTipoCobranca(e.target.value as "UNITARIO" | "M2" | "M3" | "METROS")}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
              >
                <option value="UNITARIO">Unitário</option>
                <option value="M2">M²</option>
                <option value="M3">M³</option>
                <option value="METROS">Metros</option>
              </select>
            </div>
            <div>
              <label htmlFor="precoBase" className="block text-sm font-medium text-[var(--muted)]">
                Preço base (R$)
              </label>
              <input
                id="precoBase"
                type="text"
                inputMode="decimal"
                value={precoBase}
                onChange={(e) => {
                  setPrecoBase(normalizarDecimal(e.target.value));
                }}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                placeholder="0,00"
              />
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Salvando…" : "Cadastrar"}
            </button>
          </div>
        </form>

        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h3 className="text-sm font-semibold">Vínculo de materiais ao serviço (opcional)</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Ao adicionar este serviço num orçamento, os itens abaixo serão incluídos automaticamente (quantidade do serviço × quantidade por m²/unidade).
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              type="search"
              value={buscaMaterialVinculo}
              onChange={(e) => setBuscaMaterialVinculo(e.target.value)}
              placeholder="Filtrar material..."
              className="w-56 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
            />
            <select
              value={novoMaterialVinculo.materialId || ""}
              onChange={(e) =>
                setNovoMaterialVinculo({
                  ...novoMaterialVinculo,
                  materialId: e.target.value ? Number(e.target.value) : ("" as number | ""),
                })
              }
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
            >
              <option value="">Selecione um material</option>
              {materiaisFiltradosVinculo.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome_material}
                </option>
              ))}
            </select>
            <input
              type="text"
              inputMode="decimal"
              value={novoMaterialVinculo.quantidade}
              onChange={(e) => {
                const v = normalizarDecimal(e.target.value);
                setNovoMaterialVinculo({ ...novoMaterialVinculo, quantidade: v });
              }}
              placeholder="Qtd por unidade de serviço"
              className="w-40 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={adicionarMaterialVinculo}
              disabled={!novoMaterialVinculo.materialId || !novoMaterialVinculo.quantidade}
              className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--on-accent)] hover:opacity-90 disabled:opacity-50"
            >
              Vincular
            </button>
          </div>
          {materiaisPendentes.length > 0 && (
            <ul className="mt-4 space-y-2">
              {materiaisPendentes.map((p, idx) => (
                <li
                  key={`${p.materialId}-${idx}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                >
                  <span>
                    {p.material.nome_material} — {p.quantidade} por unidade
                  </span>
                  <button
                    type="button"
                    onClick={() => removerMaterialVinculo(p.materialId)}
                    className="text-[var(--danger)] hover:opacity-80"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <section className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex flex-col gap-4 border-b border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold">Lista de serviços</h2>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por descrição..."
              className="w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
            />
          </div>
          {loading ? (
            <p className="p-6 text-sm text-[var(--muted)]">Carregando…</p>
          ) : servicos.length === 0 ? (
            <p className="p-6 text-sm text-[var(--muted)]">
              {buscaDebounce ? "Nenhum serviço encontrado para esta busca." : "Nenhum serviço cadastrado."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-elevated)]">
                    <th className="px-4 py-3 font-medium">Descrição</th>
                    <th className="px-4 py-3 font-medium">Cobrança</th>
                    <th className="px-4 py-3 font-medium">Preço base</th>
                    <th className="px-4 py-3 font-medium">Ativo</th>
                    <th className="px-4 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {servicos.map((s) => (
                    <tr key={s.id} className="border-b border-[var(--border)]">
                      <td className="px-4 py-3">{s.descricao}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {(s.tipo_cobranca ?? s.unidade_medida) === "M2" ? "M²" : (s.tipo_cobranca ?? s.unidade_medida) === "M3" ? "M³" : (s.tipo_cobranca ?? s.unidade_medida) === "METROS" ? "Metros" : "Unitário"}
                      </td>
                      <td className="px-4 py-3">{formatarPreco(s.precoBase)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            s.servicoAtivo
                              ? "rounded-full bg-[var(--success-soft)] px-2 py-1 text-xs text-[var(--success)]"
                              : "rounded-full bg-[var(--surface-elevated)] px-2 py-1 text-xs text-[var(--muted)]"
                          }
                        >
                          {s.servicoAtivo ? "Sim" : "Não"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => editar(s)} className="inline-flex h-10 w-10 items-center justify-center rounded text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]" title="Editar"><IconPencil /></button>
                          <button
                            type="button"
                            onClick={() => alternarAtivo(s)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                            title={s.servicoAtivo ? "Desativar" : "Ativar"}
                          >
                            {s.servicoAtivo ? <IconToggleOn /> : <IconToggleOff />}
                          </button>
                          <button type="button" onClick={() => excluir(s.id, s.descricao)} className="inline-flex h-10 w-10 items-center justify-center rounded text-[var(--danger)] hover:bg-[var(--danger-soft)]" title="Excluir"><IconTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-4 text-sm text-[var(--muted)]">
          <Link href="/catalogo" className="text-[var(--accent)] hover:underline">
            ← Voltar ao catálogo
          </Link>
        </p>

        {confirmExcluir && (
          <ConfirmDialog
            open
            title="Excluir serviço"
            message={`Excluir o serviço "${confirmExcluir.desc}"?`}
            variant="danger"
            confirmLabel="Excluir"
            onConfirm={executarExcluir}
            onCancel={() => setConfirmExcluir(null)}
          />
        )}

        {editando && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-soft)] p-4">
            <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
              <h3 className="text-lg font-semibold">Editar serviço</h3>
              <form onSubmit={salvarEdicao} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)]">Descrição do serviço *</label>
                  <input
                    type="text"
                    value={editando.descricao}
                    onChange={(e) => setEditando({ ...editando, descricao: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)]">Unidade de medida</label>
                  <select
                    value={editando.tipo_cobranca ?? editando.unidade_medida ?? "UNITARIO"}
                    onChange={(e) =>
                      setEditando({
                        ...editando,
                        tipo_cobranca: e.target.value as "UNITARIO" | "M2" | "M3" | "METROS",
                        unidade_medida: e.target.value as "UNITARIO" | "M2" | "M3" | "METROS",
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                  >
                    <option value="UNITARIO">Unitário</option>
                    <option value="M2">M²</option>
                    <option value="M3">M³</option>
                    <option value="METROS">Metros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)]">Preço base (R$)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editPreco}
                    onChange={(e) => setEditPreco(normalizarDecimal(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                  />
                </div>
                {erroEdit && <p className="text-sm text-[var(--danger)]">{erroEdit}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditando(null);
                      setEditPreco("");
                      setEditServicoMateriais([]);
                    }}
                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-elevated)]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] hover:opacity-90 disabled:opacity-50"
                  >
                    {savingEdit ? "Salvando…" : "Salvar"}
                  </button>
                </div>
              </form>

              <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                <h4 className="text-sm font-semibold">Materiais vinculados ao serviço</h4>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Esses materiais serão incluídos automaticamente quando o serviço for adicionado ao orçamento.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    type="search"
                    value={editBuscaMaterialVinculo}
                    onChange={(e) => setEditBuscaMaterialVinculo(e.target.value)}
                    placeholder="Filtrar material..."
                    className="w-52 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  />
                  <select
                    value={editNovoMaterialVinculo.materialId || ""}
                    onChange={(e) =>
                      setEditNovoMaterialVinculo({
                        ...editNovoMaterialVinculo,
                        materialId: e.target.value ? Number(e.target.value) : ("" as number | ""),
                      })
                    }
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  >
                    <option value="">Selecione um material</option>
                    {materiaisFiltradosVinculoEdicao.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome_material}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editNovoMaterialVinculo.quantidade}
                    onChange={(e) =>
                      setEditNovoMaterialVinculo({
                        ...editNovoMaterialVinculo,
                        quantidade: normalizarDecimal(e.target.value),
                      })
                    }
                    placeholder="Qtd por unidade"
                    className="w-36 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={adicionarMaterialVinculoEdicao}
                    disabled={!editNovoMaterialVinculo.materialId || !editNovoMaterialVinculo.quantidade}
                    className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--on-accent)] hover:opacity-90 disabled:opacity-50"
                  >
                    Vincular
                  </button>
                </div>

                {editServicoMateriais.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {editServicoMateriais.map((v) => (
                      <li
                        key={v.id}
                        className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      >
                        <span>
                          {v.material?.nome_material || `Material #${v.materialId}`} — {v.quantidade} por unidade
                        </span>
                        <button
                          type="button"
                          onClick={() => removerMaterialVinculoEdicao(v.materialId)}
                          className="text-[var(--danger)] hover:opacity-80"
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-[var(--muted)]">Nenhum material vinculado.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
