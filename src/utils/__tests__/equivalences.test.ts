import { describe, expect, it } from "vitest";

import { getCareer } from "../../data/career";
import { normalizeSubjectName, previewEquivalences } from "../equivalences";
import type { CareerRecord } from "../progressValidation";

const empty = (): CareerRecord => ({
  progress: {},
  grades: {},
  planned: {},
  pace: 5,
  equivalences: {},
  customNames: {},
});

const passedByCode = (careerId: string, codes: number[]) =>
  Object.fromEntries(
    getCareer(careerId)
      .subjects.filter((subject) => codes.includes(subject.code))
      .map((subject) => [subject.id, "passed" as const])
  );

describe("normalizeSubjectName", () => {
  it("ignora tildes, mayúsculas y signos", () => {
    expect(normalizeSubjectName("REDACCIÓN PERIODISTICA I")).toBe(normalizeSubjectName("Redacción Periodística I"));
  });
});

describe("previewEquivalences", () => {
  it("Periodismo I3-06 → I13-25 pasa las que tienen el mismo nombre", () => {
    const from = getCareer("periodismo-i3-06");
    const to = getCareer("periodismo");

    // Redacción (1), Problemática del Mundo Actual (3), Redacción Periodística I (7), Optativa (33)
    const preview = previewEquivalences(from.subjects, passedByCode("periodismo-i3-06", [1, 3, 7, 33]), to.subjects, empty());

    expect(preview.apply.map(({ to: subject }) => subject.name)).toEqual(["Redacción", "Problemática del Mundo Actual"]);
    expect(preview.unmatched.map((subject) => subject.name)).toEqual(["Redacción Periodística I", "Optativa"]);
    expect(preview.result.equivalences).toEqual({ redaccion: true, "problematica-del-mundo-actual": true });
    expect(preview.result.progress.redaccion).toBe("passed");
  });

  it("no aprueba una materia si en el destino le falta una correlativa", () => {
    const from = getCareer("psicologia-p1-13");
    const to = getCareer("abogacia-j1-22");

    // Taller de Informática II (11) sin el I (5): en Abogacía el II pide el I.
    const preview = previewEquivalences(from.subjects, passedByCode("psicologia-p1-13", [11]), to.subjects, empty());

    expect(preview.apply).toEqual([]);
    expect(preview.blocked.map(({ to: subject }) => subject.name)).toEqual(["Taller de Informática II"]);
  });

  it("respeta lo que ya estaba aprobado en el destino", () => {
    const from = getCareer("psicologia-p1-13");
    const to = getCareer("abogacia-j1-22");
    const target = { ...empty(), progress: passedByCode("abogacia-j1-22", [2]) };

    const preview = previewEquivalences(from.subjects, passedByCode("psicologia-p1-13", [9]), to.subjects, target);

    expect(preview.alreadyPassed.map(({ to: subject }) => subject.code)).toEqual([2]);
    expect(preview.result.equivalences).toEqual({});
  });
});
