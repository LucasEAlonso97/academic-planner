import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";

import { getAllowedStatus } from "./academicRules";

export type Progress = Record<string, SubjectStatus>;

/** Nota de cada materia aprobada (escala 1 a 10). */
export type Grades = Record<string, number>;

/** Cuatrimestre planificado para cada materia, como "2027-1". */
export type PlannedTerms = Record<string, string>;

/** Todo lo que se guarda de una carrera. */
export type CareerRecord = {
  progress: Progress;
  grades: Grades;
  planned: PlannedTerms;
  /** Materias por cuatrimestre para el armado automático del plan. */
  pace: number;
};

export const MIN_GRADE = 4;
export const MAX_GRADE = 10;
export const MIN_PACE = 1;
export const MAX_PACE = 8;

const TERM_PATTERN = /^\d{4}-[12]$/;

export function isValidGrade(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= MIN_GRADE &&
    value <= MAX_GRADE
  );
}

export function isValidTerm(value: unknown): value is string {
  return typeof value === "string" && TERM_PATTERN.test(value);
}

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickValid<T>(
  raw: unknown,
  subjects: AcademicSubject[],
  isValid: (value: unknown) => value is T
): Record<string, T> {
  if (!isPlainObject(raw)) {
    return {};
  }

  const subjectIds = new Set(subjects.map((subject) => subject.id));
  const result: Record<string, T> = {};

  for (const [subjectId, value] of Object.entries(raw)) {
    if (subjectIds.has(subjectId) && isValid(value)) {
      result[subjectId] = value;
    }
  }

  return result;
}

/**
 * Valida todo lo guardado de una carrera. Las notas y el plan se
 * conservan aunque la materia cambie de estado (así "Deshacer" las
 * recupera); la interfaz solo usa la nota de las aprobadas y el plan
 * de las pendientes.
 */
export function sanitizeCareerRecord(
  raw: unknown,
  subjects: AcademicSubject[]
): { record: CareerRecord; adjusted: StatusAdjustment[] } {
  const source = isPlainObject(raw) ? raw : {};

  const { progress, adjusted } = enforcePrerequisites(
    sanitizeProgress(source.progress, subjects),
    subjects
  );

  const pace =
    typeof source.pace === "number" &&
    Number.isInteger(source.pace) &&
    source.pace >= MIN_PACE &&
    source.pace <= MAX_PACE
      ? source.pace
      : 5;

  return {
    record: {
      progress,
      grades: pickValid(source.grades, subjects, isValidGrade),
      planned: pickValid(source.planned, subjects, isValidTerm),
      pace,
    },
    adjusted,
  };
}
