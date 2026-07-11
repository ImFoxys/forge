interface HeaderProps {
  settingsOpen: boolean;
  onToggleSettings: () => void;
}

export default function Header({ settingsOpen, onToggleSettings }: HeaderProps) {
  return (
    <header className="header">
      <div className="header__logo">
        FORGE

        <span className="header__logo__version">v2</span>
      </div>
      <div className="header__actions">
        <button
          type="button"
          className={`icon-btn${settingsOpen ? " icon-btn--active" : ""}`}
          onClick={onToggleSettings}
          aria-label="Paramètres"
        >
          ⚙
        </button>
      </div>
    </header>
  );
}
