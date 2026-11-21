import { describe, expect, it } from "vitest";
import type { Session } from "../types";
import {
  computeTarget,
  historyFromSessions,
  parseRepRange,
  suggestDropLoad,
  type HistorySet,
  type TargetExercise,
} from "./progression";

const TODAY = new Date("2026-11-23T12:00:00");

type RawSet = [weight: number | string, reps: number | string, done?: boolean];

/** Une séance : date ISO locale + liste [charge, reps, validée?]. */
function session(date: string, sets: RawSet[]): HistorySet[] {
  const ts = new Date(date).getTime();
  return sets.map(([weight, reps, done = true], setIndex) => ({
    date: ts,
    setIndex,
    weight: String(weight),
    reps: String(reps),
    done,
  }));
}

function ex(name: string, sets: number, reps: string, extra: Partial<TargetExercise> = {}): TargetExercise {
  return { name, type: "poly", sets, reps, ...extra };
}

describe("parseRepRange", () => {
  it.each([
    ["6–8", 6, 8],
    ["6-8", 6, 8],
    ["6 – 8", 6, 8],
    ["12", 12, 12],
  ])("%s", (reps, repMin, repMax) => {
    expect(parseRepRange(reps)).toEqual({ repMin, repMax });
  });
});

describe("computeTarget — cas réels", () => {
  it("1. Lat pulldown : 39×8 ×4 au plafond → ↑ 41 kg", () => {
    const history = [
      ...session("2026-09-15T18:00", [[41, 6], [45, 5]]),
      ...session("2026-11-10T18:00", [[39, 8], [39, 8], [39, 8], [39, 8]]),
    ];
    const t = computeTarget(ex("Lat pulldown prise large", 4, "6–8"), history, TODAY);
    expect(t.decision).toBe("up");
    expect(t.weight).toBe(41);
    expect(t.objective).toBe("4 × 6–8");
  });

  it("2. Shoulder press : 13×10, 10×10, 10×10 → L = 10 → ↑ 12,5 kg", () => {
    const history = [
      ...session("2026-10-20T18:00", [[12.5, 8], [12.5, 8], [10, 10]]),
      ...session("2026-11-19T18:00", [[13, 10], [10, 10], [10, 10]]),
    ];
    const t = computeTarget(ex("Shoulder press machine", 3, "8–10"), history, TODAY);
    expect(t.decision).toBe("up");
    expect(t.weight).toBe(12.5);
  });

  it("3. Pec deck : 45×15, 45×11, 39×15 → seulement 2 séries ≥ 45 → = 45 kg", () => {
    const history = session("2026-11-19T18:00", [[45, 15], [45, 11], [39, 15]]);
    const t = computeTarget(ex("Pec deck / machine papillon", 3, "12–15", { type: "iso" }), history, TODAY);
    expect(t.decision).toBe("keep");
    expect(t.weight).toBe(45);
  });

  it("4. Chest press convergent : 20×8, 20×8, 20×6, 20×6 → = 20 kg, +1 rep sur les séries 3 et 4", () => {
    const history = session("2026-11-19T18:00", [[20, 8], [20, 8], [20, 6], [20, 6]]);
    const t = computeTarget(ex("Chest press convergent", 4, "6–8", { type: "comp" }), history, TODAY);
    expect(t.decision).toBe("keep");
    expect(t.weight).toBe(20);
    expect(t.repTargets).toEqual([8, 8, 7, 7]);
  });

  it("5. Chest press incliné : L = 20 → ↑ 25 kg (échelle apprise), 22,5 kg avec un cran manuel de 2,5", () => {
    // 22,5 kg n'existe que sur un autre exercice : il n'est pas dans cet historique.
    const history = session("2026-11-19T18:00", [[25, 8], [20, 8], [20, 8], [20, 8]]);
    const exercise = ex("Chest press incliné convergent", 4, "6–8", { type: "comp" });

    const learned = computeTarget(exercise, history, TODAY);
    expect(learned.decision).toBe("up");
    expect(learned.weight).toBe(25);

    const manual = computeTarget(exercise, history, TODAY, { manualStep: 2.5 });
    expect(manual.weight).toBe(22.5);
    expect(manual.step.source).toBe("manual");
  });

  it("6. Hack squat : égalité → L = 147,6 ; = 147,6 ; pause 40 j → 127,6 kg", () => {
    const history = session("2026-10-14T18:00", [[87.6, 8], [107.6, 8], [127.6, 8], [147.6, 6]]);
    for (const exercise of [
      ex("Hack squat machine", 4, "6–8"), // échelle apprise
      ex("Hack squat machine", 4, "6–8", { step: 10 }), // step du programme
    ]) {
      const t = computeTarget(exercise, history, TODAY);
      expect(t.decision).toBe("keep");
      expect(t.weight).toBe(127.6);
      expect(t.pauseDays).toBe(40);
      expect(t.why).toContain("Reprise après 40 jours");
    }
  });

  it("7. Leg curl couché : 29,3×12 ×3 → ↑ 32, pause 33 j → 28,8 → cran inférieur 27 kg", () => {
    const history = [
      ...session("2026-09-30T18:00", [[32, 9], [29.3, 11], [29.3, 10]]),
      ...session("2026-10-21T18:00", [[29.3, 12], [29.3, 12], [29.3, 12]]),
    ];
    const t = computeTarget(ex("Leg curl couché", 3, "10–12", { type: "iso" }), history, TODAY);
    expect(t.decision).toBe("up");
    expect(t.weight).toBe(27);
    expect(t.pauseDays).toBe(33);
  });

  it("8. Triceps dips assistée : 36×15 ×2 → assistance 33,5 kg", () => {
    const history = [
      ...session("2026-09-01T18:00", [[54, 12], [47.3, 12]]),
      ...session("2026-09-15T18:00", [[45, 12], [43.3, 13]]),
      ...session("2026-10-01T18:00", [[41, 14], [41, 15]]),
      ...session("2026-11-02T08:43", [[36, 15], [36, 15]]),
    ];
    const t = computeTarget(ex("Machine triceps dips assistée", 2, "12–15", { type: "iso" }), history, TODAY);
    expect(t.assisted).toBe(true);
    expect(t.decision).toBe("up");
    expect(t.weight).toBe(33.5);
    expect(t.pauseDays).toBeNull(); // 21 jours pile : pas de reprise
  });

  it("9. Deux séances à 40 kg sous la fourchette → ↓ 35 kg (36 arrondi au cran inférieur)", () => {
    const history = [
      ...session("2026-11-12T18:00", [[40, 8], [40, 7], [40, 6]]),
      ...session("2026-11-19T18:00", [[40, 8], [40, 6], [40, 6]]),
    ];
    const t = computeTarget(ex("Exercice synthétique", 3, "8–10"), history, TODAY);
    expect(t.decision).toBe("down");
    expect(t.weight).toBe(35);
    expect(t.objective).toBe("3 × 10");
  });

  it("10. Sans historique → « Première fois », rien de pré-rempli", () => {
    const t = computeTarget(ex("Nouvel exercice", 3, "8–10"), [], TODAY);
    expect(t.decision).toBe("first");
    expect(t.weight).toBeNull();
    expect(t.why).toBe("Première fois : choisis une charge où tu fais environ 8 répétitions.");
  });

  it("11. Séries vides ou non validées ignorées", () => {
    const history = [
      ...session("2026-11-11T18:00", [[12, 10], [12, 10], [12, 10]]),
      // Séance plus récente sans aucune série exploitable.
      ...session("2026-11-20T18:00", [[15, 8, false], ["", "", true], [12, "", true]]),
    ];
    const t = computeTarget(ex("Exercice synthétique", 3, "8–10"), history, TODAY);
    // La séance du 11/11 reste la dernière, et 15 kg (non validée) n'entre pas dans l'échelle.
    expect(t.decision).toBe("up");
    expect(t.weight).toBe(14.5);
  });
});

