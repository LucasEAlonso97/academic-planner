import { describe, expect, it } from "vitest";

import { getCareer, getLoadedCareers } from "../../data/career";
import {
  autoPlan,
  effectivePlan,
  estimateFinish,
  makeTerm,
  parseTerm,
  termIndex,
  upcomingTerms,
  validatePlan,
} from "../semesterPlanner";

const careers = getLoadedCareers();

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

describe("todas las carreras", () => {
  it.each(careers.map((career) => [career.career.id, career] as const))(
    "%s: el plan automático cubre todo y sin problemas",
    (_id, career) => {
      for (const pace of [3, 5, 7]) {
        const planned = autoPlan(career.subjects, {}, start, pace);
        const plan = effectivePlan(career.subjects, {}, planned, start);

        expect(plan.size).toBe(career.subjects.length);
        expect([...validatePlan(career.subjects, {}, plan).keys()]).toEqual([]);
      }
    }
  );

  it("las anuales ocupan el año entero y sus dependientes esperan", () => {
    const { subjects: psico } = getCareer("psicologia-p1-13");
    const planned = autoPlan(psico, {}, start, 8);
    const term = (code: number) => planned[psico.find((subject) => subject.code === code)!.id];

    // Seminario-Taller de Integración II (anual) → III (anual, pide el II):
    // el III recién puede empezar el año siguiente, en un 1° cuatrimestre.
    expect(term(32).endsWith("-1")).toBe(true);
    expect(term(41).endsWith("-1")).toBe(true);
    expect(Number(term(41).slice(0, 4))).toBeGreaterThan(Number(term(32).slice(0, 4)));
  });

  it("la tesis de Periodismo I3-06 se puede cursar en cualquier cuatrimestre", () => {
    const { subjects: periodismo } = getCareer("periodismo-i3-06");
    const planned = autoPlan(periodismo, {}, start, 7);
    const plan = effectivePlan(periodismo, {}, planned, start);

    const taller = parseTerm(planned["taller-de-tesis"])!;
    const tesis = parseTerm(planned["tesis"])!;
    const others = periodismo.filter((subject) => !["taller-de-tesis", "tesis"].includes(subject.id));

    // El taller va después de todo lo demás, y la tesis justo después del taller,
    // aunque eso caiga en un cuatrimestre distinto al del plan.
    expect(others.every((subject) => termIndex(plan.get(subject.id)!) < termIndex(taller))).toBe(true);
    expect(termIndex(tesis)).toBe(termIndex(taller) + 1);
    expect(estimateFinish(periodismo, {}, plan, 4, null)).toEqual({ kind: "term", term: tesis });
  });
});
