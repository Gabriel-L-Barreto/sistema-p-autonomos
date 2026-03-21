"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutHeader } from "@/components/LayoutHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Cliente } from "@/lib/types";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("");
  const [afiliacao, setAfiliacao] = useState("");
  const [telefone, setTelefone] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmExcluir, setConfirmExcluir] = useState<{ id: number; nome: string } | null>(null);
  const [busca, setBusca] = useState("");
  const [buscaDebounce, setBuscaDebounce] = useState("");

  const carregarClientes = async () => {
    setLoading(true);
    try {
      const params = buscaDebounce ? `?q=${encodeURIComponent(buscaDebounce)}` : "";
      const resposta = await fetch(`/api/clientes${params}`);
      if (!resposta.ok) throw new Error("Falha ao carregar clientes");
      setClientes(await resposta.json());
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarClientes();
  }, [buscaDebounce]);

  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounce(busca), 400);
    return () => clearTimeout(t);
  }, [busca]);

  const limparFormulario = () => {
    setNome("");
    setAfiliacao("");
    setTelefone("");
    setEditingId(null);
    setError(null);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nome.trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      const corpo = {
        nome: nome.trim(),
        afiliacao: afiliacao.trim() || null,
        telefone: telefone.trim() || null,
      };
      if (editingId) {
        const resposta = await fetch(`/api/clientes/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        });
        if (!resposta.ok) {
          const dados = await resposta.json().catch(() => ({}));
          throw new Error(dados.error || "Falha ao atualizar");
        }
      } else {
        const resposta = await fetch("/api/clientes", {
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
      await carregarClientes();
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const editar = (c: Cliente) => {
    setNome(c.nome);
    setAfiliacao(c.afiliacao ?? "");
    setTelefone(c.telefone ?? "");
    setEditingId(c.id);
    setError(null);
  };

  const excluir = (id: number, nomeCliente: string) => {
    setConfirmExcluir({ id, nome: nomeCliente });
  };

  const executarExcluir = async () => {
    if (!confirmExcluir) return;
    const { id } = confirmExcluir;
    setConfirmExcluir(null);
    try {
      const resposta = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
      if (!resposta.ok) throw new Error("Falha ao excluir");
      if (editingId === id) limparFormulario();
      await carregarClientes();
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao excluir");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <LayoutHeader paginaAtiva="clientes" />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        <p className="mt-1 text-sm text-slate-600">
          Cadastre e edite clientes. Nome é obrigatório.
        </p>

        <form
          onSubmit={salvar}
          className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-slate-700">
                Nome *
              </label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="Ex: Maria, Nome da Empresa"
              />
            </div>
            <div>
              <label htmlFor="afiliacao" className="block text-sm font-medium text-slate-700">
                Afiliação
              </label>
              <input
                id="afiliacao"
                type="text"
                value={afiliacao}
                onChange={(e) => setAfiliacao(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="Nome do responsável, caso tenha"
              />
            </div>
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-slate-700">
                Telefone
              </label>
              <input
                id="telefone"
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="XX XXXXX-XXXX"
              />
            </div>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {editingId ? (saving ? "Salvando…" : "Atualizar") : saving ? "Salvando…" : "Cadastrar"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={limparFormulario}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold">Lista de clientes</h2>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, afiliação ou telefone..."
              className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Carregando…</p>
          ) : clientes.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              {buscaDebounce ? "Nenhum cliente encontrado para esta busca." : "Nenhum cliente cadastrado."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 font-medium text-slate-700">Nome</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Afiliação</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Telefone</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100">
                      <td className="px-4 py-3">{c.nome}</td>
                      <td className="px-4 py-3 text-slate-600">{c.afiliacao ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{c.telefone ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => editar(c)}
                            className="inline-flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded text-base text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
                            title="Editar"
                          >
                            <span aria-hidden>✎</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => excluir(c.id, c.nome)}
                            className="inline-flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded text-base text-red-600 transition-colors hover:bg-red-100 hover:text-red-800"
                            title="Excluir"
                          >
                            <span aria-hidden>🗑</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {confirmExcluir && (
          <ConfirmDialog
            open
            title="Excluir cliente"
            message={`Excluir o cliente "${confirmExcluir.nome}"?`}
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
