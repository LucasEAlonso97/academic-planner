import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";
import type { SubjectViewModel } from "./subjectView";

import { flexibleSubjectIds } from "./subjectPeriods";

const yearsOf = (subjects: AcademicSubject[]) =>
  [...new Set(subjects.map((subject) => subject.year))].sort();

/** Materias que dependen (directa o indirectamente) de `subject`. */
function dependentsOf(subject: AcademicSubject, allSubjects: AcademicSubject[]) {
  const result = new Set<string>();
  let changed = true;

  while (changed) {
    changed = false;

    for (const candidate of allSubjects) {
      if (
        !result.has(candidate.id) &&
        candidate.prerequisites.some((id) => id === subject.id || result.has(id))
      ) {
        result.add(candidate.id);
        changed = true;
      }
    }
  }

  return result;
}

/**
 * Describe las correlativas de forma legible. Si una materia pide un
 * año entero, lo resume como "1° año completo" en lugar de listar diez
 * nombres; si pide toda la carrera (una tesis), "Todas las demás materias".
 *
 * `forSubject` es la materia que pide las correlativas: sirve para no
 * exigirle su propio año completo (ni lo que depende de ella).
 */
export function describePrerequisites(
  prerequisiteIds: string[],
  allSubjects: AcademicSubject[],
  forSubject?: AcademicSubject
): string[] {
  const excluded = forSubject
    ? new Set([forSubject.id, ...dependentsOf(forSubject, allSubjects)])
    : new Set<string>();
  const relevant = allSubjects.filter((subject) => !excluded.has(subject.id));
  const remaining = new Set(prerequisiteIds);

  if (forSubject && relevant.length > 10 && relevant.every((subject) => remaining.has(subject.id))) {
    return ["Todas las demás materias"];
  }

  const parts: string[] = [];

  for (const year of yearsOf(allSubjects)) {
    const yearIds = relevant
      .filter((subject) => subject.year === year)
      .map((subject) => subject.id);

    if (yearIds.length > 1 && yearIds.every((id) => remaining.has(id))) {
      parts.push(`${year}° año completo`);
      yearIds.forEach((id) => remaining.delete(id));
    }
  }

  for (const subject of allSubjects) {
    if (remaining.has(subject.id)) {
      parts.push(subject.name);
    }
  }

  return parts;
}

/** Une una lista en castellano: "A", "A y B", "A, B y C". */
export function joinNames(names: string[], max = 3): string {
  if (names.length === 0) {
    return "";
  }

  const shown = names.slice(0, max);
  const hidden = names.length - shown.length;

  if (hidden > 0) {
    return `${shown.join(", ")} y ${hidden} más`;
  }

  if (shown.length === 1) {
    return shown[0];
  }

  return `${shown.slice(0, -1).join(", ")} y ${shown[shown.length - 1]}`;
}

export type Blocker = {
  subject: AcademicSubject;
  status: SubjectStatus;
  /** Materias bloqueadas que dependen de esta. */
  blocks: AcademicSubject[];
};

/**
 * Entre las materias bloqueadas que se pasan, encuentra qué
 * correlativas faltantes traban más materias.
 */
export function findBlockers(
  blocked: SubjectViewModel[],
  progress: Record<string, SubjectStatus>
): Blocker[] {
  const byId = new Map<string, Blocker>();

  for (const viewModel of blocked) {
    for (const missing of viewModel.missingPrerequisites) {
      const entry = byId.get(missing.id) ?? {
        subject: missing,
        status: progress[missing.id] ?? "pending",
        blocks: [],
      };

      entry.blocks.push(viewModel.subject);
      byId.set(missing.id, entry);
    }
  }

  return [...byId.values()].sort(
    (first, second) =>
      second.blocks.length - first.blocks.length ||
      first.subject.code - second.subject.code
  );
}

export type NextSemesterPlan = {
  available: SubjectViewModel[];
  blockers: Blocker[];
};

export function getNextSemesterPlan(
  viewModels: SubjectViewModel[],
  nextSemester: 1 | 2,
  progress: Record<string, SubjectStatus>
): NextSemesterPlan {
  const flexible = flexibleSubjectIds(viewModels.map((viewModel) => viewModel.subject));
  const inSemester = viewModels.filter(
    (viewModel) =>
      (viewModel.subject.semester === nextSemester || flexible.has(viewModel.subject.id)) &&
      viewModel.status === "pending"
  );

  return {
    available: inSemester.filter((viewModel) => viewModel.prerequisitesMet),
    blockers: findBlockers(
      inSemester.filter((viewModel) => !viewModel.prerequisitesMet),
      progress
    ),
  };
}
