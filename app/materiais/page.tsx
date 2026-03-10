"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutHeader } from "@/components/LayoutHeader";
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

  const excluir = async (id: number, nome: string) => {
    if (!confirm(`Excluir o material "${nome}"?`)) return;
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
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <LayoutHeader paginaAtiva="catalogo" />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Catálogo de materiais</h1>
        <p className="mt-1 text-sm text-slate-600">
          Cadastre materiais para usar nos orçamentos. Unidade: Unitário, M², M³ ou Metros.
        </p>

        <form onSubmit={salvar} className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="nome_material" className="block text-sm font-medium text-slate-700">
                Nome do material *
              </label>
              <input
                id="nome_material"
                type="text"
                value={nome_material}
                onChange={(e) => setNomeMaterial(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="Ex.: Cimento, Tijolo"
              />
            </div>
            <div>
              <label htmlFor="unidadeMedida" className="block text-sm font-medium text-slate-700">
                Unidade de medida
              </label>
              <select
                id="unidadeMedida"
                value={unidadeMedida}
                onChange={(e) => setUnidadeMedida(e.target.value as TipoMedidaCatalogo)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="UNITARIO">Unitário</option>
                <option value="M2">M²</option>
                <option value="M3">M³</option>
                <option value="METROS">Metros</option>
              </select>
            </div>
            <div>
              <label htmlFor="precoUnitario" className="block text-sm font-medium text-slate-700">
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
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="0,00"
              />
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {editingId ? (saving ? "Salvando…" : "Atualizar") : saving ? "Salvando…" : "Cadastrar"}
            </button>
            {editingId && (
              <button type="button" onClick={limparFormulario} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancelar
              </button>
            )}
          </div>
        </form>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold">Lista de materiais</h2>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Carregando…</p>
          ) : materiais.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              {buscaDebounce ? "Nenhum material encontrado para esta busca." : "Nenhum material cadastrado."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 font-medium text-slate-700">Nome</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Unidade</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Preço unitário</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Ativo</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {materiais.map((m) => (
                    <tr key={m.id} className="border-b border-slate-100">
                      <td className="px-4 py-3">{m.nome_material}</td>
                      <td className="px-4 py-3 text-slate-600">{m.unidadeMedida === "M2" ? "M²" : m.unidadeMedida === "M3" ? "M³" : m.unidadeMedida === "METROS" ? "Metros" : "Unitário"}</td>
                      <td className="px-4 py-3">{formatarPreco(m.precoUnitario)}</td>
                      <td className="px-4 py-3">
                        <span className={m.ativo ? "rounded-full bg-green-100 px-2 py-1 text-xs text-green-800" : "rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-600"}>
                          {m.ativo ? "Sim" : "Não"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => editar(m)} className="inline-flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded text-base text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900" title="Editar"><span aria-hidden>✎</span></button>
                          <button type="button" onClick={() => alternarAtivo(m)} className="inline-flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded text-base text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900" title={m.ativo ? "Desativar" : "Ativar"}><span aria-hidden>{m.ativo ? "⏸" : "⊕"}</span></button>
                          <button type="button" onClick={() => excluir(m.id, m.nome_material)} className="inline-flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded text-base text-red-600 transition-colors hover:bg-red-100 hover:text-red-800" title="Excluir"><span aria-hidden>🗑</span></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-4 text-sm text-slate-500">
          <Link href="/catalogo" className="text-slate-600 underline hover:text-slate-900">← Voltar ao catálogo</Link>
        </p>
      </main>
    </div>
  );
}
