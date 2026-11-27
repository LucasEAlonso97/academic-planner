import { create } from "zustand";

import { career, subjects } from "../data/career";

import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";

import { canEnrollSubject } from "../utils/academicRules";
import {
  enforcePrerequisites,
  sanitizeProgress,
  type Progress,
} from "../utils/progressValidation";

type AcademicProgressStore = {
  progress: Progress;

  updateSubjectStatus: (
    subject: AcademicSubject,
    status: SubjectStatus,
    resetSubjectIds?: string[]
  ) => boolean;

  replaceProgress: (progress: Progress) => void;

  resetProgress: () => void;
};

// v1 guardaba el objeto de progreso directamente en esta clave.
const LEGACY_STORAGE_KEY = "uai-planner-progress";

// v2 guarda { version, careerId, progress } para poder migrar
// datos y soportar más de una carrera en el futuro.
const STORAGE_KEY = "uai-planner:v2";

type StoredProgress = {
  version: 2;
  careerId: string;
  progress: Progress;
};

function readStorage(key: string): unknown {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function writeStorage(progress: Progress) {
  const payload: StoredProgress = {
    version: 2,
    careerId: career.career.id,
    progress,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Modo privado o almacenamiento lleno: la app sigue
    // funcionando, solo que el progreso no persiste.
  }
}

function loadProgress(): Progress {
  const stored = readStorage(STORAGE_KEY) as Partial<StoredProgress> | null;

  const raw: unknown =
    stored && stored.careerId === career.career.id
      ? stored.progress
      : readStorage(LEGACY_STORAGE_KEY);

  const { progress } = enforcePrerequisites(
    sanitizeProgress(raw, subjects),
    subjects
  );

  // Migra en silencio desde el formato viejo.
  if (raw !== null && !stored) {
    writeStorage(progress);

    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Ignorado.
    }
  }

  return progress;
}

export const useAcademicProgressStore = create<AcademicProgressStore>(
  (set, get) => ({
    progress: loadProgress(),

    updateSubjectStatus: (subject, status, resetSubjectIds = []) => {
      const currentProgress = get().progress;

      if (status !== "pending" && !canEnrollSubject(subject, currentProgress)) {
        return false;
      }

      const newProgress: Progress = {
        ...currentProgress,
        [subject.id]: status,
      };

      resetSubjectIds.forEach((subjectId) => {
        delete newProgress[subjectId];
      });

      if (status === "pending") {
        delete newProgress[subject.id];
      }

      writeStorage(newProgress);
      set({ progress: newProgress });

      return true;
    },

    replaceProgress: (incomingProgress) => {
      const { progress } = enforcePrerequisites(
        sanitizeProgress(incomingProgress, subjects),
        subjects
      );

      writeStorage(progress);
      set({ progress });
    },

    resetProgress: () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        // Ignorado.
      }

      set({ progress: {} });
    },
  })
);
