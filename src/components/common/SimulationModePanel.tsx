type SimulationModePanelProps = {
  changedSubjectsCount: number;
  onApply: () => void;
  onDiscard: () => void;
};

/**
 * Barra que se muestra fija arriba mientras hay una simulación
 * activa, para que siempre quede claro que los cambios no se guardan.
 */
export default function SimulationModePanel({
  changedSubjectsCount,
  onApply,
  onDiscard,
}: SimulationModePanelProps) {
  return (
    <section
      aria-label="Simulación activa"
      className="sticky top-16 z-20 rounded-2xl border border-blue-200 bg-blue-50/95 p-4 shadow-sm backdrop-blur lg:top-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-blue-950">
            Estás simulando un escenario
          </p>

          <p className="mt-0.5 text-[13px] text-blue-800">
            {changedSubjectsCount === 0
              ? "Cambiá estados para ver qué se habilita. Tu progreso real no se modifica."
              : `${changedSubjectsCount} ${
                  changedSubjectsCount === 1 ? "materia modificada" : "materias modificadas"
                }. Tu progreso real no cambió.`}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onDiscard}
            className="h-11 flex-1 rounded-xl border border-blue-300 bg-white px-4 text-sm font-semibold text-blue-900 transition hover:bg-blue-100 sm:flex-none"
          >
            Descartar
          </button>

          <button
            type="button"
            disabled={changedSubjectsCount === 0}
            onClick={onApply}
            className="h-11 flex-1 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </section>
  );
}
