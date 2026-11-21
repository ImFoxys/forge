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
  // Cran de charge propre à l'exercice (kg). Prioritaire sur l'échelle apprise,
  // mais le cran réglé dans l'appli passe avant.
  step?: number;
  // Charge = aide de la machine : progresser veut dire baisser la charge.
  // Détecté aussi automatiquement si le nom contient « assisté(e) ».
  assisted?: boolean;
  // Méthode 3/7 : `sets` mini-séries en blocs suivant le motif de `reps` (ex. "3-4-5-6-7"),
  // `rest` s entre mini-séries et `restAfterBlock` s entre les blocs.
  method?: "3/7";
  restAfterBlock?: number;
  // Dernière série en drop-set : on peut y ajouter des « drops » (charge + reps).
  dropSet?: boolean;
}

export interface ProgramDay {
  label: string;
  muscles: string;
  full: string;
  duration: number;
  exercises: ProgramExercise[];
}

export type Program = Record<number, ProgramDay>;

export interface DropEntry {
  weight: string;
  reps: string;
}

export interface SetEntry {
  weight: string;
  reps: string;
  done: boolean;
  // Drops enchaînés après la série (drop-set). Absent sur les séries normales.
  // Ignorés par le calcul de la charge du jour.
  drops?: DropEntry[];
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
  height: number;
}

export interface WeightEntry {
  date: number;
  weight: number;
}

// Mémo libre par exercice (clé = id de l'exercice), affiché aux séances suivantes.
export type Memos = Record<string, string>;

// Cran de charge réglé à la main dans l'appli (clé = id de l'exercice, valeur en kg).
export type Steps = Record<string, number>;

export interface SessionDraft {
  dayIdx: number;
  exerciseIdx: number;
  elapsed: number;
  exercises: SessionExercise[];
  status: "active" | "ended";
  updatedAt: number;
}
