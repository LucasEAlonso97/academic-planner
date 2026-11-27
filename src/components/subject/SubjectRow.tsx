import { useId, useState } from "react";

import type { AcademicSubject } from "../../types/AcademicSubject";
import type { SubjectStatus } from "../../types/SubjectProgress";
import type { SubjectViewModel } from "../../utils/subjectView";

import GradeInput from "./GradeInput";
import { MAX_CUSTOM_NAME, isElective } from "../../utils/progressValidation";
import { periodLabel } from "../../utils/subjectPeriods";
import {
  describePrerequisites,
  joinNames,
} from "../../utils/planInsights";
import {
  getDisplayStatus,
  statusLabels,
  statusStyles,
} from "../../utils/statusDisplay";

type SubjectRowProps = {
  viewModel: SubjectViewModel;
  allSubjects: AcademicSubject[];
  onStatusChange: (subject: AcademicSubject, status: SubjectStatus) => boolean;
  grade?: number;
  onGradeChange: (subjectId: string, grade: number | null) => void;
  isEquivalence: boolean;
  onEquivalenceChange: (subjectId: string, isEquivalence: boolean) => void;
  customName?: string;
  onCustomNameChange: (subjectId: string, name: string | null) => void;
};

// "equivalence" es "Aprobada" marcada como equivalencia.
type SelectValue = SubjectStatus | "equivalence";

const options: SelectValue[] = ["pending", "in_progress", "regular", "passed", "equivalence"];

