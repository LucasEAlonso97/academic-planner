import {
  statusStyles,
  type DisplayStatus,
} from "../../utils/statusDisplay";

type ProgressSummaryProps = {
  counts: Record<DisplayStatus, number>;
  total: number;
  isSimulation: boolean;
};

const statOrder: { status: DisplayStatus; label: string }[] = [
  { status: "regular", label: "Debe final" },
  { status: "in_progress", label: "Cursando" },
  { status: "available", label: "Disponibles" },
  { status: "blocked", label: "Bloqueadas" },
];

const barOrder: DisplayStatus[] = ["passed", "regular", "in_progress"];

export default function ProgressSummary({
  counts,
  total,
  isSimulation,
}: ProgressSummaryProps) {
  const percentage = total === 0 ? 0 : Math.round((counts.passed / total) * 100);

  return (
    <section
      id="mi-avance"
      aria-label={isSimulation ? "Progreso simulado" : "Tu progreso"}
      className="scroll-mt-24 rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 lg:scroll-mt-8"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-4xl font-extrabold tracking-tight text-zinc-950">
              {percentage}%
            </span>

            <span className="text-sm text-zinc-600">
              {counts.passed} de {total} materias aprobadas
            </span>

            {isSimulation && (
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                Simulado
              </span>
            )}
          </div>

          <div
            role="progressbar"
            aria-label="Materias aprobadas"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
            className="flex h-2.5 overflow-hidden rounded-full bg-zinc-100"
          >
            {barOrder.map((status) => (
              <div
                key={status}
                className={`h-full transition-all duration-300 ${statusStyles[status].bar}`}
                style={{
                  width: `${total === 0 ? 0 : (counts[status] / total) * 100}%`,
                }}
              />
            ))}
          </div>
        </div>

        <dl className="grid flex-[1.4] grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {statOrder.map(({ status, label }) => (
            <div
              key={status}
              className="flex flex-col gap-1 rounded-xl bg-zinc-50 px-3.5 py-3"
            >
              <dt className="flex items-center gap-2 text-[13px] text-zinc-600">
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusStyles[status].dot}`}
                />
                {label}
              </dt>

              <dd className="text-2xl font-bold text-zinc-900">
                {counts[status]}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
