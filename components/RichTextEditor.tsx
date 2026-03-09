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
    <div className="rounded-lg border border-slate-300">
      <div className="flex gap-1 border-b border-slate-200 bg-slate-50 p-2">
        <button
          type="button"
          onClick={() => aplicarFormato("bold")}
          className="rounded px-2 py-1 text-sm font-bold hover:bg-slate-200"
          title="Negrito"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => aplicarFormato("italic")}
          className="rounded px-2 py-1 text-sm italic hover:bg-slate-200"
          title="Itálico"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => aplicarFormato("ul")}
          className="rounded px-2 py-1 text-sm hover:bg-slate-200"
          title="Lista não ordenada"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => aplicarFormato("ol")}
          className="rounded px-2 py-1 text-sm hover:bg-slate-200"
          title="Lista ordenada"
        >
          1.
        </button>
        <button
          type="button"
          onClick={() => aplicarFormato("br")}
          className="rounded px-2 py-1 text-sm hover:bg-slate-200"
          title="Quebra de linha"
        >
          ¶
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-b-lg border-0 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
        rows={4}
        placeholder="Digite a descrição do serviço..."
      />
    </div>
  );
}
