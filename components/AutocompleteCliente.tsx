"use client";

import React, { useRef, useEffect } from "react";
import type { Cliente } from "@/lib/types";

function matchCliente(search: string, cliente: Cliente): boolean {
  const s = search.toLowerCase().trim();
  if (!s) return true;
  const nome = (cliente.nome || "").toLowerCase();
  const afil = (cliente.afiliacao || "").toLowerCase();
  const tel = (cliente.telefone || "").toLowerCase();
  return nome.includes(s) || afil.includes(s) || tel.includes(s);
}

type Props = {
  clientes: Cliente[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (cliente: Cliente) => void;
  selectedId: number | "";
  placeholder?: string;
};

export function AutocompleteCliente({
  clientes,
  value,
  onChange,
  onSelect,
  selectedId,
  placeholder = "Buscar cliente...",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const filtrados = clientes
    .filter((c) => matchCliente(value, c))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
  const [aberto, setAberto] = React.useState(false);

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        autoComplete="off"
      />
      {aberto && (value.length > 0 || filtrados.length > 0) && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] py-1 shadow-xl">
          {filtrados.slice(0, 20).map((c) => (
            <li
              key={c.id}
              role="option"
              onClick={() => {
                onSelect(c);
                onChange(c.nome);
                setAberto(false);
              }}
              className={`cursor-pointer px-3 py-2 text-sm hover:bg-[var(--accent-soft)] ${selectedId === c.id ? "bg-[var(--accent-soft)]" : ""}`}
            >
              {c.nome}
              {c.afiliacao && <span className="ml-2 text-[var(--muted)] text-xs">({c.afiliacao})</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
