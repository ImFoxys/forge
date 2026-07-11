import type { Settings } from "../types";

interface SettingsPanelProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onClearHistory: () => void;
}

export default function SettingsPanel({
  settings,
  onChange,
  onClearHistory,
}: SettingsPanelProps) {
  const handleClear = () => {
    if (window.confirm("Effacer tout l'historique des séances ? Cette action est irréversible.")) {
      onClearHistory();
    }
  };

  return (
    <div className="settings-panel">
      <div className="settings-field">
        <div className="settings-field__label">
          <span>Repos composés / polyarticulaires</span>
          <span className="value">{settings.rest}s</span>
        </div>
        <input
          type="range"
          min={30}
          max={300}
          step={15}
          value={settings.rest}
          onChange={(e) =>
            onChange({ ...settings, rest: Number(e.target.value) })
          }
        />
      </div>
      <div className="settings-field">
        <div className="settings-field__label">
          <span>Repos isolations</span>
          <span className="value">{settings.restIso}s</span>
        </div>
        <input
          type="range"
          min={30}
          max={180}
          step={15}
          value={settings.restIso}
          onChange={(e) =>
            onChange({ ...settings, restIso: Number(e.target.value) })
          }
        />
      </div>
      <button type="button" className="btn btn--danger" onClick={handleClear}>
        Effacer l'historique
      </button>
    </div>
  );
}
