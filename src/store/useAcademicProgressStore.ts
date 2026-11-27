import { create } from "zustand";

import { DEFAULT_CAREER_ID, getCareer, isKnownCareer } from "../data/career";

import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";

import { isStatusAllowed } from "../utils/academicRules";
import {
  enforcePrerequisites,
  sanitizeCareerRecord,
  type CareerRecord,
  type Grades,
  type PlannedTerms,
  type Progress,
  type StatusAdjustment,
} from "../utils/progressValidation";

type AcademicProgressStore = CareerRecord & {
  careerId: string;

  /** Materias que se ajustaron al cargar porque no cumplían correlativas. */
  startupAdjustments: StatusAdjustment[];

  setCareer: (careerId: string) => void;

  /**
   * Cambia el estado de una materia si las correlativas lo permiten
   * y ajusta en cadena las materias que dejen de cumplirlas.
   */
  updateSubjectStatus: (subject: AcademicSubject, status: SubjectStatus) => boolean;

  /** Nota de una materia aprobada; `null` la borra. */
  setGrade: (subjectId: string, grade: number | null) => void;

  /** Cuatrimestre planificado ("2027-1"); `null` lo quita del plan. */
  setPlannedTerm: (subjectId: string, term: string | null) => void;
  replacePlan: (planned: PlannedTerms) => void;
  setPace: (pace: number) => void;

  replaceProgress: (progress: Progress) => void;

  /** Reemplaza todos los datos de una carrera (importación). */
  replaceCareerRecord: (careerId: string, record: Partial<CareerRecord>) => void;

  resetProgress: () => void;
};

const LEGACY_V1_KEY = "uai-planner-progress";
const V2_KEY = "uai-planner:v2";

// v3 guarda los datos de cada carrera por separado.
const STORAGE_KEY = "uai-planner:v3";

type StoredData = {
  version: 3;
  activeCareerId: string;
  careers: Record<string, Partial<CareerRecord>>;
};

export const DEFAULT_PACE = 5;

const emptyRecord = (): CareerRecord => ({
  progress: {},
  grades: {},
  planned: {},
  pace: DEFAULT_PACE,
});

function readStorage(key: string): unknown {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function removeStorage(...keys: string[]) {
  try {
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignorado.
  }
}

let stored: StoredData = { version: 3, activeCareerId: DEFAULT_CAREER_ID, careers: {} };

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Modo privado o almacenamiento lleno: la app sigue
    // funcionando, solo que el progreso no persiste.
  }
}

/** Lee v3, o migra desde v2 / v1. */
function loadStored(): StoredData {
  const v3 = readStorage(STORAGE_KEY) as Partial<StoredData> | null;

  if (v3 && v3.version === 3 && typeof v3.careers === "object" && v3.careers) {
    return {
      version: 3,
      activeCareerId: isKnownCareer(v3.activeCareerId) ? v3.activeCareerId : DEFAULT_CAREER_ID,
      careers: v3.careers,
    };
  }

  const v2 = readStorage(V2_KEY) as { careerId?: string; progress?: unknown } | null;
  const v1 = readStorage(LEGACY_V1_KEY);
  const migrated: StoredData = { version: 3, activeCareerId: DEFAULT_CAREER_ID, careers: {} };

  if (v2 && isKnownCareer(v2.careerId)) {
    migrated.activeCareerId = v2.careerId;
    migrated.careers[v2.careerId] = { progress: v2.progress as Progress };
  } else if (v1) {
    migrated.careers[DEFAULT_CAREER_ID] = { progress: v1 as Progress };
  }

  return migrated;
}

function loadRecord(careerId: string) {
  const { subjects } = getCareer(careerId);
  return sanitizeCareerRecord(stored.careers[careerId], subjects);
}

stored = loadStored();

const initial = loadRecord(stored.activeCareerId);

// Guarda la migración (o los ajustes) y limpia formatos viejos.
stored.careers[stored.activeCareerId] = initial.record;
persist();
removeStorage(V2_KEY, LEGACY_V1_KEY);

export const useAcademicProgressStore = create<AcademicProgressStore>((set, get) => {
  /** Guarda la carrera activa y actualiza el estado. */
  const save = (changes: Partial<CareerRecord>) => {
    const { careerId, progress, grades, planned, pace } = get();
    const record: CareerRecord = { progress, grades, planned, pace, ...changes };

    stored.careers[careerId] = record;
    stored.activeCareerId = careerId;
    persist();
    set(changes);
  };

  const subjectsOf = () => getCareer(get().careerId).subjects;

  return {
    careerId: stored.activeCareerId,
    ...initial.record,
    startupAdjustments: initial.adjusted,

    setCareer: (careerId) => {
      if (!isKnownCareer(careerId) || careerId === get().careerId) {
        return;
      }

      const { record } = loadRecord(careerId);

      stored.activeCareerId = careerId;
      stored.careers[careerId] = record;
      persist();

      set({ careerId, ...record, startupAdjustments: [] });
    },

    updateSubjectStatus: (subject, status) => {
      const currentProgress = get().progress;

      if (!isStatusAllowed(subject, status, currentProgress)) {
        return false;
      }

      const withChange: Progress = { ...currentProgress, [subject.id]: status };

      if (status === "pending") {
        delete withChange[subject.id];
      }

      save({ progress: enforcePrerequisites(withChange, subjectsOf(), subject.id).progress });

      return true;
    },

    setGrade: (subjectId, grade) => {
      const grades: Grades = { ...get().grades };

      if (grade === null) {
        delete grades[subjectId];
      } else {
        grades[subjectId] = grade;
      }

      save({ grades });
    },

    setPlannedTerm: (subjectId, term) => {
      const planned: PlannedTerms = { ...get().planned };

      if (term === null) {
        delete planned[subjectId];
      } else {
        planned[subjectId] = term;
      }

      save({ planned });
    },

    replacePlan: (planned) => save({ planned }),

    setPace: (pace) => save({ pace }),

    replaceProgress: (incomingProgress) => {
      const { record } = sanitizeCareerRecord(
        { ...get(), progress: incomingProgress },
        subjectsOf()
      );

      save({ progress: record.progress });
    },

    replaceCareerRecord: (careerId, incoming) => {
      if (!isKnownCareer(careerId)) {
        return;
      }

      const { record } = sanitizeCareerRecord(incoming, getCareer(careerId).subjects);

      stored.activeCareerId = careerId;
      stored.careers[careerId] = record;
      persist();

      set({ careerId, ...record, startupAdjustments: [] });
    },

    resetProgress: () => save(emptyRecord()),
  };
});
