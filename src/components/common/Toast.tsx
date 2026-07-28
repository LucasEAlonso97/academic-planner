export type ToastType =
  | "success"
  | "info"
  | "warning"
  | "error";

export type ToastMessage = {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
};

type ToastProps = {
  toast: ToastMessage | null;
  onClose: () => void;
};

const toastStyles: Record<ToastType, string> = {
  success:
    "border-green-200 bg-green-50 text-green-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-red-200 bg-red-50 text-red-800",
};

const toastIcons: Record<ToastType, string> = {
  success: "✓",
  info: "i",
  warning: "!",
  error: "×",
};

export default function Toast({
  toast,
  onClose,
}: ToastProps) {
  if (!toast) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-[70] w-[calc(100%-2rem)] max-w-sm">
      <div
        role="status"
        className={`rounded-2xl border p-4 shadow-xl ${toastStyles[toast.type]}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current font-black">
            {toastIcons[toast.type]}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-black">
              {toast.title}
            </p>

            {toast.description && (
              <p className="mt-1 text-sm leading-5 opacity-80">
                {toast.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar notificación"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-black transition hover:bg-black/5"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}