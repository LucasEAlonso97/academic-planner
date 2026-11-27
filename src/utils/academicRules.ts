import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";

/*
 * Régimen de correlatividades:
 * - Para CURSAR una materia (Cursando / Debe final), sus correlativas
 *   tienen que estar regularizadas: "Debe final" o "Aprobada".
 * - Para APROBAR una materia (rendir el final), sus correlativas
 *   tienen que estar aprobadas.
 */

type Progress = Record<string, SubjectStatus>;

const statusOf = (subjectId: string, progress: Progress): SubjectStatus =>
  progress[subjectId] ?? "pending";

export function isSubjectPassed(subjectId: string, progress: Progress) {
  return statusOf(subjectId, progress) === "passed";
}

export function isSubjectRegularOrPassed(subjectId: string, progress: Progress) {
  const status = statusOf(subjectId, progress);
  return status === "regular" || status === "passed";
}

/** ¿Se puede cursar? (correlativas regularizadas) */
export function canEnrollSubject(subject: AcademicSubject, progress: Progress) {
  return subject.prerequisites.every((id) => isSubjectRegularOrPassed(id, progress));
}

/** ¿Se puede rendir el final? (correlativas aprobadas) */
export function canPassSubject(subject: AcademicSubject, progress: Progress) {
  return subject.prerequisites.every((id) => isSubjectPassed(id, progress));
}

/** Correlativas que faltan regularizar para poder cursar. */
export function getMissingPrerequisites(subject: AcademicSubject, progress: Progress) {
  return subject.prerequisites.filter((id) => !isSubjectRegularOrPassed(id, progress));
}

/** Correlativas que faltan aprobar para poder rendir el final. */
export function getMissingForPass(subject: AcademicSubject, progress: Progress) {
  return subject.prerequisites.filter((id) => !isSubjectPassed(id, progress));
}

/** ¿Las correlativas permiten este estado? */
export function isStatusAllowed(
  subject: AcademicSubject,
  status: SubjectStatus,
  progress: Progress
) {
  switch (status) {
    case "pending":
      return true;
    case "in_progress":
    case "regular":
      return canEnrollSubject(subject, progress);
    case "passed":
      return canPassSubject(subject, progress);
  }
}

/**
 * El estado más avanzado que permiten las correlativas, sin pasar
 * del estado actual. Una materia "Aprobada" cuyas correlativas solo
 * están regularizadas baja a "Debe final"; si ni siquiera se pueden
 * cursar, baja a "Pendiente".
 */
export function getAllowedStatus(
  subject: AcademicSubject,
  status: SubjectStatus,
  progress: Progress
): SubjectStatus {
  if (isStatusAllowed(subject, status, progress)) {
    return status;
  }

  if (status === "passed" && canEnrollSubject(subject, progress)) {
    return "regular";
  }

  return "pending";
}

export function getAvailableSubjects(subjects: AcademicSubject[], progress: Progress) {
  return subjects.filter(
    (subject) =>
      statusOf(subject.id, progress) === "pending" && canEnrollSubject(subject, progress)
  );
}