describe("computeTarget — méthode 3/7", () => {
  const curl = ex("Curl poulie basse — méthode 3/7", 10, "3-4-5-6-7", { type: "iso", method: "3/7" });
  const pattern = [3, 4, 5, 6, 7, 3, 4, 5, 6, 7];

  it("3/7 réussi : 9 kg, 3-4-5-6-7-3-4-5-6-7 → ↑ cran suivant", () => {
    const history = session("2026-11-20T18:00", pattern.map((r) => [9, r] as RawSet));
    const t = computeTarget(curl, history, TODAY);
    expect(t.decision).toBe("up");
    expect(t.weight).toBe(11.5); // aucun cran connu au-dessus de 9 → +2,5 kg par défaut
    expect(t.objective).toBe("2 × 3-4-5-6-7");
    expect(t.repTargets).toEqual(pattern);
  });

  it("3/7 réussi avec un cran connu dans l'historique → ce cran", () => {
    const history = [
      ...session("2026-11-06T18:00", pattern.map((r) => [10, r - 1] as RawSet)),
      ...session("2026-11-20T18:00", pattern.map((r) => [9, r] as RawSet)),
    ];
    expect(computeTarget(curl, history, TODAY).weight).toBe(10);
  });

  it("3/7 incomplet : 9 kg, 3-4-5-6-7-3-4-5-5-5 → = 9 kg", () => {
    const reps = [3, 4, 5, 6, 7, 3, 4, 5, 5, 5];
    const history = session("2026-11-20T18:00", reps.map((r) => [9, r] as RawSet));
    const t = computeTarget(curl, history, TODAY);
    expect(t.decision).toBe("keep");
    expect(t.weight).toBe(9);
    expect(t.repTargets).toEqual(pattern);
  });

  it("3/7 jamais en baisse, même après 2 séances ratées", () => {
    const reps = [3, 4, 5, 6, 7, 3, 4, 2, 2, 2];
    const history = [
      ...session("2026-11-13T18:00", reps.map((r) => [9, r] as RawSet)),
      ...session("2026-11-20T18:00", reps.map((r) => [9, r] as RawSet)),
    ];
    const t = computeTarget(curl, history, TODAY);
    expect(t.decision).toBe("keep");
    expect(t.weight).toBe(9);
  });

  it("3/7 sans historique → « Première fois »", () => {
    const t = computeTarget(curl, [], TODAY);
    expect(t.decision).toBe("first");
    expect(t.weight).toBeNull();
    expect(t.why).toBe("Première fois : commence à environ 70 % de ta charge habituelle sur 12 reps.");
  });
});

