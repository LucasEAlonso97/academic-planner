import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";
import { canEnrollSubject } from "./academicRules";

export function getAffectedSubjects(
  changedSubject: AcademicSubject,
  nextStatus: SubjectStatus,
  allSubjects: AcademicSubject[],
  progress: Record<string, SubjectStatus>
): AcademicSubject[] {
  const simulatedProgress: Record<string, SubjectStatus> = {
    ...progress,
    [changedSubject.id]: nextStatus,
  };

  const affectedSubjects: AcademicSubject[] = [];
  const affectedIds = new Set<string>();

  let foundNewAffectedSubject = true;

  while (foundNewAffectedSubject) {
    foundNewAffectedSubject = false;

    for (const subject of allSubjects) {
      if (
        subject.id === changedSubject.id ||
        affectedIds.has(subject.id)
      ) {
        continue;
      }

      const currentStatus =
        simulatedProgress[subject.id] ?? "pending";

      const hasAcademicProgress =
        currentStatus === "in_progress" ||
        currentStatus === "regular" ||
        currentStatus === "passed";

      if (
        hasAcademicProgress &&
        !canEnrollSubject(subject, simulatedProgress)
      ) {
        affectedSubjects.push(subject);
        affectedIds.add(subject.id);

        // Simulamos que vuelve a pendiente para detectar
        // también materias afectadas indirectamente.
        simulatedProgress[subject.id] = "pending";

        foundNewAffectedSubject = true;
      }
    }
  }

  return affectedSubjects.sort((firstSubject, secondSubject) => {
    if (firstSubject.year !== secondSubject.year) {
      return firstSubject.year - secondSubject.year;
    }

    if (firstSubject.semester !== secondSubject.semester) {
      return firstSubject.semester - secondSubject.semester;
    }

    return firstSubject.code - secondSubject.code;
  });
}