import { create } from "zustand";

import { career, subjects } from "../data/career";

import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";

import { isStatusAllowed } from "../utils/academicRules";
import {
  enforcePrerequisites,
  sanitizeProgress,
  type Progress,
  type StatusAdjustment,
} from "../utils/progressValidation";

type AcademicProgressStore = {
  progress: Progress;

  /** Materias que se ajustaron al cargar porque no cumplían correlativas. */
  startupAdjustments: StatusAdjustment[];

  /**
   * Cambia el estado de una materia si las correlativas lo permiten
   * y ajusta en cadena las materias que dejen de cumplirlas.
   */
  updateSubjectStatus: (
    subject: AcademicSubject,
    status: SubjectStatus
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

function loadProgress(): { progress: Progress; adjusted: StatusAdjustment[] } {
  const stored = readStorage(STORAGE_KEY) as Partial<StoredProgress> | null;

  const raw: unknown =
    stored && stored.careerId === career.career.id
      ? stored.progress
      : readStorage(LEGACY_STORAGE_KEY);

  const { progress, adjusted } = enforcePrerequisites(
    sanitizeProgress(raw, subjects),
    subjects
  );

  // Migra desde el formato viejo y guarda los ajustes.
  if (raw !== null && (!stored || adjusted.length > 0)) {
    writeStorage(progress);

    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Ignorado.
    }
  }

  return { progress, adjusted };
}

const initial = loadProgress();

export const useAcademicProgressStore = create<AcademicProgressStore>(
  (set, get) => ({
    progress: initial.progress,
    startupAdjustments: initial.adjusted,

    updateSubjectStatus: (subject, status) => {
      const currentProgress = get().progress;

      if (!isStatusAllowed(subject, status, currentProgress)) {
        return false;
      }

      const withChange: Progress = { ...currentProgress, [subject.id]: status };

      if (status === "pending") {
        delete withChange[subject.id];
      }

      const { progress: newProgress } = enforcePrerequisites(withChange, subjects, subject.id);

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
