import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";

import { enforcePrerequisites, isElective, type CareerRecord } from "./progressValidation";

/*
 * Cambio de plan o de carrera: las materias aprobadas que tienen el
 * mismo nombre en el destino se proponen como equivalencias.
 * Es una estimación: las equivalencias reales las otorga la universidad.
 */

/** "Redacción Periodística I" y "REDACCION PERIODISTICA I" son la misma. */
export function normalizeSubjectName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type EquivalenceMatch = { from: AcademicSubject; to: AcademicSubject };

export type EquivalencePreview = {
  /** Se pasan como aprobadas por equivalencia. */
  apply: EquivalenceMatch[];
  /** Coinciden, pero en el destino les faltan correlativas aprobadas. */
  blocked: EquivalenceMatch[];
  /** Ya estaban aprobadas en el destino. */
  alreadyPassed: EquivalenceMatch[];
  /** Aprobadas en el origen que no tienen una materia con el mismo nombre. */
  unmatched: AcademicSubject[];
  /** Cómo queda el destino si se aplica. */
  result: CareerRecord;
};

export function previewEquivalences(
  fromSubjects: AcademicSubject[],
  fromProgress: Record<string, SubjectStatus>,
  toSubjects: AcademicSubject[],
  toRecord: CareerRecord
): EquivalencePreview {
  // Las optativas se llaman todas igual: no se pueden emparejar por nombre.
  const byName = new Map(
    toSubjects
      .filter((subject) => !isElective(subject))
      .map((subject) => [normalizeSubjectName(subject.name), subject])
  );

  const passed = fromSubjects.filter((subject) => fromProgress[subject.id] === "passed");
  const matches: EquivalenceMatch[] = [];
  const unmatched: AcademicSubject[] = [];

  for (const from of passed) {
    const to = isElective(from) ? undefined : byName.get(normalizeSubjectName(from.name));

    if (to) {
      matches.push({ from, to });
    } else {
      unmatched.push(from);
    }
  }

  const alreadyPassed = matches.filter(({ to }) => toRecord.progress[to.id] === "passed");
  const candidates = matches.filter(({ to }) => toRecord.progress[to.id] !== "passed");

  const withMatches = { ...toRecord.progress };
  candidates.forEach(({ to }) => (withMatches[to.id] = "passed"));

  // Para aprobar hacen falta las correlativas aprobadas también en el destino.
  const { progress } = enforcePrerequisites(withMatches, toSubjects);

  const apply = candidates.filter(({ to }) => progress[to.id] === "passed");
  const blocked = candidates.filter(({ to }) => progress[to.id] !== "passed");

  const equivalences = { ...toRecord.equivalences };
  apply.forEach(({ to }) => (equivalences[to.id] = true));

  return {
    apply,
    blocked,
    alreadyPassed,
    unmatched,
    result: { ...toRecord, progress, equivalences },
  };
}
