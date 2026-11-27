import { jsPDF } from "jspdf";
import { PDFDocument } from "pdf-lib";

import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";

import { formatGrade, summarizeGrades } from "./grades";
import { periodGroups } from "./subjectPeriods";
import {
  sanitizeCareerRecord,
  type CareerRecord,
} from "./progressValidation";

const BACKUP_PREFIX = "UAI_PLANNER_BACKUP_V1:";


const statusLabels: Record<SubjectStatus, string> = {
  pending: "Pendiente",
  in_progress: "Cursando",
  regular: "Debe final",
  passed: "Aprobada",
};

// v1: solo progreso. v2: suma notas, plan de cuatrimestres y ritmo.
type ProgressPdfBackup = {
  app: "uai-planner";
  version: 1 | 2;
  plan: string;
  exportedAt: string;
  progress: Record<string, SubjectStatus>;
  grades?: Record<string, number>;
  planned?: Record<string, string>;
  pace?: number;
};

type ExportProgressPdfOptions = {
  careerName: string;
  plan: string;
  subjects: AcademicSubject[];
  record: CareerRecord;
};

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);

  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window.btoa(binary);
}

function decodeBase64(value: string): string {
  const binary = window.atob(value);

  const bytes = Uint8Array.from(
    binary,
    (character) => character.charCodeAt(0)
  );

  return new TextDecoder().decode(bytes);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatus(
  subjectId: string,
  progress: Record<string, SubjectStatus>
): SubjectStatus {
  return progress[subjectId] ?? "pending";
}

export function exportProgressToPdf({
  careerName,
  plan,
  subjects,
  record,
}: ExportProgressPdfOptions): void {
  const exportedAt = new Date();
  const { progress, grades } = record;

  const backup: ProgressPdfBackup = {
    app: "uai-planner",
    version: 2,
    plan,
    exportedAt: exportedAt.toISOString(),
    progress,
    grades: record.grades,
    planned: record.planned,
    pace: record.pace,
  };

  const encodedBackup = encodeBase64(
    JSON.stringify(backup)
  );

  const document = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth =
    document.internal.pageSize.getWidth();

  const pageHeight =
    document.internal.pageSize.getHeight();

  const leftMargin = 18;
  const rightMargin = 18;
  const bottomMargin = 18;

  let cursorY = 18;

  function addPageIfNeeded(
    requiredHeight: number
  ): void {
    if (
      cursorY + requiredHeight >
      pageHeight - bottomMargin
    ) {
      document.addPage();
      cursorY = 20;
    }
  }

  const approvedCount = subjects.filter(
    (subject) =>
      getStatus(subject.id, progress) === "passed"
  ).length;

  const regularCount = subjects.filter(
    (subject) =>
      getStatus(subject.id, progress) === "regular"
  ).length;

  const inProgressCount = subjects.filter(
    (subject) =>
      getStatus(subject.id, progress) ===
      "in_progress"
  ).length;

  const progressPercentage = Math.round(
    (approvedCount / subjects.length) * 100
  );

  // Encabezado institucional
  document.setFillColor(123, 23, 48);
  document.rect(0, 0, pageWidth, 42, "F");

  document.setTextColor(255, 255, 255);
  document.setFont("helvetica", "bold");
  document.setFontSize(23);
  document.text("UAI Planner", leftMargin, 18);

  document.setFont("helvetica", "normal");
  document.setFontSize(10);
  document.text(
    "Planificador académico independiente",
    leftMargin,
    25
  );

  document.setFont("helvetica", "bold");
  document.setFontSize(12);

  const careerLines = document.splitTextToSize(
    careerName,
    pageWidth - leftMargin - rightMargin
  );

  document.text(careerLines, leftMargin, 34);

  cursorY = 54;

  document.setTextColor(35, 35, 35);
  document.setFont("helvetica", "bold");
  document.setFontSize(13);
  document.text(
    `Plan ${plan}`,
    leftMargin,
    cursorY
  );

  document.setFont("helvetica", "normal");
  document.setFontSize(9);
  document.setTextColor(100, 100, 100);
  document.text(
    `Exportado el ${formatDate(exportedAt)}`,
    pageWidth - rightMargin,
    cursorY,
    {
      align: "right",
    }
  );

  cursorY += 12;

  // Resumen
  const summaryItems = [
    {
      label: "Progreso",
      value: `${progressPercentage}%`,
    },
    {
      label: "Aprobadas",
      value: String(approvedCount),
    },
    {
      label: "Debe final",
      value: String(regularCount),
    },
    {
      label: "Cursando",
      value: String(inProgressCount),
    },
  ];

  const { average } = summarizeGrades(subjects, progress, grades);

  if (average !== null) {
    summaryItems.push({ label: "Promedio", value: formatGrade(average) });
  }

  const cardGap = 4;

  const cardWidth =
    (pageWidth -
      leftMargin -
      rightMargin -
      cardGap * (summaryItems.length - 1)) /
    summaryItems.length;

  summaryItems.forEach((item, index) => {
    const cardX =
      leftMargin + index * (cardWidth + cardGap);

    document.setFillColor(248, 246, 247);
    document.setDrawColor(225, 220, 222);

    document.roundedRect(
      cardX,
      cursorY,
      cardWidth,
      25,
      3,
      3,
      "FD"
    );

    document.setTextColor(105, 95, 100);
    document.setFont("helvetica", "normal");
    document.setFontSize(8);
    document.text(
      item.label,
      cardX + 4,
      cursorY + 8
    );

    document.setTextColor(123, 23, 48);
    document.setFont("helvetica", "bold");
    document.setFontSize(16);
    document.text(
      item.value,
      cardX + 4,
      cursorY + 19
    );
  });

  cursorY += 36;

  const years = [...new Set(subjects.map((subject) => subject.year))].sort(
    (first, second) => first - second
  );
  const semesters = periodGroups;

  years.forEach((year) => {
    addPageIfNeeded(18);

    document.setFillColor(123, 23, 48);
    document.roundedRect(
      leftMargin,
      cursorY,
      pageWidth - leftMargin - rightMargin,
      10,
      2,
      2,
      "F"
    );

    document.setTextColor(255, 255, 255);
    document.setFont("helvetica", "bold");
    document.setFontSize(11);
    document.text(
      `${year}° Año`,
      leftMargin + 4,
      cursorY + 6.8
    );

    cursorY += 16;

    semesters.forEach((semester) => {
      const semesterSubjects = subjects.filter(
        (subject) =>
          subject.year === year && semester.matches(subject)
      );

      if (semesterSubjects.length === 0) {
        return;
      }

      addPageIfNeeded(14);

      document.setTextColor(123, 23, 48);
      document.setFont("helvetica", "bold");
      document.setFontSize(10);
      document.text(
        semester.key === "annual"
          ? "Materias anuales"
          : semester.key === "1"
            ? "Primer cuatrimestre"
            : "Segundo cuatrimestre",
        leftMargin,
        cursorY
      );

      cursorY += 7;

      semesterSubjects.forEach((subject) => {
        const status = getStatus(
          subject.id,
          progress
        );

        const title = `${String(
          subject.code
        ).padStart(2, "0")} - ${subject.name}`;

        const titleLines =
          document.splitTextToSize(title, 125);

        const rowHeight = Math.max(
          9,
          titleLines.length * 4.5 + 3
        );

        addPageIfNeeded(rowHeight + 2);

        document.setFillColor(251, 251, 251);
        document.setDrawColor(230, 230, 230);

        document.roundedRect(
          leftMargin,
          cursorY - 4,
          pageWidth -
            leftMargin -
            rightMargin,
          rowHeight,
          2,
          2,
          "FD"
        );

        document.setTextColor(45, 45, 45);
        document.setFont("helvetica", "bold");
        document.setFontSize(9);
        document.text(
          titleLines,
          leftMargin + 4,
          cursorY + 1
        );

        document.setTextColor(123, 23, 48);
        document.setFont("helvetica", "bold");
        document.setFontSize(8);

        const grade = grades[subject.id];

        document.text(
          status === "passed" && grade !== undefined
            ? `${statusLabels[status]} · ${formatGrade(grade)}`
            : statusLabels[status],
          pageWidth - rightMargin - 4,
          cursorY + 1,
          {
            align: "right",
          }
        );

        cursorY += rowHeight + 2;
      });

      cursorY += 5;
    });

    cursorY += 4;
  });

  // Pie de página
  const pageCount = document.getNumberOfPages();

  for (
    let pageNumber = 1;
    pageNumber <= pageCount;
    pageNumber += 1
  ) {
    document.setPage(pageNumber);

    document.setDrawColor(225, 225, 225);
    document.line(
      leftMargin,
      pageHeight - 13,
      pageWidth - rightMargin,
      pageHeight - 13
    );

    document.setTextColor(125, 125, 125);
    document.setFont("helvetica", "normal");
    document.setFontSize(7.5);

    document.text(
      "Herramienta independiente. Verificá siempre la información en los canales oficiales de la UAI.",
      leftMargin,
      pageHeight - 8
    );

    document.text(
      `${pageNumber} / ${pageCount}`,
      pageWidth - rightMargin,
      pageHeight - 8,
      {
        align: "right",
      }
    );
  }

  // El respaldo se guarda dentro de los metadatos.
  document.setProperties({
    title: `Progreso académico - ${careerName}`,
    subject: `${BACKUP_PREFIX}${encodedBackup}`,
    author: "UAI Planner",
    creator: "UAI Planner",
    keywords:
      "UAI Planner, progreso académico, VCO-19",
  });

  const filenameDate = exportedAt
    .toISOString()
    .slice(0, 10);

  document.save(
    `uai-planner-${plan}-${filenameDate}.pdf`
  );
}

export async function importProgressFromPdf(
  file: File,
  expectedPlan: string,
  subjects: AcademicSubject[]
): Promise<CareerRecord> {
  const looksLikePdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  if (!looksLikePdf) {
    throw new Error(
      "Seleccioná un archivo PDF."
    );
  }

  let pdfDocument: PDFDocument;

  try {
    const fileBytes = await file.arrayBuffer();

    pdfDocument = await PDFDocument.load(
      fileBytes
    );
  } catch {
    throw new Error(
      "No se pudo abrir el PDF seleccionado."
    );
  }

  const subjectMetadata =
    pdfDocument.getSubject();

  if (
    !subjectMetadata ||
    !subjectMetadata.startsWith(BACKUP_PREFIX)
  ) {
    throw new Error(
      "Este PDF no contiene un respaldo de UAI Planner."
    );
  }

  let backup: ProgressPdfBackup;

  try {
    const encodedPayload =
      subjectMetadata.slice(
        BACKUP_PREFIX.length
      );

    const decodedPayload =
      decodeBase64(encodedPayload);

    backup = JSON.parse(
      decodedPayload
    ) as ProgressPdfBackup;
  } catch {
    throw new Error(
      "El respaldo dentro del PDF está dañado."
    );
  }

  if (
    backup.app !== "uai-planner" ||
    (backup.version !== 1 && backup.version !== 2)
  ) {
    throw new Error(
      "La versión de este respaldo no es compatible."
    );
  }

  if (backup.plan !== expectedPlan) {
    throw new Error(
      `El PDF corresponde al plan ${backup.plan}, no al plan ${expectedPlan}.`
    );
  }

  if (
    !backup.progress ||
    typeof backup.progress !== "object"
  ) {
    throw new Error(
      "El PDF no contiene un progreso válido."
    );
  }

  // Solo materias del plan con datos válidos, y coherentes
  // con las correlativas.
  return sanitizeCareerRecord(
    {
      progress: backup.progress,
      grades: backup.grades,
      planned: backup.planned,
      pace: backup.pace,
    },
    subjects
  ).record;
}