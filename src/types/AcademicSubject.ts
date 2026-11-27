export interface CareerTitle {
  /** Nombre del título, por ejemplo "Técnico Universitario en Periodismo". */
  name: string;
  /** Se obtiene al aprobar todas las materias hasta este año inclusive. */
  years: number;
}

export interface CareerInfo {
  id: string;
  name: string;
  /** Nombre corto para títulos. */
  shortName?: string;
  /** Tipo de título, por ejemplo "Tecnicatura Superior". */
  degree?: string;
  plan: string;
  years: number;
  /** Títulos que otorga la carrera, del intermedio al final. */
  titles?: CareerTitle[];
}

export interface AcademicSubject {
  id: string;
  code: number;
  name: string;
  year: number;
  /** Cuatrimestre en que se dicta (en las anuales, en el que empieza). */
  semester: 1 | 2;
  /** Materia anual: se cursa en los dos cuatrimestres del año. */
  annual?: boolean;
  hours: number;
  prerequisites: string[];
}

export interface CareerData {
  career: CareerInfo;
  subjects: AcademicSubject[];
}
