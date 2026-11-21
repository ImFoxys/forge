import { useEffect, useMemo, useRef, useState } from "react";
import { PROGRAM } from "../../data/program";
import type { DropEntry, Memos, Session, SessionDraft, SessionExercise, Settings } from "../../types";
import {
  lastPerformanceForExercise,
  restAfterSet,
  totalSetsForDay,
} from "../../utils/calculations";
import {
  computeTarget,
  formatKg,
  historyFromSessions,
  round1,
  suggestDropLoad,
  type HistorySet,
  type Target,
} from "../../utils/progression";
import { findRecentDuplicate } from "../../utils/rotation";
import { clearDraft, useSteps, writeDraft } from "../../utils/storage";
import EndScreen from "./EndScreen";
import ModalContent from "./ModalContent";
import RestOverlay from "./RestOverlay";

interface SessionModalProps {
  dayIdx: number;
  draft: SessionDraft | null;
  sessions: Session[];
  settings: Settings;
  memos: Memos;
  onSetMemo: (exerciseId: string, text: string) => void;
  onClose: () => void;
  onSave: (session: Session) => void;
}

type Status = "active" | "resting" | "ended";

// Valeur à mettre dans le champ charge (point décimal pour <input type="number">).
function weightInput(target: Target): string {
  return target.weight === null ? "" : String(round1(target.weight));
}

function blankSessionData(dayIdx: number, targets: Target[]): SessionExercise[] {
  return PROGRAM[dayIdx].exercises.map((ex, i) => ({
    id: ex.id,
    name: ex.name,
    sets: Array.from({ length: ex.sets }, () => ({
      weight: weightInput(targets[i]),
      reps: "",
      done: false,
    })),
  }));
}

function isDraftUsable(draft: SessionDraft | null, dayIdx: number): draft is SessionDraft {
  return (
    draft !== null &&
    draft.dayIdx === dayIdx &&
    draft.exercises.length === PROGRAM[dayIdx].exercises.length
  );
}

