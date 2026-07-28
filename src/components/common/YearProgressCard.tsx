import type { SubjectViewModel } from "../../utils/subjectView";

type YearProgressCardProps = {
  year: 1 | 2 | 3;
  viewModels: SubjectViewModel[];
};

export default function YearProgressCard({
  year,
  viewModels,
}: YearProgressCardProps) {
  const totalSubjects = viewModels.length;

  const approvedCount = viewModels.filter(
    (viewModel) => viewModel.status === "passed"
  ).length;

  const regularCount = viewModels.filter(
    (viewModel) => viewModel.status === "regular"
  ).length;

  const inProgressCount = viewModels.filter(
    (viewModel) => viewModel.status === "in_progress"
  ).length;

  const progressPercentage =
    totalSubjects === 0
      ? 0
      : Math.round((approvedCount / totalSubjects) * 100);

  return (
    <article className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7B1730]">
            Trayectoria
          </p>

          <h3 className="mt-1 text-lg font-black text-zinc-900">
            {year}° Año
          </h3>
        </div>

        <span className="rounded-full bg-[#7B1730]/10 px-3 py-1 text-sm font-black text-[#7B1730]">
          {progressPercentage}%
        </span>
      </div>

      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-zinc-200">
        <div
          role="progressbar"
          aria-label={`Progreso de ${year}° año`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercentage}
          className="h-full rounded-full bg-[#7B1730] transition-all duration-300"
          style={{
            width: `${progressPercentage}%`,
          }}
        />
      </div>

      <p className="mt-3 text-sm font-semibold text-zinc-700">
        {approvedCount} de {totalSubjects} materias aprobadas
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
          {approvedCount} aprobadas
        </span>

        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          {inProgressCount} cursando
        </span>

        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
          {regularCount} debe final
        </span>
      </div>
    </article>
  );
}