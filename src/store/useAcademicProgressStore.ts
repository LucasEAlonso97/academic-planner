import { create } from "zustand";

import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";

import { canEnrollSubject } from "../utils/academicRules";

type AcademicProgressStore = {
  progress: Record<string, SubjectStatus>;

  updateSubjectStatus: (
    subject: AcademicSubject,
    status: SubjectStatus,
    resetSubjectIds?: string[]
  ) => boolean;

  getSubjectStatus: (
    subjectId: string
  ) => SubjectStatus;

  replaceProgress: (
    progress: Record<string, SubjectStatus>
  ) => void;

  resetProgress: () => void;
};

const STORAGE_KEY = "uai-planner-progress";

const loadProgress = (): Record<
  string,
  SubjectStatus
> => {
  const savedProgress =
    localStorage.getItem(STORAGE_KEY);

  if (!savedProgress) {
    return {};
  }

  try {
    return JSON.parse(savedProgress) as Record<
      string,
      SubjectStatus
    >;
  } catch {
    return {};
  }
};

const saveProgress = (
  progress: Record<string, SubjectStatus>
) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(progress)
  );
};

export const useAcademicProgressStore =
  create<AcademicProgressStore>((set, get) => ({
    progress: loadProgress(),

    updateSubjectStatus: (
      subject,
      status,
      resetSubjectIds = []
    ) => {
      const currentProgress = get().progress;

      const requiresPrerequisites =
        status === "in_progress" ||
        status === "regular" ||
        status === "passed";

      if (
        requiresPrerequisites &&
        !canEnrollSubject(
          subject,
          currentProgress
        )
      ) {
        return false;
      }

      const newProgress: Record<
        string,
        SubjectStatus
      > = {
        ...currentProgress,
        [subject.id]: status,
      };

      resetSubjectIds.forEach((subjectId) => {
        newProgress[subjectId] = "pending";
      });

      saveProgress(newProgress);

      set({
        progress: newProgress,
      });

      return true;
    },

    getSubjectStatus: (subjectId) => {
      return (
        get().progress[subjectId] ?? "pending"
      );
    },

    replaceProgress: (importedProgress) => {
      saveProgress(importedProgress);

      set({
        progress: importedProgress,
      });
    },

    resetProgress: () => {
      localStorage.removeItem(STORAGE_KEY);

      set({
        progress: {},
      });
    },
  }));