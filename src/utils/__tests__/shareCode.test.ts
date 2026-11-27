import { describe, expect, it } from "vitest";

import { careers, getCareer } from "../../data/career";
import { decodeShareCode, encodeShareCode } from "../shareCode";

const lookup = (careerId: string) =>
  careers.find((career) => career.career.id === careerId)?.subjects ?? null;

describe("shareCode", () => {
  it("ida y vuelta sin perder datos", () => {
    const { subjects } = getCareer("periodismo");
    const [first, second, third] = subjects;

    const record = {
      progress: { [first.id]: "passed", [second.id]: "regular", [third.id]: "in_progress" } as const,
      grades: { [first.id]: 8.5 },
      planned: { [subjects[10].id]: "2027-1" },
      pace: 4,
    };

    const code = encodeShareCode("periodismo", subjects, { ...record, progress: { ...record.progress } });
    const decoded = decodeShareCode(code, lookup);

    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(code.length).toBeLessThan(400);
    expect(decoded).toEqual({ careerId: "periodismo", record });
  });

  it("rechaza códigos inválidos", () => {
    expect(decodeShareCode("no-es-un-codigo", lookup)).toBeNull();
    expect(decodeShareCode(btoa(JSON.stringify({ v: 1, c: "x", s: "0" })), lookup)).toBeNull();
  });
});
