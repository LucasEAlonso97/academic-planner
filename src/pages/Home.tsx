import { useMemo, useState } from "react";

import AppLayout from "../components/layout/AppLayout";
import ConfirmDialog from "../components/common/ConfirmDialog";
import InstallAppCard from "../components/common/InstallAppCard";
import ProgressPdfActions from "../components/common/ProgressPdfActions";
import ProgressSummary from "../components/common/ProgressSummary";
import SimulationModePanel from "../components/common/SimulationModePanel";
import Toast from "../components/common/Toast";
import CareerMap from "../components/subject/CareerMap";
import NextSemesterCallout from "../components/subject/NextSemesterCallout";
import SubjectFilters, { type SubjectFilter } from "../components/subject/SubjectFilters";
import YearSection from "../components/subject/YearSection";

import { career, subjects } from "../data/career";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { usePlanner } from "../hooks/usePlanner";

import { getAcademicCalendar } from "../utils/academicCalendar";
import {
  describePrerequisites,
  findBlockers,
  getNextSemesterPlan,
  joinNames,
} from "../utils/planInsights";
import {
  displayStatusOrder,
  getDisplayStatus,
  pluralize,
  statusLabels,
  type DisplayStatus,
} from "../utils/statusDisplay";

const years = [...new Set(subjects.map((subject) => subject.year))].sort();

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

type PlanView = "list" | "map";

