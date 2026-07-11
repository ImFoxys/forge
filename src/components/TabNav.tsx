export type Tab = "programme" | "historique";

interface TabNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export default function TabNav({ active, onChange }: TabNavProps) {
  return (
    <nav className="tab-nav">
      <button
        type="button"
        className={`tab-nav__btn${active === "programme" ? " tab-nav__btn--active" : ""}`}
        onClick={() => onChange("programme")}
      >
        Programme
      </button>
      <button
        type="button"
        className={`tab-nav__btn${active === "historique" ? " tab-nav__btn--active" : ""}`}
        onClick={() => onChange("historique")}
      >
        Historique
      </button>
    </nav>
  );
}
