import { useState } from "react";
import Header from "./components/Header";
import ResumeBanner from "./components/ResumeBanner";
import SessionModal from "./components/SessionModal";
import SettingsPanel from "./components/SettingsPanel";
import TabNav from "./components/TabNav";
import type { Tab } from "./components/TabNav";
import History from "./pages/history";
import Program from "./pages/program";
import "./styles/theme.css";
import type { SessionDraft } from "./types";
import { clearDraft, readDraft, useSessions, useSettings } from "./utils/storage";

function App() {
  const [tab, setTab] = useState<Tab>("programme");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modalDayIdx, setModalDayIdx] = useState<number | null>(null);
  const [modalDraft, setModalDraft] = useState<SessionDraft | null>(null);
  const [draft, setDraft] = useState<SessionDraft | null>(() => readDraft());

  const { sessions, addSession, clearSessions } = useSessions();
  const { settings, setSettings } = useSettings();

  const launchDay = (dayIdx: number) => {
    if (draft) {
      const ok = window.confirm(
        "Une séance est déjà en cours. La démarrer maintenant abandonnera cette séance en cours. Continuer ?",
      );
      if (!ok) return;
      clearDraft();
      setDraft(null);
    }
    setModalDraft(null);
    setModalDayIdx(dayIdx);
  };

  const resumeDraft = () => {
    if (!draft) return;
    setModalDraft(draft);
    setModalDayIdx(draft.dayIdx);
  };

  const discardDraft = () => {
    clearDraft();
    setDraft(null);
  };

  const closeModal = () => {
    setModalDayIdx(null);
    setModalDraft(null);
    setDraft(readDraft());
  };

  return (
    <div className="app">
      <Header
        settingsOpen={settingsOpen}
        onToggleSettings={() => setSettingsOpen((o) => !o)}
      />

      {draft && modalDayIdx === null && (
        <ResumeBanner draft={draft} onResume={resumeDraft} onDiscard={discardDraft} />
      )}

      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          onClearHistory={clearSessions}
        />
      )}

      <TabNav active={tab} onChange={setTab} />

      {tab === "programme" && (
        <Program sessions={sessions} onLaunch={launchDay} />
      )}
      {tab === "historique" && <History sessions={sessions} />}

      {modalDayIdx !== null && (
        <SessionModal
          dayIdx={modalDayIdx}
          draft={modalDraft}
          sessions={sessions}
          settings={settings}
          onClose={closeModal}
          onSave={(session) => {
            addSession(session);
            setModalDayIdx(null);
            setModalDraft(null);
            setDraft(null);
            setTab("historique");
          }}
        />
      )}
    </div>
  );
}

export default App;
