import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";
import type { SubjectViewModel } from "./subjectView";

const yearsOf = (subjects: AcademicSubject[]) =>
  [...new Set(subjects.map((subject) => subject.year))].sort();

/**
 * Describe las correlativas de forma legible. Si una materia pide
 * un año entero, lo resume como "1° año completo" en lugar de
 * listar diez nombres.
 */
export function describePrerequisites(
  prerequisiteIds: string[],
  allSubjects: AcademicSubject[]
): string[] {
  const remaining = new Set(prerequisiteIds);
  const parts: string[] = [];

  for (const year of yearsOf(allSubjects)) {
    const yearIds = allSubjects
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
  const inSemester = viewModels.filter(
    (viewModel) =>
      viewModel.subject.semester === nextSemester &&
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
