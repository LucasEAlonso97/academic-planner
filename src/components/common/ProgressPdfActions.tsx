import {
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import ConfirmDialog from "./ConfirmDialog";

import type { AcademicSubject } from "../../types/AcademicSubject";
import type { SubjectStatus } from "../../types/SubjectProgress";

import {
  exportProgressToPdf,
  importProgressFromPdf,
} from "../../utils/progressPdf";

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

  const handleExport = () => {
    setMessage(null);

    try {
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

  return (
    <>
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7B1730]">
              Copia de seguridad
            </p>

            <h2 className="mt-1 text-lg font-black text-zinc-900">
              Exportar o recuperar progreso
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
              Descargá un PDF con tu recorrido académico o
              recuperá el progreso desde un archivo generado
              anteriormente por UAI Planner.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleExport}
              className="rounded-xl bg-[#7B1730] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#651226]"
            >
              Descargar PDF
            </button>

            <button
              type="button"
              disabled={isImporting}
              onClick={handleOpenFileSelector}
              className="rounded-xl border border-[#7B1730]/25 bg-white px-5 py-2.5 text-sm font-bold text-[#7B1730] transition hover:bg-[#7B1730]/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isImporting
                ? "Leyendo PDF..."
                : "Importar PDF"}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {message && (
          <p
            role="status"
            className={
              message.type === "success"
                ? "mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700"
                : "mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            }
          >
            {message.text}
          </p>
        )}

        <div className="mt-4 rounded-xl bg-zinc-50 px-4 py-3">
          <p className="text-xs leading-5 text-zinc-500">
            Solo pueden importarse archivos PDF descargados
            directamente desde UAI Planner. Antes de
            reemplazar el progreso se mostrará un resumen
            para confirmar la operación.
          </p>
        </div>
      </section>

      <ConfirmDialog
        isOpen={pendingImport !== null}
        title="¿Importar este progreso?"
        description={
          pendingImport ? (
            <div>
              <p>
                Se encontró una copia de seguridad compatible
                con el plan{" "}
                <strong className="text-zinc-800">
                  {plan}
                </strong>
                .
              </p>

              <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="break-all text-xs font-semibold text-zinc-500">
                  Archivo: {pendingImport.fileName}
                </p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                  <p className="text-xs font-semibold text-green-700">
                    Aprobadas
                  </p>

                  <strong className="mt-1 block text-xl font-black text-green-800">
                    {importedApprovedCount}
                  </strong>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-700">
                    Debe final
                  </p>

                  <strong className="mt-1 block text-xl font-black text-amber-800">
                    {importedRegularCount}
                  </strong>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs font-semibold text-blue-700">
                    Cursando
                  </p>

                  <strong className="mt-1 block text-xl font-black text-blue-800">
                    {importedInProgressCount}
                  </strong>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white p-3">
                  <p className="text-xs font-semibold text-zinc-600">
                    Pendientes
                  </p>

                  <strong className="mt-1 block text-xl font-black text-zinc-800">
                    {importedPendingCount}
                  </strong>
                </div>
              </div>

              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                Tu progreso actual será reemplazado por el
                progreso guardado en este PDF.
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