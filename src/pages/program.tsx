import { useState } from "react";
import DaysGrid from "../components/DaysGrid";
import DayView from "../components/DayView";
import type { Session } from "../types";

interface ProgramProps {
  sessions: Session[];
  onLaunch: (dayIdx: number) => void;
}

export default function Program({ sessions, onLaunch }: ProgramProps) {
  const [activeDay, setActiveDay] = useState(0);

  return (
    <>
      <DaysGrid activeDay={activeDay} onSelect={setActiveDay} />
      <DayView
        dayIdx={activeDay}
        sessions={sessions}
        onLaunch={() => onLaunch(activeDay)}
      />
    </>
  );
}
