import { describe, expect, it } from "vitest";

import { getCareer } from "../../data/career";

const { subjects } = getCareer("analista-sistemas");
import { getAffectedSubjects } from "../statusChangeImpact";

const byCode = (code: number) => subjects.find((subject) => subject.code === code)!;

describe("getAffectedSubjects", () => {
  it("detecta materias afectadas en cadena", () => {
    const progress = {
      [byCode(1).id]: "passed",
      [byCode(10).id]: "passed",
      [byCode(11).id]: "in_progress",
    } as const;

    const affected = getAffectedSubjects(byCode(1), "pending", subjects, { ...progress });

    expect(affected.map(({ subject }) => subject.code)).toEqual([10, 11]);
    expect(affected.every(({ to }) => to === "pending")).toBe(true);
  });

  it("no afecta nada si la materia sigue cumpliendo como correlativa", () => {
    const progress = { [byCode(1).id]: "passed", [byCode(10).id]: "in_progress" } as const;

    expect(getAffectedSubjects(byCode(1), "regular", subjects, { ...progress })).toEqual([]);
  });

  it("si una correlativa pierde el final, la aprobada baja a Debe final", () => {
    const progress = { [byCode(1).id]: "passed", [byCode(10).id]: "passed" } as const;

    expect(getAffectedSubjects(byCode(1), "regular", subjects, { ...progress })).toEqual([
      { subject: byCode(10), from: "passed", to: "regular" },
    ]);
  });
});
