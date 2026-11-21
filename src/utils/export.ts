import { PROGRAM } from "../data/program";
import type { Session } from "../types";

// Séparateur ";" et virgule décimale : format lu directement par Excel / Numbers en français.
const SEP = ";";

function toNumber(value: string): number | null {
  const n = parseFloat(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function formatNumber(n: number | null): string {
  return n === null ? "" : String(n).replace(".", ",");
}

function escapeCell(value: string): string {
  return /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function sessionsToCsv(sessions: Session[]): string {
  const header = [
    "Date",
    "Heure",
    "Jour",
    "Séance",
    "Exercice",
    "Série",
    "Charge (kg)",
    "Répétitions",
    "Volume (kg)",
    "Validée",
  ];

  const rows: string[][] = [];
  const sorted = [...sessions].sort((a, b) => a.date - b.date);

  for (const session of sorted) {
    const d = new Date(session.date);
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const dayLabel = PROGRAM[session.dayIdx]?.label ?? "";

    for (const exercise of session.exercises) {
      exercise.sets.forEach((set, i) => {
        // On ignore les séries jamais remplies ni validées.
        if (!set.done && !set.weight.trim() && !set.reps.trim()) return;
        const weight = toNumber(set.weight);
        const reps = toNumber(set.reps);
        const volume = weight !== null && reps !== null ? weight * reps : null;
        rows.push([
          date,
          time,
          dayLabel,
          session.dayLabel,
          exercise.name,
          String(i + 1),
          formatNumber(weight),
          formatNumber(reps),
          formatNumber(volume),
          set.done ? "oui" : "non",
        ]);
        // Drops du drop-set : une ligne chacun, série notée « 3-drop1 », « 3-drop2 »…
        set.drops?.forEach((drop, di) => {
          const dw = toNumber(drop.weight);
          const dr = toNumber(drop.reps);
          rows.push([
            date,
            time,
            dayLabel,
            session.dayLabel,
            exercise.name,
            `${i + 1}-drop${di + 1}`,
            formatNumber(dw),
            formatNumber(dr),
            formatNumber(dw !== null && dr !== null ? dw * dr : null),
            set.done ? "oui" : "non",
          ]);
        });
      });
    }
  }

  return [header, ...rows].map((r) => r.map(escapeCell).join(SEP)).join("\r\n");
}

export function downloadSeriesCsv(sessions: Session[]) {
  // BOM UTF-8 pour que les accents s'affichent correctement dans Excel.
  const blob = new Blob(["﻿" + sessionsToCsv(sessions)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const today = new Date();
  const stamp = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = `forge-series-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
