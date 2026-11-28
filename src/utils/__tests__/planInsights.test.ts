import { describe, expect, it } from "vitest";

import { getCareer } from "../../data/career";

const { subjects } = getCareer("analista-sistemas");
import { describePrerequisites, getNextSemesterPlan, joinNames } from "../planInsights";
import { buildSubjectViewModel } from "../subjectView";
import type { SubjectStatus } from "../../types/SubjectProgress";

const byCode = (code: number) => subjects.find((subject) => subject.code === code)!;

describe("describePrerequisites", () => {
  it("resume un año completo", () => {
    expect(describePrerequisites(byCode(33).prerequisites, subjects)).toEqual(["1° año completo"]);
  });

  it("resume el año y suma las correlativas extra", () => {
    expect(describePrerequisites(byCode(23).prerequisites, subjects)).toEqual([
      "1° año completo",
      "Metodología de Desarrollo de Sistemas I",
    ]);
  });
});

describe("joinNames", () => {
  it("une en castellano", () => {
    expect(joinNames(["A"])).toBe("A");
    expect(joinNames(["A", "B"])).toBe("A y B");
    expect(joinNames(["A", "B", "C"])).toBe("A, B y C");
    expect(joinNames(["A", "B", "C", "D", "E"])).toBe("A, B, C y 2 más");
  });
});

describe("getNextSemesterPlan", () => {
  it("identifica la correlativa que traba 3° año", () => {
    const progress: Record<string, SubjectStatus> = {};
    subjects
      .filter((subject) => subject.year <= 2 && subject.code !== 8)
      .forEach((subject) => (progress[subject.id] = "passed"));

    const viewModels = subjects.map((subject) => buildSubjectViewModel(subject, subjects, progress));
    const plan = getNextSemesterPlan(viewModels, 1, progress);

    expect(plan.available).toHaveLength(0);
    expect(plan.blockers[0].subject.code).toBe(8);
    expect(plan.blockers[0].blocks).toHaveLength(6);
  });
});

describe("describePrerequisites con la materia que las pide", () => {
  it("una tesis que pide toda la carrera dice 'Todas las demás materias'", () => {
    const abogacia = getCareer("abogacia-j1-22").subjects;
    const trabajoFinal = abogacia.find((subject) => subject.code === 57)!;

    expect(describePrerequisites(trabajoFinal.prerequisites, abogacia, trabajoFinal)).toEqual([
      "Todas las demás materias",
    ]);
  });

  it("no le exige a una materia su propio año", () => {
    const periodismo = getCareer("periodismo-i3-06").subjects;
    const taller = periodismo.find((subject) => subject.code === 44)!;

    expect(describePrerequisites(taller.prerequisites, periodismo, taller)).toEqual([
      "Todas las demás materias",
    ]);
  });
});

describe("próximo cuatrimestre con contracuatrimestre", () => {
  it("lista aparte las materias del otro cuatrimestre que ya se pueden cursar", () => {
    const analista = getCareer("analista-sistemas").subjects;
    const problematica = analista.find((subject) => subject.code === 4)!;
    const progress = { [problematica.id]: "passed" } as const;
    const viewModels = analista.map((subject) => buildSubjectViewModel(subject, analista, { ...progress }));

    const without = getNextSemesterPlan(viewModels, 1, { ...progress });
    const withCounter = getNextSemesterPlan(viewModels, 1, { ...progress }, { counterSemester: true });

    expect(without.counterSemester).toEqual([]);
    expect(withCounter.available).toEqual(without.available);
    expect(withCounter.counterSemester.map(({ subject }) => subject.code)).toContain(8);
    expect(withCounter.counterSemester.every(({ subject }) => subject.semester === 2)).toBe(true);
  });
});
