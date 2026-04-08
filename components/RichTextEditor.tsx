"use client";

import React from "react";

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const aplicarFormato = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textoSelecionado = value.substring(start, end);
    const antes = value.substring(0, start);
    const depois = value.substring(end);

    let novoTexto = "";
    switch (tag) {
      case "bold":
        novoTexto = antes + `<strong>${textoSelecionado || "texto"}</strong>` + depois;
        break;
      case "italic":
        novoTexto = antes + `<em>${textoSelecionado || "texto"}</em>` + depois;
        break;
      case "ul":
        novoTexto = antes + `<ul><li>${textoSelecionado || "item"}</li></ul>` + depois;
        break;
      case "ol":
        novoTexto = antes + `<ol><li>${textoSelecionado || "item"}</li></ol>` + depois;
        break;
      case "br":
        novoTexto = antes + `<br />` + depois;
        break;
      default:
        return;
    }

    onChange(novoTexto);
    setTimeout(() => {
      textarea.focus();
      const newPos =
        start +
        (tag === "br" ? 6 : tag === "bold" ? 17 : tag === "italic" ? 15 : 20);
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <div className="rounded-lg border border-[var(--border)]">
      <div className="flex gap-1 border-b border-[var(--border)] bg-[var(--surface-elevated)] p-2">
        <button
          type="button"
          onClick={() => aplicarFormato("bold")}
          className="rounded px-2 py-1 text-sm font-bold hover:bg-[var(--accent-soft)]"
          title="Negrito"
        >
          Negrito
        </button>
        <button
          type="button"
          onClick={() => aplicarFormato("italic")}
          className="rounded px-2 py-1 text-sm italic hover:bg-[var(--accent-soft)]"
          title="Itálico"
        >
          Itálico
        </button>
        <button
          type="button"
          onClick={() => aplicarFormato("ul")}
          className="rounded px-2 py-1 text-sm hover:bg-[var(--accent-soft)]"
          title="Lista não ordenada"
        >
          Lista
        </button>
        <button
          type="button"
          onClick={() => aplicarFormato("ol")}
          className="rounded px-2 py-1 text-sm hover:bg-[var(--accent-soft)]"
          title="Lista ordenada"
        >
          Numerada
        </button>
        <button
          type="button"
          onClick={() => aplicarFormato("br")}
          className="rounded px-2 py-1 text-sm hover:bg-[var(--accent-soft)]"
          title="Quebra de linha"
        >
          Quebra linha
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-b-lg border-0 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        rows={4}
        placeholder="Digite o complemento do orçamento..."
      />
    </div>
  );
}
