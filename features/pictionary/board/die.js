import { cn } from "@/lib/games/pictionary/utils";
import { PALETTE } from "@/lib/games/pictionary/data/palette";

const PIPS = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]],
};

/** A die face. Purely presentational — rolling lives in DiceRoller. */
export function Die({ value, size = 96, className, color = PALETTE.paper, pip = PALETTE.ink }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn("drop-shadow-[0_5px_0_var(--color-ink)]", className)}
      role="img"
      aria-label={`Die showing ${value}`}
    >
      <rect x="4" y="4" width="92" height="92" rx="22" fill={color} stroke={PALETTE.ink} strokeWidth="4" />
      {(PIPS[value] ?? PIPS[1]).map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="8.5" fill={pip} />
      ))}
    </svg>
  );
}
