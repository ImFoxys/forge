import { describe, expect, it } from "vitest";
import { DAY_ORDER, PROGRAM } from "../data/program";
import type { Session } from "../types";
import {
  dayStatuses,
  findRecentDuplicate,
  getNextSession,
  isSessionDone,
  sessionTitle,
} from "./rotation";

const PUSH = 0;
const PULL = 1;
const LEGS = 2;
const PUSH_PLUS = 3;
const PULL_PLUS = 4;

/** Séance de `total` séries prévues dont `done` validées (20 par défaut, toutes faites). */
function s(dayIdx: number, date: string, done = 20, total = 20): Session {
  return {
    date: new Date(date).getTime(),
    dayIdx,
    dayLabel: PROGRAM[dayIdx].full,
    duration: 3600,
    exercises: [
      {
        id: "x",
        name: "x",
        sets: Array.from({ length: total }, (_, i) => ({
          weight: "10",
          reps: "10",
          done: i < done,
        })),
      },
    ],
  };
}

const next = (history: Session[]) => getNextSession(history, PROGRAM, DAY_ORDER).dayIdx;

describe("getNextSession", () => {
  it("1. aucun historique → Push", () => {
    expect(next([])).toBe(PUSH);
  });

  it("2. dernière séance Push+ complète → Pull+", () => {
    expect(next([s(PUSH, "2026-11-17T08:00"), s(PUSH_PLUS, "2026-11-19T08:57")])).toBe(PULL_PLUS);
  });

  it("3. dernière séance Pull+ complète → retour à Push", () => {
    expect(next([s(PUSH_PLUS, "2026-11-19T08:57"), s(PULL_PLUS, "2026-11-20T18:00")])).toBe(PUSH);
  });

  it("4. Push 07:43 puis Push+ 08:57 le même jour → la plus tardive compte → Pull+", () => {
    // Ordre volontairement mélangé dans le tableau.
    expect(next([s(PUSH_PLUS, "2026-11-19T08:57"), s(PUSH, "2026-11-19T07:43")])).toBe(PULL_PLUS);
  });

  it("5. Legs complète puis Push+ à 5/20 séries → Push+ reproposée", () => {
    const r = getNextSession(
      [s(LEGS, "2026-11-17T18:00"), s(PUSH_PLUS, "2026-11-19T08:57", 5)],
      PROGRAM,
      DAY_ORDER,
    );
    expect(r.dayIdx).toBe(PUSH_PLUS);
    expect(r.retry).toBe(true);
  });

  it("6. Pull complète puis Legs choisie à la main → le cycle reprend après Legs → Push+", () => {
    expect(next([s(PULL, "2026-11-17T18:00"), s(LEGS, "2026-11-19T18:00")])).toBe(PUSH_PLUS);
  });

  it("seuil de 50 % : 10/20 suffit, 9/20 non", () => {
    expect(isSessionDone(s(PUSH, "2026-11-19T08:00", 10))).toBe(true);
    expect(isSessionDone(s(PUSH, "2026-11-19T08:00", 9))).toBe(false);
  });
});

describe("findRecentDuplicate (anti-doublon)", () => {
  const at = (date: string) => new Date(date).getTime();

  it("7. Push à 07:44, nouvelle Push à 08:43 → confirmation", () => {
    const dup = findRecentDuplicate([s(PUSH, "2026-11-02T07:44")], PUSH, at("2026-11-02T08:43"));
    expect(dup).not.toBeNull();
    expect(new Date(dup!.date).getHours()).toBe(7);
  });

  it("8. Push à 07:44, Push+ à 08:43 → pas de confirmation (type différent)", () => {
    expect(findRecentDuplicate([s(PUSH, "2026-11-02T07:44")], PUSH_PLUS, at("2026-11-02T08:43"))).toBeNull();
  });

  it("9. Push la veille à 08:00, Push aujourd'hui à 08:00 → pas de confirmation", () => {
    expect(findRecentDuplicate([s(PUSH, "2026-11-01T08:00")], PUSH, at("2026-11-02T08:00"))).toBeNull();
  });
});

describe("dayStatuses / sessionTitle", () => {
  it("signale les séances jamais faites ou pas faites depuis plus de 10 jours", () => {
    const today = new Date("2026-11-23T12:00").getTime();
    const statuses = dayStatuses(
      [s(PUSH, "2026-11-19T08:00"), s(LEGS, "2026-10-21T18:00"), s(PULL, "2026-11-20T08:00", 3)],
      DAY_ORDER,
      today,
    );
    expect(statuses[PUSH]).toMatchObject({ daysAgo: 4, forgotten: false });
    expect(statuses[PULL]).toMatchObject({ daysAgo: null, forgotten: true }); // 3/20 : pas faite
    expect(statuses[LEGS]).toMatchObject({ daysAgo: 33, forgotten: true });
  });

  it("titre « Séance 5/5 — Pull+ »", () => {
    expect(sessionTitle(PROGRAM, DAY_ORDER, PULL_PLUS)).toBe(`Séance 5/5 — ${PROGRAM[PULL_PLUS].muscles}`);
  });
});
