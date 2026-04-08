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

type ServicoMaterial = {
  id: number;
  quantidade: number;
  materialId: number;
  material: MaterialCatalogo;
};

export default function ServicosPage() {
  const [servicos, setServicos] = useState<ServicoCatalogo[]>([]);
  const [materiais, setMateriais] = useState<MaterialCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [descricao, setDescricao] = useState("");
  const [unidade_medida, setTipoCobranca] = useState<"UNITARIO" | "M2" | "M3" | "METROS">("UNITARIO");
  const [precoBase, setPrecoBase] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [servicoMateriais, setServicoMateriais] = useState<ServicoMaterial[]>([]);
  const [materiaisPendentes, setMateriaisPendentes] = useState<{ materialId: number; quantidade: number; material: MaterialCatalogo }[]>([]);
  const [novoMaterialVinculo, setNovoMaterialVinculo] = useState({ materialId: "" as number | "", quantidade: "" });
  const [buscaMaterialVinculo, setBuscaMaterialVinculo] = useState("");

  const [busca, setBusca] = useState("");
  const [buscaDebounce, setBuscaDebounce] = useState("");
  const [confirmExcluir, setConfirmExcluir] = useState<{ id: number; desc: string } | null>(null);

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

  useEffect(() => {
    if (!editingId) {
      setServicoMateriais([]);
      return;
    }
    const carregar = async () => {
      const res = await fetch(`/api/servicos/${editingId}/materiais`);
      if (res.ok) setServicoMateriais(await res.json());
    };
    carregar();
  }, [editingId]);

  const limparFormulario = () => {
    setDescricao("");
    setTipoCobranca("UNITARIO");
    setPrecoBase("");
    setEditingId(null);
    setError(null);
    setServicoMateriais([]);
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
    if (editingId) {
      try {
        const res = await fetch(`/api/servicos/${editingId}/materiais`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materialId, quantidade: qtd }),
        });
        if (!res.ok) throw new Error("Falha ao vincular");
        const sm = await res.json();
        setServicoMateriais((prev) => [...prev, sm]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao vincular material");
      }
    } else {
      setMateriaisPendentes((prev) => [...prev, { materialId, quantidade: qtd, material }]);
    }
  };

  const removerMaterialVinculo = async (materialId: number) => {
    if (editingId) {
      try {
        const res = await fetch(`/api/servicos/${editingId}/materiais/${materialId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Falha ao remover");
        setServicoMateriais((prev) => prev.filter((sm) => sm.materialId !== materialId));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao remover material");
      }
    } else {
      setMateriaisPendentes((prev) => prev.filter((p) => p.materialId !== materialId));
    }
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const preco = parseFloat(precoBase);
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
      if (editingId) {
        const resposta = await fetch(`/api/servicos/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        });
        if (!resposta.ok) {
          const dados = await resposta.json().catch(() => ({}));
          throw new Error(dados.error || "Falha ao atualizar");
        }
        limparFormulario();
      } else {
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
      }
      await carregarServicos();
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const editar = (s: ServicoCatalogo) => {
    setDescricao(s.descricao);
    setTipoCobranca(s.tipo_cobranca ?? s.unidade_medida ?? "UNITARIO");
    setPrecoBase(String(s.precoBase));
    setEditingId(s.id);
    setError(null);
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
      if (editingId === s.id) limparFormulario();
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
      if (editingId === id) limparFormulario();
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
                  const v = e.target.value.replace(/[^0-9,.]/g, "").replace(",", ".");
                  const partes = v.split(".");
                  if (partes.length <= 2) setPrecoBase(partes.length === 2 ? `${partes[0]}.${partes[1]}` : v);
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
              {editingId ? (saving ? "Salvando…" : "Atualizar") : saving ? "Salvando…" : "Cadastrar"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={limparFormulario}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-elevated)]"
              >
                Concluir
              </button>
            )}
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
                const v = e.target.value.replace(/[^0-9,.]/g, "").replace(",", ".");
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
          {(editingId ? servicoMateriais : materiaisPendentes).length > 0 && (
            <ul className="mt-4 space-y-2">
              {(editingId
                ? servicoMateriais.map((sm) => (
                    <li
                      key={sm.id}
                      className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                    >
                      <span>
                        {sm.material?.nome_material} — {sm.quantidade} por unidade
                      </span>
                      <button
                        type="button"
                        onClick={() => removerMaterialVinculo(sm.materialId)}
                        className="text-[var(--danger)] hover:opacity-80"
                      >
                        Remover
                      </button>
                    </li>
                  ))
                : materiaisPendentes.map((p, idx) => (
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
                  )))}
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
      </main>
    </div>
  );
}
