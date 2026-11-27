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
