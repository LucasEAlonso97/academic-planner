import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";

export function isSubjectPassed(
  subjectId: string,
  progress: Record<string, SubjectStatus>
) {
  return progress[subjectId] === "passed";
}

export function isSubjectRegularOrPassed(
  subjectId: string,
  progress: Record<string, SubjectStatus>
) {
  const status = progress[subjectId] ?? "pending";

  return status === "regular" || status === "passed";
}

export function canEnrollSubject(
  subject: AcademicSubject,
  progress: Record<string, SubjectStatus>
) {
  return subject.prerequisites.every((prerequisiteId) =>
    isSubjectRegularOrPassed(prerequisiteId, progress)
  );
}

export function getMissingPrerequisites(
  subject: AcademicSubject,
  progress: Record<string, SubjectStatus>
) {
  return subject.prerequisites.filter(
    (prerequisiteId) =>
      !isSubjectRegularOrPassed(prerequisiteId, progress)
  );
}

export function getAvailableSubjects(
  subjects: AcademicSubject[],
  progress: Record<string, SubjectStatus>
) {
  return subjects.filter((subject) => {
    const status = progress[subject.id] ?? "pending";

    return status === "pending" && canEnrollSubject(subject, progress);
  });
}