import type { SubjectViewModel } from "../../utils/subjectView";

type NextSemesterSubjectsProps = {
  periodLabel: string;
  availableSubjects: SubjectViewModel[];
  blockedSubjects: SubjectViewModel[];
};

export default function NextSemesterSubjects({
  periodLabel,
  availableSubjects,
  blockedSubjects,
}: NextSemesterSubjectsProps) {
  return (
    <section
      id="proximo-cuatrimestre"
      className="mb-10 scroll-mt-8 overflow-hidden rounded-2xl border border-[#7B1730]/15 bg-white shadow-sm"
    >
      <header className="border-b border-[#7B1730]/10 bg-[#7B1730] px-6 py-5 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">
          Planificación académica
        </p>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black">
              Próximo cuatrimestre
            </h2>

            <p className="mt-1 text-sm text-white/80">
              {periodLabel}
            </p>
          </div>

          <span className="w-fit rounded-full bg-white/15 px-4 py-2 text-sm font-bold">
            {availableSubjects.length}{" "}
            {availableSubjects.length === 1
              ? "materia habilitada"
              : "materias habilitadas"}
          </span>
        </div>
      </header>

      <div className="p-6">
        {availableSubjects.length > 0 ? (
          <>
            <p className="mb-5 text-sm text-zinc-600">
              Según tu progreso actual, podrías cursar estas
              materias durante el próximo cuatrimestre.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {availableSubjects.map((viewModel) => (
                <article
                  key={viewModel.subject.id}
                  className="relative overflow-hidden rounded-2xl border border-green-200 bg-green-50/60 p-5 pl-7"
                >
                  <div className="absolute inset-y-0 left-0 w-2 bg-green-500" />

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                        Código {viewModel.subject.code}
                      </p>

                      <h3 className="mt-1 font-black text-zinc-900">
                        {viewModel.subject.name}
                      </h3>

                      <p className="mt-2 text-sm text-zinc-600">
                        {viewModel.subject.year}° Año ·{" "}
                        {viewModel.subject.semester}° Cuatrimestre ·{" "}
                        {viewModel.subject.hours} hs
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full border border-green-200 bg-white px-3 py-1 text-xs font-bold text-green-700">
                      Disponible
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6">
            <h3 className="text-lg font-black text-zinc-900">
              Todavía no tenés materias habilitadas para este período
            </h3>

            <p className="mt-2 text-sm text-zinc-500">
              Estas son las materias más cercanas a quedar disponibles:
            </p>

            {blockedSubjects.length > 0 ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {blockedSubjects.map((viewModel) => (
                  <article
                    key={viewModel.subject.id}
                    className="rounded-xl border border-zinc-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#7B1730]">
                          Código {viewModel.subject.code}
                        </p>

                        <h4 className="mt-1 font-black text-zinc-900">
                          {viewModel.subject.name}
                        </h4>
                      </div>

                      <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600">
                        Faltan{" "}
                        {viewModel.missingPrerequisites.length}
                      </span>
                    </div>

                    <div className="mt-4 border-t border-zinc-100 pt-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                        Correlativas pendientes
                      </p>

                      <ul className="mt-2 space-y-1.5">
                        {viewModel.missingPrerequisites
                          .slice(0, 3)
                          .map((prerequisite) => (
                            <li
                              key={prerequisite.id}
                              className="flex gap-2 text-sm text-zinc-600"
                            >
                              <span className="text-[#7B1730]">
                                •
                              </span>

                              <span>{prerequisite.name}</span>
                            </li>
                          ))}
                      </ul>

                      {viewModel.missingPrerequisites.length > 3 && (
                        <p className="mt-2 text-xs font-semibold text-zinc-500">
                          Y{" "}
                          {viewModel.missingPrerequisites.length -
                            3}{" "}
                          correlativa
                          {viewModel.missingPrerequisites.length -
                            3 ===
                          1
                            ? ""
                            : "s"}{" "}
                          más.
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-600">
                No quedan materias pendientes correspondientes a ese
                cuatrimestre.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}