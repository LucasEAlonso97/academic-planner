import {
  useEffect,
  useMemo,
  useState,
} from "react";

import careerData from "../data/analista-sistemas.json";
import InstallAppCard from "../components/common/InstallAppCard";

import AcademicDateCard from "../components/common/AcademicDateCard";
import ConfirmDialog from "../components/common/ConfirmDialog";
import ProgressPdfActions from "../components/common/ProgressPdfActions";
import SimulationModePanel from "../components/common/SimulationModePanel";
import StatCard from "../components/common/StatCard";
import StatusLegend from "../components/common/StatusLegend";
import Toast, {
  type ToastMessage,
} from "../components/common/Toast";
import YearProgressCard from "../components/common/YearProgressCard";

import AppLayout from "../components/layout/AppLayout";

import NextSemesterSubjects from "../components/subject/NextSemesterSubjects";
import SubjectFilters, {
  type SubjectFilter,
} from "../components/subject/SubjectFilters";
import YearSection from "../components/subject/YearSection";

import { useAcademicProgressStore } from "../store/useAcademicProgressStore";

import type {
  AcademicSubject,
  CareerData,
} from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";

import { canEnrollSubject } from "../utils/academicRules";
import { getAcademicCalendar } from "../utils/academicCalendar";
import { getAffectedSubjects } from "../utils/statusChangeImpact";
import { buildSubjectViewModel } from "../utils/subjectView";

const data = careerData as CareerData;

const years = [1, 2, 3] as const;

const statusLabels: Record<
  SubjectStatus,
  string
> = {
  pending: "Pendiente",
  in_progress: "Cursando",
  regular: "Debe final",
  passed: "Aprobada",
};

