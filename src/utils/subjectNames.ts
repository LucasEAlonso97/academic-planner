import type { AcademicSubject } from "../types/AcademicSubject";

/** "Optativa: Periodismo de Moda" si la persona le puso nombre. */
export function subjectDisplayName(subject: AcademicSubject, customNames: Record<string, string>) {
  const custom = customNames[subject.id];
  return custom ? `${subject.name}: ${custom}` : subject.name;
}
