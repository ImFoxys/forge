import { PROGRAM } from "../data/program";
import type { Session } from "../types";
import { bestWeightForExercise, formatDate } from "../utils/calculations";
import ExerciseCard from "./ExerciseCard";

interface DayViewProps {
  dayIdx: number;
  sessions: Session[];
  onLaunch: () => void;
}

export default function DayView({ dayIdx, sessions, onLaunch }: DayViewProps) {
  const day = PROGRAM[dayIdx];
  const lastSession = sessions
    .filter((s) => s.dayIdx === dayIdx)
    .sort((a, b) => b.date - a.date)[0];

  return (
    <div className="day-view">
      <div className="day-view__header">
        <div className="day-view__title">{day.full}</div>
        <div className="day-view__meta">
          <span className="badge-duration">~{day.duration} min</span>
          {lastSession && (
            <span className="last-session-label">
              Dernière séance : {formatDate(lastSession.date)}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        className="btn btn--primary btn--full"
        onClick={onLaunch}
      >
        Lancer la séance
      </button>

      <div className="exercise-list">
        {day.exercises.map((exercise, i) => (
          <ExerciseCard
            key={exercise.id}
            order={i + 1}
            exercise={exercise}
            bestWeight={bestWeightForExercise(sessions, exercise.id)}
          />
        ))}
      </div>
    </div>
  );
}
