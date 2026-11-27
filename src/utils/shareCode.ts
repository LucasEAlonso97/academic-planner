import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";
import type { CareerRecord } from "./progressValidation";

/*
 * Código para pasar el progreso a otro dispositivo sin servidor:
 * todo viaja dentro del link (y del QR).
 *
 * { v: 1, c: careerId, s: "3302…", g: { "1": 8, … }, t: { "11": "2027-1", … }, p: 5,
 *   e: [3, 4], n: { "33": "Periodismo de Moda" } }
 * - s: un dígito por materia, en el orden del plan
 *   (0 pendiente, 1 cursando, 2 debe final, 3 aprobada)
 * - g, t y n usan el código de la materia como clave; e es la lista de
 *   códigos aprobados por equivalencia
 */

const STATUS_DIGITS: SubjectStatus[] = ["pending", "in_progress", "regular", "passed"];

export const SHARE_PARAM = "importar";

type SharePayload = {
  v: 1;
  c: string;
  s: string;
  g?: Record<string, number>;
  t?: Record<string, string>;
  p?: number;
  e?: number[];
  n?: Record<string, string>;
};

function toBase64Url(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string) {
  const base64 = code.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

export function encodeShareCode(
  careerId: string,
  subjects: AcademicSubject[],
  record: CareerRecord
): string {
  const payload: SharePayload = {
    v: 1,
    c: careerId,
    s: subjects
      .map((subject) => STATUS_DIGITS.indexOf(record.progress[subject.id] ?? "pending"))
      .join(""),
    p: record.pace,
  };

  const grades: Record<string, number> = {};
  const terms: Record<string, string> = {};

  for (const subject of subjects) {
    if (record.grades[subject.id] !== undefined && record.progress[subject.id] === "passed") {
      grades[subject.code] = record.grades[subject.id];
    }

    if (record.planned[subject.id] && (record.progress[subject.id] ?? "pending") === "pending") {
      terms[subject.code] = record.planned[subject.id];
    }
  }

  const equivalences = subjects
    .filter((subject) => record.equivalences[subject.id] && record.progress[subject.id] === "passed")
    .map((subject) => subject.code);
  const names: Record<string, string> = {};

  for (const subject of subjects) {
    if (record.customNames[subject.id]) {
      names[subject.code] = record.customNames[subject.id];
    }
  }

  if (Object.keys(grades).length > 0) payload.g = grades;
  if (Object.keys(terms).length > 0) payload.t = terms;
  if (equivalences.length > 0) payload.e = equivalences;
  if (Object.keys(names).length > 0) payload.n = names;

  return toBase64Url(JSON.stringify(payload));
}

/** Carrera de un código, sin decodificar el resto (para descargarla antes). */
export function peekShareCareerId(code: string): string | null {
  try {
    const payload = JSON.parse(fromBase64Url(code)) as Partial<SharePayload>;
    return payload?.v === 1 && typeof payload.c === "string" ? payload.c : null;
  } catch {
    return null;
  }
}

/**
 * Decodifica un código. Devuelve los datos crudos para que el store
 * los valide; null si el código no es válido.
 */
export function decodeShareCode(
  code: string,
  getSubjects: (careerId: string) => AcademicSubject[] | null
): { careerId: string; record: Partial<CareerRecord> } | null {
  let payload: SharePayload;

  try {
    payload = JSON.parse(fromBase64Url(code));
  } catch {
    return null;
  }

  if (payload?.v !== 1 || typeof payload.c !== "string" || typeof payload.s !== "string") {
    return null;
  }

  const subjects = getSubjects(payload.c);

  if (!subjects || payload.s.length !== subjects.length) {
    return null;
  }

  const byCode = new Map(subjects.map((subject) => [String(subject.code), subject.id]));
  const progress: Record<string, SubjectStatus> = {};

  subjects.forEach((subject, index) => {
    const status = STATUS_DIGITS[Number(payload.s[index])];

    if (status && status !== "pending") {
      progress[subject.id] = status;
    }
  });

  const remap = <T>(source: Record<string, T> | undefined) =>
    Object.fromEntries(
      Object.entries(source ?? {})
        .filter(([code]) => byCode.has(code))
        .map(([code, value]) => [byCode.get(code)!, value])
    );

  const equivalences = Object.fromEntries(
    (Array.isArray(payload.e) ? payload.e : [])
      .filter((code) => byCode.has(String(code)))
      .map((code) => [byCode.get(String(code))!, true as const])
  );

  return {
    careerId: payload.c,
    record: {
      progress,
      grades: remap(payload.g),
      planned: remap(payload.t),
      pace: payload.p,
      equivalences,
      customNames: remap(payload.n),
    },
  };
}

/** Lee el código del hash de la URL (#importar=…). */
export function readShareCodeFromUrl(): string | null {
  const match = new RegExp(`[#&]${SHARE_PARAM}=([A-Za-z0-9_-]+)`).exec(window.location.hash);
  return match ? match[1] : null;
}

export function buildShareUrl(code: string) {
  return `${window.location.origin}${window.location.pathname}#${SHARE_PARAM}=${code}`;
}

/** Saca el código de la URL sin recargar la página. */
export function clearShareCodeFromUrl() {
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
}
