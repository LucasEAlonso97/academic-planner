import { describe, expect, it } from "vitest";

import { getCareer } from "../../data/career";
import {
  autoPlan,
  effectivePlan,
  estimateFinish,
  makeTerm,
  parseTerm,
  upcomingTerms,
  validatePlan,
} from "../semesterPlanner";

const { subjects } = getCareer("analista-sistemas");
const byCode = (code: number) => subjects.find((subject) => subject.code === code)!;
const start = makeTerm(2027, 1);

describe("términos", () => {
  it("avanza de cuatrimestre en cuatrimestre", () => {
    expect(upcomingTerms(makeTerm(2026, 2), 3).map((term) => term.label)).toEqual([
      "2C 2026",
      "1C 2027",
      "2C 2027",
    ]);
    expect(parseTerm("2027-2")?.longLabel).toBe("2° cuatrimestre de 2027");
    expect(parseTerm("basura")).toBeNull();
  });
});

describe("autoPlan", () => {
  it("planifica toda la carrera respetando correlativas y cuatrimestres", () => {
    const planned = autoPlan(subjects, {}, start, 6);
    const plan = effectivePlan(subjects, {}, planned, start);

    expect(plan.size).toBe(subjects.length);
    expect(validatePlan(subjects, {}, plan).size).toBe(0);
  });

  it("con 6 materias por cuatrimestre, la tecnicatura entra en 6 cuatrimestres", () => {
    const planned = autoPlan(subjects, {}, start, 6);
    const plan = effectivePlan(subjects, {}, planned, start);
    const finish = estimateFinish(subjects, {}, plan, 3, null);

    expect(finish).toEqual({ kind: "term", term: makeTerm(2029, 2) });
  });

  it("a menor ritmo, tarda más", () => {
    const fast = effectivePlan(subjects, {}, autoPlan(subjects, {}, start, 6), start);
    const slow = effectivePlan(subjects, {}, autoPlan(subjects, {}, start, 3), start);
    const finish = (plan: typeof fast) => estimateFinish(subjects, {}, plan, 3, null);

    const fastTerm = finish(fast);
    const slowTerm = finish(slow);

    expect(fastTerm.kind).toBe("term");
    expect(slowTerm.kind).toBe("term");
    if (fastTerm.kind === "term" && slowTerm.kind === "term") {
      expect(slowTerm.term.year * 2 + slowTerm.term.semester).toBeGreaterThan(
        fastTerm.term.year * 2 + fastTerm.term.semester
      );
    }
  });

  it("cuenta lo que se está cursando como regularizado", () => {
    const progress = { [byCode(1).id]: "in_progress" } as const;
    const planned = autoPlan(subjects, { ...progress }, makeTerm(2027, 2), 6);

    expect(planned[byCode(10).id]).toBe("2027-2");
    expect(planned[byCode(1).id]).toBeUndefined();
  });
});

describe("validatePlan", () => {
  it("marca correlativas que no llegan y cuatrimestre equivocado", () => {
    const plan = effectivePlan(
      subjects,
      {},
      { [byCode(10).id]: "2027-1" },
      start
    );
    const issues = validatePlan(subjects, {}, plan).get(byCode(10).id)!;

    expect(issues).toContainEqual({ kind: "wrong-semester", semester: 2 });
    expect(issues).toContainEqual({ kind: "prerequisite", prerequisite: byCode(1) });
  });

  it("ignora cuatrimestres pasados", () => {
    expect(effectivePlan(subjects, {}, { [byCode(1).id]: "2020-1" }, start).size).toBe(0);
  });
});

describe("estimateFinish", () => {
  it("avisa cuántas materias faltan planificar", () => {
    expect(estimateFinish(subjects, {}, new Map(), 3, null)).toEqual({
      kind: "incomplete",
      unplanned: subjects.length,
    });
  });
});
