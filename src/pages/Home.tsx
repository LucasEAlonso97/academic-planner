import { useEffect, useMemo, useState } from "react";

import AppLayout from "../components/layout/AppLayout";
import CareerPicker from "../components/common/CareerPicker";
import PlanChangeCard from "../components/common/PlanChangeCard";
import ConfirmDialog from "../components/common/ConfirmDialog";
import InstallAppCard from "../components/common/InstallAppCard";
import ProgressPdfActions from "../components/common/ProgressPdfActions";
import ProgressSummary from "../components/common/ProgressSummary";
import SimulationModePanel from "../components/common/SimulationModePanel";
import Toast from "../components/common/Toast";
import PlanSection from "../components/plan/PlanSection";
import ShareProgressCard from "../components/common/ShareProgressCard";
import CareerMap from "../components/subject/CareerMap";
import NextSemesterCallout from "../components/subject/NextSemesterCallout";
import SubjectFilters, { type SubjectFilter } from "../components/subject/SubjectFilters";
import YearSection from "../components/subject/YearSection";

import {
  careerSummaries,
  displayName,
  getCareer,
  getCareerSummary,
  isKnownCareer,
  loadCareer,
} from "../data/career";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useAcademicProgressStore } from "../store/useAcademicProgressStore";
import { usePlanner } from "../hooks/usePlanner";

import { getAcademicCalendar } from "../utils/academicCalendar";
import { summarizeGrades } from "../utils/grades";
import { track, trackOncePerSession } from "../utils/analytics";
import { autoPlan, makeTerm } from "../utils/semesterPlanner";
import {
  buildShareUrl,
  clearShareCodeFromUrl,
  decodeShareCode,
  encodeShareCode,
  peekShareCareerId,
  readShareCodeFromUrl,
} from "../utils/shareCode";
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

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

type PlanView = "list" | "map";

/** "2026-11-27" → "27/11/2026" */
const formatDate = (isoDate: string) => isoDate.split("-").reverse().join("/");

type LinkImport = NonNullable<ReturnType<typeof decodeShareCode>>;

/**
 * Si la página se abrió con un link de "Pasar a otro dispositivo":
 * descarga la carrera del link y decodifica el progreso.
 */
async function readLinkImport(): Promise<LinkImport | null> {
  const code = readShareCodeFromUrl();

  if (!code) {
    return null;
  }

  const careerId = peekShareCareerId(code);
  let decoded: LinkImport | null = null;

  if (careerId && isKnownCareer(careerId)) {
    try {
      await loadCareer(careerId);
      decoded = decodeShareCode(code, (id) => (id === careerId ? getCareer(id).subjects : null));
    } catch {
      decoded = null;
    }
  }

  if (!decoded) {
    clearShareCodeFromUrl();
  }

  return decoded;
}

