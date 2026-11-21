import { useState } from "react";
import { formatKg, type Target } from "../../utils/progression";

interface TargetBannerProps {
  target: Target;
  onSetStep: (value: number | null) => void;
}

const ARROW = { up: "↑", keep: "=", down: "↓", first: "" } as const;

export default function TargetBanner({ target, onSetStep }: TargetBannerProps) {
  const [showWhy, setShowWhy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const stepLabel =
    target.step.value !== null ? `${formatKg(target.step.value)} kg` : "auto (historique)";
  const stepManual = target.step.source === "manual";

  const openEditor = () => {
    setDraft(target.step.value !== null ? String(target.step.value) : "");
    setEditing(true);
  };

  const save = () => {
    const n = parseFloat(draft.replace(",", "."));
    onSetStep(Number.isFinite(n) && n > 0 ? n : null);
    setEditing(false);
  };

  return (
    <div className={`target-banner target-banner--${target.decision}`}>
      {target.decision === "first" ? (
        <div className="target-banner__why">{target.why}</div>
      ) : (
        <>
          <div className="target-banner__main">
            <span className="target-banner__load">
              Aujourd'hui : <b className="mono">{formatKg(target.weight ?? 0)} kg</b>{" "}
              {ARROW[target.decision]}
              {target.assisted && <span className="target-banner__assist">assistance</span>}
            </span>
            <span className="target-banner__goal">
              Objectif : <b className="mono">{target.objective}</b>
            </span>
          </div>
          {target.pauseDays !== null && (
            <div className="target-banner__pause">Reprise après {target.pauseDays} jours</div>
          )}
          <div className="target-banner__last">
            Dernière fois : <span className="mono">{target.lastSummary}</span> → {target.reason}
          </div>
          {showWhy && <div className="target-banner__why">{target.why}</div>}
        </>
      )}

      <div className="target-banner__footer">
        {target.decision !== "first" && (
          <button type="button" className="link-btn" onClick={() => setShowWhy((v) => !v)}>
            {showWhy ? "Masquer" : "Pourquoi ?"}
          </button>
        )}
        {editing ? (
          <span className="target-banner__step-edit">
            Cran
            <input
              type="number"
              inputMode="decimal"
              step={0.1}
              min={0}
              placeholder="auto"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
            kg
            <button type="button" className="link-btn" onClick={save}>
              OK
            </button>
            {stepManual && (
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  onSetStep(null);
                  setEditing(false);
                }}
              >
                Auto
              </button>
            )}
          </span>
        ) : (
          <button type="button" className="link-btn link-btn--muted" onClick={openEditor}>
            Cran : {stepLabel}
            {stepManual ? " (manuel)" : ""}
          </button>
        )}
      </div>
    </div>
  );
}
