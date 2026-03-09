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
  onSelecionarCadastrarNoCatalogo: (nome: string) => void;
  itens: T[];
  getItemNome: (item: T) => string;
  placeholder?: string;
  id?: string;
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
  const mostraOpcaoCadastrar = busca.trim().length > 0 && !temExato;

  const [dropdownAberto, setDropdownAberto] = React.useState(false);

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
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        autoComplete="off"
      />
      {dropdownAberto && (busca.length > 0 || itensFiltrados.length > 0) && (
        <ul
          className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
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
              className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-100 data-[selected]:bg-slate-100"
            >
              {getItemNome(item)}
            </li>
          ))}
          {mostraOpcaoCadastrar && (
            <li
              role="option"
              onClick={() => {
                props.onSelecionarCadastrarNoCatalogo(busca.trim());
                setDropdownAberto(false);
              }}
              className="cursor-pointer border-t border-slate-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              ＋ Cadastrar &quot;{busca.trim()}&quot; no catálogo
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
