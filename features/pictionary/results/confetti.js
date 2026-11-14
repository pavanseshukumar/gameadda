import { TEAM_COLORS } from "@/lib/games/pictionary/data/team-colors";

// Deterministic pseudo-random so server and client render the same pieces.
function seeded(i, salt) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const PIECES = Array.from({ length: 56 }, (_, i) => ({
  left: seeded(i, 1) * 100,
  delay: seeded(i, 2) * 1.8,
  duration: 2.6 + seeded(i, 3) * 2.2,
  drift: (seeded(i, 4) - 0.5) * 160,
  spin: 360 + seeded(i, 5) * 720,
  w: 7 + seeded(i, 6) * 7,
  round: seeded(i, 7) > 0.6,
}));

/** One-shot CSS confetti burst in the winner's colour plus party accents. */
export function Confetti({ color }) {
  const colors = [color, TEAM_COLORS.sun.hex, TEAM_COLORS.ocean.hex, TEAM_COLORS.rose.hex, TEAM_COLORS.mint.hex];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden motion-reduce:hidden">
      {PIECES.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: p.w,
            height: p.round ? p.w : p.w * 1.8,
            borderRadius: p.round ? "999px" : "2px",
            background: colors[i % colors.length],
            "--drift": `${p.drift}px`,
            "--spin": `${p.spin}deg`,
            animation: `pic-confetti-fall ${p.duration}s cubic-bezier(.25,.6,.45,1) ${p.delay}s both`,
          }}
        />
      ))}
    </div>
  );
}
