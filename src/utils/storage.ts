import { useEffect, useState } from "react";
import type { Memos, Session, SessionDraft, Settings, WeightEntry } from "../types";

const SESSIONS_KEY = "forge_sessions";
const SETTINGS_KEY = "forge_settings";
const DRAFT_KEY = "forge_draft";
const WEIGHT_KEY = "forge_weight";
const MEMOS_KEY = "forge_memos";

const DEFAULT_SETTINGS: Settings = { legs: 210, rest: 120, restIso: 75, height: 167 };

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
  const [settings, setSettings] = useState<Settings>(() => ({
    ...DEFAULT_SETTINGS,
    ...readJSON<Partial<Settings>>(SETTINGS_KEY, {}),
  }));

  useEffect(() => {
    writeJSON(SETTINGS_KEY, settings);
  }, [settings]);

  return { settings, setSettings };
}

export function useWeightEntries() {
  const [entries, setEntries] = useState<WeightEntry[]>(() =>
    readJSON<WeightEntry[]>(WEIGHT_KEY, []),
  );

  useEffect(() => {
    writeJSON(WEIGHT_KEY, entries);
  }, [entries]);

  const addWeightEntry = (entry: WeightEntry) => {
    setEntries((prev) => [...prev.filter((e) => e.date !== entry.date), entry]);
  };

  const removeWeightEntry = (date: number) => {
    setEntries((prev) => prev.filter((e) => e.date !== date));
  };

  return { entries, addWeightEntry, removeWeightEntry };
}

export function useMemos() {
  const [memos, setMemos] = useState<Memos>(() => readJSON<Memos>(MEMOS_KEY, {}));

  useEffect(() => {
    writeJSON(MEMOS_KEY, memos);
  }, [memos]);

  const setMemo = (exerciseId: string, text: string) => {
    setMemos((prev) => {
      const next = { ...prev };
      if (text.trim()) next[exerciseId] = text.trim();
      else delete next[exerciseId];
      return next;
    });
  };

  return { memos, setMemo };
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
