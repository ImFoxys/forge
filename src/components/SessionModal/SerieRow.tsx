import type { RefObject } from "react";
import type { DropEntry, SetEntry } from "../../types";

interface SerieRowProps {
  index: number;
  entry: SetEntry;
  status: "done" | "current" | "pending";
  prevWeight?: string;
  prevReps?: string;
  prevSkipped?: boolean;
  repsPlaceholder?: string;
  dropSet?: boolean;
  onDropsChange?: (drops: DropEntry[]) => void;
  suggestDrop?: (from: number) => number | null;
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
  prevSkipped,
  repsPlaceholder,
  dropSet,
  onDropsChange,
  suggestDrop,
  forceFail,
  inputRef,
  onChange,
  onValidate,
  onModify,
}: SerieRowProps) {
  const hasPrev = prevWeight !== undefined && prevReps !== undefined;
  const drops = entry.drops ?? [];

  // Charge proposée pour le drop i, calculée depuis la charge précédente
  // (série principale, ou drop précédent saisi ou proposé).
  const dropLoads: (number | null)[] = [];
  drops.forEach((_, i) => {
    const typed = parseFloat(i === 0 ? entry.weight : drops[i - 1].weight);
    const base = Number.isFinite(typed) ? typed : i > 0 ? dropLoads[i - 1] : null;
    dropLoads.push(base !== null && suggestDrop ? suggestDrop(base) : null);
  });

  const addDrop = () => {
    // Pré-remplit la charge proposée ; reps à saisir.
    const prevTyped = parseFloat(drops.length === 0 ? entry.weight : drops[drops.length - 1].weight);
    const proposed = Number.isFinite(prevTyped) && suggestDrop ? suggestDrop(prevTyped) : null;
    onDropsChange?.([...drops, { weight: proposed !== null ? String(proposed) : "", reps: "" }]);
  };

  const updateDrop = (i: number, field: keyof DropEntry, value: string) =>
    onDropsChange?.(drops.map((d, di) => (di === i ? { ...d, [field]: value } : d)));

  return (
    <div className={`serie-row serie-row--${status}`}>
      <div className="serie-row__top">
        <span className="serie-row__number">
          Série {index + 1}
          {forceFail && status !== "done" ? " · à l'échec" : ""}
          {dropSet ? " · drop-set" : ""}
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
            placeholder={repsPlaceholder ?? prevReps ?? "0"}
            value={entry.reps}
            disabled={status === "done"}
            onChange={(e) => onChange("reps", e.target.value)}
          />
        </div>
      </div>
      {dropSet && status !== "pending" && (
        <div className="drop-list">
          {drops.map((drop, i) => (
            <div className="drop-row" key={i}>
              <span className="drop-row__label">Drop {i + 1}</span>
              <input
                type="number"
                inputMode="decimal"
                step={0.5}
                aria-label={`Charge du drop ${i + 1} (kg)`}
                placeholder={dropLoads[i] !== null ? `${dropLoads[i]} kg` : "kg"}
                value={drop.weight}
                onChange={(e) => updateDrop(i, "weight", e.target.value)}
              />
              <input
                type="number"
                inputMode="numeric"
                step={1}
                aria-label={`Reps du drop ${i + 1}`}
                placeholder="reps"
                value={drop.reps}
                onChange={(e) => updateDrop(i, "reps", e.target.value)}
              />
              <button
                type="button"
                className="icon-btn drop-row__remove"
                aria-label={`Supprimer le drop ${i + 1}`}
                onClick={() => onDropsChange?.(drops.filter((_, di) => di !== i))}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="link-btn"
            onClick={addDrop}
          >
            + Drop
          </button>
        </div>
      )}
      <div className="serie-row__actions">
        {prevSkipped && status !== "done" && (
          <span className="serie-row__skipped">Non faite la dernière fois</span>
        )}
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
