import type { CareerData, CareerInfo } from "../types/AcademicSubject";

/*
 * Registro de carreras.
 *
 * El índice (nombre y plan de cada carrera) va siempre en la app; las
 * materias de cada carrera son un archivo aparte que se descarga
 * recién cuando alguien la elige.
 *
 * Para sumar una carrera:
 * 1. Pegá el texto del plan (copiado de la web de la UAI) en plans/.
 * 2. npm run import-plan -- plans/archivo.txt
 * 3. Agregá la línea que imprime el script a `careerIndex`.
 * (`npm test` verifica que el índice coincida con cada JSON.)
 */

export type CareerSummary = Pick<CareerInfo, "id" | "name" | "shortName" | "degree" | "plan">;

type CareerEntry = CareerSummary & { load: () => Promise<{ default: unknown }> };

const careerIndex: CareerEntry[] = [
  { id: "abogacia-j1-22", name: "Abogacía", plan: "J1-22", load: () => import("./abogacia-j1-22.json") },
  {
    id: "analista-sistemas",
    name: "Tecnicatura Superior en Análisis de Sistemas Informáticos",
    shortName: "Análisis de Sistemas Informáticos",
    degree: "Tecnicatura Superior",
    plan: "VCO-19",
    load: () => import("./analista-sistemas.json"),
  },
  {
    id: "periodismo-i3-06",
    name: "Licenciatura en Periodismo",
    shortName: "Periodismo",
    degree: "Licenciatura",
    plan: "I3-06",
    load: () => import("./periodismo-i3-06.json"),
  },
  {
    id: "periodismo",
    name: "Licenciatura en Periodismo, Gestión y Producción de Contenidos",
    shortName: "Periodismo, Gestión y Producción de Contenidos",
    degree: "Licenciatura",
    plan: "I13-25",
    load: () => import("./periodismo.json"),
  },
  {
    id: "psicologia-p1-13",
    name: "Licenciatura en Psicología",
    shortName: "Psicología",
    degree: "Licenciatura",
    plan: "P1-13",
    load: () => import("./psicologia-p1-13.json"),
  },
];

/** Nombre para listas: "Psicología", "Abogacía"… */
export const displayName = (career: CareerSummary | CareerData) => {
  const info = "career" in career ? career.career : career;
  return info.shortName ?? info.name;
};

/** Carreras en orden alfabético (sin las materias). */
export const careerSummaries: CareerSummary[] = careerIndex
  .map((entry): CareerSummary => {
    const summary: CareerSummary = { id: entry.id, name: entry.name, plan: entry.plan };
    if (entry.shortName) summary.shortName = entry.shortName;
    if (entry.degree) summary.degree = entry.degree;
    return summary;
  })
  .sort(
    (first, second) =>
      displayName(first).localeCompare(displayName(second), "es") ||
      first.plan.localeCompare(second.plan, "es")
  );

// La carrera original de la app; quien ya la usaba la sigue viendo.
export const DEFAULT_CAREER_ID = "analista-sistemas";

export function isKnownCareer(careerId: unknown): careerId is string {
  return careerIndex.some((entry) => entry.id === careerId);
}

export function getCareerSummary(careerId: string): CareerSummary {
  return (
    careerSummaries.find((summary) => summary.id === careerId) ??
    careerSummaries.find((summary) => summary.id === DEFAULT_CAREER_ID)!
  );
}

const loaded = new Map<string, CareerData>();
const loading = new Map<string, Promise<CareerData>>();

/** Descarga (una sola vez) las materias de una carrera. */
export function loadCareer(careerId: string): Promise<CareerData> {
  const id = isKnownCareer(careerId) ? careerId : DEFAULT_CAREER_ID;
  const cached = loaded.get(id);

  if (cached) {
    return Promise.resolve(cached);
  }

  if (!loading.has(id)) {
    const entry = careerIndex.find((candidate) => candidate.id === id)!;

    loading.set(
      id,
      entry
        .load()
        .then((module) => {
          const data = module.default as CareerData;
          loaded.set(id, data);
          return data;
        })
        .finally(() => loading.delete(id))
    );
  }

  return loading.get(id)!;
}

export function loadAllCareers() {
  return Promise.all(careerIndex.map((entry) => loadCareer(entry.id)));
}

export function isCareerLoaded(careerId: string) {
  return loaded.has(careerId);
}

/** Carrera ya descargada (con `loadCareer`). */
export function getCareer(careerId: string): CareerData {
  const id = isKnownCareer(careerId) ? careerId : DEFAULT_CAREER_ID;
  const data = loaded.get(id);

  if (!data) {
    throw new Error(`La carrera ${careerId} todavía no se cargó.`);
  }

  return data;
}

/** Todas las carreras ya descargadas, en orden alfabético (para tests). */
export function getLoadedCareers(): CareerData[] {
  return careerSummaries.filter((summary) => loaded.has(summary.id)).map((summary) => loaded.get(summary.id)!);
}
