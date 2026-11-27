import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";
import {
  canEnrollSubject,
  canPassSubject,
  getMissingForPass,
  getMissingPrerequisites,
} from "./academicRules";

export type SubjectViewModel = {
  subject: AcademicSubject;
  status: SubjectStatus;
  prerequisitesMet: boolean;
  isAvailable: boolean;
  missingPrerequisites: AcademicSubject[];
  /** ¿Las correlativas están aprobadas? (necesario para rendir el final) */
  canPass: boolean;
  /** Correlativas que faltan aprobar para poder rendir el final. */
  missingForPass: AcademicSubject[];
  prerequisiteNames: string[];
  unlockedSubjects: AcademicSubject[];
};

export function buildSubjectViewModel(
  subject: AcademicSubject,
  allSubjects: AcademicSubject[],
  progress: Record<string, SubjectStatus>
): SubjectViewModel {
  const status = progress[subject.id] ?? "pending";

  const prerequisitesMet = canEnrollSubject(
    subject,
    progress
  );

  const isAvailable =
    status === "pending" && prerequisitesMet;

  const missingPrerequisiteIds =
    getMissingPrerequisites(subject, progress);

  const missingPrerequisites =
    missingPrerequisiteIds
      .map((prerequisiteId) =>
        allSubjects.find(
          (candidate) =>
            candidate.id === prerequisiteId
        )
      )
      .filter(
        (
          candidate
        ): candidate is AcademicSubject =>
          candidate !== undefined
      );

  const missingForPass = getMissingForPass(subject, progress)
    .map((id) => allSubjects.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is AcademicSubject => candidate !== undefined);

  const prerequisiteNames = subject.prerequisites
    .map(
      (prerequisiteId) =>
        allSubjects.find(
          (candidate) =>
            candidate.id === prerequisiteId
        )?.name
    )
    .filter(
      (name): name is string =>
        name !== undefined
    );

  const unlockedSubjects = allSubjects
    .filter((candidate) =>
      candidate.prerequisites.includes(subject.id)
    )
    .sort((firstSubject, secondSubject) => {
      if (firstSubject.year !== secondSubject.year) {
        return firstSubject.year - secondSubject.year;
      }

      if (
        firstSubject.semester !==
        secondSubject.semester
      ) {
        return (
          firstSubject.semester -
          secondSubject.semester
        );
      }

      return firstSubject.code - secondSubject.code;
    });

  return {
    subject,
    status,
    prerequisitesMet,
    isAvailable,
    missingPrerequisites,
    canPass: canPassSubject(subject, progress),
    missingForPass,
    prerequisiteNames,
    unlockedSubjects,
  };
}