import { useMemo } from "react";

import type { AcademicSubject, CareerTitle } from "../../types/AcademicSubject";
import type { SubjectStatus } from "../../types/SubjectProgress";

import { MAX_PACE, MIN_PACE } from "../../utils/progressValidation";
import {
  effectivePlan,
  estimateFinish,
  termIndex,
  upcomingTerms,
  validatePlan,
  type FinishEstimate,
  type PlanIssue,
  type Term,
} from "../../utils/semesterPlanner";
import { pluralize } from "../../utils/statusDisplay";

type PlanSectionProps = {
  subjects: AcademicSubject[];
  progress: Record<string, SubjectStatus>;
  planned: Record<string, string>;
  pace: number;
  titles: CareerTitle[];
  maxYear: number;
  start: Term;
  currentTerm: Term | null;
  onPlanSubject: (subjectId: string, termKey: string | null) => void;
  onAutoPlan: () => void;
  onClearPlan: () => void;
  onPaceChange: (pace: number) => void;
};

/** Cuántos cuatrimestres se muestran como mínimo y como máximo. */
const MIN_VISIBLE_TERMS = 4;
const MAX_TERMS = 16;

function describeIssue(issue: PlanIssue) {
  return issue.kind === "wrong-semester"
    ? `Se dicta en el ${issue.semester}° cuatrimestre`
    : `Antes necesitás cursar ${issue.prerequisite.name}`;
}

function describeEstimate(estimate: FinishEstimate) {
  switch (estimate.kind) {
    case "done":
      return "Ya cursaste todas las materias";
    case "incomplete":
      return `Faltan planificar ${pluralize(estimate.unplanned, "materia", "materias")}`;
    case "term":
      return `Terminarías de cursar en el ${estimate.term.longLabel}`;
  }
}

function TermSelect({
  subject,
  value,
  terms,
  label,
  onChange,
}: {
  subject: AcademicSubject;
  value: string;
  terms: Term[];
  label: string;
  onChange: (termKey: string | null) => void;
}) {
  // Se ofrecen los cuatrimestres en que se dicta la materia.
  const options = terms.filter((term) => term.semester === subject.semester || term.key === value);

  return (
    <label className="relative block shrink-0">
      <span className="sr-only">
        {label} {subject.name}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value || null)}
        className="h-9 w-[108px] cursor-pointer appearance-none rounded-lg border border-zinc-200 bg-white pl-2.5 pr-7 text-[13px] font-semibold text-zinc-800 outline-none transition hover:border-zinc-300 focus-visible:ring-2 focus-visible:ring-[#7B1730]/30"
      >
        <option value="">{value ? "Quitar" : "Agregar a…"}</option>
        {options.map((term) => (
          <option key={term.key} value={term.key}>
            {term.label}
          </option>
        ))}
      </select>
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </label>
  );
}

