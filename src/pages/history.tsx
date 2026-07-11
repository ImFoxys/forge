import ProgressChart from "../components/ProgressChart";
import SessionCard from "../components/SessionCard";
import type { Session } from "../types";

interface HistoryProps {
  sessions: Session[];
}

export default function History({ sessions }: HistoryProps) {
  const sorted = [...sessions].sort((a, b) => b.date - a.date);

  return (
    <>
      <div className="section-title">Séances</div>
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
