// Double progression : calcule la charge du jour d'un exercice à partir de son historique.
// Tout ce fichier est pur (aucun accès au DOM ni au localStorage) pour être testable.
import type { ProgramExercise, Session } from "../types";
import { repPattern } from "./calculations";

export interface HistorySet {
  date: number; // timestamp de la séance (sert de clé de regroupement)
  setIndex: number;
  weight: string | number;
  reps: string | number;
  done: boolean;
}

export type Decision = "up" | "keep" | "down" | "first";
export type StepSource = "manual" | "program" | "history" | "default";

export interface Target {
  decision: Decision;
  assisted: boolean;
  weight: number | null; // charge du jour (null = première fois)
  repMin: number;
  repMax: number;
  repTargets: number[] | null; // objectif de reps par série (décision « garder »)
  objective: string; // ex. « 4 × 6–8 » ou « 8-8-7-7 »
  lastSummary: string | null; // ex. « 39 kg × 8-8-8-8 »
  reason: string; // courte justification affichée après la flèche
  why: string; // explication en une phrase (« Pourquoi ? »)
  pauseDays: number | null; // renseigné si reprise après plus de 21 jours
  step: { value: number | null; source: StepSource };
}

export type TargetExercise = Pick<ProgramExercise, "name" | "type" | "sets" | "reps"> &
  Partial<Pick<ProgramExercise, "step" | "assisted" | "method" | "dropSet">>;

