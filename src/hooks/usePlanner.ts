import { useEffect, useMemo, useState } from "react";

import { subjects } from "../data/career";
import { useAcademicProgressStore } from "../store/useAcademicProgressStore";

import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";
import type { ToastMessage } from "../components/common/Toast";

import { canEnrollSubject, isStatusAllowed } from "../utils/academicRules";
import { joinNames } from "../utils/planInsights";
import {
  enforcePrerequisites,
  type Progress,
  type StatusAdjustment,
} from "../utils/progressValidation";
import { statusLabels } from "../utils/statusDisplay";
import { getAffectedSubjects } from "../utils/statusChangeImpact";
import { buildSubjectViewModel } from "../utils/subjectView";

export type PendingStatusChange = {
  subject: AcademicSubject;
  nextStatus: SubjectStatus;
  affectedSubjects: StatusAdjustment[];
};

/** Aplica el cambio y ajusta en cadena lo que deje de cumplir correlativas. */
function applyChange(
  progress: Progress,
  subject: AcademicSubject,
  nextStatus: SubjectStatus
): Progress {
  const next: Progress = { ...progress, [subject.id]: nextStatus };

  if (nextStatus === "pending") {
    delete next[subject.id];
  }

  return enforcePrerequisites(next, subjects, subject.id).progress;
}

function availableIds(progress: Progress) {
  return new Set(
    subjects
      .filter(
        (subject) =>
          (progress[subject.id] ?? "pending") === "pending" &&
          canEnrollSubject(subject, progress)
      )
      .map((subject) => subject.id)
  );
}

