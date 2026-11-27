import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { careerSummaries, getCareer, getLoadedCareers } from "../../data/career";
import { PlanParseError, parsePlanText, toTitleCase } from "../planParser";

const careers = getLoadedCareers();

const read = (file: string) => readFileSync(new URL(`../../../plans/${file}`, import.meta.url), "utf8");

describe("toTitleCase", () => {
  it("respeta conectores, números romanos, guiones y tildes faltantes", () => {
    expect(toTitleCase("REDACCIÓN PERIODISTICA I")).toBe("Redacción Periodística I");
    expect(toTitleCase("SEMINARIO-TALLER DE INNOVACIÓN CREATIVA II")).toBe(
      "Seminario-Taller de Innovación Creativa II"
    );
    expect(toTitleCase("LEGISLACIÓN, ÉTICA Y REGLAMENTACIÓN MEDIÁTICA")).toBe(
      "Legislación, Ética y Reglamentación Mediática"
    );
  });
});

describe("parsePlanText", () => {
  it("el texto del plan I13-25 da exactamente la carrera cargada a mano", () => {
    const parsed = parsePlanText(read("periodismo-i13-25.txt"), { id: "periodismo" });
    expect(parsed).toEqual(getCareer("periodismo"));
  });

  it("lee el plan I3-06", () => {
    const { career, subjects } = parsePlanText(read("periodismo-i3-06.txt"));

    expect(career).toMatchObject({
      id: "periodismo-i3-06",
      name: "Licenciatura en Periodismo",
      shortName: "Periodismo",
      degree: "Licenciatura",
      plan: "I3-06",
      years: 4,
      titles: [
        { name: "Técnico Universitario en Periodismo", years: 3 },
        { name: "Licenciado en Periodismo", years: 4 },
      ],
    });

    expect(subjects).toHaveLength(45);
    expect(subjects.map((subject) => subject.code)).not.toContain(45);

    const byCode = (code: number) => subjects.find((subject) => subject.code === code)!;

    expect(byCode(23).prerequisites).toEqual(["expresion-oral", "metodologia-de-la-investigacion-cientifica", "periodismo-radial-ii"]);
    expect(byCode(44).prerequisites).toHaveLength(43);
    expect(byCode(46)).toMatchObject({ name: "Tesis", hours: 1, year: 4, semester: 2, prerequisites: ["taller-de-tesis"] });
    expect(byCode(33).id).toBe("optativa-33");
    expect(byCode(43).id).toBe("optativa-43");
  });

  it("explica qué falla", () => {
    expect(() => parsePlanText("")).toThrow(PlanParseError);
    expect(() => parsePlanText("cualquier cosa")).toThrow(/PLAN/);
    expect(() =>
      parsePlanText("CARRERA - PLAN: X\n1er Año\nMaterias del primer cuatrimestre\n01\nUNA\n99\n48")
    ).toThrow(/99/);
  });
});

describe("plans/ y las carreras de la app", () => {
  const dir = new URL("../../../plans/", import.meta.url);
  const files = readdirSync(dir).filter((file) => file.endsWith(".txt"));

  it.each(files)("%s coincide con la carrera cargada", (file) => {
    const parsed = parsePlanText(readFileSync(new URL(file, dir), "utf8"));
    const loaded = careers.find((career) => career.career.plan === parsed.career.plan);

    expect(loaded, `Falta registrar el plan ${parsed.career.plan} en src/data/career.ts`).toBeDefined();
    expect({ ...parsed, career: { ...parsed.career, id: loaded!.career.id } }).toEqual(loaded);
  });

  it("todas las carreras salen de un archivo de plans/ (salvo Análisis de Sistemas)", () => {
    const plansInFiles = files.map((file) =>
      parsePlanText(readFileSync(new URL(file, dir), "utf8")).career.plan
    );

    careers
      .filter((career) => career.career.id !== "analista-sistemas")
      .forEach((career) => expect(plansInFiles).toContain(career.career.plan));
  });
});

describe("índice de carreras", () => {
  it("coincide con los datos de cada carrera", () => {
    expect(careerSummaries).toHaveLength(careers.length);

    for (const summary of careerSummaries) {
      const { career } = getCareer(summary.id);
      expect(summary).toEqual({
        id: career.id,
        name: career.name,
        plan: career.plan,
        ...(career.shortName ? { shortName: career.shortName } : {}),
        ...(career.degree ? { degree: career.degree } : {}),
      });
    }
  });
});