const PAUSE_DAYS = 21;
const DEFAULT_INCREMENT = 2.5;
const EPS = 1e-6;
const DAY_MS = 86_400_000;

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function formatKg(n: number): string {
  return round1(n).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

export function parseRepRange(reps: string): { repMin: number; repMax: number } {
  const nums = reps.match(/\d+/g)?.map(Number) ?? [];
  if (nums.length === 0) return { repMin: 0, repMax: 0 };
  const repMin = nums[0];
  const repMax = nums.length > 1 ? nums[1] : nums[0];
  return { repMin: Math.min(repMin, repMax), repMax: Math.max(repMin, repMax) };
}

export function isAssisted(exercise: Pick<TargetExercise, "name" | "assisted">): boolean {
  return exercise.assisted === true || /assist[ée]e?/i.test(exercise.name);
}

function toNum(v: string | number): number {
  if (typeof v === "number") return v;
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Extrait l'historique d'un exercice (par id) depuis les séances stockées. */
export function historyFromSessions(sessions: Session[], exerciseId: string): HistorySet[] {
  const out: HistorySet[] = [];
  for (const session of sessions) {
    for (const ex of session.exercises) {
      if (ex.id !== exerciseId) continue;
      ex.sets.forEach((s, i) =>
        out.push({ date: session.date, setIndex: i, weight: s.weight, reps: s.reps, done: s.done }),
      );
    }
  }
  return out;
}

interface CleanSet {
  date: number;
  setIndex: number;
  weight: number;
  reps: number;
}

interface SessionGroup {
  date: number;
  sets: CleanSet[];
  ref: number; // charge de référence L
}

/** Charge la plus fréquente ; en cas d'égalité, la plus élevée. */
function referenceLoad(sets: CleanSet[]): number {
  const counts = new Map<number, number>();
  for (const s of sets) counts.set(round1(s.weight), (counts.get(round1(s.weight)) ?? 0) + 1);
  let best = -Infinity;
  let bestCount = 0;
  for (const [w, c] of counts) {
    if (c > bestCount || (c === bestCount && w > best)) {
      best = w;
      bestCount = c;
    }
  }
  return best;
}

/** Séries validées avec une charge et des reps exploitables (les drops ne sont jamais lus). */
function cleanHistory(history: HistorySet[]): CleanSet[] {
  return history
    .filter((h) => h.done)
    .map((h) => ({ date: h.date, setIndex: h.setIndex, weight: toNum(h.weight), reps: toNum(h.reps) }))
    .filter((h) => Number.isFinite(h.weight) && Number.isFinite(h.reps) && h.reps > 0);
}

/**
 * Échelle des charges disponibles d'un exercice.
 * Priorité : cran réglé dans l'appli > step du programme > échelle apprise > incrément par défaut.
 */
function buildScale(exercise: TargetExercise, clean: CleanSet[], manualStep?: number | null) {
  const fixedStep =
    manualStep && manualStep > 0
      ? { value: manualStep, source: "manual" as const }
      : exercise.step && exercise.step > 0
        ? { value: exercise.step, source: "program" as const }
        : null;
  const ladder = [...new Set(clean.map((s) => round1(s.weight)))].sort((a, b) => a - b);
  const inc = fixedStep?.value ?? DEFAULT_INCREMENT;
  const step: Target["step"] = fixedStep ?? {
    value: ladder.length > 1 ? null : DEFAULT_INCREMENT,
    source: ladder.length > 1 ? "history" : "default",
  };

  const nextUp = (from: number): number => {
    if (fixedStep) return from + inc;
    return ladder.find((w) => w > from + EPS) ?? from + inc;
  };
  const nextDown = (from: number): number => {
    if (fixedStep) return from - inc;
    return [...ladder].reverse().find((w) => w < from - EPS) ?? from - inc;
  };
  // Plus grande charge disponible ≤ target (à défaut : anchor − k × incrément).
  const roundDown = (anchor: number, target: number): number => {
    if (!fixedStep) {
      const found = [...ladder].reverse().find((w) => w <= target + EPS);
      if (found !== undefined) return found;
    }
    const k = Math.ceil((anchor - target) / inc - EPS);
    return anchor - Math.max(k, 0) * inc;
  };
  // Plus petite charge disponible ≥ target (à défaut : anchor + k × incrément).
  const roundUp = (anchor: number, target: number): number => {
    if (!fixedStep) {
      const found = ladder.find((w) => w >= target - EPS);
      if (found !== undefined) return found;
    }
    const k = Math.ceil((target - anchor) / inc - EPS);
    return anchor + Math.max(k, 0) * inc;
  };

  return { step, nextUp, nextDown, roundDown, roundUp };
}

/**
 * Charge proposée pour un drop : −20 % de la charge précédente, arrondie au cran
 * inférieur avec les mêmes règles que computeTarget. Toujours strictement plus léger.
 */
export function suggestDropLoad(
  exercise: TargetExercise,
  history: HistorySet[],
  from: number,
  options: { manualStep?: number | null } = {},
): number | null {
  if (!Number.isFinite(from) || from <= 0) return null;
  const { roundDown, nextDown } = buildScale(exercise, cleanHistory(history), options.manualStep);
  let load = roundDown(from, from * 0.8);
  if (load >= from - EPS) load = nextDown(from);
  load = round1(load);
  return load > 0 ? load : null;
}

export function computeTarget(
  exercise: TargetExercise,
  history: HistorySet[],
  today: Date | number,
  options: { manualStep?: number | null } = {},
): Target {
  // Méthode 3/7 : objectif de reps fixé par mini-série selon le motif (3-4-5-6-7, 3-4-5-6-7…).
  const pattern = exercise.method === "3/7" ? repPattern(exercise.reps) : null;
  const patternTargets = pattern?.length
    ? Array.from({ length: exercise.sets }, (_, i) => pattern[i % pattern.length])
    : null;
  const { repMin, repMax } = pattern?.length
    ? { repMin: Math.min(...pattern), repMax: Math.max(...pattern) }
    : parseRepRange(exercise.reps);
  const assisted = isAssisted(exercise);
  const range = pattern?.length
    ? exercise.reps
    : repMin === repMax
      ? `${repMax}`
      : `${repMin}–${repMax}`;
  const blocks = pattern?.length ? Math.ceil(exercise.sets / pattern.length) : 0;
  const prescription = patternTargets ? `${blocks} × ${range}` : `${exercise.sets} × ${range}`;

  const clean = cleanHistory(history);
  const scale = buildScale(exercise, clean, options.manualStep);
  const step = scale.step;

  if (clean.length === 0) {
    return {
      decision: "first",
      assisted,
      weight: null,
      repMin,
      repMax,
      repTargets: null,
      objective: prescription,
      lastSummary: null,
      reason: "",
      why: patternTargets
        ? "Première fois : commence à environ 70 % de ta charge habituelle sur 12 reps."
        : `Première fois : choisis une charge où tu fais environ ${Math.max(repMax - 2, 1)} répétitions.`,
      pauseDays: null,
      step,
    };
  }

  const { nextUp, nextDown, roundDown, roundUp } = scale;
  const progress = (L: number) => (assisted ? nextDown(L) : nextUp(L));
  const lighten = (L: number) => (assisted ? roundUp(L, L * 1.1) : roundDown(L, L * 0.9));
  // « Au moins aussi dur que L » : charge ≥ L, ou aide ≤ L pour un exercice assisté.
  const atLeast = (w: number, L: number) => (assisted ? w <= L + EPS : w >= L - EPS);

  // Étape 1 : regroupement par séance, la plus récente d'abord.
  const byDate = new Map<number, CleanSet[]>();
  for (const s of clean) byDate.set(s.date, [...(byDate.get(s.date) ?? []), s]);
  const groups: SessionGroup[] = [...byDate.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([date, sets]) => ({
      date,
      sets: sets.sort((a, b) => a.setIndex - b.setIndex),
      ref: referenceLoad(sets),
    }));
  const last = groups[0];

  // Étape 2 : charge de référence.
  const L = last.ref;
  const S = last.sets.filter((s) => atLeast(s.weight, L));
  const unit = assisted ? " kg d'assistance" : " kg";

  // Étape 3 : décision.
  let decision: Decision;
  let weight: number;
  let repTargets: number[] | null = null;
  let objective: string;
  let reason: string;
  let why: string;

  const prev2 = groups.slice(0, 2);
  const failedTwice =
    prev2.length === 2 &&
    prev2.every((g) => Math.abs(g.ref - L) < EPS && g.sets.some((s) => s.reps < repMin));

  if (patternTargets) {
    // Toutes les mini-séries réussies à la charge L → on monte ; sinon on garde la charge.
    const missed = patternTargets.filter((goal, i) => {
      const s = last.sets.find((x) => x.setIndex === i);
      return !s || !atLeast(s.weight, L) || s.reps < goal;
    }).length;
    repTargets = patternTargets;
    objective = prescription;
    if (missed === 0) {
      decision = "up";
      weight = progress(L);
      reason = "toutes les mini-séries réussies, on monte";
      why = `Tu as réussi les ${exercise.sets} mini-séries (${range}) à ${formatKg(L)}${unit} : on passe au cran suivant.`;
    } else {
      decision = "keep";
      weight = L;
      reason = "même charge, finis toutes les mini-séries";
      why = `${missed} mini-série${missed > 1 ? "s" : ""} sur ${exercise.sets} incomplète${missed > 1 ? "s" : ""} à ${formatKg(L)}${unit} : garde la même charge jusqu'à tout réussir.`;
    }
  } else if (S.length >= exercise.sets && S.every((s) => s.reps >= repMax)) {
    decision = "up";
    weight = progress(L);
    objective = prescription;
    reason = assisted ? "plafond atteint, on réduit l'assistance" : "plafond atteint, on monte";
    why = `Tes ${S.length} séries à ${formatKg(L)}${unit} ont atteint ${repMax} répétitions (haut de la fourchette ${range}).`;
  } else if (failedTwice) {
    decision = "down";
    weight = lighten(L);
    objective = `${exercise.sets} × ${repMax}`;
    reason = assisted ? "trop dur 2 fois, on ajoute de l'aide" : "trop dur 2 fois, on allège";
    why = `Sur tes 2 dernières séances à ${formatKg(L)}${unit}, au moins une série est passée sous ${repMin} répétitions : on repart ${assisted ? "avec 10 % d'aide en plus" : "10 % plus léger"} en visant ${repMax} reps.`;
  } else {
    decision = "keep";
    weight = L;
    repTargets = Array.from({ length: exercise.sets }, (_, i) => {
      const s = last.sets.find((x) => x.setIndex === i);
      if (!s || !atLeast(s.weight, L)) return repMin;
      return s.reps >= repMax ? repMax : Math.max(s.reps + 1, repMin);
    });
    objective = repTargets.join("-");
    if (S.length < exercise.sets) {
      reason = "on consolide la charge";
      why = `Seulement ${S.length} série${S.length > 1 ? "s" : ""} sur ${exercise.sets} à ${formatKg(L)}${unit} : fais toutes tes séries à cette charge avant de progresser.`;
    } else {
      reason = "+1 rep là où c'est possible";
      why = `Toutes tes séries n'ont pas atteint ${repMax} répétitions : vise +1 rep sur celles qui sont en dessous.`;
    }
  }

  // Étape 4 : reprise après une pause.
  const pause = Math.round((startOfDay(+today) - startOfDay(last.date)) / DAY_MS);
  let pauseDays: number | null = null;
  if (pause > PAUSE_DAYS) {
    pauseDays = pause;
    weight = assisted ? roundUp(weight, weight * 1.1) : roundDown(weight, weight * 0.9);
    why += ` Reprise après ${pause} jours : ${assisted ? "+10 % d'aide" : "−10 %"} pour se réhabituer.`;
  }

  weight = Math.max(round1(weight), 0);

  // Résumé de la dernière séance.
  const loads = new Set(last.sets.map((s) => round1(s.weight)));
  const lastSummary =
    loads.size === 1
      ? `${formatKg(L)} kg × ${last.sets.map((s) => s.reps).join("-")}`
      : last.sets.map((s) => `${formatKg(s.weight)}×${s.reps}`).join(", ");

  return {
    decision,
    assisted,
    weight,
    repMin,
    repMax,
    repTargets,
    objective,
    lastSummary,
    reason,
    why,
    pauseDays,
    step,
  };
}