describe("drop-set", () => {
  const pushdown = ex("Pushdown câble barre droite", 3, "10–12", { type: "iso", dropSet: true });

  it("drop ignoré : 20,3×12 ×3 + drops 15,8×8, 11,3×6 → ↑ (séries principales seules)", () => {
    const sessions: Session[] = [
      {
        date: new Date("2026-11-16T18:00").getTime(),
        dayIdx: 0,
        dayLabel: "Push",
        duration: 3600,
        exercises: [
          {
            id: "lun6",
            name: "Pushdown câble barre droite",
            sets: [
              { weight: "20.3", reps: "12", done: true },
              { weight: "20.3", reps: "12", done: true },
              {
                weight: "20.3",
                reps: "12",
                done: true,
                drops: [
                  { weight: "15.8", reps: "8" },
                  { weight: "11.3", reps: "6" },
                ],
              },
            ],
          },
        ],
      },
    ];
    const history = historyFromSessions(sessions, "lun6");
    expect(history).toHaveLength(3);
    const t = computeTarget(pushdown, history, TODAY);
    expect(t.decision).toBe("up");
    // 15,8 et 11,3 (drops) ne sont pas dans l'échelle : +2,5 kg par défaut.
    expect(t.weight).toBe(22.8);
    expect(t.lastSummary).toBe("20,3 kg × 12-12-12");
  });

  it("charge proposée : −20 % arrondi au cran inférieur de l'échelle apprise", () => {
    const history = [
      ...session("2026-10-01T18:00", [[11.3, 12], [13.5, 12], [15.8, 12]]),
      ...session("2026-10-15T18:00", [[18, 12], [20.3, 12], [20.3, 11]]),
    ];
    expect(suggestDropLoad(pushdown, history, 20.3)).toBe(15.8); // 16,24 → 15,8
    expect(suggestDropLoad(pushdown, history, 15.8)).toBe(11.3); // 12,64 → 11,3
  });

  it("charge proposée : cran manuel > défaut, toujours plus léger", () => {
    expect(suggestDropLoad(pushdown, [], 20, { manualStep: 2.5 })).toBe(15); // 16 → 15
    expect(suggestDropLoad(pushdown, [], 20)).toBe(15); // défaut 2,5
    expect(suggestDropLoad(pushdown, [], 2)).toBeNull(); // rien de plus léger
  });
});
