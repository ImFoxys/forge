import { useState } from "react";
import DayView from "../components/DayView";
import NextSessionCard from "../components/NextSessionCard";
import { DAY_ORDER, PROGRAM } from "../data/program";
import type { Memos, Session } from "../types";
import { getNextSession } from "../utils/rotation";

interface ProgramProps {
  sessions: Session[];
  memos: Memos;
  onLaunch: (dayIdx: number) => void;
}

export default function Program({ sessions, memos, onLaunch }: ProgramProps) {
  // null = séance proposée par la rotation ; sinon choix manuel.
  const [chosenDay, setChosenDay] = useState<number | null>(null);
  const activeDay = chosenDay ?? getNextSession(sessions, PROGRAM, DAY_ORDER).dayIdx;

  return (
    <>
      <NextSessionCard sessions={sessions} activeDay={activeDay} onSelect={setChosenDay} />
      <DayView
        dayIdx={activeDay}
        sessions={sessions}
        memos={memos}
        onLaunch={() => {
          setChosenDay(null);
          onLaunch(activeDay);
        }}
      />
    </>
  );
}
