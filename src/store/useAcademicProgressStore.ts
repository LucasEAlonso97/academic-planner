import { create } from "zustand";

import { getCareer, isKnownCareer } from "../data/career";

import { loadStored, persist as persistData, removeLegacyStorage } from "./persistence";

import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";

import { isStatusAllowed } from "../utils/academicRules";
import {
  enforcePrerequisites,
  sanitizeCareerRecord,
  type CareerRecord,
  type CustomNames,
  type Equivalences,
  type Grades,
  type PlannedTerms,
  type Progress,
  type StatusAdjustment,
} from "../utils/progressValidation";

type AcademicProgressStore = CareerRecord & {
  careerId: string;

  /** Materias que se ajustaron al cargar porque no cumplían correlativas. */
  startupAdjustments: StatusAdjustment[];

  /** Primera visita: todavía no eligió carrera. */
  isFirstVisit: boolean;

  /** Cambia a una carrera ya descargada (ver `loadCareer`). */
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

  /** Marca o desmarca una aprobada como "por equivalencia". */
  setEquivalence: (subjectId: string, isEquivalence: boolean) => void;

  /** Nombre de una optativa; `null` lo borra. */
  setCustomName: (subjectId: string, name: string | null) => void;

  replaceProgress: (progress: Progress) => void;

  /** Reemplaza todos los datos de una carrera (importación). */
  replaceCareerRecord: (careerId: string, record: Partial<CareerRecord>) => void;

  resetProgress: () => void;
};

export const DEFAULT_PACE = 5;

const emptyRecord = (): CareerRecord => ({
  progress: {},
  grades: {},
  planned: {},
  pace: DEFAULT_PACE,
  equivalences: {},
  customNames: {},
});

function loadRecord(careerId: string) {
  const { subjects } = getCareer(careerId);
  return sanitizeCareerRecord(stored.careers[careerId], subjects);
}

// main.tsx descarga la carrera activa antes de importar este módulo.
const { isFirstVisit, ...storedData } = loadStored();
const stored = storedData;
const persist = () => persistData(stored);

const initial = loadRecord(stored.activeCareerId);

// Guarda la migración (o los ajustes) y limpia formatos viejos.
// En la primera visita no se guarda nada hasta que se elija carrera.
if (!isFirstVisit) {
  stored.careers[stored.activeCareerId] = initial.record;
  persist();
  removeLegacyStorage();
}

export const useAcademicProgressStore = create<AcademicProgressStore>((set, get) => {
  /** Guarda la carrera activa y actualiza el estado. */
  const save = (changes: Partial<CareerRecord>) => {
    const { careerId, progress, grades, planned, pace, equivalences, customNames } = get();
    const record: CareerRecord = {
      progress,
      grades,
      planned,
      pace,
      equivalences,
      customNames,
      ...changes,
    };

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
    isFirstVisit,

    setCareer: (careerId) => {
      if (!isKnownCareer(careerId)) {
        return;
      }

      if (careerId === get().careerId) {
        // En la primera visita, elegir la carrera que ya estaba también cuenta.
        if (get().isFirstVisit) {
          save({});
          set({ isFirstVisit: false });
        }
        return;
      }

      const { record } = loadRecord(careerId);

      stored.activeCareerId = careerId;
      stored.careers[careerId] = record;
      persist();

      set({ careerId, ...record, startupAdjustments: [], isFirstVisit: false });
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

    setEquivalence: (subjectId, isEquivalence) => {
      const equivalences: Equivalences = { ...get().equivalences };

      if (isEquivalence) {
        equivalences[subjectId] = true;
      } else {
        delete equivalences[subjectId];
      }

      save({ equivalences });
    },

    setCustomName: (subjectId, name) => {
      const customNames: CustomNames = { ...get().customNames };
      const trimmed = name?.trim() ?? "";

      if (trimmed) {
        customNames[subjectId] = trimmed;
      } else {
        delete customNames[subjectId];
      }

      save({ customNames });
    },

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

      set({ careerId, ...record, startupAdjustments: [], isFirstVisit: false });
    },

    resetProgress: () => save(emptyRecord()),
  };
});

/** Datos guardados de una carrera (ya descargada), aunque no sea la activa. */
export function getStoredRecord(careerId: string): CareerRecord {
  const state = useAcademicProgressStore.getState();

  if (careerId === state.careerId) {
    const { progress, grades, planned, pace, equivalences, customNames } = state;
    return { progress, grades, planned, pace, equivalences, customNames };
  }

  return loadRecord(careerId).record;
}
