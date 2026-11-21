import type { RefObject } from "react";
import type { DropEntry, ProgramExercise, SessionExercise } from "../../types";
import { formatDuration, setsLabel, type PreviousSet } from "../../utils/calculations";
import type { Target } from "../../utils/progression";
import ExerciseTag from "../ExerciseTag";
import RirBadge from "../RirBadge";
import ImageCarousel from "./ImageCarousel";
import MemoBox from "./MemoBox";
import SerieRow from "./SerieRow";
import TargetBanner from "./TargetBanner";

interface ModalContentProps {
  exercise: ProgramExercise;
  sessionExercise: SessionExercise;
  exerciseIdx: number;
  totalExercises: number;
  progressPct: number;
  elapsed: number;
  prevPerf: PreviousSet[] | null;
  target: Target;
  onSetStep: (value: number | null) => void;
  memo: string;
  onSetMemo: (text: string) => void;
  forceFailSetIdx: number | null;
  firstInputRef: RefObject<HTMLInputElement | null>;
  bodyRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onChangeField: (setIdx: number, field: "weight" | "reps", value: string) => void;
  onValidateSet: (setIdx: number) => void;
  onModifySet: (setIdx: number) => void;
  onChangeDrops: (setIdx: number, drops: DropEntry[]) => void;
  suggestDrop: (from: number) => number | null;
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
  target,
  onSetStep,
  memo,
  onSetMemo,
  forceFailSetIdx,
  firstInputRef,
  bodyRef,
  onClose,
  onChangeField,
  onValidateSet,
  onModifySet,
  onChangeDrops,
  suggestDrop,
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
            {setsLabel(exercise)} · {exercise.tempo}
          </div>
          <ExerciseTag type={exercise.type} />
          <RirBadge rir={exercise.rir} rirType={exercise.rir_type} />
        </div>

        <TargetBanner key={exercise.id} target={target} onSetStep={onSetStep} />

        <div className="tips-box">{exercise.tips}</div>

        <MemoBox key={exercise.id} memo={memo} onChange={onSetMemo} />

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
                prevSkipped={prevPerf?.[setIdx]?.skipped}
                repsPlaceholder={
                  target.decision === "first"
                    ? undefined
                    : target.decision === "down"
                      ? String(target.repMax)
                      : String(target.repTargets?.[setIdx] ?? `${target.repMin}–${target.repMax}`)
                }
                dropSet={exercise.dropSet === true && setIdx === exercise.sets - 1}
                onDropsChange={(drops) => onChangeDrops(setIdx, drops)}
                suggestDrop={suggestDrop}
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
