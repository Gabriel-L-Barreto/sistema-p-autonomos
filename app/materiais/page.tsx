"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutHeader } from "@/components/LayoutHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { IconPencil, IconTrash, IconToggleOn, IconToggleOff } from "@/components/Icons";
import { formatarPreco } from "@/lib/format";

type TipoMedidaCatalogo = "UNITARIO" | "M2" | "M3" | "METROS";

type MaterialCatalogo = {
  id: number;
  nome_material: string;
  unidadeMedida: TipoMedidaCatalogo;
  precoUnitario: number;
  ativo: boolean;
};

export default function MateriaisPage() {
  const [materiais, setMateriais] = useState<MaterialCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome_material, setNomeMaterial] = useState("");
  const [unidadeMedida, setUnidadeMedida] = useState<TipoMedidaCatalogo>("UNITARIO");
  const [precoUnitario, setPrecoUnitario] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmExcluir, setConfirmExcluir] = useState<{ id: number; nome: string } | null>(null);
  const [busca, setBusca] = useState("");
  const [buscaDebounce, setBuscaDebounce] = useState("");

  const carregarMateriais = async () => {
    setLoading(true);
    try {
      const params = buscaDebounce ? `?q=${encodeURIComponent(buscaDebounce)}` : "";
      const resposta = await fetch(`/api/materiais${params}`);
      if (!resposta.ok) throw new Error("Falha ao carregar materiais");
      setMateriais(await resposta.json());
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMateriais();
  }, [buscaDebounce]);

  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounce(busca), 400);
    return () => clearTimeout(t);
  }, [busca]);

  const limparFormulario = () => {
    setNomeMaterial("");
    setUnidadeMedida("UNITARIO");
    setPrecoUnitario("");
    setEditingId(null);
    setError(null);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const preco = parseFloat(precoUnitario);
    if (!nome_material.trim()) {
      setError("Nome do material é obrigatório.");
      return;
    }
    if (Number.isNaN(preco) || preco < 0) {
      setError("Preço unitário deve ser um número maior ou igual a zero.");
      return;
    }
    setSaving(true);
    try {
      const corpo = {
        nome_material: nome_material.trim(),
        unidadeMedida,
        precoUnitario: preco,
      };
      if (editingId) {
        const resposta = await fetch(`/api/materiais/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        });
        if (!resposta.ok) {
          const dados = await resposta.json().catch(() => ({}));
          throw new Error(dados.error || "Falha ao atualizar");
        }
      } else {
        const resposta = await fetch("/api/materiais", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        });
        if (!resposta.ok) {
          const dados = await resposta.json().catch(() => ({}));
          throw new Error(dados.error || "Falha ao criar");
        }
      }
      limparFormulario();
      await carregarMateriais();
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const editar = (m: MaterialCatalogo) => {
    setNomeMaterial(m.nome_material);
    setUnidadeMedida(m.unidadeMedida);
    setPrecoUnitario(String(m.precoUnitario));
    setEditingId(m.id);
    setError(null);
  };

  const alternarAtivo = async (m: MaterialCatalogo) => {
    try {
      const resposta = await fetch(`/api/materiais/${m.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !m.ativo }),
      });
      if (!resposta.ok) throw new Error("Falha ao atualizar");
      await carregarMateriais();
      if (editingId === m.id) limparFormulario();
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao atualizar");
    }
  };

  const excluir = (id: number, nome: string) => {
    setConfirmExcluir({ id, nome });
  };

  const executarExcluir = async () => {
    if (!confirmExcluir) return;
    const { id } = confirmExcluir;
    setConfirmExcluir(null);
    try {
      const resposta = await fetch(`/api/materiais/${id}`, { method: "DELETE" });
      if (!resposta.ok) throw new Error("Falha ao excluir");
      if (editingId === id) limparFormulario();
      await carregarMateriais();
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao excluir");
    }
  };

  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <LayoutHeader paginaAtiva="catalogo" />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Materiais</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Cadastre materiais de forma rápida para reutilizar nos orçamentos.
        </p>

        <form onSubmit={salvar} className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="nome_material" className="block text-sm font-medium text-[var(--muted)]">
                Nome do material *
              </label>
              <input
                id="nome_material"
                type="text"
                value={nome_material}
                onChange={(e) => setNomeMaterial(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                placeholder="Ex.: Cimento, Tijolo"
              />
            </div>
            <div>
              <label htmlFor="unidadeMedida" className="block text-sm font-medium text-[var(--muted)]">
                Unidade de medida
              </label>
              <select
                id="unidadeMedida"
                value={unidadeMedida}
                onChange={(e) => setUnidadeMedida(e.target.value as TipoMedidaCatalogo)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
              >
                <option value="UNITARIO">Unitário</option>
                <option value="M2">M²</option>
                <option value="M3">M³</option>
                <option value="METROS">Metros</option>
              </select>
            </div>
            <div>
              <label htmlFor="precoUnitario" className="block text-sm font-medium text-[var(--muted)]">
                Preço unitário (R$)
              </label>
              <input
                id="precoUnitario"
                type="text"
                inputMode="decimal"
                value={precoUnitario}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9,.]/g, "").replace(",", ".");
                  const partes = v.split(".");
                  if (partes.length <= 2) setPrecoUnitario(partes.length === 2 ? `${partes[0]}.${partes[1]}` : v);
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
              <button type="button" onClick={limparFormulario} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-elevated)]">
                Cancelar
              </button>
            )}
          </div>
        </form>

        <section className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex flex-col gap-4 border-b border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold">Lista de materiais</h2>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
            />
          </div>
          {loading ? (
            <p className="p-6 text-sm text-[var(--muted)]">Carregando…</p>
          ) : materiais.length === 0 ? (
            <p className="p-6 text-sm text-[var(--muted)]">
              {buscaDebounce ? "Nenhum material encontrado para esta busca." : "Nenhum material cadastrado."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-elevated)]">
                    <th className="px-4 py-3 font-medium">Nome</th>
                    <th className="px-4 py-3 font-medium">Unidade</th>
                    <th className="px-4 py-3 font-medium">Preço unitário</th>
                    <th className="px-4 py-3 font-medium">Ativo</th>
                    <th className="px-4 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {materiais.map((m) => (
                    <tr key={m.id} className="border-b border-[var(--border)]">
                      <td className="px-4 py-3">{m.nome_material}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">{m.unidadeMedida === "M2" ? "M²" : m.unidadeMedida === "M3" ? "M³" : m.unidadeMedida === "METROS" ? "Metros" : "Unitário"}</td>
                      <td className="px-4 py-3">{formatarPreco(m.precoUnitario)}</td>
                      <td className="px-4 py-3">
                        <span className={m.ativo ? "rounded-full bg-[var(--success-soft)] px-2 py-1 text-xs text-[var(--success)]" : "rounded-full bg-[var(--surface-elevated)] px-2 py-1 text-xs text-[var(--muted)]"}>
                          {m.ativo ? "Sim" : "Não"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => editar(m)} className="inline-flex h-10 w-10 items-center justify-center rounded text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]" title="Editar"><IconPencil /></button>
                          <button
                            type="button"
                            onClick={() => alternarAtivo(m)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                            title={m.ativo ? "Desativar" : "Ativar"}
                          >
                            {m.ativo ? <IconToggleOn /> : <IconToggleOff />}
                          </button>
                          <button type="button" onClick={() => excluir(m.id, m.nome_material)} className="inline-flex h-10 w-10 items-center justify-center rounded text-[var(--danger)] hover:bg-[var(--danger-soft)]" title="Excluir"><IconTrash /></button>
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
          <Link href="/catalogo" className="text-[var(--accent)] hover:underline">← Voltar ao catálogo</Link>
        </p>

        {confirmExcluir && (
          <ConfirmDialog
            open
            title="Excluir material"
            message={`Excluir o material "${confirmExcluir.nome}"?`}
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
