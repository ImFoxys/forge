import type { RefObject } from "react";
import type { SetEntry } from "../../types";

interface SerieRowProps {
  index: number;
  entry: SetEntry;
  status: "done" | "current" | "pending";
  prevWeight?: string;
  prevReps?: string;
  forceFail?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  onChange: (field: "weight" | "reps", value: string) => void;
  onValidate: () => void;
  onModify: () => void;
}

export default function SerieRow({
  index,
  entry,
  status,
  prevWeight,
  prevReps,
  forceFail,
  inputRef,
  onChange,
  onValidate,
  onModify,
}: SerieRowProps) {
  const hasPrev = prevWeight !== undefined && prevReps !== undefined;

  return (
    <div className={`serie-row serie-row--${status}`}>
      <div className="serie-row__top">
        <span className="serie-row__number">
          Série {index + 1}
          {forceFail && status !== "done" ? " · à l'échec" : ""}
        </span>
        <span className="serie-row__prev mono">
          {hasPrev ? `Préc. : ${prevWeight}kg × ${prevReps}` : "Première fois"}
        </span>
      </div>
      <div className="serie-row__inputs">
        <div className="serie-row__field">
          <label htmlFor={`weight-${index}`}>Poids (kg)</label>
          <input
            ref={inputRef}
            id={`weight-${index}`}
            type="number"
            inputMode="decimal"
            step={0.5}
            placeholder={prevWeight ?? "0"}
            value={entry.weight}
            disabled={status === "done"}
            onChange={(e) => onChange("weight", e.target.value)}
          />
        </div>
        <div className="serie-row__field">
          <label htmlFor={`reps-${index}`}>Reps</label>
          <input
            id={`reps-${index}`}
            type="number"
            inputMode="numeric"
            step={1}
            placeholder={prevReps ?? "0"}
            value={entry.reps}
            disabled={status === "done"}
            onChange={(e) => onChange("reps", e.target.value)}
          />
        </div>
      </div>
      <div className="serie-row__actions">
        {status === "done" ? (
          <button type="button" className="btn btn--sm btn--ghost" onClick={onModify}>
            Modifier
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--sm btn--primary"
            disabled={status === "pending"}
            onClick={onValidate}
          >
            Valider
          </button>
        )}
      </div>
    </div>
  );
}