export default function SessionModal({
  dayIdx,
  draft,
  sessions,
  settings,
  memos,
  onSetMemo,
  onClose,
  onSave,
}: SessionModalProps) {
  const day = PROGRAM[dayIdx];
  const usableDraft = isDraftUsable(draft, dayIdx) ? draft : null;

  const { steps, setStep } = useSteps();
  const [today] = useState(() => Date.now());
  const histories = useMemo(
    () => day.exercises.map((ex) => historyFromSessions(sessions, ex.id)),
    [day, sessions],
  );
  const targets = useMemo(
    () =>
      day.exercises.map((ex, i) =>
        computeTarget(ex, histories[i], today, { manualStep: steps[ex.id] }),
      ),
    [day, histories, today, steps],
  );

  const [sessionData, setSessionData] = useState<SessionExercise[]>(() =>
    usableDraft ? usableDraft.exercises : blankSessionData(dayIdx, targets),
  );
  const [toast, setToast] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [exerciseIdx, setExerciseIdx] = useState(usableDraft?.exerciseIdx ?? 0);
  const [status, setStatus] = useState<Status>(
    usableDraft?.status === "ended" ? "ended" : "active",
  );
  const [saved, setSaved] = useState(false);

  // Timestamp-based timers: elapsed/rest are *derived* from Date.now() rather than
  // incremented by a tick counter, so they stay correct even if setInterval gets
  // throttled or suspended while the tab/app is backgrounded (rest overlay, chrono).
  const [startedAt] = useState(() => Date.now() - (usableDraft?.elapsed ?? 0) * 1000);
  const [frozenElapsed, setFrozenElapsed] = useState<number | null>(
    usableDraft?.status === "ended" ? usableDraft.elapsed : null,
  );
  const [rest, setRest] = useState<{ startAt: number; endAt: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const elapsed = frozenElapsed ?? Math.max(0, Math.floor((now - startedAt) / 1000));
  const restRemaining = rest ? Math.max(0, Math.ceil((rest.endAt - now) / 1000)) : 0;
  const restTotal = rest ? Math.round((rest.endAt - rest.startAt) / 1000) : 0;

  const bodyRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tick = () => {
      const n = Date.now();
      setNow(n);
      setRest((r) => {
        if (r && n >= r.endAt) {
          setStatus((s) => (s === "resting" ? "active" : s));
        }
        return r;
      });
    };
    const id = setInterval(tick, 1000);
    const onVisibilityChange = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
    firstInputRef.current?.focus();
  }, [exerciseIdx]);

  useEffect(() => {
    if (saved) return;
    writeDraft({
      dayIdx,
      exerciseIdx,
      elapsed,
      exercises: sessionData,
      status: status === "ended" ? "ended" : "active",
      updatedAt: Date.now(),
    });
  }, [dayIdx, exerciseIdx, elapsed, sessionData, status, saved]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const exercise = day.exercises[exerciseIdx];
  const target = targets[exerciseIdx];
  const sessionExercise = sessionData[exerciseIdx];
  const isLastExercise = exerciseIdx === day.exercises.length - 1;

  const totalSets = totalSetsForDay(day.exercises);
  const validatedSets = sessionData.reduce(
    (sum, se) => sum + se.sets.filter((s) => s.done).length,
    0,
  );
  const progressPct = totalSets > 0 ? (validatedSets / totalSets) * 100 : 0;

  const lastIsoIdx = day.exercises.reduce(
    (acc, ex, i) => (ex.type === "iso" ? i : acc),
    -1,
  );
  const forceFailSetIdx =
    exerciseIdx === lastIsoIdx ? exercise.sets - 1 : null;

  const prevPerf = lastPerformanceForExercise(sessions, exercise.id);

  const volume = sessionData.reduce((sum, se) => {
    return (
      sum +
      se.sets.reduce((s, set) => {
        if (!set.done) return s;
        const w = parseFloat(set.weight);
        const r = parseFloat(set.reps);
        return Number.isNaN(w) || Number.isNaN(r) ? s : s + w * r;
      }, 0)
    );
  }, 0);

  function updateSet(
    setIdx: number,
    patch: Partial<{ weight: string; reps: string; done: boolean; drops: DropEntry[] }>,
  ) {
    setSessionData((prev) =>
      prev.map((se, i) =>
        i !== exerciseIdx
          ? se
          : {
              ...se,
              sets: se.sets.map((s, si) => (si !== setIdx ? s : { ...s, ...patch })),
            },
      ),
    );
  }

  function handleChangeField(setIdx: number, field: "weight" | "reps", value: string) {
    updateSet(setIdx, { [field]: value });
  }

  function handleValidateSet(setIdx: number) {
    const set = sessionExercise.sets[setIdx];
    const fallback = prevPerf?.[setIdx];
    const validated = {
      weight: set.weight || fallback?.weight || "",
      reps: set.reps || fallback?.reps || "",
      done: true,
    };
    updateSet(setIdx, validated);

    // Toutes les séries faites : si le plafond est atteint, on annonce la prochaine charge.
    const sets = sessionExercise.sets.map((s, i) => (i === setIdx ? validated : s));
    if (target.decision !== "first" && sets.every((s) => s.done)) {
      const now = Date.now();
      const current: HistorySet[] = sets.map((s, i) => ({ date: now, setIndex: i, ...s }));
      const next = computeTarget(exercise, [...histories[exerciseIdx], ...current], now, {
        manualStep: steps[exercise.id],
      });
      if (next.decision === "up" && next.weight !== null) {
        setToast(`Objectif atteint 💪 Prochaine fois : ${formatKg(next.weight)} kg`);
      }
    }

    const restDuration = restAfterSet(exercise, setIdx, settings);
    const startAt = Date.now();
    setRest({ startAt, endAt: startAt + restDuration * 1000 });
    setNow(startAt);
    setStatus("resting");
  }

  // Changement de cran : on recalcule la cible et on met à jour les séries
  // non validées qui portaient encore l'ancienne charge pré-remplie.
  function handleSetStep(value: number | null) {
    const oldWeight = weightInput(target);
    const newTarget = computeTarget(exercise, histories[exerciseIdx], today, { manualStep: value });
    const newWeight = weightInput(newTarget);
    setStep(exercise.id, value);
    setSessionData((prev) =>
      prev.map((se, i) =>
        i !== exerciseIdx
          ? se
          : {
              ...se,
              sets: se.sets.map((s) =>
                !s.done && s.weight === oldWeight ? { ...s, weight: newWeight } : s,
              ),
            },
      ),
    );
  }

  function handleChangeDrops(setIdx: number, drops: DropEntry[]) {
    updateSet(setIdx, { drops });
  }

  function handleModifySet(setIdx: number) {
    updateSet(setIdx, { done: false });
  }

  function handlePrev() {
    if (exerciseIdx > 0) setExerciseIdx((i) => i - 1);
  }

  function handleNext() {
    if (isLastExercise) {
      setFrozenElapsed(elapsed);
      setStatus("ended");
    } else {
      setExerciseIdx((i) => i + 1);
    }
  }

  function handleAdjustRest(delta: number) {
    setRest((r) => (r ? { ...r, endAt: Math.max(now, r.endAt + delta * 1000) } : r));
  }

  // Anti-doublon : même séance du programme enregistrée il y a moins de 2 h → on demande.
  function handleSave() {
    const dup = findRecentDuplicate(sessions, dayIdx, Date.now());
    if (dup) {
      const d = new Date(dup.date);
      const time = `${d.getHours()} h ${String(d.getMinutes()).padStart(2, "0")}`;
      setDuplicateWarning(
        `Tu as déjà enregistré une séance ${day.muscles} à ${time}. Enregistrer quand même ?`,
      );
      return;
    }
    saveSession();
  }

  function saveSession() {
    setDuplicateWarning(null);
    const session: Session = {
      date: Date.now(),
      dayIdx,
      dayLabel: day.full,
      duration: elapsed,
      // Drops laissés vides : on ne les enregistre pas.
      exercises: sessionData.map((se) => ({
        ...se,
        sets: se.sets.map(({ drops, ...set }) => {
          const kept = drops?.filter((d) => d.weight.trim() || d.reps.trim());
          return kept?.length ? { ...set, drops: kept } : set;
        }),
      })),
    };
    setSaved(true);
    clearDraft();
    onSave(session);
  }

  const nextExercise = isLastExercise ? null : day.exercises[exerciseIdx + 1];
  const nextSetIdx = sessionExercise.sets.findIndex((s) => !s.done);
  const restNextLabel =
    nextSetIdx !== -1
      ? `Prochaine série : ${exercise.name} · série ${nextSetIdx + 1}`
      : nextExercise
        ? `Exercice suivant : ${nextExercise.name}`
        : "Dernière série de la séance";

  return (
    <div className="modal-overlay">
      {status === "ended" ? (
        <EndScreen
          duration={elapsed}
          validatedSets={validatedSets}
          volume={volume}
          onSave={handleSave}
          duplicateWarning={duplicateWarning}
          onCancelDuplicate={() => setDuplicateWarning(null)}
          onConfirmDuplicate={saveSession}
        />
      ) : (
        <>
          <ModalContent
            exercise={exercise}
            sessionExercise={sessionExercise}
            exerciseIdx={exerciseIdx}
            totalExercises={day.exercises.length}
            progressPct={progressPct}
            elapsed={elapsed}
            prevPerf={prevPerf}
            target={target}
            onSetStep={handleSetStep}
            memo={memos[exercise.id] ?? ""}
            onSetMemo={(text) => onSetMemo(exercise.id, text)}
            forceFailSetIdx={forceFailSetIdx}
            firstInputRef={firstInputRef}
            bodyRef={bodyRef}
            onClose={onClose}
            onChangeField={handleChangeField}
            onValidateSet={handleValidateSet}
            onModifySet={handleModifySet}
            onChangeDrops={handleChangeDrops}
            suggestDrop={(from) =>
              suggestDropLoad(exercise, histories[exerciseIdx], from, {
                manualStep: steps[exercise.id],
              })
            }
            onPrev={handlePrev}
            onNext={handleNext}
            isLastExercise={isLastExercise}
          />
          {status === "resting" && (
            <RestOverlay
              remaining={restRemaining}
              total={restTotal}
              nextLabel={restNextLabel}
              nextExercise={nextSetIdx === -1 ? nextExercise : null}
              memo={memos[exercise.id] ?? ""}
              onSetMemo={(text) => onSetMemo(exercise.id, text)}
              onSkip={() => setStatus("active")}
              onAdjust={handleAdjustRest}
            />
          )}
        </>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
