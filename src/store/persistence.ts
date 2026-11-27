import { DEFAULT_CAREER_ID, isKnownCareer } from "../data/career";

import type { CareerRecord, Progress } from "../utils/progressValidation";

/*
 * Lectura y escritura del progreso en localStorage. Está separado del
 * store para que main.tsx sepa qué carrera descargar antes de arrancar.
 */

const LEGACY_V1_KEY = "uai-planner-progress";
const V2_KEY = "uai-planner:v2";

// v3 guarda los datos de cada carrera por separado.
const STORAGE_KEY = "uai-planner:v3";

export type StoredData = {
  version: 3;
  activeCareerId: string;
  careers: Record<string, Partial<CareerRecord>>;
};

function readStorage(key: string): unknown {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function removeLegacyStorage() {
  try {
    localStorage.removeItem(V2_KEY);
    localStorage.removeItem(LEGACY_V1_KEY);
  } catch {
    // Ignorado.
  }
}

export function persist(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Modo privado o almacenamiento lleno: la app sigue
    // funcionando, solo que el progreso no persiste.
  }
}

/**
 * Lee v3, o migra desde v2 / v1. `isFirstVisit` es true si no había
 * nada guardado (alguien que entra por primera vez).
 */
export function loadStored(): StoredData & { isFirstVisit: boolean } {
  const v3 = readStorage(STORAGE_KEY) as Partial<StoredData> | null;

  if (v3 && v3.version === 3 && typeof v3.careers === "object" && v3.careers) {
    return {
      version: 3,
      activeCareerId: isKnownCareer(v3.activeCareerId) ? v3.activeCareerId : DEFAULT_CAREER_ID,
      careers: v3.careers,
      isFirstVisit: false,
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

  return { ...migrated, isFirstVisit: !v2 && !v1 };
}