function LockIcon() {
  return (
    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="shrink-0">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export default function SubjectRow({
  viewModel,
  allSubjects,
  onStatusChange,
  grade,
  onGradeChange,
  isEquivalence,
  onEquivalenceChange,
  customName,
  onCustomNameChange,
}: SubjectRowProps) {
  const {
    subject,
    status,
    prerequisitesMet,
    canPass,
    missingPrerequisites,
    missingForPass,
    unlockedSubjects,
  } = viewModel;

  const [isExpanded, setIsExpanded] = useState(false);
  const detailsId = useId();

  const displayStatus = getDisplayStatus(viewModel);
  const style = statusStyles[displayStatus];
  const isBlocked = displayStatus === "blocked";

  // Puede cursarse, pero para rendir el final falta aprobar correlativas.
  const needsFinalsFirst =
    !isBlocked && status !== "passed" && !canPass && missingForPass.length > 0;

  const describe = (ids: string[]) => joinNames(describePrerequisites(ids, allSubjects, subject));

  const requirement = isBlocked
    ? `Falta: ${describe(missingPrerequisites.map((missing) => missing.id))}`
    : needsFinalsFirst
      ? `Para rendir: aprobá ${describe(missingForPass.map((missing) => missing.id))}`
      : subject.prerequisites.length === 0
        ? "Sin correlativas"
        : `Requiere: ${describe(subject.prerequisites)}`;

  const isOptionAllowed = (option: SelectValue) =>
    option === "pending" ||
    (option === "passed" || option === "equivalence" ? canPass : prerequisitesMet);

  const isPassedByEquivalence = status === "passed" && isEquivalence;
  const selectValue: SelectValue = isPassedByEquivalence ? "equivalence" : status;

  const handleSelect = (value: SelectValue) => {
    if (value === "equivalence") {
      // Ya aprobada: solo cambia la marca. Si no, primero se aprueba.
      if (status === "passed" || onStatusChange(subject, "passed")) {
        onEquivalenceChange(subject.id, true);
      }
      return;
    }

    if (isEquivalence) {
      onEquivalenceChange(subject.id, false);
    }

    if (value !== status) {
      onStatusChange(subject, value);
    }
  };

  const optionLabel = (option: SelectValue) => {
    if (option === "equivalence") return "Equivalencia";
    if (option === "pending" && status === "pending") return style.label;
    return statusLabels[option];
  };

  const [isEditingName, setIsEditingName] = useState(false);
  const elective = isElective(subject);

  const allRequirements = describePrerequisites(subject.prerequisites, allSubjects, subject);

  return (
    <li className={`border-b border-zinc-100 last:border-b-0 ${isExpanded ? "bg-zinc-50/70" : ""}`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3 sm:grid-cols-[40px_minmax(0,1.3fr)_minmax(0,1fr)_52px_auto] sm:gap-x-4">
        <span className="hidden text-[13px] tabular-nums text-zinc-500 sm:block">
          {subject.code}
        </span>

        <div className="min-w-0">
          {elective && isEditingName ? (
            <label className="flex items-center gap-2">
              <span className="sr-only">Nombre de la {subject.name.toLowerCase()} (código {subject.code})</span>
              <input
                autoFocus
                defaultValue={customName ?? ""}
                maxLength={MAX_CUSTOM_NAME}
                placeholder="¿Cuál elegiste?"
                onBlur={(event) => {
                  onCustomNameChange(subject.id, event.target.value);
                  setIsEditingName(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                  if (event.key === "Escape") setIsEditingName(false);
                }}
                className="h-9 w-full max-w-xs rounded-lg border border-zinc-300 px-2.5 text-sm font-semibold text-zinc-900 outline-none focus:border-[#7B1730] focus:ring-2 focus:ring-[#7B1730]/15"
              />
            </label>
          ) : (
            <p className={`text-[15px] font-semibold leading-snug ${isBlocked ? "text-zinc-500" : "text-zinc-900"}`}>
              {elective && customName ? (
                <>
                  <span className="mr-1.5 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                    Optativa
                  </span>
                  {customName}
                </>
              ) : (
                subject.name
              )}

              {elective && (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="ml-2 inline-flex h-7 items-center rounded-md px-1.5 text-xs font-semibold text-[#7B1730] hover:bg-[#FBF3F5]"
                >
                  {customName ? "Cambiar" : "Ponerle nombre"}
                </button>
              )}
            </p>
          )}

          {/* Línea secundaria en celular */}
          <p className="mt-0.5 flex items-center gap-1.5 text-xs leading-snug text-zinc-600 sm:hidden">
            {isBlocked && <LockIcon />}
            <span>
              Cód. {subject.code} · {requirement}
            </span>
          </p>
        </div>

        <p className="hidden items-center gap-1.5 text-[13px] leading-snug text-zinc-600 sm:flex">
          {isBlocked && <LockIcon />}
          <span className="line-clamp-2">{requirement}</span>
        </p>

        <span className="hidden text-right text-[13px] text-zinc-500 sm:block">
          {subject.hours} h
        </span>

        <div className="flex items-center gap-1.5">
          {status === "passed" && !isPassedByEquivalence && (
            <GradeInput
              key={grade ?? "sin-nota"}
              subjectName={subject.name}
              grade={grade}
              onChange={(value) => onGradeChange(subject.id, value)}
            />
          )}

          <label className="relative block">
            <span className="sr-only">Estado de {subject.name}</span>

            <span
              aria-hidden="true"
              className={`pointer-events-none absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${style.dot}`}
            />

            <select
              value={selectValue}
              onChange={(event) => handleSelect(event.target.value as SelectValue)}
              className={`h-9 w-[124px] cursor-pointer appearance-none rounded-full border py-0 pl-7 pr-7 text-[13px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#7B1730]/40 sm:w-[160px] ${style.pill}`}
            >
              {options.map((option) => (
                <option
                  key={option}
                  value={option}
                  disabled={!isOptionAllowed(option) && option !== selectValue}
                >
                  {optionLabel(option)}
                </option>
              ))}
            </select>

            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-70">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </label>

          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={detailsId}
            aria-label={`${isExpanded ? "Ocultar" : "Ver"} detalles de ${subject.name}`}
            onClick={() => setIsExpanded((value) => !value)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1730]/40"
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div
          id={detailsId}
          className="grid gap-3 pb-4 text-sm leading-6 text-zinc-700 sm:grid-cols-2 sm:pl-14"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Correlativas
            </p>

            {allRequirements.length === 0 ? (
              <p>Ninguna.</p>
            ) : (
              <ul className="mt-1 space-y-0.5">
                {allRequirements.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            )}

            {allRequirements.length > 0 && (
              <p className="mt-2 text-[13px] leading-5 text-zinc-500">
                Para cursarla tienen que estar en “Debe final” o
                “Aprobada”. Para rendir el final, aprobadas.
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Es correlativa de
            </p>

            {unlockedSubjects.length === 0 ? (
              <p>Ninguna materia.</p>
            ) : (
              <ul className="mt-1 space-y-0.5">
                {unlockedSubjects.map((unlocked) => (
                  <li key={unlocked.id} className="flex justify-between gap-3">
                    <span>{unlocked.name}</span>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {unlocked.year}° año · {periodLabel(unlocked)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
