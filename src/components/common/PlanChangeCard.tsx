import { useState } from "react";

import type { AcademicSubject } from "../../types/AcademicSubject";
import type { SubjectStatus } from "../../types/SubjectProgress";

import {
  careerSummaries,
  displayName,
  getCareer,
  getCareerSummary,
  loadCareer,
} from "../../data/career";
import { getStoredRecord } from "../../store/useAcademicProgressStore";
import { previewEquivalences, type EquivalencePreview } from "../../utils/equivalences";
import { joinNames } from "../../utils/planInsights";
import type { CareerRecord } from "../../utils/progressValidation";
import { pluralize } from "../../utils/statusDisplay";

import ConfirmDialog from "./ConfirmDialog";

type PlanChangeCardProps = {
  currentCareerId: string;
  subjects: AcademicSubject[];
  progress: Record<string, SubjectStatus>;
  onApply: (careerId: string, record: CareerRecord, applied: number) => void;
};

export default function PlanChangeCard({
  currentCareerId,
  subjects,
  progress,
  onApply,
}: PlanChangeCardProps) {
  const options = careerSummaries.filter((summary) => summary.id !== currentCareerId);
  const [targetId, setTargetId] = useState(options[0]?.id ?? "");
  const [preview, setPreview] = useState<EquivalencePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passedCount = subjects.filter((subject) => progress[subject.id] === "passed").length;
  const selectedId = options.some((option) => option.id === targetId) ? targetId : options[0]?.id;
  const target = selectedId ? getCareerSummary(selectedId) : null;

  const open = async () => {
    if (!selectedId) return;

    setError(null);
    setIsLoading(true);

    try {
      await loadCareer(selectedId);
      setTargetId(selectedId);
      setPreview(
        previewEquivalences(
          subjects,
          progress,
          getCareer(selectedId).subjects,
          getStoredRecord(selectedId)
        )
      );
    } catch {
      setError("No se pudo cargar la carrera. Revisá tu conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  const names = (subjectsList: AcademicSubject[]) =>
    joinNames(
      subjectsList.map((subject) => subject.name),
      6
    );

  return (
    <>
      <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5">
        <div>
          <h3 className="text-base font-bold text-zinc-900">Cambiar de plan o de carrera</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Pasamos tus aprobadas que tengan el mismo nombre en el otro plan como equivalencias.
            Después podés ajustar a mano.
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Plan o carrera de destino</span>
            <select
              value={selectedId}
              onChange={(event) => setTargetId(event.target.value)}
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-800 outline-none focus-visible:ring-2 focus-visible:ring-[#7B1730]/30"
            >
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {displayName(option)} · Plan {option.plan}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            disabled={isLoading || passedCount === 0}
            onClick={() => void open()}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Cargando…" : "Ver qué pasa"}
          </button>
        </div>

        {passedCount === 0 && (
          <p className="text-xs text-zinc-500">Todavía no tenés materias aprobadas para pasar.</p>
        )}

        {error && <p className="text-sm font-medium text-red-700">{error}</p>}
      </section>

      <ConfirmDialog
        isOpen={preview !== null && target !== null}
        title={`Pasar a ${target ? displayName(target) : ""} (plan ${target?.plan ?? ""})`}
        description={
          preview ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl bg-[#E3F3EA] px-3.5 py-3 text-[#14532D]">
                <p className="font-semibold">
                  {preview.apply.length === 0
                    ? "Ninguna materia pasa como equivalencia"
                    : `${pluralize(preview.apply.length, "materia pasa", "materias pasan")} como equivalencia`}
                </p>
                {preview.apply.length > 0 && (
                  <p className="mt-1 text-[13px]">{names(preview.apply.map(({ to }) => to))}</p>
                )}
              </div>

              {preview.blocked.length > 0 && (
                <p className="text-[13px]">
                  <strong className="text-zinc-900">No pasan por correlativas:</strong>{" "}
                  {names(preview.blocked.map(({ to }) => to))}. En el plan nuevo piden materias
                  que no tenés aprobadas.
                </p>
              )}

              {preview.alreadyPassed.length > 0 && (
                <p className="text-[13px]">
                  Ya aprobadas en el destino: {names(preview.alreadyPassed.map(({ to }) => to))}.
                </p>
              )}

              {preview.unmatched.length > 0 && (
                <p className="text-[13px]">
                  <strong className="text-zinc-900">Sin una materia con el mismo nombre:</strong>{" "}
                  {names(preview.unmatched)}.
                </p>
              )}

              <p className="text-xs leading-5 text-zinc-500">
                Es una estimación por nombre: las equivalencias las otorga la universidad. Tu
                progreso en {displayName(getCareerSummary(currentCareerId))} no se borra.
              </p>
            </div>
          ) : null
        }
        confirmLabel={
          preview && preview.apply.length > 0
            ? `Pasar ${pluralize(preview.apply.length, "materia", "materias")}`
            : "Cambiar de carrera igual"
        }
        cancelLabel="Cancelar"
        onConfirm={() => {
          if (preview && target) {
            onApply(target.id, preview.result, preview.apply.length);
          }
          setPreview(null);
        }}
        onCancel={() => setPreview(null)}
      />
    </>
  );
}
