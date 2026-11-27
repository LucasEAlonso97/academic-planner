import analistaSistemas from "./analista-sistemas.json";
import periodismo from "./periodismo.json";

import type { CareerData } from "../types/AcademicSubject";

/**
 * Carreras disponibles. Para sumar una nueva alcanza con agregar su
 * JSON acá (mismo formato que los existentes).
 */
export const careers: CareerData[] = [
  analistaSistemas as CareerData,
  periodismo as CareerData,
];

export const DEFAULT_CAREER_ID = careers[0].career.id;

export function getCareer(careerId: string): CareerData {
  return careers.find((career) => career.career.id === careerId) ?? careers[0];
}

export function isKnownCareer(careerId: unknown): careerId is string {
  return careers.some((career) => career.career.id === careerId);
}
