import careerJson from "./analista-sistemas.json";

import type { CareerData } from "../types/AcademicSubject";

// Punto único de acceso al plan de estudios.
// Para sumar otra carrera alcanza con otro JSON
// y un selector que elija cuál exportar acá.
export const career = careerJson as CareerData;

export const subjects = career.subjects;
