import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";

/*
 * Planificación de cuatrimestres futuros.
 *
 * Supuestos:
 * - Cada materia se dicta en el cuatrimestre que indica el plan.
 * - Lo que estás cursando ahora queda regularizado al terminar el
 *   cuatrimestre actual.
 * - Para cursar una materia, sus correlativas tienen que estar
 *   regularizadas antes de que empiece ese cuatrimestre.
 */

export type Term = {
  key: string;
  year: number;
  semester: 1 | 2;
  /** "1C 2027" */
  label: string;
  /** "1° cuatrimestre de 2027" */
  longLabel: string;
};

type Progress = Record<string, SubjectStatus>;
type PlannedTerms = Record<string, string>;

export function makeTerm(year: number, semester: 1 | 2): Term {
  return {
    key: `${year}-${semester}`,
    year,
    semester,
    label: `${semester}C ${year}`,
    longLabel: `${semester}° cuatrimestre de ${year}`,
  };
}

export function parseTerm(key: string): Term | null {
  const match = /^(\d{4})-([12])$/.exec(key);
  return match ? makeTerm(Number(match[1]), Number(match[2]) as 1 | 2) : null;
}

export function nextTerm(term: Term): Term {
  return term.semester === 1 ? makeTerm(term.year, 2) : makeTerm(term.year + 1, 1);
}

/** Índice para comparar cuatrimestres. */
export const termIndex = (term: Term) => term.year * 2 + (term.semester - 1);

export function upcomingTerms(start: Term, count: number): Term[] {
  const terms: Term[] = [start];

  while (terms.length < count) {
    terms.push(nextTerm(terms[terms.length - 1]));
  }

  return terms;
}

const isDone = (status: SubjectStatus) =>
  status === "regular" || status === "passed" || status === "in_progress";

/** Materias que todavía hay que cursar. */
export function subjectsToPlan(subjects: AcademicSubject[], progress: Progress) {
  return subjects.filter((subject) => (progress[subject.id] ?? "pending") === "pending");
}

/** Plan efectivo: solo materias pendientes y cuatrimestres desde `start`. */
export function effectivePlan(
  subjects: AcademicSubject[],
  progress: Progress,
  planned: PlannedTerms,
  start: Term
): Map<string, Term> {
  const result = new Map<string, Term>();

  for (const subject of subjectsToPlan(subjects, progress)) {
    const term = planned[subject.id] ? parseTerm(planned[subject.id]) : null;

    if (term && termIndex(term) >= termIndex(start)) {
      result.set(subject.id, term);
    }
  }

  return result;
}

export type PlanIssue =
  | { kind: "wrong-semester"; semester: 1 | 2 }
  | { kind: "prerequisite"; prerequisite: AcademicSubject };

/** Problemas de cada materia planificada. */
export function validatePlan(
  subjects: AcademicSubject[],
  progress: Progress,
  plan: Map<string, Term>
): Map<string, PlanIssue[]> {
  const byId = new Map(subjects.map((subject) => [subject.id, subject]));
  const issues = new Map<string, PlanIssue[]>();

  for (const [subjectId, term] of plan) {
    const subject = byId.get(subjectId)!;
    const list: PlanIssue[] = [];

    if (subject.semester !== term.semester) {
      list.push({ kind: "wrong-semester", semester: subject.semester });
    }

    for (const prerequisiteId of subject.prerequisites) {
      if (isDone(progress[prerequisiteId] ?? "pending")) {
        continue;
      }

      const prerequisiteTerm = plan.get(prerequisiteId);

      if (!prerequisiteTerm || termIndex(prerequisiteTerm) >= termIndex(term)) {
        list.push({ kind: "prerequisite", prerequisite: byId.get(prerequisiteId)! });
      }
    }

    if (list.length > 0) {
      issues.set(subjectId, list);
    }
  }

  return issues;
}

/** Cuántas materias dependen (directa o indirectamente) de cada una. */
function dependentCounts(subjects: AcademicSubject[]): Map<string, number> {
  const dependents = new Map<string, string[]>();

  for (const subject of subjects) {
    for (const prerequisiteId of subject.prerequisites) {
      dependents.set(prerequisiteId, [...(dependents.get(prerequisiteId) ?? []), subject.id]);
    }
  }

  const memo = new Map<string, Set<string>>();

  const collect = (id: string): Set<string> => {
    if (memo.has(id)) {
      return memo.get(id)!;
    }

    const all = new Set<string>();

    for (const child of dependents.get(id) ?? []) {
      all.add(child);
      collect(child).forEach((grandChild) => all.add(grandChild));
    }

    memo.set(id, all);
    return all;
  };

  return new Map(subjects.map((subject) => [subject.id, collect(subject.id).size]));
}

/**
 * Arma un plan automático: cuatrimestre por cuatrimestre, elige hasta
 * `pace` materias que se dicten en ese cuatrimestre y cuyas correlativas
 * ya estén cubiertas, priorizando las que destraban más materias.
 */
export function autoPlan(
  subjects: AcademicSubject[],
  progress: Progress,
  start: Term,
  pace: number,
  maxTerms = 24
): PlannedTerms {
  const remaining = subjectsToPlan(subjects, progress);
  const weight = dependentCounts(subjects);
  const covered = new Set(
    subjects.filter((subject) => isDone(progress[subject.id] ?? "pending")).map((subject) => subject.id)
  );

  const result: PlannedTerms = {};
  let term = start;

  for (let index = 0; index < maxTerms && remaining.length > 0; index += 1) {
    const candidates = remaining
      .filter(
        (subject) =>
          subject.semester === term.semester &&
          subject.prerequisites.every((prerequisiteId) => covered.has(prerequisiteId))
      )
      .sort(
        (first, second) =>
          (weight.get(second.id) ?? 0) - (weight.get(first.id) ?? 0) ||
          first.year - second.year ||
          first.code - second.code
      )
      .slice(0, pace);

    for (const subject of candidates) {
      result[subject.id] = term.key;
      remaining.splice(remaining.indexOf(subject), 1);
    }

    // Lo cursado en este cuatrimestre habilita el siguiente.
    candidates.forEach((subject) => covered.add(subject.id));
    term = nextTerm(term);
  }

  return result;
}

export type FinishEstimate =
  | { kind: "done" }
  | { kind: "term"; term: Term }
  | { kind: "incomplete"; unplanned: number };

/**
 * Cuándo terminarías de cursar las materias de los años indicados.
 */
export function estimateFinish(
  subjects: AcademicSubject[],
  progress: Progress,
  plan: Map<string, Term>,
  upToYear: number,
  currentTerm: Term | null
): FinishEstimate {
  const scope = subjects.filter((subject) => subject.year <= upToYear);
  const pending = scope.filter((subject) => (progress[subject.id] ?? "pending") === "pending");
  const unplanned = pending.filter((subject) => !plan.has(subject.id)).length;

  if (unplanned > 0) {
    return { kind: "incomplete", unplanned };
  }

  if (pending.length === 0) {
    const stillCursando = scope.some((subject) => progress[subject.id] === "in_progress");
    return stillCursando && currentTerm ? { kind: "term", term: currentTerm } : { kind: "done" };
  }

  const last = pending
    .map((subject) => plan.get(subject.id)!)
    .reduce((latest, term) => (termIndex(term) > termIndex(latest) ? term : latest));

  return { kind: "term", term: last };
}
