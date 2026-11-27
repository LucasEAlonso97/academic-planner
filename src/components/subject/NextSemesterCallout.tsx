import type { NextSemesterPlan } from "../../utils/planInsights";
import { joinNames } from "../../utils/planInsights";
import { pluralize } from "../../utils/statusDisplay";

type NextSemesterCalloutProps = {
  periodLabel: string;
  semesterLabel: string;
  plan: NextSemesterPlan;
};

export default function NextSemesterCallout({
  periodLabel,
  semesterLabel,
  plan,
}: NextSemesterCalloutProps) {
  const { available, blockers } = plan;
  const topBlocker = blockers[0];

  const title =
    available.length > 0
      ? `Podés cursar ${pluralize(available.length, "materia", "materias")} el ${semesterLabel}`
      : `No tenés materias habilitadas para el ${semesterLabel}`;

  // Si ya hay materias para cursar, la lista alcanza. Si no hay
  // ninguna, explicamos qué correlativa destraba más.
  let hint: string | null = null;

  if (available.length === 0 && topBlocker) {
    const unlockCount = pluralize(topBlocker.blocks.length, "materia", "materias");

    hint =
      topBlocker.status === "in_progress"
        ? `Si regularizás ${topBlocker.subject.name}, se habilitan ${unlockCount}.`
        : `Te falta ${topBlocker.subject.name} para habilitar ${unlockCount}.`;
  }

  return (
    <section
      id="proximo-cuatrimestre"
      aria-label="Próximo cuatrimestre"
      className="scroll-mt-24 rounded-2xl border border-[#F0DCE1] bg-[#FBF3F5] p-5 lg:scroll-mt-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          aria-hidden="true"
          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#7B1730] sm:flex"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
          </svg>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="text-[13px] font-semibold text-[#7B1730]">
            Próximo cuatrimestre · {periodLabel}
          </p>

          <h2 className="text-base font-bold text-zinc-900">{title}</h2>

          {available.length > 0 && (
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {available.map(({ subject }) => (
                <li
                  key={subject.id}
                  className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-[13px] font-medium text-zinc-800"
                >
                  {subject.name}
                </li>
              ))}
            </ul>
          )}

          {hint && topBlocker && (
            <p className="text-sm leading-6 text-zinc-700">
              {hint}{" "}
              <span className="text-zinc-500">
                ({joinNames(topBlocker.blocks.map((subject) => subject.name), 2)})
              </span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
