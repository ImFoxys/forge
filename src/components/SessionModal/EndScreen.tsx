import { formatDuration } from "../../utils/calculations";

interface EndScreenProps {
  duration: number;
  validatedSets: number;
  volume: number;
  onSave: () => void;
  // Alerte anti-doublon : message à confirmer avant d'enregistrer.
  duplicateWarning: string | null;
  onCancelDuplicate: () => void;
  onConfirmDuplicate: () => void;
}

export default function EndScreen({
  duration,
  validatedSets,
  volume,
  onSave,
  duplicateWarning,
  onCancelDuplicate,
  onConfirmDuplicate,
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
      {duplicateWarning ? (
        <div className="duplicate-warning" role="alertdialog" aria-live="assertive">
          <p>{duplicateWarning}</p>
          <div className="duplicate-warning__actions">
            <button type="button" className="btn" onClick={onCancelDuplicate}>
              Annuler
            </button>
            <button type="button" className="btn btn--primary" onClick={onConfirmDuplicate}>
              Enregistrer
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn--primary" onClick={onSave}>
          Sauvegarder la séance
        </button>
      )}
    </div>
  );
}