export function usePlanner() {
  const progress = useAcademicProgressStore((state) => state.progress);
  const updateSubjectStatus = useAcademicProgressStore((state) => state.updateSubjectStatus);
  const replaceProgress = useAcademicProgressStore((state) => state.replaceProgress);
  const resetProgress = useAcademicProgressStore((state) => state.resetProgress);

  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState<Progress>({});
  const [pendingStatusChange, setPendingStatusChange] =
    useState<PendingStatusChange | null>(null);
  // Si al cargar hubo que corregir materias (por ejemplo, "Aprobada"
  // con la correlativa sin final), lo avisamos una vez.
  const [toast, setToast] = useState<ToastMessage | null>(() => {
    const adjusted = useAcademicProgressStore.getState().startupAdjustments;

    if (adjusted.length === 0) {
      return null;
    }

    return {
      id: Date.now(),
      type: "warning",
      title: "Ajustamos tu progreso",
      description: `${joinNames(adjusted.map(({ subject }) => subject.name))} ${
        adjusted.every(({ to }) => to === adjusted[0].to)
          ? `${adjusted.length === 1 ? "pasó" : "pasaron"} a ${statusLabels[adjusted[0].to]}`
          : "cambiaron de estado"
      }: para aprobar una materia, sus correlativas tienen que estar aprobadas.`,
    };
  });

  const activeProgress = isSimulationMode ? simulationProgress : progress;

  // Los avisos con acción duran más, para dar tiempo a "Deshacer".
  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), toast.action ? 7000 : 4500);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const viewModels = useMemo(
    () =>
      subjects.map((subject) =>
        buildSubjectViewModel(subject, subjects, activeProgress)
      ),
    [activeProgress]
  );

  const simulationChangesCount = useMemo(() => {
    if (!isSimulationMode) {
      return 0;
    }

    return subjects.filter(
      (subject) =>
        (progress[subject.id] ?? "pending") !==
        (simulationProgress[subject.id] ?? "pending")
    ).length;
  }, [isSimulationMode, progress, simulationProgress]);

  const showToast = (
    type: ToastMessage["type"],
    title: string,
    description?: string,
    action?: ToastMessage["action"]
  ) => {
    setToast({ id: Date.now(), type, title, description, action });
  };

  /** Aplica el cambio al progreso real o al simulado. */
  const commit = (subject: AcademicSubject, nextStatus: SubjectStatus): boolean => {
    if (!isSimulationMode) {
      return updateSubjectStatus(subject, nextStatus);
    }

    if (!isStatusAllowed(subject, nextStatus, simulationProgress)) {
      return false;
    }

    setSimulationProgress(applyChange(simulationProgress, subject, nextStatus));

    return true;
  };

  const notAllowedMessage = (subject: AcademicSubject, nextStatus: SubjectStatus) => {
    const pending = (nextStatus === "passed"
      ? subject.prerequisites.filter((id) => activeProgress[id] !== "passed")
      : subject.prerequisites.filter(
          (id) => activeProgress[id] !== "passed" && activeProgress[id] !== "regular"
        )
    ).map((id) => subjects.find((candidate) => candidate.id === id)?.name ?? id);

    return nextStatus === "passed"
      ? `Para rendir el final primero tenés que aprobar ${joinNames(pending)}.`
      : `Para cursarla tenés que regularizar ${joinNames(pending)}.`;
  };

  const undoTo = (snapshot: Progress, inSimulation: boolean) => () => {
    if (inSimulation) {
      setSimulationProgress(snapshot);
    } else {
      replaceProgress(snapshot);
    }
  };

  const changeStatus = (subject: AcademicSubject, nextStatus: SubjectStatus): boolean => {
    if (!isStatusAllowed(subject, nextStatus, activeProgress)) {
      showToast("error", "No se puede cambiar el estado", notAllowedMessage(subject, nextStatus));
      return false;
    }

    const affectedSubjects = getAffectedSubjects(subject, nextStatus, subjects, activeProgress);

    if (affectedSubjects.length > 0) {
      setPendingStatusChange({ subject, nextStatus, affectedSubjects });
      return false;
    }

    const snapshot = activeProgress;
    const before = availableIds(activeProgress);
    const after = availableIds(applyChange(activeProgress, subject, nextStatus));
    const unlocked = subjects.filter(
      (candidate) => after.has(candidate.id) && !before.has(candidate.id)
    );

    if (!commit(subject, nextStatus)) {
      showToast("error", "No se puede cambiar el estado", notAllowedMessage(subject, nextStatus));
      return false;
    }

    const undo = { label: "Deshacer", onClick: undoTo(snapshot, isSimulationMode) };

    if (unlocked.length > 0) {
      showToast(
        "success",
        `${subject.name}: ${statusLabels[nextStatus]}`,
        `${unlocked.length === 1 ? "Se habilitó" : "Se habilitaron"} ${joinNames(
          unlocked.map((candidate) => candidate.name)
        )}.`,
        undo
      );
    } else {
      showToast(
        isSimulationMode ? "info" : "success",
        `${subject.name}: ${statusLabels[nextStatus]}`,
        isSimulationMode ? "Cambio aplicado en la simulación." : undefined,
        undo
      );
    }

    return true;
  };

  const confirmPendingStatusChange = () => {
    if (!pendingStatusChange) {
      return;
    }

    const snapshot = activeProgress;
    const { subject, nextStatus, affectedSubjects } = pendingStatusChange;

    const wasUpdated = commit(subject, nextStatus);

    if (wasUpdated) {
      showToast(
        "warning",
        isSimulationMode ? "Simulación ajustada" : "Progreso ajustado",
        `${affectedSubjects.length} ${
          affectedSubjects.length === 1 ? "materia cambió" : "materias cambiaron"
        } de estado por las correlativas.`,
        { label: "Deshacer", onClick: undoTo(snapshot, isSimulationMode) }
      );
    } else {
      showToast("error", "No se pudo realizar el cambio", "Revisá las correlativas.");
    }

    setPendingStatusChange(null);
  };

  const startSimulation = () => {
    setSimulationProgress({ ...progress });
    setPendingStatusChange(null);
    setIsSimulationMode(true);
    showToast(
      "info",
      "Modo simulación activado",
      "Los cambios no modifican tu progreso real."
    );
  };

  const discardSimulation = () => {
    setIsSimulationMode(false);
    setSimulationProgress({});
    setPendingStatusChange(null);
    showToast("info", "Simulación descartada", "Tu progreso real no cambió.");
  };

  const applySimulation = () => {
    const count = simulationChangesCount;
    const snapshot = progress;

    replaceProgress(simulationProgress);
    setIsSimulationMode(false);
    setSimulationProgress({});
    setPendingStatusChange(null);

    showToast(
      "success",
      "Simulación guardada",
      `${count} ${count === 1 ? "cambio guardado" : "cambios guardados"} en tu progreso.`,
      { label: "Deshacer", onClick: () => replaceProgress(snapshot) }
    );
  };

  const reset = () => {
    const snapshot = progress;

    resetProgress();
    showToast(
      "warning",
      "Progreso reiniciado",
      "Todas las materias volvieron a Pendiente.",
      { label: "Deshacer", onClick: () => replaceProgress(snapshot) }
    );
  };

  return {
    progress,
    activeProgress,
    viewModels,
    isSimulationMode,
    simulationChangesCount,
    pendingStatusChange,
    cancelPendingStatusChange: () => setPendingStatusChange(null),
    confirmPendingStatusChange,
    changeStatus,
    startSimulation,
    discardSimulation,
    applySimulation,
    reset,
    replaceProgress,
    toast,
    closeToast: () => setToast(null),
  };
}
