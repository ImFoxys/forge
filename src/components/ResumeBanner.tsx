import { DAY_ORDER, PROGRAM } from "../data/program";
import { sessionTitle } from "../utils/rotation";
import type { SessionDraft } from "../types";
import { formatDuration } from "../utils/calculations";

interface ResumeBannerProps {
  draft: SessionDraft;
  onResume: () => void;
  onDiscard: () => void;
}

export default function ResumeBanner({ draft, onResume, onDiscard }: ResumeBannerProps) {

  const handleDiscard = () => {
    if (window.confirm("Abandonner cette séance en cours ? Les données saisies seront perdues.")) {
      onDiscard();
    }
  };

  return (
    <div className="resume-banner">
      <div className="resume-banner__text">
        <div className="resume-banner__title">Séance en cours</div>
        <div className="resume-banner__meta">
          {sessionTitle(PROGRAM, DAY_ORDER, draft.dayIdx)} · {formatDuration(draft.elapsed)} écoulées
        </div>
      </div>
      <div className="resume-banner__actions">
        <button type="button" className="btn btn--sm btn--ghost" onClick={handleDiscard}>
          Abandonner
        </button>
        <button type="button" className="btn btn--sm btn--primary" onClick={onResume}>
          Reprendre
        </button>
      </div>
    </div>
  );
}
