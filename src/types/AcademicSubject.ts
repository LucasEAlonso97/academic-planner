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
  /** De dónde sale el plan y cuándo se cargó. */
  source?: CareerSource;
  /**
   * Se pueden cursar materias en contracuatrimestre (las del 2° en el 1°
   * y viceversa), cumpliendo las correlativas. Hoy: Análisis de Sistemas
   * en UAI Centro.
   */
  counterSemester?: boolean;
}

export interface CareerSource {
  /** Página oficial del plan. */
  url?: string;
  /** Fecha en que se copió el plan, "AAAA-MM-DD". */
  loadedAt?: string;
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
