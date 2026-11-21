// Rotation des séances : on propose toujours la séance suivante du cycle,
// quel que soit le jour de la semaine. Fichier pur, testable sans l'interface.
import type { Program, Session } from "../types";

/** Part minimale de séries validées pour qu'une séance compte comme « faite ». */
export const DONE_RATIO = 0.5;
/** Au-delà, une séance non faite est signalée en orange. */
export const FORGOTTEN_DAYS = 10;
/** Fenêtre de l'alerte anti-doublon. */
export const DUPLICATE_WINDOW_MS = 2 * 60 * 60 * 1000;

const DAY_MS = 86_400_000;

type SessionLike = Pick<Session, "date" | "dayIdx" | "exercises">;

/** Au moins 50 % des séries prévues (celles enregistrées dans la séance) validées. */
export function isSessionDone(session: SessionLike): boolean {
  let planned = 0;
  let validated = 0;
  for (const ex of session.exercises) {
    planned += ex.sets.length;
    validated += ex.sets.filter((s) => s.done).length;
  }
  return planned > 0 && validated >= planned * DONE_RATIO;
}

export interface NextSession {
  dayIdx: number;
  /** Dernière séance prise en compte (faite ou non), null si aucun historique. */
  last: SessionLike | null;
  /** true si la dernière séance n'a pas été faite à 50 % et est reproposée. */
  retry: boolean;
}

export function getNextSession(
  history: SessionLike[],
  program: Program,
  dayOrder: number[],
): NextSession {
  const known = history
    .filter((s) => program[s.dayIdx] && dayOrder.includes(s.dayIdx))
    .sort((a, b) => b.date - a.date);
  const last = known[0];
  if (!last) return { dayIdx: dayOrder[0], last: null, retry: false };
  if (!isSessionDone(last)) return { dayIdx: last.dayIdx, last, retry: true };
  const pos = dayOrder.indexOf(last.dayIdx);
  return { dayIdx: dayOrder[(pos + 1) % dayOrder.length], last, retry: false };
}

export interface DayStatus {
  dayIdx: number;
  lastDone: number | null; // timestamp de la dernière séance faite
  daysAgo: number | null;
  forgotten: boolean; // jamais faite, ou pas faite depuis plus de 10 jours
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Pour chaque séance du cycle : depuis quand elle n'a pas été faite. */
export function dayStatuses(
  history: SessionLike[],
  dayOrder: number[],
  today: number,
): DayStatus[] {
  return dayOrder.map((dayIdx) => {
    const done = history.filter((s) => s.dayIdx === dayIdx && isSessionDone(s));
    const lastDone = done.length ? Math.max(...done.map((s) => s.date)) : null;
    const daysAgo =
      lastDone === null ? null : Math.round((startOfDay(today) - startOfDay(lastDone)) / DAY_MS);
    return { dayIdx, lastDone, daysAgo, forgotten: daysAgo === null || daysAgo > FORGOTTEN_DAYS };
  });
}

/** Séance du même jour du programme enregistrée moins de 2 h avant `now`, la plus récente. */
export function findRecentDuplicate<T extends Pick<Session, "date" | "dayIdx">>(
  history: T[],
  dayIdx: number,
  now: number,
): T | null {
  const candidates = history
    .filter((s) => s.dayIdx === dayIdx && s.date <= now && now - s.date < DUPLICATE_WINDOW_MS)
    .sort((a, b) => b.date - a.date);
  return candidates[0] ?? null;
}

/** « Séance 5/5 — Pull+ » */
export function sessionTitle(program: Program, dayOrder: number[], dayIdx: number): string {
  const pos = dayOrder.indexOf(dayIdx);
  const name = program[dayIdx]?.muscles ?? "";
  return pos === -1 ? name : `Séance ${pos + 1}/${dayOrder.length} — ${name}`;
}