type PendingStatusChange = {
  subject: AcademicSubject;
  nextStatus: SubjectStatus;
  affectedSubjects: AcademicSubject[];
};

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function Home() {
  const [searchQuery, setSearchQuery] =
    useState("");

  const [selectedFilter, setSelectedFilter] =
    useState<SubjectFilter>("all");

  const [isResetDialogOpen, setIsResetDialogOpen] =
    useState(false);

  const [
    isApplySimulationDialogOpen,
    setIsApplySimulationDialogOpen,
  ] = useState(false);

  const [
    pendingStatusChange,
    setPendingStatusChange,
  ] = useState<PendingStatusChange | null>(null);

  const [toast, setToast] =
    useState<ToastMessage | null>(null);

  const [
    isSimulationMode,
    setIsSimulationMode,
  ] = useState(false);

  const [
    simulationProgress,
    setSimulationProgress,
  ] = useState<Record<string, SubjectStatus>>(
    {}
  );

  const progress = useAcademicProgressStore(
    (state) => state.progress
  );

  const resetProgress = useAcademicProgressStore(
    (state) => state.resetProgress
  );

  const updateSubjectStatus =
    useAcademicProgressStore(
      (state) => state.updateSubjectStatus
    );

  const replaceProgress =
    useAcademicProgressStore(
      (state) => state.replaceProgress
    );

  const activeProgress = isSimulationMode
    ? simulationProgress
    : progress;

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 4500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  const subjectViewModels = useMemo(
    () =>
      data.subjects.map((subject) =>
        buildSubjectViewModel(
          subject,
          data.subjects,
          activeProgress
        )
      ),
    [activeProgress]
  );

  const simulationChangesCount =
    useMemo(() => {
      if (!isSimulationMode) {
        return 0;
      }

      return data.subjects.filter(
        (subject) => {
          const realStatus =
            progress[subject.id] ?? "pending";

          const simulatedStatus =
            simulationProgress[subject.id] ??
            "pending";

          return realStatus !== simulatedStatus;
        }
      ).length;
    }, [
      isSimulationMode,
      progress,
      simulationProgress,
    ]);

  const academicCalendar =
    getAcademicCalendar();

  const nextSemesterAvailableSubjects =
    subjectViewModels.filter(
      (viewModel) =>
        viewModel.subject.semester ===
          academicCalendar.nextSemester &&
        viewModel.isAvailable
    );

  const nextSemesterBlockedSubjects =
    subjectViewModels
      .filter(
        (viewModel) =>
          viewModel.subject.semester ===
            academicCalendar.nextSemester &&
          viewModel.status === "pending" &&
          !viewModel.prerequisitesMet
      )
      .sort(
        (firstSubject, secondSubject) =>
          firstSubject.missingPrerequisites
            .length -
          secondSubject.missingPrerequisites
            .length
      )
      .slice(0, 4);

  const approvedCount =
    subjectViewModels.filter(
      (viewModel) =>
        viewModel.status === "passed"
    ).length;

  const regularCount =
    subjectViewModels.filter(
      (viewModel) =>
        viewModel.status === "regular"
    ).length;

  const inProgressCount =
    subjectViewModels.filter(
      (viewModel) =>
        viewModel.status ===
        "in_progress"
    ).length;

  const availableCount =
    subjectViewModels.filter(
      (viewModel) =>
        viewModel.isAvailable
    ).length;

  const blockedCount =
    subjectViewModels.filter(
      (viewModel) =>
        viewModel.status === "pending" &&
        !viewModel.prerequisitesMet
    ).length;

  const progressPercentage = Math.round(
    (approvedCount / data.subjects.length) *
      100
  );

  const filteredViewModels = useMemo(() => {
    const normalizedQuery =
      normalizeSearchText(searchQuery);

    return subjectViewModels.filter(
      (viewModel) => {
        const searchableContent =
          normalizeSearchText(
            `${viewModel.subject.code} ${viewModel.subject.name}`
          );

        const matchesSearch =
          normalizedQuery.length === 0 ||
          searchableContent.includes(
            normalizedQuery
          );

        if (!matchesSearch) {
          return false;
        }

        switch (selectedFilter) {
          case "all":
            return true;

          case "available":
            return viewModel.isAvailable;

          case "blocked":
            return (
              viewModel.status === "pending" &&
              !viewModel.prerequisitesMet
            );

          case "pending":
            return (
              viewModel.status === "pending"
            );

          case "in_progress":
            return (
              viewModel.status ===
              "in_progress"
            );

          case "regular":
            return (
              viewModel.status === "regular"
            );

          case "passed":
            return (
              viewModel.status === "passed"
            );

          default:
            return true;
        }
      }
    );
  }, [
    searchQuery,
    selectedFilter,
    subjectViewModels,
  ]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedFilter !== "all";

  const showToast = (
    type: ToastMessage["type"],
    title: string,
    description?: string
  ) => {
    setToast({
      id: Date.now(),
      type,
      title,
      description,
    });
  };

  const getNewlyAvailableSubjects = (
    subject: AcademicSubject,
    nextStatus: SubjectStatus,
    resetSubjectIds: string[] = []
  ) => {
    const currentlyAvailableIds = new Set(
      subjectViewModels
        .filter(
          (viewModel) =>
            viewModel.isAvailable
        )
        .map(
          (viewModel) =>
            viewModel.subject.id
        )
    );

    const simulatedProgress: Record<
      string,
      SubjectStatus
    > = {
      ...activeProgress,
      [subject.id]: nextStatus,
    };

    resetSubjectIds.forEach((subjectId) => {
      simulatedProgress[subjectId] =
        "pending";
    });

    return data.subjects
      .map((currentSubject) =>
        buildSubjectViewModel(
          currentSubject,
          data.subjects,
          simulatedProgress
        )
      )
      .filter(
        (viewModel) =>
          viewModel.isAvailable &&
          !currentlyAvailableIds.has(
            viewModel.subject.id
          )
      )
      .map(
        (viewModel) =>
          viewModel.subject
      );
  };

  const startSimulation = () => {
    setSimulationProgress({
      ...progress,
    });

    setPendingStatusChange(null);
    setIsResetDialogOpen(false);
    setIsApplySimulationDialogOpen(false);
    setIsSimulationMode(true);

    showToast(
      "info",
      "Modo simulación activado",
      "Los cambios que realices no modificarán tu progreso real."
    );
  };

  const discardSimulation = () => {
    setIsSimulationMode(false);
    setSimulationProgress({});
    setPendingStatusChange(null);
    setIsApplySimulationDialogOpen(false);

    showToast(
      "info",
      "Simulación descartada",
      "Tu progreso real no fue modificado."
    );
  };

  const confirmApplySimulation = () => {
    replaceProgress(simulationProgress);

    setIsSimulationMode(false);
    setSimulationProgress({});
    setPendingStatusChange(null);
    setIsApplySimulationDialogOpen(false);

    showToast(
      "success",
      "Simulación aplicada",
      `${simulationChangesCount} ${
        simulationChangesCount === 1
          ? "cambio fue guardado"
          : "cambios fueron guardados"
      } en tu progreso real.`
    );
  };

  const updateActiveSubjectStatus = (
    subject: AcademicSubject,
    nextStatus: SubjectStatus,
    resetSubjectIds: string[] = []
  ): boolean => {
    if (!isSimulationMode) {
      return updateSubjectStatus(
        subject,
        nextStatus,
        resetSubjectIds
      );
    }

    const requiresPrerequisites =
      nextStatus === "in_progress" ||
      nextStatus === "regular" ||
      nextStatus === "passed";

    if (
      requiresPrerequisites &&
      !canEnrollSubject(
        subject,
        simulationProgress
      )
    ) {
      return false;
    }

    const nextSimulationProgress: Record<
      string,
      SubjectStatus
    > = {
      ...simulationProgress,
      [subject.id]: nextStatus,
    };

    resetSubjectIds.forEach((subjectId) => {
      nextSimulationProgress[subjectId] =
        "pending";
    });

    setSimulationProgress(
      nextSimulationProgress
    );

    return true;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedFilter("all");
  };

  const confirmResetProgress = () => {
    resetProgress();
    setIsResetDialogOpen(false);

    showToast(
      "warning",
      "Progreso reiniciado",
      "Todas las materias volvieron al estado Pendiente."
    );
  };

  const handleSubjectStatusChange = (
    subject: AcademicSubject,
    nextStatus: SubjectStatus
  ) => {
    const affectedSubjects =
      getAffectedSubjects(
        subject,
        nextStatus,
        data.subjects,
        activeProgress
      );

    if (affectedSubjects.length > 0) {
      setPendingStatusChange({
        subject,
        nextStatus,
        affectedSubjects,
      });

      return false;
    }

    const newlyAvailableSubjects =
      getNewlyAvailableSubjects(
        subject,
        nextStatus
      );

    const wasUpdated =
      updateActiveSubjectStatus(
        subject,
        nextStatus
      );

    if (!wasUpdated) {
      showToast(
        "error",
        "No se pudo cambiar el estado",
        "La materia todavía no cumple sus correlativas."
      );

      return false;
    }

    if (
      newlyAvailableSubjects.length > 0
    ) {
      const unlockedNames =
        newlyAvailableSubjects
          .slice(0, 3)
          .map(
            (unlockedSubject) =>
              unlockedSubject.name
          )
          .join(", ");

      const remainingCount =
        newlyAvailableSubjects.length - 3;

      showToast(
        "success",
        isSimulationMode
          ? "La simulación habilitó nuevas materias"
          : "¡Desbloqueaste nuevas materias!",
        remainingCount > 0
          ? `${unlockedNames} y ${remainingCount} más.`
          : unlockedNames
      );
    } else {
      showToast(
        isSimulationMode
          ? "info"
          : "success",
        isSimulationMode
          ? `${subject.name} modificada en la simulación`
          : `${subject.name} actualizada`,
        `Nuevo estado: ${statusLabels[nextStatus]}.`
      );
    }

    return true;
  };

  const confirmSubjectStatusChange = () => {
    if (!pendingStatusChange) {
      return;
    }

    const affectedSubjectIds =
      pendingStatusChange.affectedSubjects.map(
        (subject) => subject.id
      );

    const wasUpdated =
      updateActiveSubjectStatus(
        pendingStatusChange.subject,
        pendingStatusChange.nextStatus,
        affectedSubjectIds
      );

    if (wasUpdated) {
      showToast(
        "warning",
        isSimulationMode
          ? "Simulación ajustada"
          : "Progreso ajustado",
        `${pendingStatusChange.affectedSubjects.length} materias volvieron a Pendiente para mantener las correlativas correctas.`
      );
    } else {
      showToast(
        "error",
        "No se pudo realizar el cambio",
        "Revisá el estado de las correlativas."
      );
    }

    setPendingStatusChange(null);
  };

  return (
    <AppLayout>
      <Toast
        toast={toast}
        onClose={() => setToast(null)}
      />

      <section
        id="inicio"
        className="mx-auto max-w-7xl scroll-mt-24 lg:scroll-mt-8"
      >
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black text-zinc-950">
              {data.career.name}
            </h1>

            <p className="mt-2 text-zinc-500">
              Plan {data.career.plan} ·{" "}
              {data.career.totalSubjects}{" "}
              materias
            </p>

            {isSimulationMode && (
              <span className="mt-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                Simulación activa
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={isSimulationMode}
            onClick={() =>
              setIsResetDialogOpen(true)
            }
            className="rounded-xl border border-[#7B1730]/20 bg-white px-4 py-2 text-sm font-bold text-[#7B1730] transition hover:bg-[#7B1730]/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reiniciar progreso
          </button>
        </div>

        <AcademicDateCard />
        <div className="mb-8">
  <InstallAppCard />
</div>


        <section
          id="simulacion"
          className="mb-8 scroll-mt-24 lg:scroll-mt-8"
        >
          <SimulationModePanel
            isActive={isSimulationMode}
            changedSubjectsCount={
              simulationChangesCount
            }
            onStart={startSimulation}
            onApply={() =>
              setIsApplySimulationDialogOpen(
                true
              )
            }
            onDiscard={discardSimulation}
          />
        </section>

        {!isSimulationMode && (
          <div className="mb-8">
            <ProgressPdfActions
              careerName={
                data.career.name
              }
              plan={data.career.plan}
              subjects={data.subjects}
              progress={progress}
              onImport={replaceProgress}
            />
          </div>
        )}

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Materias totales"
            value={data.subjects.length}
            featured
          />

          <StatCard
            label="Aprobadas"
            value={approvedCount}
          />

          <StatCard
            label="Finales pendientes"
            value={regularCount}
          />

          <StatCard
            label="Cursando"
            value={inProgressCount}
          />

          <StatCard
            label="Disponibles"
            value={availableCount}
          />
        </section>

        <div className="mb-10">
          <StatusLegend />
        </div>

        <section
          id="mi-avance"
          className="mb-10 scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:scroll-mt-8"
        >
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-black text-[#7B1730]">
                {isSimulationMode
                  ? "Progreso simulado"
                  : "Tu progreso"}
              </h2>

              {isSimulationMode && (
                <p className="mt-1 text-xs font-semibold text-blue-600">
                  Estos valores son temporales.
                </p>
              )}
            </div>

            <span className="text-sm font-bold text-zinc-700">
              {progressPercentage}%
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
            <div
              role="progressbar"
              aria-label={
                isSimulationMode
                  ? "Progreso simulado de la carrera"
                  : "Progreso general de la carrera"
              }
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={
                progressPercentage
              }
              className={`h-full rounded-full transition-all duration-300 ${
                isSimulationMode
                  ? "bg-blue-600"
                  : "bg-[#7B1730]"
              }`}
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>

          <p className="mt-3 text-sm text-zinc-500">
            {approvedCount} de{" "}
            {data.subjects.length} materias
            aprobadas
          </p>

          <div className="mt-7 border-t border-zinc-200 pt-6">
            <div className="mb-4">
              <h3 className="font-black text-zinc-900">
                Progreso por año
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Revisá cuánto completaste en
                cada etapa de la carrera.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {years.map((year) => (
                <YearProgressCard
                  key={year}
                  year={year}
                  viewModels={subjectViewModels.filter(
                    (viewModel) =>
                      viewModel.subject.year ===
                      year
                  )}
                />
              ))}
            </div>
          </div>
        </section>

        <section
          id="correlativas"
          className="mb-10 scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:scroll-mt-8"
        >
          <div className="mb-5">
            <p className="text-sm font-bold uppercase tracking-wide text-[#7B1730]">
              Correlativas
            </p>

            <h2 className="mt-1 text-2xl font-black text-zinc-900">
              Estado de tus correlativas
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Para cursar una materia, todas
              sus correlativas deben estar en
              “Debe final” o “Aprobada”.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <p className="text-sm font-semibold text-green-700">
                Materias habilitadas
              </p>

              <strong className="mt-2 block text-3xl font-black text-green-800">
                {availableCount}
              </strong>

              <p className="mt-2 text-sm text-green-700">
                Podés comenzar a cursarlas.
              </p>
            </article>

            <article className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm font-semibold text-zinc-600">
                Materias bloqueadas
              </p>

              <strong className="mt-2 block text-3xl font-black text-zinc-800">
                {blockedCount}
              </strong>

              <p className="mt-2 text-sm text-zinc-500">
                Todavía tienen correlativas
                pendientes.
              </p>
            </article>
          </div>
        </section>

        <NextSemesterSubjects
          periodLabel={
            academicCalendar.nextPeriod
          }
          availableSubjects={
            nextSemesterAvailableSubjects
          }
          blockedSubjects={
            nextSemesterBlockedSubjects
          }
        />

        <section
          id="plan-academico"
          className="scroll-mt-24 lg:scroll-mt-8"
        >
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#7B1730]">
              Carrera
            </p>

            <h2 className="mb-5 mt-1 text-2xl font-black text-[#7B1730]">
              Plan académico
            </h2>

            {isSimulationMode && (
              <p className="-mt-3 mb-5 text-sm font-semibold text-blue-600">
                Los cambios en las materias son
                temporales y se descartarán al
                salir de la simulación.
              </p>
            )}
          </div>

          <SubjectFilters
            query={searchQuery}
            selectedFilter={
              selectedFilter
            }
            resultCount={
              filteredViewModels.length
            }
            onQueryChange={
              setSearchQuery
            }
            onFilterChange={
              setSelectedFilter
            }
            onClear={clearFilters}
          />

          {filteredViewModels.length ===
            0 && (
            <section className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
              <h3 className="text-lg font-black text-zinc-900">
                No encontramos materias
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Probá con otro nombre, código
                o filtro.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-[#7B1730] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#651226]"
              >
                Limpiar búsqueda
              </button>
            </section>
          )}

          {years.map((year) => {
            const yearViewModels =
              filteredViewModels.filter(
                (viewModel) =>
                  viewModel.subject.year ===
                  year
              );

            if (
              yearViewModels.length === 0
            ) {
              return null;
            }

            const totalYearSubjects =
              data.subjects.filter(
                (subject) =>
                  subject.year === year
              ).length;

            return (
              <YearSection
                key={year}
                year={year}
                viewModels={
                  yearViewModels
                }
                totalSubjects={
                  totalYearSubjects
                }
                forceOpen={
                  hasActiveFilters
                }
                onStatusChange={
                  handleSubjectStatusChange
                }
              />
            );
          })}
        </section>
      </section>

      <ConfirmDialog
        isOpen={isResetDialogOpen}
        title="¿Reiniciar todo el progreso?"
        description="Todas las materias volverán al estado Pendiente. Esta acción también borrará el avance guardado en este navegador."
        confirmLabel="Sí, reiniciar"
        cancelLabel="Conservar progreso"
        onConfirm={confirmResetProgress}
        onCancel={() =>
          setIsResetDialogOpen(false)
        }
      />

      <ConfirmDialog
        isOpen={isApplySimulationDialogOpen}
        title="¿Aplicar esta simulación?"
        description={
          <div>
            <p>
              Estás por reemplazar tu progreso
              real con el escenario que
              preparaste.
            </p>

            <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-700">
                Cambios que se guardarán
              </p>

              <strong className="mt-1 block text-2xl font-black text-blue-900">
                {simulationChangesCount}
              </strong>

              <p className="mt-1 text-xs text-blue-700">
                {simulationChangesCount === 1
                  ? "materia modificada"
                  : "materias modificadas"}
              </p>
            </div>

            <p className="mt-3 text-zinc-600">
              Una vez aplicado, este escenario
              pasará a ser tu progreso académico
              actual.
            </p>
          </div>
        }
        confirmLabel="Aplicar cambios"
        cancelLabel="Seguir simulando"
        onConfirm={confirmApplySimulation}
        onCancel={() =>
          setIsApplySimulationDialogOpen(false)
        }
      />

      <ConfirmDialog
        isOpen={
          pendingStatusChange !== null
        }
        title={
          isSimulationMode
            ? "Este cambio afecta la simulación"
            : "Este cambio afecta otras materias"
        }
        description={
          pendingStatusChange ? (
            <div>
              <p>
                Al cambiar{" "}
                <strong className="text-zinc-800">
                  {
                    pendingStatusChange
                      .subject.name
                  }
                </strong>
                , estas materias dejarán de
                cumplir sus correlativas:
              </p>

              <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                {pendingStatusChange.affectedSubjects.map(
                  (subject) => (
                    <li
                      key={subject.id}
                      className="flex items-start gap-2 text-zinc-700"
                    >
                      <span className="text-red-500">
                        •
                      </span>

                      <span>
                        {subject.name}
                      </span>
                    </li>
                  )
                )}
              </ul>

              <p className="mt-3">
                Al continuar, estas materias
                volverán automáticamente al
                estado{" "}
                <strong className="text-zinc-800">
                  Pendiente
                </strong>
                {isSimulationMode
                  ? " dentro de la simulación."
                  : "."}
              </p>
            </div>
          ) : null
        }
        confirmLabel={
          isSimulationMode
            ? "Ajustar simulación"
            : "Cambiar y ajustar"
        }
        cancelLabel="Cancelar"
        onConfirm={
          confirmSubjectStatusChange
        }
        onCancel={() =>
          setPendingStatusChange(null)
        }
      />
    </AppLayout>
  );
}