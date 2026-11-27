import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";

import { getAllowedStatus } from "./academicRules";

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

export type StatusAdjustment = {
  subject: AcademicSubject;
  from: SubjectStatus;
  to: SubjectStatus;
};

/**
 * Ajusta las materias cuyas correlativas no permiten su estado:
 * "Aprobada" baja a "Debe final" si las correlativas solo están
 * regularizadas, y cualquier estado baja a "Pendiente" si ni
 * siquiera se puede cursar. Repite hasta que todo quede coherente.
 *
 * `pinnedId` es una materia que no se toca (la que se está cambiando).
 */
export function enforcePrerequisites(
  progress: Progress,
  subjects: AcademicSubject[],
  pinnedId?: string
): { progress: Progress; adjusted: StatusAdjustment[] } {
  const result: Progress = { ...progress };
  const original = new Map<string, SubjectStatus>();

  let changed = true;

  while (changed) {
    changed = false;

    for (const subject of subjects) {
      if (subject.id === pinnedId) {
        continue;
      }

      const status = result[subject.id] ?? "pending";
      const allowed = getAllowedStatus(subject, status, result);

      if (allowed !== status) {
        if (!original.has(subject.id)) {
          original.set(subject.id, status);
        }

        if (allowed === "pending") {
          delete result[subject.id];
        } else {
          result[subject.id] = allowed;
        }

        changed = true;
      }
    }
  }

  const adjusted = subjects
    .filter((subject) => original.has(subject.id))
    .map((subject) => ({
      subject,
      from: original.get(subject.id)!,
      to: result[subject.id] ?? "pending",
    }));

  return { progress: result, adjusted };
}
