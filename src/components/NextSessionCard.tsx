import { useState } from "react";
import { DAY_ORDER, PROGRAM } from "../data/program";
import type { Session } from "../types";
import { dayStatuses, getNextSession, sessionTitle } from "../utils/rotation";

interface NextSessionCardProps {
  sessions: Session[];
  activeDay: number;
  onSelect: (dayIdx: number | null) => void; // null = revenir à la séance proposée
}

function formatLastDate(ts: number): string {
  return new Date(ts).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

function sinceLabel(daysAgo: number | null, forgotten: boolean): string {
  if (daysAgo === null) return "⚠️ jamais faite";
  if (forgotten) return `⚠️ pas faite depuis ${daysAgo} jours`;
  if (daysAgo === 0) return "faite aujourd'hui";
  if (daysAgo === 1) return "faite hier";
  return `faite il y a ${daysAgo} jours`;
}

export default function NextSessionCard({ sessions, activeDay, onSelect }: NextSessionCardProps) {
  const [listOpen, setListOpen] = useState(false);
  const [today] = useState(() => Date.now());
  const next = getNextSession(sessions, PROGRAM, DAY_ORDER);
  const statuses = dayStatuses(sessions, DAY_ORDER, today);
  const isManual = activeDay !== next.dayIdx;
  const lastDay = next.last ? PROGRAM[next.last.dayIdx] : null;

  return (
    <div className="next-session">
      <div className="next-session__label">{isManual ? "Séance choisie" : "Prochaine séance"}</div>
      <div className="next-session__title">{PROGRAM[activeDay].full}</div>
      {isManual ? (
        <div className="next-session__meta">
          Séance proposée : {PROGRAM[next.dayIdx].muscles} ·{" "}
          <button type="button" className="link-btn" onClick={() => onSelect(null)}>
            y revenir
          </button>
        </div>
      ) : (
        next.last &&
        lastDay && (
          <div className="next-session__meta">
            Dernière séance : {lastDay.muscles}, {formatLastDate(next.last.date)}
            {next.retry && " — pas terminée, on la refait"}
          </div>
        )
      )}

      <button
        type="button"
        className="link-btn link-btn--muted next-session__toggle"
        onClick={() => setListOpen((o) => !o)}
      >
        {listOpen ? "Fermer la liste" : "Faire une autre séance"}
      </button>

      {listOpen && (
        <div className="session-picker">
          {statuses.map((st) => (
            <button
              type="button"
              key={st.dayIdx}
              className={`session-picker__item${st.dayIdx === activeDay ? " session-picker__item--active" : ""}${st.forgotten ? " session-picker__item--forgotten" : ""}`}
              onClick={() => {
                onSelect(st.dayIdx === next.dayIdx ? null : st.dayIdx);
                setListOpen(false);
              }}
            >
              <span className="session-picker__name">
                {sessionTitle(PROGRAM, DAY_ORDER, st.dayIdx)}
                {st.dayIdx === next.dayIdx && <span className="session-picker__tag">proposée</span>}
              </span>
              <span className="session-picker__since">{sinceLabel(st.daysAgo, st.forgotten)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
