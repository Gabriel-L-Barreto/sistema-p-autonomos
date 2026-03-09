"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutHeader } from "@/components/LayoutHeader";

type Config = {
  id: number;
  cabecalho: string;
  logoUrl: string | null;
  nomeAssinatura: string;
  cidadeEmissao: string | null;
};

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cabecalho, setCabecalho] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [nomeAssinatura, setNomeAssinatura] = useState("");
  const [cidadeEmissao, setCidadeEmissao] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/config/empresa");
        if (!res.ok) throw new Error("Falha ao carregar");
        const data = await res.json();
        setConfig(data);
        setCabecalho(data.cabecalho ?? "");
        setLogoUrl(data.logoUrl ?? "");
        setNomeAssinatura(data.nomeAssinatura ?? "");
        setCidadeEmissao(data.cidadeEmissao ?? "");
      } catch (erro) {
        setError(erro instanceof Error ? erro.message : "Erro");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/config/empresa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cabecalho: cabecalho.trim(),
          logoUrl: logoUrl.trim() || null,
          nomeAssinatura: nomeAssinatura.trim(),
          cidadeEmissao: cidadeEmissao.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Falha ao salvar");
      const data = await res.json();
      setConfig(data);
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <LayoutHeader />
        <main className="mx-auto max-w-2xl px-6 py-10">
          <p className="text-sm text-slate-500">Carregando…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <LayoutHeader />

      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Voltar ao início
          </Link>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Configurações do PDF
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Edite o cabeçalho, logo e nome da assinatura usados nos PDFs de orçamento.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={salvar} className="mt-6 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-medium text-slate-900">Cabeçalho</h2>
            <p className="mb-3 text-xs text-slate-500">
              CNPJ, contatos (tel/email) e endereço. Uma linha por informação.
            </p>
            <textarea
              value={cabecalho}
              onChange={(e) => setCabecalho(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder={"CNPJ: 00.000.000/0001-00\nContatos: Tel: (00) 00000-0000 / Email: email@exemplo.com\nRua Exemplo, 123 - Bairro - Cidade/MG"}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-medium text-slate-900">Logo</h2>
            <p className="mb-3 text-xs text-slate-500">
              Envie uma imagem ou cole uma URL. Aparece no PDF entre o cabeçalho e o número do orçamento.
            </p>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFile}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium"
                />
              </div>
              {logoUrl && (
                <div className="h-16 w-24 overflow-hidden rounded border border-slate-200">
                  <img
                    src={logoUrl}
                    alt="Preview logo"
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
            </div>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="Ou cole URL da imagem"
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-medium text-slate-900">Nome na assinatura</h2>
            <input
              type="text"
              value={nomeAssinatura}
              onChange={(e) => setNomeAssinatura(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="Ex.: Luiz Carlos Barreto"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-medium text-slate-900">Cidade de emissão</h2>
            <p className="mb-3 text-xs text-slate-500">
              Usada na data do documento (ex.: &quot;Barroso, 12 de janeiro de 2026&quot;).
            </p>
            <input
              type="text"
              value={cidadeEmissao}
              onChange={(e) => setCidadeEmissao(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="Ex.: Barroso"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar configurações"}
          </button>
        </form>
      </main>
    </div>
  );
}
