import type { SubjectStatus } from "../types/SubjectProgress";
import type { SubjectViewModel } from "./subjectView";

/**
 * Estado tal como se muestra en pantalla: los cuatro estados que
 * guarda la persona, más "Disponible" y "Bloqueada" para las
 * materias pendientes según sus correlativas.
 */
export type DisplayStatus =
  | "passed"
  | "regular"
  | "in_progress"
  | "available"
  | "blocked";

export const statusLabels: Record<SubjectStatus, string> = {
  pending: "Pendiente",
  in_progress: "Cursando",
  regular: "Debe final",
  passed: "Aprobada",
};

type StatusStyle = {
  label: string;
  /** Pastilla de estado. */
  pill: string;
  /** Punto de color en leyendas y pastillas. */
  dot: string;
  /** Mosaico de la vista de mapa. */
  tile: string;
  /** Color sólido para barras. */
  bar: string;
};

// Cada estado tiene su propio color. El bordó queda reservado
// para la marca y las acciones principales.
export const statusStyles: Record<DisplayStatus, StatusStyle> = {
  passed: {
    label: "Aprobada",
    pill: "bg-[#E3F3EA] text-[#14532D] border-[#E3F3EA]",
    dot: "bg-[#1F8A50]",
    tile: "bg-[#E3F3EA] text-[#14532D] border-[#CFE9DA]",
    bar: "bg-[#1F8A50]",
  },
  regular: {
    label: "Debe final",
    pill: "bg-[#FDF0D5] text-[#6B4100] border-[#FDF0D5]",
    dot: "bg-[#E9A62B]",
    tile: "bg-[#FDF0D5] text-[#6B4100] border-[#F6DFAE]",
    bar: "bg-[#E9A62B]",
  },
  in_progress: {
    label: "Cursando",
    pill: "bg-[#E2ECFB] text-[#1D4E9E] border-[#E2ECFB]",
    dot: "bg-[#2F6FD6]",
    tile: "bg-[#E2ECFB] text-[#1D4E9E] border-[#C9DAF6]",
    bar: "bg-[#2F6FD6]",
  },
  available: {
    label: "Disponible",
    pill: "bg-white text-zinc-800 border-zinc-400",
    dot: "border-2 border-zinc-600 bg-white",
    tile: "bg-white text-zinc-900 border-dashed border-zinc-500",
    bar: "bg-zinc-400",
  },
  blocked: {
    label: "Bloqueada",
    pill: "bg-zinc-100 text-zinc-600 border-zinc-100",
    dot: "bg-zinc-300",
    tile: "bg-zinc-100 text-zinc-500 border-zinc-200",
    bar: "bg-zinc-300",
  },
};

export const displayStatusOrder: DisplayStatus[] = [
  "passed",
  "regular",
  "in_progress",
  "available",
  "blocked",
];

export function getDisplayStatus(viewModel: SubjectViewModel): DisplayStatus {
  if (viewModel.status !== "pending") {
    return viewModel.status;
  }

  return viewModel.prerequisitesMet ? "available" : "blocked";
}

/** "1 materia" / "3 materias" */
export function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}
