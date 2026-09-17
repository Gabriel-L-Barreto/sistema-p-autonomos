"use client";

type Props = {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  const isDanger = variant === "danger";
  const btnConfirmClass = isDanger
    ? "bg-[var(--danger)] hover:opacity-90 text-[var(--on-accent)]"
    : "bg-[var(--accent)] hover:opacity-90 text-[var(--on-accent)]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
        <h2 id="confirm-title" className="text-lg font-semibold text-[var(--foreground)]">
          {title}
        </h2>
        <div className="mt-3 text-sm text-[var(--muted)] [&>p+p]:mt-2">
          {message}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-elevated)]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--background)] ${btnConfirmClass} ${isDanger ? "focus:ring-[var(--danger)]" : "focus:ring-[var(--accent)]"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
