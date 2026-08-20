import { useState } from "react";
import type { WeightEntry } from "../types";
import { computeBMI, formatDate } from "../utils/calculations";

interface WeightProps {
  entries: WeightEntry[];
  height: number;
  onAdd: (entry: WeightEntry) => void;
  onRemove: (date: number) => void;
}

function todayInputValue(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export default function Weight({ entries, height, onAdd, onRemove }: WeightProps) {
  const [date, setDate] = useState(todayInputValue);
  const [weight, setWeight] = useState("");

  const chronological = [...entries].sort((a, b) => a.date - b.date);
  const sorted = [...chronological].reverse();

  const handleAdd = () => {
    const w = parseFloat(weight.replace(",", "."));
    if (Number.isNaN(w) || w <= 0 || !date) return;
    const timestamp = new Date(`${date}T12:00:00`).getTime();
    onAdd({ date: timestamp, weight: w });
    setWeight("");
  };

  const percentChange = (entry: WeightEntry): number | null => {
    const idx = chronological.findIndex((e) => e.date === entry.date);
    if (idx <= 0) return null;
    const prev = chronological[idx - 1];
    if (prev.weight === 0) return null;
    return ((entry.weight - prev.weight) / prev.weight) * 100;
  };

  return (
    <>
      <div className="section-title">Suivi du poids</div>
      <div className="weight-form">
        <div className="weight-form__field">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="weight-form__field">
          <label>Poids (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="0.0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <button type="button" className="btn btn--primary" onClick={handleAdd}>
          Ajouter
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">Aucune pesée enregistrée pour le moment.</div>
      ) : (
        <div className="weight-table-wrap">
          <table className="weight-table mono">
            <thead>
              <tr>
                <th>Date</th>
                <th>Poids</th>
                <th>IMC</th>
                <th>%</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => {
                const change = percentChange(entry);
                const changeClass =
                  change === null
                    ? ""
                    : change > 0
                      ? " weight-table__change--up"
                      : change < 0
                        ? " weight-table__change--down"
                        : " weight-table__change--flat";
                return (
                  <tr key={entry.date}>
                    <td>{formatDate(entry.date)}</td>
                    <td>{entry.weight.toFixed(1)} kg</td>
                    <td>{computeBMI(entry.weight, height).toFixed(1)}</td>
                    <td className={`weight-table__change${changeClass}`}>
                      {change === null ? "—" : `${change > 0 ? "+" : ""}${change.toFixed(1)}%`}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="weight-table__delete"
                        aria-label="Supprimer"
                        onClick={() => onRemove(entry.date)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
