"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

const SIZE = 48;
const STROKE = 4;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const WARN_SECONDS = 5;

/**
 * Circular countdown for the current turn. Re-key it (e.g. on the latest event) to
 * restart from full. While `paused`, the remaining time is held, not reset.
 *
 * @param {{ seconds: number, paused?: boolean, onExpire: () => void }} props
 */
export function TurnTimer({ seconds, paused = false, onExpire }) {
  const total = seconds * 1000;
  const [left, setLeft] = useState(total);
  const leftRef = useRef(total);
  const expire = useEffectEvent(onExpire);

  useEffect(() => {
    if (paused || leftRef.current <= 0) return;
    const startedAt = performance.now();
    const startLeft = leftRef.current;
    const id = setInterval(() => {
      const next = Math.max(0, startLeft - (performance.now() - startedAt));
      leftRef.current = next;
      setLeft(next);
      if (next === 0) {
        clearInterval(id);
        expire();
      }
    }, 100);
    return () => clearInterval(id);
  }, [paused]);

  const secondsLeft = Math.ceil(left / 1000);
  const urgent = secondsLeft <= WARN_SECONDS;
  const color = urgent ? "var(--miss)" : "var(--team, var(--accent))";

  return (
    <div
      className={`relative grid shrink-0 place-items-center ${urgent && !paused && left > 0 ? "anim-pulse rounded-full" : ""}`}
      style={{ width: SIZE, height: SIZE }}
      role="timer"
      aria-label={`${secondsLeft} seconds left${paused ? ", paused" : ""}`}
    >
      <svg width={SIZE} height={SIZE} className="-rotate-90" aria-hidden="true">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--surface-strong)" strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - left / total)}
          style={{ transition: "stroke-dashoffset 100ms linear, stroke 200ms" }}
        />
      </svg>
      <span
        className="absolute font-display text-base font-bold tabular-nums"
        style={{ color: urgent ? "var(--miss)" : undefined }}
        aria-hidden="true"
      >
        {secondsLeft}
      </span>
    </div>
  );
}
