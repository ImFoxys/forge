import { PROGRAM } from "../data/program";
import type { Session } from "../types";
import { formatDate, formatDuration, sessionVolume } from "../utils/calculations";

export default function SessionCard({ session }: { session: Session }) {
  const day = PROGRAM[session.dayIdx];
  return (
    <div className="session-card">
      <div className="session-card__top">
        <div className="session-card__day">
          {day ? `${day.label} — ${session.dayLabel}` : session.dayLabel}
        </div>
        <div className="session-card__date">{formatDate(session.date)}</div>
      </div>
      <div className="session-card__stats mono">
        <span>
          Durée : <b>{formatDuration(session.duration)}</b>
        </span>
        <span>
          Volume : <b>{Math.round(sessionVolume(session))} kg</b>
        </span>
      </div>
    </div>
  );
}
