export type ExerciseType = "comp" | "poly" | "iso";

export type RirType = "hard" | "mod" | "fail";

export interface ProgramExercise {
  id: string;
  name: string;
  type: ExerciseType;
  sets: number;
  reps: string;
  tempo: string;
  rir: string;
  rir_type: RirType;
  rest: number;
  tips: string;
  images: string[];
}

export interface ProgramDay {
  label: string;
  muscles: string;
  full: string;
  duration: number;
  exercises: ProgramExercise[];
}

export type Program = Record<number, ProgramDay>;

export interface SetEntry {
  weight: string;
  reps: string;
  done: boolean;
}

export interface SessionExercise {
  id: string;
  name: string;
  sets: SetEntry[];
}

export interface Session {
  date: number;
  dayIdx: number;
  dayLabel: string;
  duration: number;
  exercises: SessionExercise[];
}

export interface Settings {
  legs: number;
  rest: number;
  restIso: number;
}

export interface SessionDraft {
  dayIdx: number;
  exerciseIdx: number;
  elapsed: number;
  exercises: SessionExercise[];
  status: "active" | "ended";
  updatedAt: number;
}
