import { describe, expect, it } from "vitest";

import { subjects } from "../../data/career";
import {
  canEnrollSubject,
  getAvailableSubjects,
  getMissingPrerequisites,
} from "../academicRules";

const byCode = (code: number) => subjects.find((subject) => subject.code === code)!;

describe("academicRules", () => {
  it("una materia sin correlativas siempre se puede cursar", () => {
    expect(canEnrollSubject(byCode(1), {})).toBe(true);
  });

  it("exige que la correlativa esté en Debe final o Aprobada", () => {
    const programacionI = byCode(10);
    const estructurada = byCode(1);

    expect(canEnrollSubject(programacionI, {})).toBe(false);
    expect(canEnrollSubject(programacionI, { [estructurada.id]: "in_progress" })).toBe(false);
    expect(canEnrollSubject(programacionI, { [estructurada.id]: "regular" })).toBe(true);
    expect(canEnrollSubject(programacionI, { [estructurada.id]: "passed" })).toBe(true);
  });

  it("lista las correlativas faltantes", () => {
    expect(getMissingPrerequisites(byCode(10), {})).toEqual([byCode(1).id]);
  });

  it("al empezar, las disponibles son las que no tienen correlativas", () => {
    const available = getAvailableSubjects(subjects, {});
    expect(available.every((subject) => subject.prerequisites.length === 0)).toBe(true);
    expect(available).toHaveLength(subjects.filter((s) => s.prerequisites.length === 0).length);
  });
});

describe("datos del plan", () => {
  it("tiene 34 materias con ids y códigos únicos", () => {
    expect(subjects).toHaveLength(34);
    expect(new Set(subjects.map((subject) => subject.id)).size).toBe(34);
    expect(new Set(subjects.map((subject) => subject.code)).size).toBe(34);
  });

  it("todas las correlativas existen y son de un cuatrimestre anterior", () => {
    const ids = new Map(subjects.map((subject) => [subject.id, subject]));
    const order = (year: number, semester: number) => year * 2 + semester;

    for (const subject of subjects) {
      for (const prerequisiteId of subject.prerequisites) {
        const prerequisite = ids.get(prerequisiteId);
        expect(prerequisite, `${subject.name} -> ${prerequisiteId}`).toBeDefined();
        expect(order(prerequisite!.year, prerequisite!.semester)).toBeLessThan(
          order(subject.year, subject.semester)
        );
      }
    }
  });
});
