import { useEffect, useRef, useState } from "react";

import type { CareerSummary } from "../../data/career";
import { displayName } from "../../data/career";

type CareerPickerProps = {
  careers: CareerSummary[];
  onPick: (careerId: string) => Promise<boolean>;
};

/** Primera visita: "¿Qué carrera estudiás?" */
export default function CareerPicker({ careers, onPick }: CareerPickerProps) {
  const [picking, setPicking] = useState<string | null>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const pick = async (careerId: string) => {
    setPicking(careerId);
    const ok = await onPick(careerId);
    if (!ok) setPicking(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-zinc-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="career-picker-title"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8"
      >
        <img src="/pwa-192x192.png" alt="" width={48} height={48} className="h-12 w-12 rounded-xl" />

        <h2 id="career-picker-title" className="mt-5 text-2xl font-extrabold tracking-tight text-zinc-950">
          ¿Qué carrera estudiás?
        </h2>

        <p className="mt-1.5 text-sm leading-6 text-zinc-600">
          Elegila para ver tu plan de estudios. Podés cambiarla cuando quieras desde el menú.
        </p>

        <ul className="mt-5 flex flex-col gap-2">
          {careers.map((career, index) => {
            const isPicking = picking === career.id;

            return (
              <li key={career.id}>
                <button
                  ref={index === 0 ? firstButtonRef : undefined}
                  type="button"
                  disabled={picking !== null}
                  onClick={() => void pick(career.id)}
                  className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-zinc-200 px-4 py-3 text-left transition hover:border-[#7B1730]/40 hover:bg-[#FBF3F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1730]/40 disabled:cursor-wait disabled:opacity-60"
                >
                  <span className="flex flex-col">
                    <span className="text-[15px] font-bold text-zinc-900">{displayName(career)}</span>
                    <span className="text-xs text-zinc-500">
                      {career.degree ? `${career.degree} · ` : ""}Plan {career.plan}
                    </span>
                  </span>

                  <span aria-hidden="true" className="text-sm font-semibold text-[#7B1730]">
                    {isPicking ? "Cargando…" : "→"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-5 text-xs leading-5 text-zinc-500">
          ¿No está tu carrera? Pronto vamos a sumar más. Tu progreso se guarda solo en este
          dispositivo.
        </p>
      </section>
    </div>
  );
}
