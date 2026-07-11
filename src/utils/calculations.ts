import type { Session } from "../types";

export function bestWeightForExercise(
  sessions: Session[],
  exerciseId: string,
): number | null {
  let best: number | null = null;
  for (const session of sessions) {
    const exercise = session.exercises.find((e) => e.id === exerciseId);
    if (!exercise) continue;
    for (const set of exercise.sets) {
      if (!set.done) continue;
      const weight = parseFloat(set.weight);
      if (!Number.isNaN(weight) && (best === null || weight > best)) {
        best = weight;
      }
    }
  }
  return best;
}

export function lastPerformanceForExercise(
  sessions: Session[],
  exerciseId: string,
): { weight: string; reps: string }[] | null {
  const past = sessions
    .filter((s) => s.exercises.some((e) => e.id === exerciseId))
    .sort((a, b) => b.date - a.date);
  if (past.length === 0) return null;
  const exercise = past[0].exercises.find((e) => e.id === exerciseId);
  if (!exercise) return null;
  return exercise.sets.map((s) => ({ weight: s.weight, reps: s.reps }));
}

export function lastSessionForDay(
  sessions: Session[],
  dayIdx: number,
): Session | null {
  const past = sessions
    .filter((s) => s.dayIdx === dayIdx)
    .sort((a, b) => b.date - a.date);
  return past[0] ?? null;
}

export function sessionVolume(session: Session): number {
  let volume = 0;
  for (const exercise of session.exercises) {
    for (const set of exercise.sets) {
      if (!set.done) continue;
      const weight = parseFloat(set.weight);
      const reps = parseFloat(set.reps);
      if (!Number.isNaN(weight) && !Number.isNaN(reps)) {
        volume += weight * reps;
      }
    }
  }
  return volume;
}

export function totalSetsForDay(exercises: { sets: number }[]): number {
  return exercises.reduce((sum, e) => sum + e.sets, 0);
}

export function estimatedOneRepMax(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
