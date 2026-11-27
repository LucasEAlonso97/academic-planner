import { describe, expect, it } from "vitest";

import { subjects } from "../../data/career";
import { enforcePrerequisites, sanitizeProgress } from "../progressValidation";

const byCode = (code: number) => subjects.find((subject) => subject.code === code)!;

describe("sanitizeProgress", () => {
  it("descarta materias inexistentes, estados inválidos y pendientes", () => {
    const result = sanitizeProgress(
      {
        [byCode(1).id]: "passed",
        [byCode(2).id]: "pending",
        [byCode(3).id]: "aprobadísima",
        "materia-inventada": "passed",
      },
      subjects
    );

    expect(result).toEqual({ [byCode(1).id]: "passed" });
  });

  it("tolera datos que no son un objeto", () => {
    expect(sanitizeProgress(null, subjects)).toEqual({});
    expect(sanitizeProgress("hola", subjects)).toEqual({});
    expect(sanitizeProgress([1, 2], subjects)).toEqual({});
  });
});

describe("enforcePrerequisites", () => {
  it("vuelve a Pendiente lo que no cumple correlativas, en cadena", () => {
    const { progress, adjusted } = enforcePrerequisites(
      { [byCode(10).id]: "passed", [byCode(11).id]: "passed", [byCode(4).id]: "passed" },
      subjects
    );

    expect(progress).toEqual({ [byCode(4).id]: "passed" });
    expect(adjusted.map((subject) => subject.code).sort()).toEqual([10, 11]);
  });

  it("deja intacto un progreso coherente", () => {
    const input = { [byCode(1).id]: "passed", [byCode(10).id]: "regular" } as const;
    expect(enforcePrerequisites({ ...input }, subjects).progress).toEqual(input);
  });
});
