import type { ExerciseType } from "../types";

const LABELS: Record<ExerciseType, string> = {
  comp: "Composé",
  poly: "Polyarticulaire",
  iso: "Isolation",
};

export default function ExerciseTag({ type }: { type: ExerciseType }) {
  return <span className={`tag tag--${type}`}>{LABELS[type]}</span>;
}
