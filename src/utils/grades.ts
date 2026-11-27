import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";

export type GradeSummary = {
  /** Promedio de las aprobadas con nota, o null si no hay notas. */
  average: number | null;
  /** Materias aprobadas con nota cargada. */
  graded: number;
  /** Materias aprobadas sin nota. */
  missing: number;
};

export function summarizeGrades(
  subjects: AcademicSubject[],
  progress: Record<string, SubjectStatus>,
  grades: Record<string, number>
): GradeSummary {
  const passed = subjects.filter((subject) => progress[subject.id] === "passed");
  const values = passed
    .map((subject) => grades[subject.id])
    .filter((grade): grade is number => typeof grade === "number");

  return {
    average:
      values.length === 0
        ? null
        : values.reduce((total, grade) => total + grade, 0) / values.length,
    graded: values.length,
    missing: passed.length - values.length,
  };
}

const formatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 8.5 → "8,5" */
export function formatGrade(value: number) {
  return formatter.format(value);
}

/** Acepta "8", "8,5" o "8.5". Devuelve null si no es un número. */
export function parseGrade(text: string): number | null {
  const normalized = text.trim().replace(",", ".");

  if (normalized === "" || !/^\d{1,2}(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  return Number(normalized);
}
