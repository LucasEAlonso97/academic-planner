import abogacia from "./abogacia-j1-22.json";
import analistaSistemas from "./analista-sistemas.json";
import periodismo from "./periodismo.json";
import periodismoI306 from "./periodismo-i3-06.json";
import psicologia from "./psicologia-p1-13.json";

import type { CareerData } from "../types/AcademicSubject";

/**
 * Carreras disponibles, en orden alfabético. Para sumar una nueva:
 * 1. Pegá el texto del plan (copiado de la web de la UAI) en plans/.
 * 2. npm run import-plan -- plans/archivo.txt
 * 3. Importá el JSON generado y agregalo a esta lista.
 */
/** Nombre para listas: "Psicología", "Abogacía"… */
export const displayName = ({ career }: CareerData) => career.shortName ?? career.name;

export const careers: CareerData[] = (
  [abogacia, analistaSistemas, periodismo, periodismoI306, psicologia] as CareerData[]
).sort(
  (first, second) =>
    displayName(first).localeCompare(displayName(second), "es") ||
    first.career.plan.localeCompare(second.career.plan, "es")
);

// La carrera original de la app; quien ya la usaba la sigue viendo.
export const DEFAULT_CAREER_ID = "analista-sistemas";

export function getCareer(careerId: string): CareerData {
  return (
    careers.find((career) => career.career.id === careerId) ??
    careers.find((career) => career.career.id === DEFAULT_CAREER_ID)!
  );
}

export function isKnownCareer(careerId: unknown): careerId is string {
  return careers.some((career) => career.career.id === careerId);
}
