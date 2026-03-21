"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutHeader } from "@/components/LayoutHeader";

type Config = {
  id: number;
  cabecalho: string;
  rodape: string | null;
  logoUrl: string | null;
  timbradoUrl: string | null;
  cabecalhoCor: string | null;
  cabecalhoLocal: string | null;
  rodapeLocal: string | null;
  nomeAssinatura: string;
  cidadeEmissao: string | null;
};

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cabecalho, setCabecalho] = useState("");
  const [rodape, setRodape] = useState("");
  const [cabecalhoCor, setCabecalhoCor] = useState("#000000");
  const [cabecalhoLocal, setCabecalhoLocal] = useState<"inicio" | "meio" | "fim">("meio");
  const [rodapeLocal, setRodapeLocal] = useState<"inicio" | "meio" | "fim">("meio");
  const [logoUrl, setLogoUrl] = useState("");
  const [timbradoUrl, setTimbradoUrl] = useState("");
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
        setTimbradoUrl(data.timbradoUrl ?? "");
        setCabecalhoCor(data.cabecalhoCor ?? "#000000");
        setCabecalhoLocal(["inicio", "meio", "fim"].includes(data.cabecalhoLocal ?? "") ? (data.cabecalhoLocal as "inicio" | "meio" | "fim") : "meio");
        setRodape(data.rodape ?? "");
        setRodapeLocal(["inicio", "meio", "fim"].includes(data.rodapeLocal ?? "") ? (data.rodapeLocal as "inicio" | "meio" | "fim") : "meio");
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
          timbradoUrl: timbradoUrl.trim() || null,
          cabecalhoCor: cabecalhoCor || null,
          cabecalhoLocal: cabecalhoLocal,
          rodape: rodape.trim() || null,
          rodapeLocal: rodapeLocal,
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

  const handleTimbradoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "image/png") return;
    const reader = new FileReader();
    reader.onload = () => setTimbradoUrl(String(reader.result));
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
          <div className="rounded-xl border-2 border-slate-300 bg-white p-6 shadow-sm">
            <h2 className="mb-2 font-medium text-slate-900">Cabeçalho do PDF</h2>
            <p className="mb-3 text-xs text-slate-500">
              CNPJ, contatos (tel/email) e endereço. Digite cada informação em uma linha. Aparece no topo dos PDFs.
            </p>
            <label htmlFor="cabecalho" className="mb-1 block text-sm font-semibold text-slate-700">
              Caixa do cabeçalho (digite aqui):
            </label>
            <textarea
              id="cabecalho"
              value={cabecalho}
              onChange={(e) => setCabecalho(e.target.value)}
              rows={6}
              className="block w-full rounded-lg border-2 border-slate-500 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder={"CNPJ: 00.000.000/0001-00\nContatos: Tel: (00) 00000-0000 / Email: email@exemplo.com\nRua Exemplo, 123 - Bairro - Cidade/MG"}
              aria-label="Caixa do cabeçalho - digite CNPJ, contatos e endereço"
            />
            <div className="mt-3 flex items-center gap-4">
              <label htmlFor="cabecalhoCor" className="text-sm font-medium text-slate-700">
                Cor do cabeçalho
              </label>
              <input
                id="cabecalhoCor"
                type="color"
                value={cabecalhoCor}
                onChange={(e) => setCabecalhoCor(e.target.value)}
                className="h-10 w-16 cursor-pointer rounded border border-slate-300"
              />
              <span className="text-xs text-slate-500">{cabecalhoCor}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <label htmlFor="cabecalhoLocal" className="text-sm font-medium text-slate-700">
                Local do cabeçalho
              </label>
              <select
                id="cabecalhoLocal"
                value={cabecalhoLocal}
                onChange={(e) => setCabecalhoLocal(e.target.value as "inicio" | "meio" | "fim")}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="inicio">Início (esquerda)</option>
                <option value="meio">Meio (centro)</option>
                <option value="fim">Fim (direita)</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border-2 border-slate-300 bg-white p-6 shadow-sm">
            <h2 className="mb-2 font-medium text-slate-900">Rodapé do PDF</h2>
            <p className="mb-3 text-xs text-slate-500">
              Texto exibido no rodapé dos PDFs. Se vazio, será usado um texto padrão conforme o tipo de documento.
            </p>
            <label htmlFor="rodape" className="mb-1 block text-sm font-semibold text-slate-700">
              Caixa do rodapé (digite aqui):
            </label>
            <textarea
              id="rodape"
              value={rodape}
              onChange={(e) => setRodape(e.target.value)}
              rows={4}
              className="block w-full rounded-lg border-2 border-slate-500 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="Ex.: Documento válido por 30 dias a partir da data de emissão. Quaisquer modificações serão cobradas à parte."
              aria-label="Caixa do rodapé - texto exibido no fim dos PDFs"
            />
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <label htmlFor="rodapeLocal" className="text-sm font-medium text-slate-700">
                Local do rodapé
              </label>
              <select
                id="rodapeLocal"
                value={rodapeLocal}
                onChange={(e) => setRodapeLocal(e.target.value as "inicio" | "meio" | "fim")}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="inicio">Início (esquerda)</option>
                <option value="meio">Meio (centro)</option>
                <option value="fim">Fim (direita)</option>
              </select>
            </div>
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
            <h2 className="mb-3 font-medium text-slate-900">Papel timbrado</h2>
            <p className="mb-3 text-xs text-slate-500">
              Envie uma imagem PNG para usar como fundo nos PDFs de orçamento e recebimento. Ocupa toda a página A4.
            </p>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/png"
                  onChange={handleTimbradoFile}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium"
                />
              </div>
              {timbradoUrl && (
                <div className="h-16 w-24 overflow-hidden rounded border border-slate-200">
                  <img
                    src={timbradoUrl}
                    alt="Preview timbrado"
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
            </div>
            {timbradoUrl && (
              <button
                type="button"
                onClick={() => setTimbradoUrl("")}
                className="mt-2 text-xs text-slate-500 hover:text-red-600"
              >
                Remover timbrado
              </button>
            )}
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
