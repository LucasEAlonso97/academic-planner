/*
 * Lector del texto de un plan de estudios tal como aparece en la web
 * de la UAI (copiar y pegar). Ejemplo del formato:
 *
 *   LICENCIATURA EN PERIODISMO - PLAN: I3-06
 *   Títulos
 *   * LICENCIADO EN PERIODISMO
 *   1er Año
 *   Materias del primer cuatrimestre      (o "Materias anuales")
 *   Código / Asignatura / Correlativas / Carga
 *   07
 *   REDACCIÓN PERIODISTICA I
 *   01              ← correlativas (opcional, códigos separados por espacio)
 *   80              ← carga horaria
 *   Título: TÉCNICO UNIVERSITARIO EN PERIODISMO   ← título intermedio
 *
 * Al principio puede haber líneas de metadatos (opcionales):
 *   # fuente: https://…   ← página oficial del plan
 *   # cargado: 2026-11-27 ← fecha en que se copió
 *
 * Solo usa sintaxis de TypeScript "borrable" para poder correrlo con
 * `node --experimental-strip-types` desde scripts/import-plan.ts.
 */

import type {
  AcademicSubject,
  CareerData,
  CareerSource,
  CareerTitle,
} from "../types/AcademicSubject";

export class PlanParseError extends Error {}

const HEADER_LABELS = new Set(["código", "asignatura", "correlativas", "carga", "títulos", "título"]);

/** Líneas de resoluciones ministeriales en la lista de títulos. */
const RESOLUTION_LINE = /^(R\.?\s?M\.?|D\.?N\.?G\.?U|RES)|UAI\s*-/i;

const LOWERCASE_WORDS = new Set([
  "a", "al", "con", "de", "del", "e", "el", "en", "la", "las", "los", "o", "para", "por", "u", "y",
]);

const ROMAN_NUMERALS = /^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/;

// Tildes que suelen faltar en los textos de la web.
const ACCENT_FIXES: Record<string, string> = {
  periodistica: "periodística",
  periodisticas: "periodísticas",
  periodistico: "periodístico",
  periodisticos: "periodísticos",
  psicologia: "psicología",
};

const DEGREE_PREFIX =
  /^(Licenciatura|Tecnicatura(?: Superior| Universitaria)?|Ingeniería|Profesorado|Especialización|Maestría|Doctorado|Diplomatura|Analista|Arquitectura|Abogacía|Contador Público|Medicina|Odontología)(?: en )?/;

function capitalize(word: string) {
  return word.charAt(0).toLocaleUpperCase("es") + word.slice(1);
}

