import { useEffect, useState } from "react";

import type { AcademicSubject } from "../../types/AcademicSubject";
import type { SubjectStatus } from "../../types/SubjectProgress";
import type { SubjectViewModel } from "../../utils/subjectView";

import SubjectCard from "./SubjectCard";

type YearSectionProps = {
  year: 1 | 2 | 3;
  viewModels: SubjectViewModel[];
  totalSubjects: number;
  forceOpen: boolean;
  onStatusChange: (
    subject: AcademicSubject,
    status: SubjectStatus
  ) => boolean;
};

const semesters = [1, 2] as const;

export default function YearSection({
  year,
  viewModels,
  totalSubjects,
  forceOpen,
  onStatusChange,
}: YearSectionProps) {
  const [isOpen, setIsOpen] = useState(year === 1);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const approvedCount = viewModels.filter(
    (viewModel) => viewModel.status === "passed"
  ).length;

  const progressPercentage =
    totalSubjects === 0
      ? 0
      : Math.round((approvedCount / totalSubjects) * 100);

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="flex w-full items-center justify-between gap-5 bg-[#7B1730] px-6 py-5 text-left text-white transition hover:bg-[#681329]"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black">
              {year}° Año
            </h3>

            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white/90">
              {viewModels.length} de {totalSubjects} materias
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{
                  width: `${progressPercentage}%`,
                }}
              />
            </div>

            <span className="text-xs font-bold text-white/80">
              {progressPercentage}%
            </span>
          </div>
        </div>

        <span
          aria-hidden="true"
          className={`shrink-0 text-lg transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="p-5">
          {semesters.map((semester) => {
            const semesterViewModels = viewModels.filter(
              (viewModel) =>
                viewModel.subject.semester === semester
            );

            if (semesterViewModels.length === 0) {
              return null;
            }

            return (
              <div
                key={semester}
                className="mb-8 last:mb-0"
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h4 className="text-sm font-black uppercase tracking-wide text-zinc-500">
                    {semester === 1
                      ? "Primer cuatrimestre"
                      : "Segundo cuatrimestre"}
                  </h4>

                  <span className="text-xs font-semibold text-zinc-400">
                    {semesterViewModels.length}{" "}
                    {semesterViewModels.length === 1
                      ? "materia"
                      : "materias"}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {semesterViewModels.map((viewModel) => (
                    <SubjectCard
                      key={viewModel.subject.id}
                      subject={viewModel.subject}
                      status={viewModel.status}
                      prerequisitesMet={
                        viewModel.prerequisitesMet
                      }
                      isAvailable={viewModel.isAvailable}
                      missingPrerequisites={
                        viewModel.missingPrerequisites
                      }
                      prerequisitesCount={
                        viewModel.prerequisiteNames.length
                      }
                      onStatusChange={onStatusChange}
                      unlockedSubjects={
                        viewModel.unlockedSubjects
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}