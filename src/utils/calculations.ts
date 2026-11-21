import type { ProgramExercise, Session } from "../types";

// Motif de reps d'une méthode par blocs : "3-4-5-6-7" → [3, 4, 5, 6, 7].
export function repPattern(reps: string): number[] {
  return reps.match(/\d+/g)?.map(Number) ?? [];
}

// Prescription affichée : « 3 × 6–8 », ou « 2 × 3-4-5-6-7 » pour la méthode 3/7.
export function setsLabel(exercise: Pick<ProgramExercise, "sets" | "reps" | "method">): string {
  if (exercise.method === "3/7") {
    const blocks = Math.ceil(exercise.sets / Math.max(repPattern(exercise.reps).length, 1));
    return `${blocks} × ${exercise.reps}`;
  }
  return `${exercise.sets} × ${exercise.reps}`;
}

// Repos après une série (en s). Méthode 3/7 : repos court entre mini-séries, long entre blocs.
export function restAfterSet(
  exercise: Pick<ProgramExercise, "id" | "type" | "rest" | "reps" | "method" | "restAfterBlock">,
  setIdx: number,
  settings: { rest: number; restIso: number },
): number {
  if (exercise.method === "3/7") {
    const blockSize = repPattern(exercise.reps).length;
    const endOfBlock = blockSize > 0 && (setIdx + 1) % blockSize === 0;
    return endOfBlock ? (exercise.restAfterBlock ?? settings.restIso) : exercise.rest;
  }
  if (exercise.id === "mer1") return 210;
  return exercise.type === "iso" ? settings.restIso : settings.rest;
}

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

export interface PreviousSet {
  weight: string;
  reps: string;
  skipped: boolean;
}

function isPerformed(set: { weight: string; reps: string; done: boolean }): boolean {
  return set.done && set.weight !== "" && set.reps !== "";
}

// Pour chaque série, reprend les valeurs de la dernière séance où elle a été
// réellement faite. `skipped` vaut true si elle n'a pas été faite lors de la
// toute dernière séance contenant cet exercice.
export function lastPerformanceForExercise(
  sessions: Session[],
  exerciseId: string,
): PreviousSet[] | null {
  const past = sessions
    .filter((s) => s.exercises.some((e) => e.id === exerciseId))
    .sort((a, b) => b.date - a.date);
  if (past.length === 0) return null;
  const history = past.map((s) => s.exercises.find((e) => e.id === exerciseId)!.sets);
  const setCount = history[0].length;
  const result: PreviousSet[] = [];
  for (let i = 0; i < setCount; i++) {
    const idx = history.findIndex((sets) => sets[i] && isPerformed(sets[i]));
    if (idx === -1) {
      result.push({ weight: "", reps: "", skipped: true });
    } else {
      const { weight, reps } = history[idx][i];
      result.push({ weight, reps, skipped: idx > 0 });
    }
  }
  return result;
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

export function computeBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
