import ProgressChart from "../components/ProgressChart";
import SessionCard from "../components/SessionCard";
import type { Session } from "../types";
import { downloadSeriesCsv } from "../utils/export";

interface HistoryProps {
  sessions: Session[];
}

export default function History({ sessions }: HistoryProps) {
  const sorted = [...sessions].sort((a, b) => b.date - a.date);

  return (
    <>
      <div className="section-header">
        <div className="section-title">Séances</div>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => downloadSeriesCsv(sessions)}
          disabled={sessions.length === 0}
        >
          Exporter (CSV)
        </button>
      </div>
      {sorted.length === 0 ? (
        <div className="empty-state">Aucune séance enregistrée pour le moment.</div>
      ) : (
        <div className="session-list">
          {sorted.map((session) => (
            <SessionCard key={session.date} session={session} />
          ))}
        </div>
      )}
      <ProgressChart sessions={sessions} />
    </>
  );
}
