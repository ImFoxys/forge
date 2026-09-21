import type { ProgramExercise } from "../types";
import ExerciseTag from "./ExerciseTag";

interface ExerciseCardProps {
  order: number;
  exercise: ProgramExercise;
  bestWeight: number | null;
  memo?: string;
}

export default function ExerciseCard({
  order,
  exercise,
  bestWeight,
  memo,
}: ExerciseCardProps) {
  return (
    <div className="exercise-card">
      <div className="exercise-card__order">{order}</div>
      <div className="exercise-card__body">
        <div className="exercise-card__top">
          <div className="exercise-card__name">{exercise.name}</div>
          <ExerciseTag type={exercise.type} />
        </div>
        <div className="exercise-card__specs mono">
          {exercise.sets} × {exercise.reps} · {exercise.tempo} · {exercise.rir}
        </div>
        {bestWeight !== null && (
          <div className="exercise-card__best">
            Meilleure charge : {bestWeight} kg
          </div>
        )}
        {memo && <div className="memo-box memo-box--compact">📌 {memo}</div>}
      </div>
    </div>
  );
}
