export type AcademicCalendarInfo = {
  formattedDate: string;
  periodName: string;
  periodDescription: string;
  nextPeriod: string;
  activeSemester: 1 | 2 | null;
  nextSemester: 1 | 2;
  nextAcademicYear: number;
};

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getAcademicCalendar(
  date: Date = new Date()
): AcademicCalendarInfo {
  const month = date.getMonth();
  const year = date.getFullYear();

  const formattedDate = capitalize(
    new Intl.DateTimeFormat("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date)
  );

  // Abril a julio: primer cuatrimestre.
  if (month >= 3 && month <= 6) {
    return {
      formattedDate,
      periodName: "Primer cuatrimestre",
      periodDescription:
        month === 6
          ? "Estás finalizando el primer cuatrimestre."
          : "Estás cursando el primer cuatrimestre.",
      nextPeriod: `Agosto–Noviembre de ${year}`,
      activeSemester: 1,
      nextSemester: 2,
      nextAcademicYear: year,
    };
  }

  // Agosto a noviembre: segundo cuatrimestre.
  if (month >= 7 && month <= 10) {
    return {
      formattedDate,
      periodName: "Segundo cuatrimestre",
      periodDescription:
        month === 10
          ? "Estás finalizando el segundo cuatrimestre."
          : "Estás cursando el segundo cuatrimestre.",
      nextPeriod: `Abril–julio de ${year + 1}`,
      activeSemester: 2,
      nextSemester: 1,
      nextAcademicYear: year + 1,
    };
  }

  // Enero, febrero y marzo.
  if (month <= 2) {
    return {
      formattedDate,
      periodName: "Receso académico",
      periodDescription:
        "No hay un cuatrimestre regular en curso.",
      nextPeriod: `Abril–julio de ${year}`,
      activeSemester: null,
      nextSemester: 1,
      nextAcademicYear: year,
    };
  }

  // Diciembre.
  return {
    formattedDate,
    periodName: "Receso académico",
    periodDescription:
      "No hay un cuatrimestre regular en curso.",
    nextPeriod: `Abril–julio de ${year + 1}`,
    activeSemester: null,
    nextSemester: 1,
    nextAcademicYear: year + 1,
  };
}