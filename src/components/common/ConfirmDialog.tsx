import type { ReactNode } from "react";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
      role="presentation"
      onClick={onCancel}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        onClick={(event) =>
          event.stopPropagation()
        }
        className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl"
      >
        <div className="border-b border-zinc-100 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-xl">
              ⚠️
            </div>

            <div className="min-w-0 flex-1">
              <h2
                id="confirm-dialog-title"
                className="text-xl font-black text-zinc-900"
              >
                {title}
              </h2>

              <div
                id="confirm-dialog-description"
                className="mt-2 text-sm leading-6 text-zinc-500"
              >
                {description}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 bg-zinc-50 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}