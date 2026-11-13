"use client";

import { useState } from "react";
import { TeamSetup } from "@/components/game/TeamSetup";
import { DEFAULT_TURN_SECONDS, GUESS_COST, HINT_COST, POT_START, TURN_SECONDS_OPTIONS } from "@/lib/games/hot-and-cold/engine";

const RULES = [
  {
    title: "Take a reading",
    body: "There’s a secret Telugu movie (2000 onwards). Guess any Telugu movie and see how hot it is: shared director, cast, music, year and genre all warm it up.",
  },
  { title: "Follow the heat", body: "Every guess stays on the board with what it shares. Teams take turns, one guess each, building on each other’s readings." },
  {
    title: "Grab the pot",
    body: `Name the secret to win the pot: ${POT_START}, minus ${GUESS_COST} per guess and ${HINT_COST} per hint along the way.`,
  },
];

/**
 * @param {{ pool: import("@/lib/games/hot-and-cold/pool").HotColdPool | null, starting: boolean, error: string | null }} props
 */
export function SetupScreen({ initialTeams, initialSeconds, pool, starting, error, onStart }) {
  const [turnSeconds, setTurnSeconds] = useState(initialSeconds ?? DEFAULT_TURN_SECONDS);
  const poolLabel = !pool
    ? "loading movies…"
    : pool.source === "unavailable"
      ? "movies unavailable"
      : `${pool.movies.length.toLocaleString()} movies`;

  return (
    <TeamSetup
      eyebrow={`Deduction game · ${poolLabel}`}
      title={
        <>
          Hot <span className="text-accent-2">&amp;</span>
          <br />
          Cold
        </>
      }
      intro="Find the secret Telugu movie by feel. Every guess gets a temperature. Follow the heat."
      rules={RULES}
      initialTeams={initialTeams}
      startDisabled={starting || !pool}
      startLabel={starting ? "Picking a secret…" : !pool ? "Loading movies…" : undefined}
      onStart={(drafts) => onStart(drafts, { turnSeconds })}
    >
      <section className="card rounded-[1.75rem] p-4 sm:p-6" aria-labelledby="timer-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h2 id="timer-heading" className="font-display text-xl font-bold tracking-tight">
              Turn timer
            </h2>
            <p className="text-sm text-muted">Seconds each team gets to make its guess.</p>
          </div>
          <div role="radiogroup" aria-labelledby="timer-heading" className="flex gap-1 rounded-full border border-line bg-surface p-1">
            {TURN_SECONDS_OPTIONS.map((seconds) => {
              const selected = seconds === turnSeconds;
              return (
                <button
                  key={seconds}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setTurnSeconds(seconds)}
                  className={`btn h-10 min-w-14 px-3 text-sm tabular-nums ${selected ? "btn-primary" : "btn-ghost"}`}
                >
                  {seconds}s
                </button>
              );
            })}
          </div>
        </div>
        {error ? (
          <p role="alert" className="mt-4 rounded-2xl border border-miss/40 bg-miss/10 px-4 py-3 text-sm">
            {error}
          </p>
        ) : null}
      </section>
    </TeamSetup>
  );
}
