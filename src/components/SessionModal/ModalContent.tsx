import type { RefObject } from "react";
import type { ProgramExercise, SessionExercise } from "../../types";
import { formatDuration } from "../../utils/calculations";
import ExerciseTag from "../ExerciseTag";
import RirBadge from "../RirBadge";
import ImageCarousel from "./ImageCarousel";
import SerieRow from "./SerieRow";

interface ModalContentProps {
  exercise: ProgramExercise;
  sessionExercise: SessionExercise;
  exerciseIdx: number;
  totalExercises: number;
  progressPct: number;
  elapsed: number;
  prevPerf: { weight: string; reps: string }[] | null;
  forceFailSetIdx: number | null;
  firstInputRef: RefObject<HTMLInputElement | null>;
  bodyRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onChangeField: (setIdx: number, field: "weight" | "reps", value: string) => void;
  onValidateSet: (setIdx: number) => void;
  onModifySet: (setIdx: number) => void;
  onPrev: () => void;
  onNext: () => void;
  isLastExercise: boolean;
}

export default function ModalContent({
  exercise,
  sessionExercise,
  exerciseIdx,
  totalExercises,
  progressPct,
  elapsed,
  prevPerf,
  forceFailSetIdx,
  firstInputRef,
  bodyRef,
  onClose,
  onChangeField,
  onValidateSet,
  onModifySet,
  onPrev,
  onNext,
  isLastExercise,
}: ModalContentProps) {
  const currentSetIdx = sessionExercise.sets.findIndex((s) => !s.done);
  const activeSetIdx = currentSetIdx === -1 ? sessionExercise.sets.length - 1 : currentSetIdx;

  return (
    <>
      <div className="modal__header">
        <div className="modal__header-top">
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
          <span className="chrono mono">{formatDuration(elapsed)}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="modal__label">
          Exercice {exerciseIdx + 1} / {totalExercises} · Série {activeSetIdx + 1} / {exercise.sets}
        </div>
      </div>

      <div className="modal__body" ref={bodyRef}>
        <ImageCarousel images={exercise.images} />

        <div className="exercise-title-row">
          <h2>{exercise.name}</h2>
          <div className="exercise-card__specs mono">
            {exercise.sets} × {exercise.reps} · {exercise.tempo}
          </div>
          <ExerciseTag type={exercise.type} />
          <RirBadge rir={exercise.rir} rirType={exercise.rir_type} />
        </div>

        <div className="tips-box">{exercise.tips}</div>

        <div className="series-list">
          {sessionExercise.sets.map((set, setIdx) => {
            const status = set.done ? "done" : setIdx === activeSetIdx ? "current" : "pending";
            return (
              <SerieRow
                key={setIdx}
                index={setIdx}
                entry={set}
                status={status}
                prevWeight={prevPerf?.[setIdx]?.weight}
                prevReps={prevPerf?.[setIdx]?.reps}
                forceFail={forceFailSetIdx === setIdx}
                inputRef={setIdx === activeSetIdx ? firstInputRef : undefined}
                onChange={(field, value) => onChangeField(setIdx, field, value)}
                onValidate={() => onValidateSet(setIdx)}
                onModify={() => onModifySet(setIdx)}
              />
            );
          })}
        </div>
      </div>

      <div className="modal__footer">
        <button type="button" className="btn" disabled={exerciseIdx === 0} onClick={onPrev}>
          ← Préc.
        </button>
        <button type="button" className="btn btn--primary" onClick={onNext}>
          {isLastExercise ? "✓ Terminer" : "Suiv. →"}
        </button>
      </div>
    </>
  );
}
