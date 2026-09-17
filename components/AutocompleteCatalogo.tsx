"use client";

import React, { useRef, useEffect } from "react";

function matchInOrder(search: string, text: string): boolean {
  const s = search.toLowerCase().trim();
  if (!s) return true;
  const t = text.toLowerCase();
  let i = 0;
  for (let j = 0; j < t.length && i < s.length; j++) {
    if (t[j] === s[i]) i++;
  }
  return i === s.length;
}

type ItemCatalogo = { id: number; [key: string]: unknown };

type Props<T extends ItemCatalogo> = {
  tipo: "material" | "servico";
  busca: string;
  onBuscaChange: (value: string) => void;
  selecionadoId: number | null;
  onSelecionarCatalogo: (item: T) => void;
  onSelecionarCadastrarNoCatalogo?: (nome: string) => void;
  onSelecionarUsarSemCatalogar?: (nome: string) => void;
  itens: T[];
  getItemNome: (item: T) => string;
  placeholder?: string;
  id?: string;
  mostrarOpcaoCadastrar?: boolean;
  mostrarOpcaoUsarSemCatalogar?: boolean;
  compact?: boolean;
  inputClassName?: string;
};

export function AutocompleteCatalogo<T extends ItemCatalogo>(props: Props<T>) {
  const {
    busca,
    onBuscaChange,
    selecionadoId,
    itens,
    getItemNome,
    placeholder = "Digite para buscar...",
    id = "autocomplete",
  } = props;

  const ref = useRef<HTMLDivElement>(null);

  const itensFiltrados = itens.filter((item) => matchInOrder(busca, getItemNome(item)));
  const temExato = busca.trim() && itens.some((item) => getItemNome(item).toLowerCase() === busca.trim().toLowerCase());
  const mostrarCadastrar = props.mostrarOpcaoCadastrar !== false && props.onSelecionarCadastrarNoCatalogo;
  const mostraOpcaoCadastrar = mostrarCadastrar && busca.trim().length > 0 && !temExato;
  const mostrarUsarSemCatalogar = props.mostrarOpcaoUsarSemCatalogar && props.onSelecionarUsarSemCatalogar && busca.trim().length > 0 && !temExato;

  const [dropdownAberto, setDropdownAberto] = React.useState(false);

  const inputClasses = props.compact
    ? `w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] ${props.inputClassName ?? ""}`
    : `w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] ${props.inputClassName ?? ""}`;

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        id={id}
        type="text"
        value={busca}
        onChange={(e) => {
          onBuscaChange(e.target.value);
          setDropdownAberto(true);
        }}
        onFocus={() => setDropdownAberto(true)}
        placeholder={placeholder}
        className={inputClasses.trim()}
        autoComplete="off"
      />
      {dropdownAberto && (busca.length > 0 || itensFiltrados.length > 0) && (
        <ul
          className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] py-1 shadow-xl"
          role="listbox"
        >
          {itensFiltrados.map((item) => (
            <li
              key={item.id}
              role="option"
              aria-selected={selecionadoId === item.id}
              onClick={() => {
                props.onSelecionarCatalogo(item);
                setDropdownAberto(false);
              }}
              className={`cursor-pointer px-3 py-2 text-sm hover:bg-[var(--accent-soft)] ${selecionadoId === item.id ? "bg-[var(--accent-soft)]" : ""}`}
            >
              {getItemNome(item)}
            </li>
          ))}
          {mostraOpcaoCadastrar && props.onSelecionarCadastrarNoCatalogo && (
            <li
              role="option"
              aria-selected={false}
              onClick={() => {
                props.onSelecionarCadastrarNoCatalogo?.(busca.trim());
                setDropdownAberto(false);
              }}
              className="cursor-pointer border-t border-[var(--border)] bg-[var(--warning)]/15 px-3 py-2 text-sm font-medium text-[var(--warning)] hover:bg-[var(--warning)]/25"
            >
              ＋ Cadastrar &quot;{busca.trim()}&quot; no catálogo
            </li>
          )}
          {mostrarUsarSemCatalogar && props.onSelecionarUsarSemCatalogar && (
            <li
              role="option"
              aria-selected={false}
              onClick={() => {
                props.onSelecionarUsarSemCatalogar?.(busca.trim());
                setDropdownAberto(false);
              }}
              className="cursor-pointer border-t border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium hover:bg-[var(--accent-soft)]"
            >
              ＋ Usar &quot;{busca.trim()}&quot; como descrição (apenas neste orçamento)
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
