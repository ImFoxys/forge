import type { RirType } from "../types";

interface RirBadgeProps {
  rir: string;
  rirType: RirType;
  forceFail?: boolean;
}

export default function RirBadge({ rir, rirType, forceFail }: RirBadgeProps) {
  const type = forceFail ? "fail" : rirType;
  const label = forceFail ? "À l'échec" : type === "fail" ? "À l'échec" : rir;
  return <span className={`badge-rir badge-rir--${type}`}>{label}</span>;
}
