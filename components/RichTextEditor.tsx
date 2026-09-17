"use client";

import React from "react";

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)]">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded-lg border-0 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        rows={5}
        placeholder="Digite o complemento do orçamento..."
      />
    </div>
  );
}
