import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";

import { enforcePrerequisites, type StatusAdjustment } from "./progressValidation";

/**
 * Qué otras materias tendrían que cambiar de estado si `changedSubject`
 * pasa a `nextStatus`, para que el progreso siga respetando las
 * correlativas (incluye efectos en cadena).
 */
export function getAffectedSubjects(
  changedSubject: AcademicSubject,
  nextStatus: SubjectStatus,
  allSubjects: AcademicSubject[],
  progress: Record<string, SubjectStatus>
): StatusAdjustment[] {
  const simulated: Record<string, SubjectStatus> = {
    ...progress,
    [changedSubject.id]: nextStatus,
  };

  return enforcePrerequisites(simulated, allSubjects, changedSubject.id).adjusted.sort(
    (first, second) =>
      first.subject.year - second.subject.year ||
      first.subject.semester - second.subject.semester ||
      first.subject.code - second.subject.code
  );
}
