import {
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import ConfirmDialog from "./ConfirmDialog";

import type { AcademicSubject } from "../../types/AcademicSubject";
import type { SubjectStatus } from "../../types/SubjectProgress";

// jsPDF y pdf-lib pesan casi 1 MB: se cargan recién
// cuando la persona exporta o importa.
const loadPdfUtils = () =>
  import("../../utils/progressPdf");

type ProgressPdfActionsProps = {
  careerName: string;
  plan: string;
  subjects: AcademicSubject[];
  progress: Record<string, SubjectStatus>;

  onImport: (
    progress: Record<string, SubjectStatus>
  ) => void;
};

type ActionMessage =
  | {
      type: "success" | "error";
      text: string;
    }
  | null;

type PendingImport = {
  fileName: string;
  progress: Record<string, SubjectStatus>;
};

export default function ProgressPdfActions({
  careerName,
  plan,
  subjects,
  progress,
  onImport,
}: ProgressPdfActionsProps) {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [message, setMessage] =
    useState<ActionMessage>(null);

  const [isImporting, setIsImporting] =
    useState(false);

  const [pendingImport, setPendingImport] =
    useState<PendingImport | null>(null);

  const [isExporting, setIsExporting] =
    useState(false);

  const handleExport = async () => {
    setMessage(null);
    setIsExporting(true);

    try {
      const { exportProgressToPdf } =
        await loadPdfUtils();

      exportProgressToPdf({
        careerName,
        plan,
        subjects,
        progress,
      });

      setMessage({
        type: "success",
        text: "El PDF se descargó correctamente.",
      });
    } catch {
      setMessage({
        type: "error",
        text: "No se pudo generar el PDF.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenFileSelector = () => {
    setMessage(null);

    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    // Permite seleccionar nuevamente el mismo archivo.
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsImporting(true);
    setMessage(null);

    try {
      const { importProgressFromPdf } =
        await loadPdfUtils();

      const importedProgress =
        await importProgressFromPdf(
          file,
          plan,
          subjects
        );

      // Todavía no modificamos el progreso.
      // Guardamos temporalmente la importación
      // hasta que el usuario confirme.
      setPendingImport({
        fileName: file.name,
        progress: importedProgress,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "No se pudo importar el PDF.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const confirmImport = () => {
    if (!pendingImport) {
      return;
    }

    onImport(pendingImport.progress);

    setPendingImport(null);

    setMessage({
      type: "success",
      text: "El progreso fue importado correctamente.",
    });
  };

  const cancelImport = () => {
    setPendingImport(null);

    setMessage({
      type: "error",
      text: "La importación fue cancelada. Tu progreso no cambió.",
    });
  };

  const importedApprovedCount = pendingImport
    ? subjects.filter(
        (subject) =>
          pendingImport.progress[subject.id] ===
          "passed"
      ).length
    : 0;

  const importedRegularCount = pendingImport
    ? subjects.filter(
        (subject) =>
          pendingImport.progress[subject.id] ===
          "regular"
      ).length
    : 0;

  const importedInProgressCount = pendingImport
    ? subjects.filter(
        (subject) =>
          pendingImport.progress[subject.id] ===
          "in_progress"
      ).length
    : 0;

  const importedPendingCount =
    subjects.length -
    importedApprovedCount -
    importedRegularCount -
    importedInProgressCount;

  const importedCounts = [
    { label: "Aprobadas", value: importedApprovedCount },
    { label: "Debe final", value: importedRegularCount },
    { label: "Cursando", value: importedInProgressCount },
    { label: "Pendientes", value: importedPendingCount },
  ];

  return (
    <>
      <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5">
        <div>
          <h3 className="text-base font-bold text-zinc-900">
            Copia de seguridad
          </h3>

          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Tu progreso se guarda solo en este navegador.
            Descargá un PDF para no perderlo o para pasarlo a
            otro dispositivo.
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExport}
            className="h-11 rounded-xl bg-[#7B1730] px-4 text-sm font-semibold text-white transition hover:bg-[#651226] disabled:opacity-60"
          >
            {isExporting ? "Generando PDF…" : "Descargar PDF"}
          </button>

          <button
            type="button"
            disabled={isImporting}
            onClick={handleOpenFileSelector}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isImporting ? "Leyendo PDF…" : "Importar PDF"}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {message && (
          <p
            role="status"
            className={
              message.type === "success"
                ? "rounded-xl bg-[#E3F3EA] px-3.5 py-2.5 text-sm font-medium text-[#14532D]"
                : "rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
            }
          >
            {message.text}
          </p>
        )}

        <p className="text-xs leading-5 text-zinc-500">
          Solo se pueden importar PDF descargados desde esta
          app. Antes de reemplazar tu progreso vas a ver un
          resumen.
        </p>
      </section>

      <ConfirmDialog
        isOpen={pendingImport !== null}
        tone="danger"
        title="¿Importar este progreso?"
        description={
          pendingImport ? (
            <div>
              <p>
                Copia de seguridad del plan{" "}
                <strong className="text-zinc-900">{plan}</strong>
                <span className="block break-all text-xs text-zinc-500">
                  {pendingImport.fileName}
                </span>
              </p>

              <dl className="mt-3 grid grid-cols-2 gap-2">
                {importedCounts.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl bg-zinc-50 px-3 py-2"
                  >
                    <dt className="text-xs text-zinc-600">
                      {item.label}
                    </dt>
                    <dd className="text-xl font-bold text-zinc-900">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-3 font-medium text-red-700">
                Tu progreso actual se va a reemplazar por el de
                este PDF.
              </p>
            </div>
          ) : null
        }
        confirmLabel="Importar progreso"
        cancelLabel="Cancelar"
        onConfirm={confirmImport}
        onCancel={cancelImport}
      />
    </>
  );
}