export default function PlanSection({
  subjects,
  progress,
  planned,
  pace,
  titles,
  maxYear,
  start,
  currentTerm,
  onPlanSubject,
  onAutoPlan,
  onClearPlan,
  onPaceChange,
}: PlanSectionProps) {
  const plan = useMemo(
    () => effectivePlan(subjects, progress, planned, start),
    [subjects, progress, planned, start]
  );
  const issues = useMemo(() => validatePlan(subjects, progress, plan), [subjects, progress, plan]);

  const pending = subjects.filter((subject) => (progress[subject.id] ?? "pending") === "pending");
  const unplanned = pending.filter((subject) => !plan.has(subject.id));

  const lastPlanned = [...plan.values()].reduce(
    (latest, term) => Math.max(latest, termIndex(term) - termIndex(start) + 1),
    0
  );
  const visibleTerms = upcomingTerms(start, Math.min(MAX_TERMS, Math.max(MIN_VISIBLE_TERMS, lastPlanned)));
  const selectableTerms = upcomingTerms(start, MAX_TERMS);

  // Títulos: el intermedio (si hay) y el final.
  const goals = [
    ...titles.filter((title) => title.years < maxYear),
    titles.find((title) => title.years >= maxYear) ?? { name: "Toda la carrera", years: maxYear },
  ];

  const issueCount = issues.size;

  return (
    <section
      id="planificar"
      aria-labelledby="plan-future-title"
      className="mt-4 flex scroll-mt-24 flex-col gap-4 lg:scroll-mt-8"
    >
      <div className="flex flex-col gap-1">
        <h2 id="plan-future-title" className="text-xl font-extrabold tracking-tight text-zinc-950">
          Planificar cuatrimestres
        </h2>
        <p className="text-sm text-zinc-600">
          Repartí las materias que te faltan en los próximos cuatrimestres y mirá cuándo terminarías
          de cursar. Te avisamos si una correlativa no llega a tiempo.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-[13px] font-medium text-zinc-700">
            Materias por cuatrimestre
            <select
              value={pace}
              onChange={(event) => onPaceChange(Number(event.target.value))}
              className="h-11 w-24 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-[#7B1730]/30"
            >
              {Array.from({ length: MAX_PACE - MIN_PACE + 1 }, (_, index) => MIN_PACE + index).map(
                (value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                )
              )}
            </select>
          </label>

          <button
            type="button"
            onClick={onAutoPlan}
            disabled={pending.length === 0}
            className="h-11 rounded-xl bg-[#7B1730] px-4 text-sm font-semibold text-white transition hover:bg-[#651226] disabled:opacity-40"
          >
            {plan.size > 0 ? "Rearmar plan automático" : "Armar plan automático"}
          </button>

          {plan.size > 0 && (
            <button
              type="button"
              onClick={onClearPlan}
              className="h-11 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              Borrar plan
            </button>
          )}
        </div>

        <dl className="grid gap-2 sm:grid-cols-2">
          {goals.map((goal) => {
            const estimate = estimateFinish(subjects, progress, plan, goal.years, currentTerm);

            return (
              <div key={goal.name} className="rounded-xl bg-zinc-50 px-4 py-3">
                <dt className="text-[13px] text-zinc-600">{goal.name}</dt>
                <dd
                  className={`mt-0.5 text-[15px] font-bold ${
                    estimate.kind === "incomplete" ? "text-zinc-500" : "text-zinc-900"
                  }`}
                >
                  {describeEstimate(estimate)}
                </dd>
              </div>
            );
          })}
        </dl>

        <p className="text-xs leading-5 text-zinc-500">
          Es una estimación de cursada: no incluye los finales. Supone que cada materia se dicta en
          el cuatrimestre del plan y que regularizás lo que cursás.
          {issueCount > 0 && (
            <strong className="ml-1 font-semibold text-red-700">
              {pluralize(issueCount, "materia tiene", "materias tienen")} problemas en el plan.
            </strong>
          )}
        </p>
      </div>

      {pending.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-8 text-center text-sm text-zinc-600">
          No te quedan materias por cursar.
        </p>
      ) : (
        <>
          <ol className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleTerms.map((term) => {
              const termSubjects = subjects.filter((subject) => plan.get(subject.id)?.key === term.key);
              const hours = termSubjects.reduce((total, subject) => total + subject.hours, 0);

              return (
                <li key={term.key} className="flex flex-col gap-2 rounded-2xl border border-zinc-200/80 bg-white p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-base font-extrabold text-zinc-950">{term.label}</h3>
                    <span className="text-xs text-zinc-500">
                      {termSubjects.length === 0
                        ? "Sin materias"
                        : `${pluralize(termSubjects.length, "materia", "materias")} · ${hours} h`}
                    </span>
                  </div>

                  {termSubjects.length > 0 && (
                    <ul className="flex flex-col gap-2">
                      {termSubjects.map((subject) => {
                        const subjectIssues = issues.get(subject.id) ?? [];

                        return (
                          <li
                            key={subject.id}
                            className={`flex flex-col gap-1.5 rounded-xl px-3 py-2.5 ${
                              subjectIssues.length > 0 ? "bg-red-50" : "bg-zinc-50"
                            }`}
                          >
                            <p className="text-[13px] font-semibold leading-snug text-zinc-900">
                              {subject.name}
                            </p>

                            {subjectIssues.map((issue) => (
                              <p key={describeIssue(issue)} className="text-xs font-medium text-red-700">
                                {describeIssue(issue)}
                              </p>
                            ))}

                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] text-zinc-500">
                                Cód. {subject.code} · {subject.year}° año
                              </span>

                              <TermSelect
                                subject={subject}
                                value={term.key}
                                terms={selectableTerms}
                                label="Cuatrimestre de"
                                onChange={(termKey) => onPlanSubject(subject.id, termKey)}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>

          {unplanned.length > 0 && (
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5">
              <h3 className="text-base font-bold text-zinc-900">
                Sin planificar{" "}
                <span className="font-medium text-zinc-500">({unplanned.length})</span>
              </h3>

              <ul className="mt-2 divide-y divide-zinc-100">
                {unplanned.map((subject) => (
                  <li key={subject.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900">{subject.name}</p>
                      <p className="text-xs text-zinc-500">
                        Cód. {subject.code} · {subject.year}° año · se dicta en el {subject.semester}° cuatrimestre
                      </p>
                    </div>

                    <TermSelect
                      subject={subject}
                      value=""
                      terms={selectableTerms}
                      label="Planificar"
                      onChange={(termKey) => onPlanSubject(subject.id, termKey)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
