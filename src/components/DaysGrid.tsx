import { DAY_ORDER, PROGRAM } from "../data/program";

interface DaysGridProps {
  activeDay: number;
  onSelect: (dayIdx: number) => void;
}

export default function DaysGrid({ activeDay, onSelect }: DaysGridProps) {
  return (
    <div className="days-grid">
      {DAY_ORDER.map((dayIdx) => {
        const day = PROGRAM[dayIdx];
        return (
          <button
            type="button"
            key={dayIdx}
            className={`day-card${dayIdx === activeDay ? " day-card--active" : ""}`}
            onClick={() => onSelect(dayIdx)}
          >
            <div className="day-card__label">{day.label}</div>
            <div className="day-card__muscles">{day.muscles}</div>
          </button>
        );
      })}
    </div>
  );
}
