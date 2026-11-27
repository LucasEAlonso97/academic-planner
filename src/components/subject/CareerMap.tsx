import type { SubjectViewModel } from "../../utils/subjectView";

import { formatGrade } from "../../utils/grades";
import {
  displayStatusOrder,
  getDisplayStatus,
  statusStyles,
} from "../../utils/statusDisplay";

type CareerMapProps = {
  years: number[];
  viewModels: SubjectViewModel[];
  /** Materia que más materias traba, se resalta en el mapa. */
  keySubjectId: string | null;
  keySubjectLabel: string | null;
  grades: Record<string, number>;
};

const semesters = [1, 2] as const;

export default function CareerMap({
  years,
  viewModels,
  keySubjectId,
  keySubjectLabel,
  grades,
}: CareerMapProps) {
  return (
    <div className="flex flex-col gap-4">
      <ul aria-label="Referencias" className="flex flex-wrap gap-x-4 gap-y-2">
        {displayStatusOrder.map((status) => (
          <li key={status} className="flex items-center gap-2 text-[13px] text-zinc-700">
            <span
              aria-hidden="true"
              className={`h-3.5 w-3.5 rounded border ${statusStyles[status].tile}`}
            />
            {statusStyles[status].label}
          </li>
        ))}
      </ul>

      <div className={`grid gap-4 ${years.length > 3 ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
        {years.map((year) => {
          const yearViewModels = viewModels.filter(
            (viewModel) => viewModel.subject.year === year
          );
          const approved = yearViewModels.filter(
            (viewModel) => viewModel.status === "passed"
          ).length;

          return (
            <section
              key={year}
              aria-label={`${year}° año`}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-zinc-950">{year}° año</h3>
                <span className="text-[13px] text-zinc-600">
                  {approved} de {yearViewModels.length} aprobadas
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {semesters.map((semester) => (
                  <div key={semester} className="flex flex-col gap-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      {semester}° cuatr.
                    </h4>

                    <ul className="flex flex-col gap-2">
                      {yearViewModels
                        .filter((viewModel) => viewModel.subject.semester === semester)
                        .map((viewModel) => {
                          const status = getDisplayStatus(viewModel);
                          const isKey = viewModel.subject.id === keySubjectId;

                          return (
                            <li
                              key={viewModel.subject.id}
                              className={`flex min-h-[68px] flex-col gap-0.5 rounded-lg border px-2.5 py-2 ${statusStyles[status].tile} ${
                                isKey ? "outline outline-2 outline-offset-2 outline-[#7B1730]" : ""
                              }`}
                            >
                              <span className="flex justify-between gap-2 text-[11px] font-semibold opacity-80">
                                <span>Cód. {viewModel.subject.code}</span>
                                {status === "passed" && grades[viewModel.subject.id] !== undefined && (
                                  <span>Nota {formatGrade(grades[viewModel.subject.id])}</span>
                                )}
                              </span>
                              <span className="text-[13px] font-semibold leading-tight">
                                {viewModel.subject.name}
                              </span>
                              <span className="sr-only">{statusStyles[status].label}</span>
                              {isKey && keySubjectLabel && (
                                <span className="text-[11px] font-bold text-[#7B1730]">
                                  {keySubjectLabel}
                                </span>
                              )}
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
