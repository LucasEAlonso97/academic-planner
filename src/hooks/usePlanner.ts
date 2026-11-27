import { useEffect, useMemo, useState } from "react";

import { subjects } from "../data/career";
import { useAcademicProgressStore } from "../store/useAcademicProgressStore";

import type { AcademicSubject } from "../types/AcademicSubject";
import type { SubjectStatus } from "../types/SubjectProgress";
import type { ToastMessage } from "../components/common/Toast";

import { canEnrollSubject } from "../utils/academicRules";
import { joinNames } from "../utils/planInsights";
import type { Progress } from "../utils/progressValidation";
import { statusLabels } from "../utils/statusDisplay";
import { getAffectedSubjects } from "../utils/statusChangeImpact";
import { buildSubjectViewModel } from "../utils/subjectView";

export type PendingStatusChange = {
  subject: AcademicSubject;
  nextStatus: SubjectStatus;
  affectedSubjects: AcademicSubject[];
};

function applyChange(
  progress: Progress,
  subject: AcademicSubject,
  nextStatus: SubjectStatus,
  resetSubjectIds: string[]
): Progress {
  const next: Progress = { ...progress, [subject.id]: nextStatus };

  if (nextStatus === "pending") {
    delete next[subject.id];
  }

  resetSubjectIds.forEach((subjectId) => {
    delete next[subjectId];
  });

  return next;
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
  const [toast, setToast] = useState<ToastMessage | null>(null);

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
  const commit = (
    subject: AcademicSubject,
    nextStatus: SubjectStatus,
    resetSubjectIds: string[] = []
  ): boolean => {
    if (!isSimulationMode) {
      return updateSubjectStatus(subject, nextStatus, resetSubjectIds);
    }

    if (nextStatus !== "pending" && !canEnrollSubject(subject, simulationProgress)) {
      return false;
    }

    setSimulationProgress(
      applyChange(simulationProgress, subject, nextStatus, resetSubjectIds)
    );

    return true;
  };

  const undoTo = (snapshot: Progress, inSimulation: boolean) => () => {
    if (inSimulation) {
      setSimulationProgress(snapshot);
    } else {
      replaceProgress(snapshot);
    }
  };

  const changeStatus = (subject: AcademicSubject, nextStatus: SubjectStatus): boolean => {
    const affectedSubjects = getAffectedSubjects(subject, nextStatus, subjects, activeProgress);

    if (affectedSubjects.length > 0) {
      setPendingStatusChange({ subject, nextStatus, affectedSubjects });
      return false;
    }

    const snapshot = activeProgress;
    const before = availableIds(activeProgress);
    const after = availableIds(applyChange(activeProgress, subject, nextStatus, []));
    const unlocked = subjects.filter(
      (candidate) => after.has(candidate.id) && !before.has(candidate.id)
    );

    if (!commit(subject, nextStatus)) {
      showToast(
        "error",
        "No se pudo cambiar el estado",
        "La materia todavía no cumple sus correlativas."
      );
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

    const wasUpdated = commit(
      subject,
      nextStatus,
      affectedSubjects.map((affected) => affected.id)
    );

    if (wasUpdated) {
      showToast(
        "warning",
        isSimulationMode ? "Simulación ajustada" : "Progreso ajustado",
        `${affectedSubjects.length} ${
          affectedSubjects.length === 1 ? "materia volvió" : "materias volvieron"
        } a Pendiente por las correlativas.`,
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