export default function Home() {
  const planner = usePlanner();
  const { viewModels, activeProgress, isSimulationMode } = planner;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<SubjectFilter>("all");
  const [planView, setPlanView] = useState<PlanView>("list");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);

  const isSmallScreen = useMediaQuery("(max-width: 639px)");
  const calendar = getAcademicCalendar();

  const counts = useMemo(() => {
    const result = Object.fromEntries(
      displayStatusOrder.map((status) => [status, 0])
    ) as Record<DisplayStatus, number>;

    viewModels.forEach((viewModel) => {
      result[getDisplayStatus(viewModel)] += 1;
    });

    return result;
  }, [viewModels]);

  const nextSemesterPlan = useMemo(
    () => getNextSemesterPlan(viewModels, calendar.nextSemester, activeProgress),
    [viewModels, calendar.nextSemester, activeProgress]
  );

  // La correlativa faltante que más materias traba en toda la carrera.
  const keyBlocker = useMemo(
    () =>
      findBlockers(
        viewModels.filter((viewModel) => getDisplayStatus(viewModel) === "blocked"),
        activeProgress
      )[0] ?? null,
    [viewModels, activeProgress]
  );

  // Año "activo": el primero con algo pendiente de cursar o rendir.
  const activeYear =
    years.find((year) =>
      viewModels.some(
        (viewModel) =>
          viewModel.subject.year === year &&
          ["available", "in_progress", "regular"].includes(getDisplayStatus(viewModel))
      )
    ) ?? years[0];

  const [mobileYear, setMobileYear] = useState<number | null>(null);
  const selectedMobileYear = mobileYear ?? activeYear;

  const filteredViewModels = useMemo(() => {
    const query = normalizeSearchText(searchQuery);

    return viewModels.filter((viewModel) => {
      const matchesSearch =
        query.length === 0 ||
        normalizeSearchText(`${viewModel.subject.code} ${viewModel.subject.name}`).includes(query);

      return (
        matchesSearch &&
        (selectedFilter === "all" || getDisplayStatus(viewModel) === selectedFilter)
      );
    });
  }, [searchQuery, selectedFilter, viewModels]);

  const hasActiveFilters = searchQuery.trim().length > 0 || selectedFilter !== "all";
  const useYearTabs = isSmallScreen && !hasActiveFilters;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedFilter("all");
  };

  const yearNote = (year: number) => {
    const yearViewModels = viewModels.filter((viewModel) => viewModel.subject.year === year);
    const blocked = yearViewModels.filter(
      (viewModel) => getDisplayStatus(viewModel) === "blocked"
    );

    if (blocked.length === 0 || blocked.length !== yearViewModels.length) {
      return null;
    }

    // Si hay correlativas que traban todo el año, nombramos solo esas.
    const blockers = findBlockers(blocked, activeProgress);
    const shared = blockers.filter((blocker) => blocker.blocks.length === blocked.length);
    const names = describePrerequisites(
      (shared.length > 0 ? shared : blockers).map((blocker) => blocker.subject.id),
      subjects
    );

    return `Bloqueado · ${names.length === 1 ? "falta" : "faltan"} ${joinNames(names, 2)}`;
  };

  const periodLabel = calendar.nextPeriod;
  const semesterLabel = `${calendar.nextSemester}° cuatrimestre`;

  return (
    <AppLayout>
      <Toast toast={planner.toast} onClose={planner.closeToast} />

      <div id="inicio" className="mx-auto flex max-w-6xl scroll-mt-24 flex-col gap-5 lg:scroll-mt-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <p className="text-[13px] font-semibold text-[#7B1730]">
              Plan {career.career.plan} · {subjects.length} materias
            </p>

            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-zinc-950 sm:text-3xl">
              {career.career.shortName ?? career.career.name}
            </h1>

            <p className="text-sm text-zinc-600">
              {career.career.degree ? `${career.career.degree} · ` : ""}
              Hoy, {calendar.formattedDate.toLowerCase()} · {calendar.periodName.toLowerCase()}
            </p>
          </div>

          {!isSimulationMode && (
            <button
              type="button"
              onClick={planner.startSimulation}
              className="h-11 shrink-0 self-start rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 sm:self-auto"
            >
              Simular escenario
            </button>
          )}
        </header>

        {isSimulationMode && (
          <SimulationModePanel
            changedSubjectsCount={planner.simulationChangesCount}
            onApply={() => setIsApplyDialogOpen(true)}
            onDiscard={planner.discardSimulation}
          />
        )}

        <ProgressSummary counts={counts} total={subjects.length} isSimulation={isSimulationMode} />

        <NextSemesterCallout
          periodLabel={periodLabel}
          semesterLabel={semesterLabel}
          plan={nextSemesterPlan}
        />

        <section
          id="plan-academico"
          aria-labelledby="plan-title"
          className="mt-4 flex scroll-mt-24 flex-col gap-4 lg:scroll-mt-8"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="plan-title" className="text-xl font-extrabold tracking-tight text-zinc-950">
              Plan de estudios
            </h2>

            <div role="group" aria-label="Vista del plan" className="flex gap-1 rounded-xl bg-zinc-200/60 p-1">
              {(["list", "map"] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  aria-pressed={planView === view}
                  onClick={() => setPlanView(view)}
                  className={`h-9 rounded-lg px-3.5 text-[13px] font-semibold transition ${
                    planView === view ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  {view === "list" ? "Lista" : "Mapa"}
                </button>
              ))}
            </div>
          </div>

          {planView === "map" ? (
            <CareerMap
              years={years}
              viewModels={viewModels}
              keySubjectId={keyBlocker?.subject.id ?? null}
              keySubjectLabel={
                keyBlocker
                  ? `Traba ${pluralize(keyBlocker.blocks.length, "materia", "materias")}`
                  : null
              }
            />
          ) : (
            <>
              <SubjectFilters
                query={searchQuery}
                selectedFilter={selectedFilter}
                counts={counts}
                total={subjects.length}
                resultCount={filteredViewModels.length}
                onQueryChange={setSearchQuery}
                onFilterChange={setSelectedFilter}
                onClear={clearFilters}
              />

              {useYearTabs && (
                <div role="group" aria-label="Año" className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-200/60 p-1">
                  {years.map((year) => (
                    <button
                      key={year}
                      type="button"
                      aria-pressed={selectedMobileYear === year}
                      onClick={() => setMobileYear(year)}
                      className={`h-10 rounded-lg text-sm font-semibold transition ${
                        selectedMobileYear === year ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600"
                      }`}
                    >
                      {year}° año
                    </button>
                  ))}
                </div>
              )}

              {filteredViewModels.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
                  <p className="font-semibold text-zinc-900">No encontramos materias</p>
                  <p className="mt-1 text-sm text-zinc-600">Probá con otro nombre, código o filtro.</p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 h-11 rounded-xl bg-[#7B1730] px-5 text-sm font-semibold text-white transition hover:bg-[#651226]"
                  >
                    Limpiar búsqueda
                  </button>
                </div>
              ) : (
                years
                  .filter((year) => !useYearTabs || year === selectedMobileYear)
                  .map((year) => {
                    const yearFiltered = filteredViewModels.filter(
                      (viewModel) => viewModel.subject.year === year
                    );

                    if (yearFiltered.length === 0) {
                      return null;
                    }

                    return (
                      <YearSection
                        key={year}
                        year={year}
                        viewModels={yearFiltered}
                        yearViewModels={viewModels.filter((viewModel) => viewModel.subject.year === year)}
                        allSubjects={subjects}
                        defaultOpen={year <= activeYear + 1 && !yearNote(year)}
                        forceOpen={hasActiveFilters || useYearTabs}
                        note={yearNote(year)}
                        onStatusChange={planner.changeStatus}
                      />
                    );
                  })
              )}
            </>
          )}
        </section>

        <section
          id="herramientas"
          aria-labelledby="tools-title"
          className="mt-4 flex scroll-mt-24 flex-col gap-4 lg:scroll-mt-8"
        >
          <h2 id="tools-title" className="text-xl font-extrabold tracking-tight text-zinc-950">
            Herramientas
          </h2>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {!isSimulationMode && (
              <ProgressPdfActions
                careerName={career.career.name}
                plan={career.career.plan}
                subjects={subjects}
                progress={planner.progress}
                onImport={planner.replaceProgress}
              />
            )}

            <InstallAppCard />

            <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Empezar de cero</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  Vuelve todas las materias a Pendiente y borra el progreso guardado en este navegador.
                </p>
              </div>

              <button
                type="button"
                disabled={isSimulationMode}
                onClick={() => setIsResetDialogOpen(true)}
                className="mt-auto h-11 self-start rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reiniciar progreso
              </button>
            </section>
          </div>
        </section>
      </div>

      <ConfirmDialog
        isOpen={isResetDialogOpen}
        tone="danger"
        title="¿Reiniciar todo el progreso?"
        description="Todas las materias vuelven a Pendiente y se borra el avance guardado en este navegador. Vas a poder deshacerlo durante unos segundos; después, solo con una copia en PDF."
        confirmLabel="Sí, reiniciar"
        cancelLabel="Conservar progreso"
        onConfirm={() => {
          planner.reset();
          setIsResetDialogOpen(false);
        }}
        onCancel={() => setIsResetDialogOpen(false)}
      />

      <ConfirmDialog
        isOpen={isApplyDialogOpen}
        title="¿Guardar la simulación?"
        description={`Tu progreso real se va a reemplazar por este escenario (${pluralize(
          planner.simulationChangesCount,
          "materia modificada",
          "materias modificadas"
        )}).`}
        confirmLabel="Guardar cambios"
        cancelLabel="Seguir simulando"
        onConfirm={() => {
          planner.applySimulation();
          setIsApplyDialogOpen(false);
        }}
        onCancel={() => setIsApplyDialogOpen(false)}
      />

      <ConfirmDialog
        isOpen={planner.pendingStatusChange !== null}
        title={isSimulationMode ? "Este cambio afecta la simulación" : "Este cambio afecta otras materias"}
        description={
          planner.pendingStatusChange ? (
            <div>
              <p>
                Si cambiás <strong className="text-zinc-900">{planner.pendingStatusChange.subject.name}</strong>,
                estas materias dejan de cumplir sus correlativas y cambian de estado:
              </p>

              <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-xl bg-zinc-50 p-3 text-zinc-800">
                {planner.pendingStatusChange.affectedSubjects.map(({ subject, from, to }) => (
                  <li key={subject.id} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-3">
                    <span className="font-medium">{subject.name}</span>
                    <span className="shrink-0 text-[13px] text-zinc-600">
                      {statusLabels[from]} → <strong className="text-zinc-900">{statusLabels[to]}</strong>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null
        }
        confirmLabel={isSimulationMode ? "Ajustar simulación" : "Cambiar y ajustar"}
        cancelLabel="Cancelar"
        onConfirm={planner.confirmPendingStatusChange}
        onCancel={planner.cancelPendingStatusChange}
      />
    </AppLayout>
  );
}
