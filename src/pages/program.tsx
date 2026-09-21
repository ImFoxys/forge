import { useState } from "react";
import DaysGrid from "../components/DaysGrid";
import DayView from "../components/DayView";
import type { Memos, Session } from "../types";

interface ProgramProps {
  sessions: Session[];
  memos: Memos;
  onLaunch: (dayIdx: number) => void;
}

export default function Program({ sessions, memos, onLaunch }: ProgramProps) {
  const [activeDay, setActiveDay] = useState(0);

  return (
    <>
      <DaysGrid activeDay={activeDay} onSelect={setActiveDay} />
      <DayView
        dayIdx={activeDay}
        sessions={sessions}
        memos={memos}
        onLaunch={() => onLaunch(activeDay)}
      />
    </>
  );
}
