import { describe, expect, it } from "vitest";

import { getAcademicCalendar } from "../academicCalendar";

describe("getAcademicCalendar", () => {
  it("noviembre es segundo cuatrimestre y el próximo es el 1° del año siguiente", () => {
    const calendar = getAcademicCalendar(new Date(2026, 10, 27));
    expect(calendar.activeSemester).toBe(2);
    expect(calendar.nextSemester).toBe(1);
    expect(calendar.nextAcademicYear).toBe(2027);
  });

  it("mayo es primer cuatrimestre", () => {
    const calendar = getAcademicCalendar(new Date(2026, 4, 10));
    expect(calendar.activeSemester).toBe(1);
    expect(calendar.nextSemester).toBe(2);
  });

  it("febrero es receso y el próximo es abril del mismo año", () => {
    const calendar = getAcademicCalendar(new Date(2026, 1, 1));
    expect(calendar.activeSemester).toBeNull();
    expect(calendar.nextAcademicYear).toBe(2026);
  });
});
