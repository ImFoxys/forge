import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DAY_ORDER, PROGRAM } from "../data/program";
import type { Session } from "../types";
import { formatDate } from "../utils/calculations";

interface ProgressChartProps {
  sessions: Session[];
}

interface ExerciseOption {
  id: string;
  name: string;
}

export default function ProgressChart({ sessions }: ProgressChartProps) {
  const exerciseOptions = useMemo<ExerciseOption[]>(() => {
    const seen = new Map<string, string>();
    for (const dayIdx of DAY_ORDER) {
      for (const exercise of PROGRAM[dayIdx].exercises) {
        seen.set(exercise.id, exercise.name);
      }
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, []);

  const [selected, setSelected] = useState(exerciseOptions[0]?.id ?? "");

  const data = useMemo(() => {
    return sessions
      .filter((s) => s.exercises.some((e) => e.id === selected))
      .sort((a, b) => a.date - b.date)
      .map((session) => {
        const exercise = session.exercises.find((e) => e.id === selected)!;
        const maxWeight = exercise.sets.reduce((max, set) => {
          if (!set.done) return max;
          const weight = parseFloat(set.weight);
          return Number.isNaN(weight) ? max : Math.max(max, weight);
        }, 0);
        return {
          date: session.date,
          label: formatDate(session.date),
          weight: maxWeight,
        };
      });
  }, [sessions, selected]);

  if (exerciseOptions.length === 0) return null;

  return (
    <div className="progress-chart">
      <div className="progress-chart__title">Progression</div>
      <select value={selected} onChange={(e) => setSelected(e.target.value)}>
        {exerciseOptions.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis
              dataKey="label"
              stroke="#5a5855"
              tick={{ fontSize: 11, fill: "#9e9b95" }}
            />
            <YAxis stroke="#5a5855" tick={{ fontSize: 11, fill: "#9e9b95" }} />
            <Tooltip
              contentStyle={{
                background: "#242424",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#f0ede6" }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#c8a96e"
              strokeWidth={2}
              dot={{ r: 3, fill: "#c8a96e" }}
              name="Poids max (kg)"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="empty-state">Aucune donnée pour cet exercice</div>
      )}
    </div>
  );
}
