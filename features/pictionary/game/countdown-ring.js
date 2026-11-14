import { cn, formatClock } from "@/lib/games/pictionary/utils";

/**
 * Big circular countdown, sized to be read from across a room. Under a
 * minute it shows bare seconds ("42"), which reads faster than "0:42".
 */
export function CountdownRing({ remainingMs, durationMs, paused }) {
  const fraction = durationMs ? remainingMs / durationMs : 0;
  const seconds = Math.ceil(remainingMs / 1000);
  const urgent = seconds <= 10 && seconds > 0;
  const done = remainingMs <= 0;
  const r = 88;
  const circumference = 2 * Math.PI * r;
  const label = seconds >= 60 ? formatClock(remainingMs) : String(seconds);

  return (
    <div
      className={cn(
        "relative mx-auto aspect-square w-[min(86vw,54dvh,30rem)]",
        urgent && !paused && "animate-timer-urgent",
      )}
      role="timer"
      aria-live={urgent ? "assertive" : "off"}
      aria-label={done ? "Time’s up" : `${seconds} seconds left`}
    >
      <svg viewBox="0 0 200 200" className="size-full -rotate-90">
        <circle cx="100" cy="100" r={r + 9} fill="#fffdf8" stroke="#1b2140" strokeWidth="3.5" />
        <circle cx="100" cy="100" r={r} fill="none" stroke="#f3e9d6" strokeWidth="13" />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={urgent || done ? "#f0603d" : "var(--team)"}
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          className="transition-[stroke-dashoffset,stroke] duration-300 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {done ? (
          <span className="text-center font-display text-[clamp(3rem,14vw,4.5rem)] leading-[0.9] font-extrabold tracking-tight text-coral-deep animate-pop-in">
            Time’s
            <br />
            up!
          </span>
        ) : (
          <>
            <span
              key={urgent ? seconds : "steady"}
              className={cn(
                "font-display leading-none font-extrabold tracking-tighter tabular-nums",
                seconds >= 60 ? "text-[clamp(4.5rem,22vw,8rem)]" : "text-[clamp(6.5rem,34vw,12rem)]",
                urgent && "text-coral-deep animate-pop-in",
              )}
            >
              {label}
            </span>
            <span className="mt-1 text-sm font-bold tracking-[0.2em] text-ink-muted uppercase">
              {paused ? "Paused" : urgent ? "Hurry!" : "Draw!"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
