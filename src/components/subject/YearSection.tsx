import { useId, useState } from "react";

import type { AcademicSubject } from "../../types/AcademicSubject";
import type { SubjectStatus } from "../../types/SubjectProgress";
import type { SubjectViewModel } from "../../utils/subjectView";

import SubjectRow from "./SubjectRow";
import { periodGroups } from "../../utils/subjectPeriods";

type YearSectionProps = {
  year: number;
  /** Materias del año que pasan el filtro actual. */
  viewModels: SubjectViewModel[];
  /** Todas las materias del año, para calcular el avance real. */
  yearViewModels: SubjectViewModel[];
  allSubjects: AcademicSubject[];
  defaultOpen: boolean;
  forceOpen: boolean;
  note?: string | null;
  onStatusChange: (subject: AcademicSubject, status: SubjectStatus) => boolean;
  grades: Record<string, number>;
  onGradeChange: (subjectId: string, grade: number | null) => void;
};


export default function YearSection({
  year,
  viewModels,
  yearViewModels,
  allSubjects,
  defaultOpen,
  forceOpen,
  note,
  onStatusChange,
  grades,
  onGradeChange,
}: YearSectionProps) {
  const [isOpenByUser, setIsOpenByUser] = useState(defaultOpen);
  const isOpen = forceOpen || isOpenByUser;
  const panelId = useId();

  const total = yearViewModels.length;
  const approved = yearViewModels.filter((viewModel) => viewModel.status === "passed").length;
  const percentage = total === 0 ? 0 : Math.round((approved / total) * 100);

  return (
    <section
      aria-label={`${year}° año`}
      className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white"
    >
      <h3>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpenByUser(!isOpen)}
          className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 text-left transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7B1730]/40 sm:px-5"
        >
          <span className="min-w-14 text-lg font-extrabold text-zinc-950">
            {year}° año
          </span>

          <span
            aria-hidden="true"
            className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-100 sm:w-48"
          >
            <span
              className="block h-full rounded-full bg-[#1F8A50] transition-all"
              style={{ width: `${percentage}%` }}
            />
          </span>

          <span className="text-[13px] text-zinc-600">
            {approved} de {total} aprobadas
          </span>

          <span className="order-last basis-full text-[13px] text-zinc-500 sm:order-none sm:flex-1 sm:basis-auto">
            {note}
          </span>

          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`ml-auto text-zinc-500 transition-transform sm:ml-0 ${isOpen ? "rotate-180" : ""}`}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </h3>

      {isOpen && (
        <div id={panelId} className="border-t border-zinc-100 px-4 pb-2 sm:px-5">
          {periodGroups.map((period) => {
            const semesterViewModels = viewModels.filter((viewModel) =>
              period.matches(viewModel.subject)
            );

            if (semesterViewModels.length === 0) {
              return null;
            }

            return (
              <div key={period.key}>
                <h4 className="pb-1 pt-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {period.label}
                </h4>

                <ul>
                  {semesterViewModels.map((viewModel) => (
                    <SubjectRow
                      key={viewModel.subject.id}
                      viewModel={viewModel}
                      allSubjects={allSubjects}
                      onStatusChange={onStatusChange}
                      grade={grades[viewModel.subject.id]}
                      onGradeChange={onGradeChange}
                    />
                  ))}
                </ul>
              </div>
            );
          })}

          {viewModels.length === 0 && (
            <p className="py-4 text-sm text-zinc-500">
              Ninguna materia de este año coincide con la búsqueda.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
