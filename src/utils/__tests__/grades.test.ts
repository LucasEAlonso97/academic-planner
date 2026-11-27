import { describe, expect, it } from "vitest";

import { getCareer } from "../../data/career";
import { formatGrade, parseGrade, summarizeGrades } from "../grades";

const { subjects } = getCareer("analista-sistemas");

describe("grades", () => {
  it("promedia solo las aprobadas con nota", () => {
    const [a, b, c] = subjects;
    const summary = summarizeGrades(
      subjects,
      { [a.id]: "passed", [b.id]: "passed", [c.id]: "regular" },
      { [a.id]: 8, [c.id]: 10 }
    );

    expect(summary).toEqual({ average: 8, graded: 1, missing: 1 });
  });

  it("parsea y formatea con coma", () => {
    expect(parseGrade("8,5")).toBe(8.5);
    expect(parseGrade("7")).toBe(7);
    expect(parseGrade("abc")).toBeNull();
    expect(formatGrade(8.5)).toBe("8,5");
  });
});

describe("plan de Periodismo", () => {
  const periodismo = getCareer("periodismo");

  it("tiene 41 materias en 4 años y correlativas válidas", () => {
    const ids = new Set(periodismo.subjects.map((subject) => subject.id));

    expect(periodismo.subjects).toHaveLength(41);
    expect(Math.max(...periodismo.subjects.map((subject) => subject.year))).toBe(4);
    periodismo.subjects.forEach((subject) =>
      subject.prerequisites.forEach((id) => expect(ids.has(id)).toBe(true))
    );
  });
});
