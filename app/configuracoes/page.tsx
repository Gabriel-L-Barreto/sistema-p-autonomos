"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutHeader } from "@/components/LayoutHeader";
import { IconArrowLeft } from "@/components/Icons";

type Config = {
  id: number;
  cabecalho: string;
  rodape: string | null;
  logoUrl: string | null;
  timbradoUrl: string | null;
  timbradoRecebimentoUrl: string | null;
  pixQrCodeUrl: string | null;
  cabecalhoCor: string | null;
  cabecalhoLocal: string | null;
  rodapeLocal: string | null;
  nomeAssinatura: string;
  cidadeEmissao: string | null;
};

type Aba = "empresa" | "documento" | "visual";

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<Aba>("empresa");

  const [cabecalho, setCabecalho] = useState("");
  const [rodape, setRodape] = useState("");
  const [cabecalhoCor, setCabecalhoCor] = useState("#1f2b6b");
  const [cabecalhoLocal, setCabecalhoLocal] = useState<"inicio" | "meio" | "fim">("meio");
  const [rodapeLocal, setRodapeLocal] = useState<"inicio" | "meio" | "fim">("meio");
  const [logoUrl, setLogoUrl] = useState("");
  const [timbradoUrl, setTimbradoUrl] = useState("");
  const [timbradoRecebimentoUrl, setTimbradoRecebimentoUrl] = useState("");
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState("");
  const [nomeAssinatura, setNomeAssinatura] = useState("");
  const [cidadeEmissao, setCidadeEmissao] = useState("");

  const inputBase =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/config/empresa");
        if (!res.ok) throw new Error("Falha ao carregar");
        const data: Config = await res.json();
        setCabecalho(data.cabecalho ?? "");
        setRodape(data.rodape ?? "");
        setLogoUrl(data.logoUrl ?? "");
        setTimbradoUrl(data.timbradoUrl ?? "");
        setTimbradoRecebimentoUrl(data.timbradoRecebimentoUrl ?? "");
        setPixQrCodeUrl(data.pixQrCodeUrl ?? "");
        setCabecalhoCor(data.cabecalhoCor ?? "#1f2b6b");
        setCabecalhoLocal(["inicio", "meio", "fim"].includes(data.cabecalhoLocal ?? "") ? (data.cabecalhoLocal as "inicio" | "meio" | "fim") : "meio");
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
          timbradoRecebimentoUrl: timbradoRecebimentoUrl.trim() || null,
          pixQrCodeUrl: pixQrCodeUrl.trim() || null,
          cabecalhoCor: cabecalhoCor || null,
          cabecalhoLocal,
          rodape: rodape.trim() || null,
          rodapeLocal,
          nomeAssinatura: nomeAssinatura.trim(),
          cidadeEmissao: cidadeEmissao.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Falha ao salvar");
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

  const handleTimbradoRecebimentoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "image/png") return;
    const reader = new FileReader();
    reader.onload = () => setTimbradoRecebimentoUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handlePixQrCodeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setPixQrCodeUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <LayoutHeader paginaAtiva="configuracoes" />
        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <p className="text-sm text-[var(--muted)]">Carregando…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <LayoutHeader paginaAtiva="configuracoes" />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--accent)]">
            <IconArrowLeft className="h-4 w-4" /> Voltar ao início
          </Link>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Personalize a identidade e os dados dos documentos.</p>

        {error && (
          <div className="mt-4 rounded-lg border border-[var(--danger)]/50 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-1 border-b border-[var(--border)]">
          <button type="button" onClick={() => setAbaAtiva("empresa")} className={`rounded-t-lg px-4 py-2 text-sm font-medium ${abaAtiva === "empresa" ? "bg-[var(--surface)] text-[var(--accent)] border border-[var(--border)] border-b-transparent -mb-px" : "text-[var(--muted)]"}`}>Empresa</button>
          <button type="button" onClick={() => setAbaAtiva("documento")} className={`rounded-t-lg px-4 py-2 text-sm font-medium ${abaAtiva === "documento" ? "bg-[var(--surface)] text-[var(--accent)] border border-[var(--border)] border-b-transparent -mb-px" : "text-[var(--muted)]"}`}>Cabeçalho e rodapé</button>
          <button type="button" onClick={() => setAbaAtiva("visual")} className={`rounded-t-lg px-4 py-2 text-sm font-medium ${abaAtiva === "visual" ? "bg-[var(--surface)] text-[var(--accent)] border border-[var(--border)] border-b-transparent -mb-px" : "text-[var(--muted)]"}`}>Visual</button>
        </div>

        <form onSubmit={salvar} className="space-y-6 rounded-b-xl border border-t-0 border-[var(--border)] bg-[var(--surface)] p-6">
          {abaAtiva === "empresa" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--muted)]">Nome da empresa ou autônomo</label>
                <input value={nomeAssinatura} onChange={(e) => setNomeAssinatura(e.target.value)} className={inputBase} />
                <p className="mt-1 text-xs text-[var(--muted)]">Esse nome aparece na assinatura e na identidade do sistema.</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--muted)]">Cidade de emissão</label>
                <input value={cidadeEmissao} onChange={(e) => setCidadeEmissao(e.target.value)} className={inputBase} />
              </div>
            </div>
          )}

          {abaAtiva === "documento" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                <h2 className="font-medium">Cabeçalho</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">Informações para ficar na parte de cima da página de orçamentos. Aperte enter para escrever na linha embaixo.</p>
                <textarea value={cabecalho} onChange={(e) => setCabecalho(e.target.value)} rows={5} className={`${inputBase} mt-3 resize-none`} />
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-[var(--muted)]">Cor do texto (cabeçalho e rodapé)</label>
                    <input type="color" value={cabecalhoCor} onChange={(e) => setCabecalhoCor(e.target.value)} className="h-10 w-20 rounded border border-[var(--border)] bg-transparent" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[var(--muted)]">Posição</label>
                    <select value={cabecalhoLocal} onChange={(e) => setCabecalhoLocal(e.target.value as "inicio" | "meio" | "fim")} className={inputBase}>
                      <option value="inicio">Esquerda (início da página)</option>
                      <option value="meio">Centro (meio da página)</option>
                      <option value="fim">Direita (fim da página)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                <h2 className="font-medium">Rodapé</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">Informações para ficar no final da página.</p>
                <textarea value={rodape} onChange={(e) => setRodape(e.target.value)} rows={4} className={`${inputBase} mt-3 resize-none`} />
                <div className="mt-3">
                  <label className="mb-1 block text-xs text-[var(--muted)]">Posição</label>
                  <select value={rodapeLocal} onChange={(e) => setRodapeLocal(e.target.value as "inicio" | "meio" | "fim")} className={inputBase}>
                    <option value="inicio">Esquerda (início da página)</option>
                    <option value="meio">Centro (meio da página)</option>
                    <option value="fim">Direita (fim da página)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {abaAtiva === "visual" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                <h2 className="font-medium">Logo</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">Imagem do seu dispositivo ou links.</p>
                <input type="file" accept="image/*" onChange={handleLogoFile} className="mt-3 block w-full text-sm file:rounded-lg file:border-0 file:bg-[var(--accent-soft)] file:px-4 file:py-2 file:text-[var(--accent)]" />
                <input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className={`${inputBase} mt-3`} placeholder="https://..." />
                {logoUrl && (
                  <div className="mt-3 h-24 w-24 overflow-hidden rounded-lg border border-[var(--border)]">
                    <img src={logoUrl} alt="Preview logo" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                <h2 className="font-medium">Papel timbrado</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">Imagem PNG usada como fundo dos documentos.</p>
                <input type="file" accept="image/png" onChange={handleTimbradoFile} className="mt-3 block w-full text-sm file:rounded-lg file:border-0 file:bg-[var(--accent-soft)] file:px-4 file:py-2 file:text-[var(--accent)]" />
                {timbradoUrl && (
                  <div className="mt-3 h-24 w-24 overflow-hidden rounded-lg border border-[var(--border)]">
                    <img src={timbradoUrl} alt="Preview timbrado" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                <h2 className="font-medium">Papel timbrado exclusivo para recebimentos</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Se informado, será usado apenas nos PDFs de recebimento. Se vazio, usa o timbrado padrão.
                </p>
                <input
                  type="file"
                  accept="image/png"
                  onChange={handleTimbradoRecebimentoFile}
                  className="mt-3 block w-full text-sm file:rounded-lg file:border-0 file:bg-[var(--accent-soft)] file:px-4 file:py-2 file:text-[var(--accent)]"
                />
                <input
                  type="url"
                  value={timbradoRecebimentoUrl}
                  onChange={(e) => setTimbradoRecebimentoUrl(e.target.value)}
                  className={`${inputBase} mt-3`}
                  placeholder="https://... (ou apague para usar o timbrado padrão)"
                />
                {timbradoRecebimentoUrl && (
                  <div className="mt-3 h-24 w-24 overflow-hidden rounded-lg border border-[var(--border)]">
                    <img src={timbradoRecebimentoUrl} alt="Preview timbrado recebimento" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                <h2 className="font-medium">QR Code PIX para recebimentos</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Esse QR aparece automaticamente no PDF de recebimento quando a forma de pagamento for PIX.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePixQrCodeFile}
                  className="mt-3 block w-full text-sm file:rounded-lg file:border-0 file:bg-[var(--accent-soft)] file:px-4 file:py-2 file:text-[var(--accent)]"
                />
                <input
                  type="url"
                  value={pixQrCodeUrl}
                  onChange={(e) => setPixQrCodeUrl(e.target.value)}
                  className={`${inputBase} mt-3`}
                  placeholder="https://... (ou data:image/...)"
                />
                {pixQrCodeUrl && (
                  <div className="mt-3 h-24 w-24 overflow-hidden rounded-lg border border-[var(--border)]">
                    <img src={pixQrCodeUrl} alt="Preview QR Code PIX" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          )}

          <button type="submit" disabled={saving} className="rounded-lg bg-[var(--accent)] px-6 py-2 text-sm font-medium text-[var(--on-accent)] hover:opacity-90 disabled:opacity-50">
            {saving ? "Salvando…" : "Salvar configurações"}
          </button>
        </form>
      </main>
    </div>
  );
}
