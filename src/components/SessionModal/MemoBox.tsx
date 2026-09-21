import { useEffect, useRef, useState } from "react";

interface MemoBoxProps {
  memo: string;
  onChange: (text: string) => void;
}

export default function MemoBox({ memo, onChange }: MemoBoxProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  // Le repos peut se terminer (et démonter ce composant) pendant la saisie :
  // on enregistre alors le brouillon plutôt que de le perdre.
  const pending = useRef<string | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
    pending.current = editing ? draft : null;
  });
  useEffect(
    () => () => {
      if (pending.current !== null) onChangeRef.current(pending.current);
    },
    [],
  );

  const startEditing = () => {
    setDraft(memo);
    setEditing(true);
  };

  const save = () => {
    onChange(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="memo-box">
        <textarea
          className="memo-box__input"
          value={draft}
          rows={2}
          autoFocus
          placeholder="Ex. : rajouter du poids, faire si en forme…"
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="memo-box__actions">
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => setEditing(false)}>
            Annuler
          </button>
          <button type="button" className="btn btn--sm btn--primary" onClick={save}>
            Enregistrer
          </button>
        </div>
      </div>
    );
  }

  if (!memo) {
    return (
      <button type="button" className="btn btn--sm btn--ghost memo-add" onClick={startEditing}>
        📌 Ajouter un mémo pour la prochaine séance
      </button>
    );
  }

  return (
    <div className="memo-box">
      <div className="memo-box__label">📌 Mémo</div>
      <div className="memo-box__text">{memo}</div>
      <div className="memo-box__actions">
        <button type="button" className="btn btn--sm btn--ghost" onClick={startEditing}>
          Modifier
        </button>
        <button type="button" className="btn btn--sm btn--ghost" onClick={() => onChange("")}>
          ✓ Fait
        </button>
      </div>
    </div>
  );
}