/** "REDACCIÓN PERIODISTICA I" → "Redacción Periodística I" */
export function toTitleCase(text: string): string {
  return text
    .toLocaleLowerCase("es")
    .split(/\s+/)
    .map((word, index) =>
      word
        .split("-")
        .map((part) => {
          const bare = part.replace(/[,.;:]$/, "");
          const punctuation = part.slice(bare.length);
          const fixed = ACCENT_FIXES[bare] ?? bare;

          if (ROMAN_NUMERALS.test(fixed)) return fixed.toUpperCase() + punctuation;
          if (index > 0 && LOWERCASE_WORDS.has(fixed)) return fixed + punctuation;
          return capitalize(fixed) + punctuation;
        })
        .join("-")
    )
    .join(" ");
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const isNumberLine = (line: string) => /^\d{1,3}$/.test(line);
const isCodeList = (line: string) => /^\d{1,3}(\s+\d{1,3})*$/.test(line);

/** Nombre de materia: todo en mayúsculas y con al menos una letra. */
const isNameLine = (line: string) =>
  /[A-ZÁÉÍÓÚÑÜ]/.test(line) &&
  line === line.toLocaleUpperCase("es") &&
  !line.startsWith("*") &&
  !HEADER_LABELS.has(line.toLocaleLowerCase("es"));

type RawSubject = {
  code: number;
  name: string;
  year: number;
  semester: 1 | 2;
  annual: boolean;
  hours: number;
  prerequisiteCodes: number[];
};

export type ParsePlanOptions = {
  /** Id de la carrera; por defecto se arma con el nombre y el plan. */
  id?: string;
};

export function parsePlanText(text: string, options: ParsePlanOptions = {}): CareerData {
  const allLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Metadatos "# clave: valor".
  const source: CareerSource = {};

  for (const line of allLines) {
    const meta = /^#\s*(fuente|cargado)\s*:\s*(.+)$/i.exec(line);

    if (meta?.[1].toLowerCase() === "fuente") source.url = meta[2].trim();
    if (meta?.[1].toLowerCase() === "cargado") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(meta[2].trim())) {
        throw new PlanParseError('La fecha de "# cargado:" tiene que ser AAAA-MM-DD.');
      }
      source.loadedAt = meta[2].trim();
    }
  }

  const lines = allLines.filter((line) => !line.startsWith("#"));

  if (lines.length === 0) {
    throw new PlanParseError("El texto está vacío.");
  }

  // Encabezado: "NOMBRE DE LA CARRERA - PLAN: XXX"
  const header = /^(.+?)\s*-\s*PLAN:\s*(\S+)\s*$/i.exec(lines[0]);

  if (!header) {
    throw new PlanParseError(
      'La primera línea tiene que ser "NOMBRE DE LA CARRERA - PLAN: CÓDIGO".'
    );
  }

  const name = toTitleCase(header[1]);
  const plan = header[2].toUpperCase();

  const listedTitles: string[] = [];
  const titleYears = new Map<string, number>();
  const raw: RawSubject[] = [];

  let year = 0;
  let semester: 1 | 2 | "annual" | 0 = 0;

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];

    const yearMatch = /^(\d+)\s*(?:er|ero|do|ro|to|vo|mo|no|°|º)?\s+año$/i.exec(line);
    if (yearMatch) {
      year = Number(yearMatch[1]);
      continue;
    }

    if (/^materias\s+anuales/i.test(line)) {
      semester = "annual";
      continue;
    }

    if (/cuatrimestre/i.test(line) && !isNameLine(line)) {
      semester = /primer|1/i.test(line) ? 1 : /segundo|2/i.test(line) ? 2 : semester;
      continue;
    }

    const titleLine = /^título:\s*(.+)$/i.exec(line);
    if (titleLine) {
      titleYears.set(toTitleCase(titleLine[1]), year);
      continue;
    }

    // Lista de títulos, antes de "1er Año" (con o sin viñetas).
    // Las resoluciones ("R.M.Nº…, UAI - CENTRO") se ignoran.
    if (year === 0) {
      const title = line.replace(/^\*\s*/, "");

      if (title && /[a-záéíóúñ]/i.test(title) && !RESOLUTION_LINE.test(title) && !HEADER_LABELS.has(title.toLocaleLowerCase("es"))) {
        listedTitles.push(toTitleCase(title));
      }
      continue;
    }

    if (line.startsWith("*")) {
      continue;
    }

    // Materia: código + nombre + [correlativas] + carga.
    if (isNumberLine(line) && index + 1 < lines.length && isNameLine(lines[index + 1])) {
      if (!year || !semester) {
        throw new PlanParseError(
          `La materia ${line} aparece antes de "1er Año" o de "Materias del primer cuatrimestre".`
        );
      }

      const code = Number(line);
      const subjectName = lines[index + 1];
      const values: string[] = [];
      let next = index + 2;

      // Números hasta el próximo código (un número seguido de un nombre).
      while (
        next < lines.length &&
        isCodeList(lines[next]) &&
        !(isNumberLine(lines[next]) && next + 1 < lines.length && isNameLine(lines[next + 1]))
      ) {
        values.push(lines[next]);
        next += 1;
      }

      if (values.length === 0 || values.length > 2 || !isNumberLine(values[values.length - 1])) {
        throw new PlanParseError(
          `No se entiende la materia ${code} (${subjectName}): se esperaban correlativas opcionales y la carga horaria.`
        );
      }

      raw.push({
        code,
        name: toTitleCase(subjectName),
        year,
        semester: semester === "annual" ? 1 : semester,
        annual: semester === "annual",
        hours: Number(values[values.length - 1]),
        prerequisiteCodes: values.length === 2 ? values[0].split(/\s+/).map(Number) : [],
      });

      index = next - 1;
    }
  }

  if (raw.length === 0) {
    throw new PlanParseError("No se encontró ninguna materia.");
  }

  // Ids legibles y únicos ("optativa-33" si el nombre se repite).
  const nameCount = new Map<string, number>();
  raw.forEach((subject) =>
    nameCount.set(slugify(subject.name), (nameCount.get(slugify(subject.name)) ?? 0) + 1)
  );

  const idByCode = new Map<number, string>();

  for (const subject of raw) {
    if (idByCode.has(subject.code)) {
      throw new PlanParseError(`El código ${subject.code} está repetido.`);
    }

    const slug = slugify(subject.name);
    idByCode.set(subject.code, nameCount.get(slug)! > 1 ? `${slug}-${subject.code}` : slug);
  }

  const subjects: AcademicSubject[] = raw.map((subject) => ({
    id: idByCode.get(subject.code)!,
    code: subject.code,
    name: subject.name,
    year: subject.year,
    semester: subject.semester,
    ...(subject.annual ? { annual: true } : {}),
    hours: subject.hours,
    prerequisites: subject.prerequisiteCodes.map((prerequisiteCode) => {
      const id = idByCode.get(prerequisiteCode);

      if (!id) {
        throw new PlanParseError(
          `La materia ${subject.code} pide la correlativa ${prerequisiteCode}, que no está en el plan.`
        );
      }

      return id;
    }),
  }));

  const years = Math.max(...subjects.map((subject) => subject.year));

  // Títulos: los marcados con "Título:" en su año; el resto, al final.
  const titleNames = [...new Set([...listedTitles, ...titleYears.keys()])];
  const titles: CareerTitle[] = titleNames
    .map((titleName) => ({ name: titleName, years: titleYears.get(titleName) || years }))
    .sort((first, second) => first.years - second.years);

  // "Licenciatura en Psicología" → título "Licenciatura", nombre corto
  // "Psicología". En "Abogacía" no hay nada que acortar.
  const degreeMatch = DEGREE_PREFIX.exec(name);
  const rest = degreeMatch ? name.slice(degreeMatch[0].length).trim() : "";
  const degree = degreeMatch && rest ? degreeMatch : null;
  const shortName = degree ? capitalize(rest) : name;

  return {
    career: {
      id: options.id ?? `${slugify(shortName)}-${slugify(plan)}`,
      name,
      ...(degree && shortName !== name ? { shortName, degree: degree[1] } : {}),
      plan,
      years,
      ...(titles.length > 0 ? { titles } : {}),
      ...(source.url || source.loadedAt ? { source } : {}),
    },
    subjects,
  };
}
