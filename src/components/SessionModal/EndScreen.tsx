import { formatDuration } from "../../utils/calculations";

interface EndScreenProps {
  duration: number;
  validatedSets: number;
  volume: number;
  onSave: () => void;
}

export default function EndScreen({
  duration,
  validatedSets,
  volume,
  onSave,
}: EndScreenProps) {
  return (
    <div className="end-screen">
      <h1>Séance terminée</h1>
      <div className="end-screen__stats">
        <div className="stat-tile">
          <div className="stat-tile__value mono">{formatDuration(duration)}</div>
          <div className="stat-tile__label">Durée</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__value">{validatedSets}</div>
          <div className="stat-tile__label">Séries validées</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__value">{Math.round(volume)}</div>
          <div className="stat-tile__label">Volume (kg)</div>
        </div>
      </div>
      <button type="button" className="btn btn--primary" onClick={onSave}>
        Sauvegarder la séance
      </button>
    </div>
  );
}
