import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";

import { canEnrollSubject } from "./academicRules";

export type Progress = Record<string, SubjectStatus>;

const validStatuses: ReadonlySet<string> = new Set<SubjectStatus>([
  "pending",
  "in_progress",
  "regular",
  "passed",
]);

export function isSubjectStatus(value: unknown): value is SubjectStatus {
  return typeof value === "string" && validStatuses.has(value);
}

/**
 * Se queda solo con materias que existen en el plan y con estados
 * válidos. Descarta cualquier otra cosa sin romper la app.
 */
export function sanitizeProgress(
  raw: unknown,
  subjects: AcademicSubject[]
): Progress {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return {};
  }

  const subjectIds = new Set(subjects.map((subject) => subject.id));
  const result: Progress = {};

  for (const [subjectId, status] of Object.entries(raw)) {
    if (subjectIds.has(subjectId) && isSubjectStatus(status) && status !== "pending") {
      result[subjectId] = status;
    }
  }

  return result;
}

/**
 * Devuelve a "Pendiente" las materias con avance cuyas correlativas
 * no se cumplen, repitiendo hasta que el progreso quede coherente.
 * Devuelve también la lista de materias que tuvo que ajustar.
 */
export function enforcePrerequisites(
  progress: Progress,
  subjects: AcademicSubject[]
): { progress: Progress; adjusted: AcademicSubject[] } {
  const result: Progress = { ...progress };
  const adjusted: AcademicSubject[] = [];

  let changed = true;

  while (changed) {
    changed = false;

    for (const subject of subjects) {
      const status = result[subject.id] ?? "pending";

      if (status !== "pending" && !canEnrollSubject(subject, result)) {
        delete result[subject.id];
        adjusted.push(subject);
        changed = true;
      }
    }
  }

  return { progress: result, adjusted };
}
