"use client";

import { useState } from "react";
import { TeamSetup } from "@/components/game/TeamSetup";
import { CLUE_COST, DEFAULT_TURN_SECONDS, LISTEN_TIERS, TURN_SECONDS_OPTIONS } from "@/lib/games/tune-in/engine";

const [first, second] = LISTEN_TIERS;
const RULES = [
  { title: "Listen", body: "Each round plays a 30-second clip of a Telugu film song. Play and pause it as often as you like during your turn." },
  {
    title: "Name the movie",
    body: `Type the movie the song is from. Within the first ${first[0]}s of the clip it’s worth ${first[1]}, by ${second[0]}s it’s ${second[1]}, then less. A clue costs ${CLUE_COST}.`,
  },
  { title: "Steal it", body: "Out of time? The next team gets one steal: half the time, half the points." },
];

/**
 * @param {{ starting: boolean, error: string | null }} props
 */
export function SetupScreen({ initialTeams, initialSeconds, songCount, starting, error, onStart }) {
  const [turnSeconds, setTurnSeconds] = useState(initialSeconds ?? DEFAULT_TURN_SECONDS);

  return (
    <TeamSetup
      eyebrow={`Music game · ${songCount} songs`}
      title={
        <>
          Tune
          <br />
          <span className="text-accent-2">In</span>
        </>
      }
      intro="Hear a few seconds of a Telugu song and name the movie. The less you need, the more you score."
      rules={RULES}
      initialTeams={initialTeams}
      startDisabled={starting}
      startLabel={starting ? "Finding a song…" : undefined}
      onStart={(drafts) => onStart(drafts, { turnSeconds })}
    >
      <section className="card flex flex-col gap-5 rounded-[1.75rem] p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h2 id="timer-heading" className="font-display text-xl font-bold tracking-tight">
              Turn timer
            </h2>
            <p className="text-sm text-muted">Turn the volume up first.</p>
          </div>
          <div role="radiogroup" aria-labelledby="timer-heading" className="flex flex-wrap gap-1 rounded-full border border-line bg-surface p-1">
            {TURN_SECONDS_OPTIONS.map((option) => {
              const selected = option === turnSeconds;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setTurnSeconds(option)}
                  className={`btn h-10 min-w-14 px-3 text-sm tabular-nums ${selected ? "btn-primary" : "btn-ghost"}`}
                >
                  {option}s
                </button>
              );
            })}
          </div>
        </div>
        {error ? (
          <p role="alert" className="rounded-2xl border border-miss/40 bg-miss/10 px-4 py-3 text-sm">
            {error}
          </p>
        ) : null}
      </section>
    </TeamSetup>
  );
}
