"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  inteiro?: boolean;
};

export function InputNumero({
  value,
  onChange,
  placeholder = "0",
  className = "",
  id,
  inteiro = false,
}: Props) {
  return (
    <input
      type="text"
      inputMode={inteiro ? "numeric" : "decimal"}
      pattern={inteiro ? "[0-9]*" : undefined}
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        if (inteiro) {
          onChange(v.replace(/[^0-9]/g, ""));
        } else {
          const limpo = v.replace(/[^0-9,.\s]/g, "").replace(/\s/g, "").replace(/\./g, ",");
          const partes = limpo.split(",");
          if (partes.length > 2) return;
          onChange(partes.length === 2 ? `${partes[0]},${partes[1]}` : partes[0]);
        }
      }}
      placeholder={placeholder}
      id={id}
      className={`rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${className}`}
    />
  );
}
