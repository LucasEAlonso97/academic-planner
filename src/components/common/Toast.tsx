export type ToastType = "success" | "info" | "warning" | "error";

export type ToastMessage = {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
  /** Acción opcional, por ejemplo "Deshacer". */
  action?: {
    label: string;
    onClick: () => void;
  };
};

type ToastProps = {
  toast: ToastMessage | null;
  onClose: () => void;
};

const iconStyles: Record<ToastType, string> = {
  success: "bg-[#1F8A50]",
  info: "bg-[#2F6FD6]",
  warning: "bg-[#C77F00]",
  error: "bg-red-600",
};

function ToastIcon({ type }: { type: ToastType }) {
  const path =
    type === "success"
      ? "m5 12 5 5 9-10"
      : type === "error"
        ? "M7 7l10 10M17 7 7 17"
        : type === "warning"
          ? "M12 7v6M12 17h.01"
          : "M12 11v6M12 7h.01";

  return (
    <span
      aria-hidden="true"
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${iconStyles[type]}`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </svg>
    </span>
  );
}

export default function Toast({ toast, onClose }: ToastProps) {
  return (
    // La región existe siempre para que los lectores de pantalla
    // anuncien cada mensaje nuevo.
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex justify-center sm:inset-x-auto sm:bottom-6 sm:right-6"
    >
      {toast && (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-3.5 text-white shadow-xl"
        >
          <ToastIcon type={toast.type} />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{toast.title}</p>

            {toast.description && (
              <p className="mt-0.5 text-[13px] leading-5 text-zinc-300">
                {toast.description}
              </p>
            )}
          </div>

          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                onClose();
              }}
              className="h-11 shrink-0 rounded-lg px-2 text-sm font-semibold text-[#F3C1CD] hover:text-white"
            >
              {toast.action.label}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar notificación"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M7 7l10 10M17 7 7 17" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