export default function Home() {
  const planner = usePlanner();
  const { career, subjects, viewModels, activeProgress, isSimulationMode } = planner;
  const years = useMemo(
    () => [...new Set(subjects.map((subject) => subject.year))].sort((a, b) => a - b),
    [subjects]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<SubjectFilter>("all");
  const [planView, setPlanView] = useState<PlanView>("list");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [linkImport, setLinkImport] = useState<LinkImport | null>(null);

  useEffect(() => {
    let cancelled = false;

    void readLinkImport().then((result) => {
      if (!cancelled) setLinkImport(result);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const isFirstVisit = useAcademicProgressStore((state) => state.isFirstVisit);
  const [isFirstVisitAtStart] = useState(isFirstVisit);

  // Qué carrera se usa: una vez por visita.
  useEffect(() => {
    if (!isFirstVisitAtStart) {
      trackOncePerSession("uso", { carrera: career.career.id });
    }
  }, [career.career.id, isFirstVisitAtStart]);

  // Si se entra con un link de "Pasar a otro dispositivo", primero va ese diálogo.
  const showCareerPicker = isFirstVisit && linkImport === null && !readShareCodeFromUrl();

  const closeLinkImport = () => {
    clearShareCodeFromUrl();
    setLinkImport(null);
  };

  const isSmallScreen = useMediaQuery("(max-width: 639px)");
  const calendar = getAcademicCalendar();

  // El plan arranca en el próximo cuatrimestre.
  const planStart = useMemo(
    () => makeTerm(calendar.nextAcademicYear, calendar.nextSemester),
    [calendar.nextAcademicYear, calendar.nextSemester]
  );
  const currentTerm = calendar.activeSemester
    ? makeTerm(new Date().getFullYear(), calendar.activeSemester)
    : null;

  const handleAutoPlan = () => {
    const previous = planner.planned;

    planner.replacePlan(autoPlan(subjects, planner.progress, planStart, planner.pace));
    track("plan-automatico", { carrera: career.career.id, ritmo: planner.pace });
    planner.notify(
      "success",
      "Plan armado",
      `Hasta ${planner.pace} materias por cuatrimestre. Podés moverlas a mano.`,
      { label: "Deshacer", onClick: () => planner.replacePlan(previous) }
    );
  };

  const handleClearPlan = () => {
    const previous = planner.planned;

    planner.replacePlan({});
    planner.notify("info", "Plan borrado", undefined, {
      label: "Deshacer",
      onClick: () => planner.replacePlan(previous),
    });
  };

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
  const selectedMobileYear =
    mobileYear !== null && years.includes(mobileYear) ? mobileYear : activeYear;

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

    // Si hay correlativas que traban todo el año, las nombramos;
    // si cada materia está trabada por algo distinto, no listamos nada.
    const shared = findBlockers(blocked, activeProgress).filter(
      (blocker) => blocker.blocks.length === blocked.length
    );

    if (shared.length === 0) {
      return "Bloqueado por correlativas";
    }

    const names = describePrerequisites(
      shared.map((blocker) => blocker.subject.id),
      subjects
    );

    return `Bloqueado · ${names.length === 1 ? "falta" : "faltan"} ${joinNames(names, 2)}`;
  };

  const periodLabel = calendar.nextPeriod;
  const semesterLabel = `${calendar.nextSemester}° cuatrimestre`;

  return (
    <AppLayout
      careers={careerSummaries.map((option) => ({
        id: option.id,
        name: displayName(option),
        plan: option.plan,
      }))}
      activeCareerId={career.career.id}
      onCareerChange={(careerId) => void planner.setCareer(careerId)}
    >
      <Toast toast={planner.toast} onClose={planner.closeToast} />

      <div id="inicio" className="mx-auto flex max-w-6xl scroll-mt-24 flex-col gap-5 lg:scroll-mt-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold text-[#7B1730]">
              <label className="relative inline-flex items-center gap-2">
                <span className="text-zinc-600">Carrera:</span>
                <select
                  value={career.career.id}
                  onChange={(event) => void planner.setCareer(event.target.value)}
                  className="h-8 max-w-[70vw] cursor-pointer appearance-none truncate rounded-lg border border-[#F0DCE1] bg-[#FBF3F5] py-0 pl-2.5 pr-7 font-semibold text-[#7B1730] outline-none transition hover:border-[#E3C3CC] focus-visible:ring-2 focus-visible:ring-[#7B1730]/30"
                >
                  {careerSummaries.map((option) => (
                    <option key={option.id} value={option.id}>
                      {displayName(option)} · Plan {option.plan}
                    </option>
                  ))}
                </select>
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="pointer-events-none absolute right-2 text-[#7B1730]">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </label>
              <span>
                Plan {career.career.plan} · {subjects.length} materias
              </span>
              {career.career.source?.loadedAt && (
                <span className="font-medium text-zinc-500">
                  · Cargado el {formatDate(career.career.source.loadedAt)}
                </span>
              )}
              {career.career.source?.url && (
                <a
                  href={career.career.source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-[#7B1730]/30 underline-offset-2 hover:decoration-[#7B1730]"
                >
                  Ver plan oficial ↗
                </a>
              )}
            </div>

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

        <ProgressSummary
          counts={counts}
          total={subjects.length}
          isSimulation={isSimulationMode}
          gradeSummary={summarizeGrades(subjects, activeProgress, planner.grades, planner.equivalences)}
        />

        <NextSemesterCallout
          periodLabel={periodLabel}
          semesterLabel={semesterLabel}
          plan={nextSemesterPlan}
          customNames={planner.customNames}
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
              grades={planner.grades}
              equivalences={planner.equivalences}
              customNames={planner.customNames}
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
                <div
                  role="group"
                  aria-label="Año"
                  className="grid gap-1 rounded-xl bg-zinc-200/60 p-1"
                  style={{ gridTemplateColumns: `repeat(${years.length}, minmax(0, 1fr))` }}
                >
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
                      {year}°{years.length > 3 ? "" : " año"}
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
                        grades={planner.grades}
                        onGradeChange={planner.setGrade}
                        equivalences={planner.equivalences}
                        onEquivalenceChange={planner.setEquivalence}
                        customNames={planner.customNames}
                        onCustomNameChange={planner.setCustomName}
                      />
                    );
                  })
              )}
            </>
          )}
        </section>

        <PlanSection
          subjects={subjects}
          progress={planner.progress}
          planned={planner.planned}
          pace={planner.pace}
          titles={career.career.titles ?? []}
          maxYear={years[years.length - 1]}
          start={planStart}
          currentTerm={currentTerm}
          onPlanSubject={planner.setPlannedTerm}
          onAutoPlan={handleAutoPlan}
          onClearPlan={handleClearPlan}
          onPaceChange={planner.setPace}
          customNames={planner.customNames}
        />

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
                record={planner.record}
                onImport={(record) => planner.replaceCareerRecord(career.career.id, record)}
              />
            )}

            {!isSimulationMode && (
              <PlanChangeCard
                currentCareerId={career.career.id}
                subjects={subjects}
                progress={planner.progress}
                onApply={(careerId, record, applied) => {
                  track("cambio-de-plan", { desde: career.career.id, hacia: careerId, materias: applied });
                  planner.replaceCareerRecord(careerId, record);
                  window.scrollTo({ top: 0 });
                  planner.notify(
                    "success",
                    `Pasaste a ${displayName(getCareerSummary(careerId))}`,
                    applied > 0
                      ? `${pluralize(applied, "materia quedó", "materias quedaron")} aprobada${applied === 1 ? "" : "s"} por equivalencia.`
                      : "No había materias con el mismo nombre."
                  );
                }}
              />
            )}

            <ShareProgressCard
              buildLink={() => {
                track("qr-mostrado", { carrera: career.career.id });
                return buildShareUrl(encodeShareCode(career.career.id, subjects, planner.record));
              }}
            />

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
      <ConfirmDialog
        isOpen={linkImport !== null}
        tone="danger"
        title="¿Copiar este progreso acá?"
        description={
          linkImport ? (
            <div>
              <p>
                El link trae el progreso de{" "}
                <strong className="text-zinc-900">{getCareerSummary(linkImport.careerId).name}</strong>:
              </p>

              <dl className="mt-3 grid grid-cols-3 gap-2">
                {[
                  ["Aprobadas", "passed"],
                  ["Debe final", "regular"],
                  ["Cursando", "in_progress"],
                ].map(([label, status]) => (
                  <div key={status} className="rounded-xl bg-zinc-50 px-3 py-2">
                    <dt className="text-xs text-zinc-600">{label}</dt>
                    <dd className="text-xl font-bold text-zinc-900">
                      {Object.values(linkImport.record.progress ?? {}).filter((value) => value === status).length}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-3 font-medium text-red-700">
                Lo que tengas guardado de esa carrera en este dispositivo se va a reemplazar.
              </p>
            </div>
          ) : null
        }
        confirmLabel="Copiar progreso"
        cancelLabel="Cancelar"
        onConfirm={() => {
          if (linkImport) {
            planner.replaceCareerRecord(linkImport.careerId, linkImport.record);
            track("qr-importado", { carrera: linkImport.careerId });
            planner.notify("success", "Progreso copiado", "Ya tenés tu progreso en este dispositivo.");
          }
          closeLinkImport();
        }}
        onCancel={closeLinkImport}
      />
      {showCareerPicker && (
        <CareerPicker careers={careerSummaries} onPick={planner.setCareer} />
      )}
    </AppLayout>
  );
}
