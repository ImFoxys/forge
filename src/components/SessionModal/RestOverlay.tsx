import { formatDuration } from "../../utils/calculations";

interface RestOverlayProps {
  remaining: number;
  total: number;
  nextLabel: string;
  onSkip: () => void;
  onAdjust: (deltaSeconds: number) => void;
}

const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RestOverlay({
  remaining,
  total,
  nextLabel,
  onSkip,
  onAdjust,
}: RestOverlayProps) {
  const progress = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="rest-overlay">
      <div className="rest-overlay__label">Temps de repos</div>
      <div className="rest-overlay__circle">
        <svg viewBox="0 0 200 200">
          <circle className="rest-overlay__circle-bg" cx="100" cy="100" r={RADIUS} />
          <circle
            className="rest-overlay__circle-fg"
            cx="100"
            cy="100"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="rest-overlay__time mono">{formatDuration(Math.max(0, remaining))}</div>
      </div>
      <div className="rest-overlay__next">{nextLabel}</div>
      <div className="rest-overlay__adjust">
        <button type="button" className="btn btn--sm" onClick={() => onAdjust(-15)}>
          −15s
        </button>
        <button type="button" className="btn btn--sm" onClick={() => onAdjust(30)}>
          +30s
        </button>
      </div>
      <button type="button" className="btn btn--primary" onClick={onSkip}>
        Passer le repos
      </button>
    </div>
  );
}
