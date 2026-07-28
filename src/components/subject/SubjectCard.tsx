import type { AcademicSubject } from "../../types/AcademicSubject";
import type { SubjectStatus } from "../../types/SubjectProgress";

type SubjectCardProps = {
  subject: AcademicSubject;
  status: SubjectStatus;
  prerequisitesMet: boolean;
  isAvailable: boolean;
  missingPrerequisites: AcademicSubject[];
  prerequisitesCount: number;
  unlockedSubjects: AcademicSubject[];

  onStatusChange: (
    subject: AcademicSubject,
    status: SubjectStatus
  ) => boolean;
};

const statusLabels: Record<SubjectStatus, string> = {
  pending: "Pendiente",
  in_progress: "Cursando",
  regular: "Debe final",
  passed: "Aprobada",
};

const statusStyles: Record<SubjectStatus, string> = {
  pending:
    "border-zinc-200 bg-zinc-100 text-zinc-700",
  in_progress:
    "border-blue-200 bg-blue-100 text-blue-700",
  regular:
    "border-amber-200 bg-amber-100 text-amber-800",
  passed:
    "border-green-200 bg-green-100 text-green-700",
};

const sideBarStyles: Record<SubjectStatus, string> = {
  pending: "bg-zinc-300",
  in_progress: "bg-blue-500",
  regular: "bg-amber-500",
  passed: "bg-green-500",
};

export default function SubjectCard({
  subject,
  status,
  prerequisitesMet,
  isAvailable,
  missingPrerequisites,
  prerequisitesCount,
  unlockedSubjects,
  onStatusChange,
}: SubjectCardProps) {
  const isBlocked =
    status === "pending" && !prerequisitesMet;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 pl-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`absolute left-0 top-0 h-full w-2 ${
          isAvailable
            ? "bg-[#7B1730]"
            : sideBarStyles[status]
        }`}
      />

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7B1730]/10 text-xl text-[#7B1730]">
          📖
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black text-zinc-900">
            {subject.name}
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            Código {subject.code} · {subject.year}° Año ·{" "}
            {subject.semester}° Cuatrimestre
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
              {subject.hours} hs
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
            >
              {statusLabels[status]}
            </span>

            {status === "pending" && (
              <span
                className={
                  isAvailable
                    ? "rounded-full border border-[#7B1730]/20 bg-[#7B1730]/10 px-3 py-1 text-xs font-semibold text-[#7B1730]"
                    : "rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-500"
                }
              >
                {isAvailable
                  ? "Disponible"
                  : "Bloqueada"}
              </span>
            )}
          </div>

          <p className="mt-4 text-sm text-zinc-500">
            Correlativas:{" "}
            <strong className="text-zinc-800">
              {prerequisitesCount === 0
                ? "Sin correlativas"
                : prerequisitesCount}
            </strong>
          </p>

          {isBlocked &&
            missingPrerequisites.length > 0 && (
              <details className="group mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-zinc-700">
                  <span>
                    🔒 Faltan{" "}
                    {missingPrerequisites.length}{" "}
                    correlativa
                    {missingPrerequisites.length === 1
                      ? ""
                      : "s"}
                  </span>

                  <span className="text-xs text-[#7B1730] transition-transform group-open:rotate-180">
                    ▼
                  </span>
                </summary>

                <div className="border-t border-zinc-200 px-4 py-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Deben estar en “Debe final” o
                    “Aprobada”
                  </p>

                  <ul className="space-y-2">
                    {missingPrerequisites.map(
                      (prerequisite) => (
                        <li
                          key={prerequisite.id}
                          className="flex gap-2 text-sm text-zinc-700"
                        >
                          <span className="text-[#7B1730]">
                            •
                          </span>

                          <span>
                            {prerequisite.name}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </details>
            )}

          {unlockedSubjects.length > 0 && (
            <details className="group mt-3 overflow-hidden rounded-xl border border-[#7B1730]/15 bg-[#7B1730]/5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-[#7B1730]">
                <span>
                  🔓 Puede desbloquear{" "}
                  {unlockedSubjects.length} materia
                  {unlockedSubjects.length === 1
                    ? ""
                    : "s"}
                </span>

                <span className="text-xs transition-transform group-open:rotate-180">
                  ▼
                </span>
              </summary>

              <div className="border-t border-[#7B1730]/10 bg-white/70 px-4 py-3">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Materias que dependen de esta
                </p>

                <ul className="space-y-2">
                  {unlockedSubjects.map(
                    (unlockedSubject) => (
                      <li
                        key={unlockedSubject.id}
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <div className="flex min-w-0 gap-2 text-zinc-700">
                          <span className="text-[#7B1730]">
                            •
                          </span>

                          <span>
                            {unlockedSubject.name}
                          </span>
                        </div>

                        <span className="shrink-0 text-xs font-semibold text-zinc-400">
                          {unlockedSubject.year}° año ·{" "}
                          {unlockedSubject.semester}°
                          cuatri.
                        </span>
                      </li>
                    )
                  )}
                </ul>

                <p className="mt-3 text-xs text-zinc-500">
                  Algunas pueden requerir otras
                  correlativas adicionales.
                </p>
              </div>
            </details>
          )}

          <select
            value={status}
            onChange={(event) =>
              onStatusChange(
                subject,
                event.target.value as SubjectStatus
              )
            }
            className="mt-4 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 outline-none transition focus:border-[#7B1730]"
          >
            <option value="pending">
              Pendiente
            </option>

            <option
              value="in_progress"
              disabled={
                !prerequisitesMet &&
                status !== "in_progress"
              }
            >
              Cursando
            </option>

            <option
              value="regular"
              disabled={
                !prerequisitesMet &&
                status !== "regular"
              }
            >
              Debe final
            </option>

            <option
              value="passed"
              disabled={
                !prerequisitesMet &&
                status !== "passed"
              }
            >
              Aprobada
            </option>
          </select>

          {isBlocked && (
            <p className="mt-2 text-xs text-zinc-500">
              Completá las correlativas para habilitar
              los demás estados.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}