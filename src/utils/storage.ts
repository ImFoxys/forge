import { useEffect, useState } from "react";
import type { Session, SessionDraft, Settings } from "../types";

const SESSIONS_KEY = "forge_sessions";
const SETTINGS_KEY = "forge_settings";
const DRAFT_KEY = "forge_draft";

const DEFAULT_SETTINGS: Settings = { rest: 120, restIso: 75 };

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>(() =>
    readJSON<Session[]>(SESSIONS_KEY, []),
  );

  useEffect(() => {
    writeJSON(SESSIONS_KEY, sessions);
  }, [sessions]);

  const addSession = (session: Session) => {
    setSessions((prev) => [...prev, session]);
  };

  const clearSessions = () => {
    setSessions([]);
  };

  return { sessions, addSession, clearSessions };
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() =>
    readJSON<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS),
  );

  useEffect(() => {
    writeJSON(SETTINGS_KEY, settings);
  }, [settings]);

  return { settings, setSettings };
}

export function readDraft(): SessionDraft | null {
  return readJSON<SessionDraft | null>(DRAFT_KEY, null);
}

export function writeDraft(draft: SessionDraft) {
  writeJSON(DRAFT_KEY, draft);
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}
