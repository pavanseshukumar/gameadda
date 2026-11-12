const COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#06b6d4", "#22c55e", "#f97316"];

// Deterministic pseudo-random so server and client markup match.
function seeded(i, salt) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function Confetti({ count = 46 }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${seeded(i, 1) * 100}%`,
            background: COLORS[i % COLORS.length],
            "--drift": `${(seeded(i, 2) - 0.5) * 30}vw`,
            "--spin": `${(seeded(i, 3) - 0.5) * 1440}deg`,
            "--dur": `${2.6 + seeded(i, 4) * 2.4}s`,
            "--delay": `${seeded(i, 5) * 0.9}s`,
            borderRadius: i % 3 === 0 ? "999px" : "2px",
          }}
        />
      ))}
    </div>
  );
}
