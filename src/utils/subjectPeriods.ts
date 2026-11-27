import type { AcademicSubject } from "../types/AcademicSubject";

/*
 * Períodos de cursada: anual, 1° o 2° cuatrimestre.
 * El "orden" numera los cuatrimestres de la carrera: 1° año 1C = 2,
 * 1° año 2C = 3, 2° año 1C = 4… Una anual empieza en el 1C y termina
 * en el 2C de su año.
 */

export type PeriodGroup = {
  key: "annual" | "1" | "2";
  label: string;
  shortLabel: string;
  matches: (subject: AcademicSubject) => boolean;
};

export const periodGroups: PeriodGroup[] = [
  { key: "annual", label: "Anuales", shortLabel: "Anual", matches: (subject) => Boolean(subject.annual) },
  {
    key: "1",
    label: "1° cuatrimestre",
    shortLabel: "1° cuatr.",
    matches: (subject) => !subject.annual && subject.semester === 1,
  },
  {
    key: "2",
    label: "2° cuatrimestre",
    shortLabel: "2° cuatr.",
    matches: (subject) => !subject.annual && subject.semester === 2,
  },
];

/** "Anual", "1° cuatr." o "2° cuatr." */
export function periodLabel(subject: AcademicSubject) {
  return periodGroups.find((group) => group.matches(subject))!.shortLabel;
}

export const startOrder = (subject: AcademicSubject) => subject.year * 2 + (subject.semester - 1);

export const endOrder = (subject: AcademicSubject) =>
  subject.annual ? subject.year * 2 + 1 : startOrder(subject);

/**
 * Materias que se pueden cursar en cualquier cuatrimestre: las que
 * piden correlativas que, según el plan, terminan en el mismo
 * cuatrimestre o después (por ejemplo, una tesis que pide todas las
 * materias). Si no, nunca se podrían cursar en su cuatrimestre.
 */
export function flexibleSubjectIds(subjects: AcademicSubject[]): Set<string> {
  const byId = new Map(subjects.map((subject) => [subject.id, subject]));

  return new Set(
    subjects
      .filter((subject) =>
        subject.prerequisites.some((id) => {
          const prerequisite = byId.get(id);
          return prerequisite !== undefined && endOrder(prerequisite) >= startOrder(subject);
        })
      )
      .map((subject) => subject.id)
  );
}
