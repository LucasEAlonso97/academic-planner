import { describe, expect, it } from "vitest";

import { getCareer, getLoadedCareers } from "../../data/career";
import {
  autoPlan,
  canStartIn,
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

describe("contracuatrimestre (Análisis de Sistemas)", () => {
  const options = { counterSemester: true };

  it("permite cursar materias del otro cuatrimestre, menos las anuales", () => {
    const flexible = new Set<string>();
    const programacionI = byCode(10); // 2° cuatrimestre

    expect(canStartIn(programacionI, makeTerm(2027, 1), flexible)).toBe(false);
    expect(canStartIn(programacionI, makeTerm(2027, 1), flexible, options)).toBe(true);
    expect(canStartIn({ ...programacionI, annual: true, semester: 1 }, makeTerm(2027, 2), flexible, options)).toBe(false);
  });

  it("el plan automático respeta correlativas sin dejar problemas", () => {
    const planned = autoPlan(subjects, {}, start, 6, options);
    const plan = effectivePlan(subjects, {}, planned, start);

    expect(plan.size).toBe(subjects.length);
    expect([...validatePlan(subjects, {}, plan, options).keys()]).toEqual([]);
    // Sin la opción, ese mismo plan tendría materias "en el cuatrimestre equivocado".
    expect(validatePlan(subjects, {}, plan).size).toBeGreaterThan(0);
  });

  it("a quien le falta una materia del 2° cuatrimestre, le ahorra un año", () => {
    // A mitad de 2° año, le falta Historia de la Ciencia (1° año, 2C), que traba todo 3°.
    const statuses: Record<number, string> = {
      1: "passed", 2: "passed", 3: "regular", 4: "passed", 5: "passed", 6: "passed", 7: "passed",
      9: "regular", 10: "passed", 11: "passed", 12: "passed", 13: "regular", 14: "passed",
      18: "regular", 25: "passed", 17: "in_progress", 19: "in_progress", 20: "in_progress",
      21: "in_progress", 22: "in_progress",
    };
    const progress = Object.fromEntries(
      subjects.filter((subject) => statuses[subject.code]).map((subject) => [subject.id, statuses[subject.code]])
    ) as Record<string, "passed" | "regular" | "in_progress">;

    const finish = (counterSemester: boolean) => {
      const planned = autoPlan(subjects, progress, start, 5, { counterSemester });
      return {
        historia: planned[byCode(8).id],
        finish: estimateFinish(subjects, progress, effectivePlan(subjects, progress, planned, start), 3, null),
      };
    };

    expect(finish(false)).toEqual({ historia: "2027-2", finish: { kind: "term", term: makeTerm(2029, 2) } });
    expect(finish(true)).toEqual({ historia: "2027-1", finish: { kind: "term", term: makeTerm(2028, 2) } });
  });

  it("a igual prioridad, prefiere la materia en su cuatrimestre", () => {
    const planned = autoPlan(subjects, {}, start, 6, options);

    // 1C 2027 sin nada aprobado: las 5 de 1° año 1C + una más.
    const firstTerm = subjects.filter((subject) => planned[subject.id] === "2027-1");
    expect(firstTerm.filter((subject) => subject.year === 1 && subject.semester === 1)).toHaveLength(5);
  });
});
