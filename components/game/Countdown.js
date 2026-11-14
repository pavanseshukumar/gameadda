/**
 * Circular countdown. Turns red and pulses in the last `urgentAt` seconds.
 *
 * `format="clock"` shows m:ss instead of seconds (for minute-long timers).
 *
 * @param {{ remainingMs: number, totalMs: number, color?: string, urgentAt?: number, paused?: boolean, format?: "seconds" | "clock" }} props
 */
export function Countdown({ remainingMs, totalMs, color = "var(--team)", urgentAt = 10, paused = false, format = "seconds" }) {
  const seconds = Math.ceil(remainingMs / 1000);
  const progress = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0;
  const urgent = !paused && seconds <= urgentAt && seconds > 0;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const stroke = urgent ? "var(--miss)" : color;
  const clock = format === "clock";
  const text = clock ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : seconds;

  return (
    <div
      className="countdown relative grid size-16 shrink-0 place-items-center rounded-full sm:size-20"
      data-urgent={urgent}
      role="timer"
      aria-label={`${seconds} seconds left${paused ? ", paused" : ""}`}
      style={{ "--team": stroke }}
    >
      <svg viewBox="0 0 60 60" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
        <circle cx="30" cy="30" r={radius} fill="none" stroke="var(--surface-strong)" strokeWidth="5" />
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          style={{ transition: "stroke-dashoffset 200ms linear, stroke 300ms ease" }}
        />
      </svg>
      <span
        className={`font-display font-extrabold tabular-nums ${clock ? "text-base sm:text-lg" : "text-xl sm:text-2xl"} ${urgent ? "text-miss" : ""}`}
        aria-hidden="true"
      >
        {paused ? "❚❚" : text}
      </span>
    </div>
  );
}
