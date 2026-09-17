"use client";

import { useEffect, useState } from "react";
import { LayoutHeader } from "@/components/LayoutHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { IconPencil, IconTrash } from "@/components/Icons";
import type { Cliente } from "@/lib/types";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("");
  const [afiliacao, setAfiliacao] = useState("");
  const [telefone, setTelefone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmExcluir, setConfirmExcluir] = useState<{ id: number; nome: string } | null>(null);
  const [busca, setBusca] = useState("");
  const [buscaDebounce, setBuscaDebounce] = useState("");
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [erroEdit, setErroEdit] = useState<string | null>(null);

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
      const resposta = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}));
        throw new Error(dados.error || "Falha ao criar");
      }
      limparFormulario();
      await carregarClientes();
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    setErroEdit(null);
    if (!editando.nome.trim()) {
      setErroEdit("Nome é obrigatório.");
      return;
    }
    setSavingEdit(true);
    try {
      const resposta = await fetch(`/api/clientes/${editando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: editando.nome.trim(),
          afiliacao: editando.afiliacao?.trim() || null,
          telefone: editando.telefone?.trim() || null,
        }),
      });
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}));
        throw new Error(dados.error || "Falha ao atualizar");
      }
      setEditando(null);
      await carregarClientes();
    } catch (erro) {
      setErroEdit(erro instanceof Error ? erro.message : "Erro ao salvar");
    } finally {
      setSavingEdit(false);
    }
  };

  const editar = (c: Cliente) => {
    setErroEdit(null);
    setEditando({
      id: c.id,
      nome: c.nome,
      afiliacao: c.afiliacao ?? null,
      telefone: c.telefone ?? null,
    });
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
      if (editando?.id === id) setEditando(null);
      await carregarClientes();
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao excluir");
    }
  };

  const inputBase = "mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";

  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <LayoutHeader paginaAtiva="clientes" />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>

        <form
          onSubmit={salvar}
          className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
        >
          <h2 className="mb-3 text-base font-semibold">Cadastro de clientes</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-[var(--muted)]">
                Nome *
              </label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className={inputBase}
                placeholder="Ex: Maria, Nome da Empresa"
              />
            </div>
            <div>
              <label htmlFor="afiliacao" className="block text-sm font-medium text-[var(--muted)]">
                Afiliação
              </label>
              <input
                id="afiliacao"
                type="text"
                value={afiliacao}
                onChange={(e) => setAfiliacao(e.target.value)}
                className={inputBase}
                placeholder="Nome do responsável, caso tenha"
              />
            </div>
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-[var(--muted)]">
                Telefone
              </label>
              <input
                id="telefone"
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className={inputBase}
                placeholder="XX XXXXX-XXXX"
              />
            </div>
          </div>
          {error && (
            <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>
          )}
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

        <details className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <summary className="cursor-pointer border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
            Lista de clientes
          </summary>
          <div className="flex flex-col gap-4 border-b border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-[var(--muted)]">Buscar cliente</h2>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, afiliação ou telefone..."
              className="w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          {loading ? (
            <p className="p-6 text-sm text-[var(--muted)]">Carregando…</p>
          ) : clientes.length === 0 ? (
            <p className="p-6 text-sm text-[var(--muted)]">
              {buscaDebounce ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-elevated)]">
                    <th className="px-4 py-3 font-medium">Nome</th>
                    <th className="px-4 py-3 font-medium text-[var(--muted)]">Afiliação</th>
                    <th className="px-4 py-3 font-medium text-[var(--muted)]">Telefone</th>
                    <th className="px-4 py-3 font-medium text-[var(--muted)]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c) => (
                    <tr key={c.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-elevated)]/50">
                      <td className="px-4 py-3">{c.nome}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">{c.afiliacao ?? "—"}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">{c.telefone ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => editar(c)}
                            className="inline-flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                            title="Editar"
                          >
                            <IconPencil />
                          </button>
                          <button
                            type="button"
                            onClick={() => excluir(c.id, c.nome)}
                            className="inline-flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]"
                            title="Excluir"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </details>

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

        {editando && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-soft)] p-4">
            <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
              <h3 className="text-lg font-semibold">Editar cliente</h3>
              <form onSubmit={salvarEdicao} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)]">Nome *</label>
                  <input
                    type="text"
                    value={editando.nome}
                    onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)]">Afiliação</label>
                  <input
                    type="text"
                    value={editando.afiliacao ?? ""}
                    onChange={(e) => setEditando({ ...editando, afiliacao: e.target.value || null })}
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)]">Telefone</label>
                  <input
                    type="text"
                    value={editando.telefone ?? ""}
                    onChange={(e) => setEditando({ ...editando, telefone: e.target.value || null })}
                    className={inputBase}
                  />
                </div>
                {erroEdit && <p className="text-sm text-[var(--danger)]">{erroEdit}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditando(null)}
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
