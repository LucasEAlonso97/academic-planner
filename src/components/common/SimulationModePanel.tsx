type SimulationModePanelProps = {
  isActive: boolean;
  changedSubjectsCount: number;
  onStart: () => void;
  onApply: () => void;
  onDiscard: () => void;
};

export default function SimulationModePanel({
  isActive,
  changedSubjectsCount,
  onStart,
  onApply,
  onDiscard,
}: SimulationModePanelProps) {
  if (isActive) {
    return (
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
              🧪
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                Simulación activa
              </p>

              <h2 className="mt-1 text-lg font-black text-blue-950">
                Estás probando un escenario
              </h2>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                Los cambios todavía no modificaron tu progreso
                real.
              </p>

              <p className="mt-2 text-sm font-bold text-blue-900">
                {changedSubjectsCount === 0
                  ? "Todavía no modificaste ninguna materia."
                  : `${changedSubjectsCount} ${
                      changedSubjectsCount === 1
                        ? "materia modificada"
                        : "materias modificadas"
                    } en la simulación.`}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onDiscard}
              className="rounded-xl border border-blue-300 bg-white px-5 py-2.5 text-sm font-bold text-blue-800 transition hover:bg-blue-100"
            >
              Salir y descartar
            </button>

            <button
              type="button"
              disabled={changedSubjectsCount === 0}
              onClick={onApply}
              className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Aplicar al progreso real
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-2xl">
            🧪
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7B1730]">
              Planificación
            </p>

            <h2 className="mt-1 text-lg font-black text-zinc-900">
              Probar un escenario académico
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
              Cambiá estados temporalmente para descubrir qué
              materias podrías desbloquear sin modificar tu
              progreso guardado.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="shrink-0 rounded-xl bg-[#7B1730] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#651226]"
        >
          Iniciar simulación
        </button>
      </div>
    </section>
  );
}