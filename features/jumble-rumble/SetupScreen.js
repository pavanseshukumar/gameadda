"use client";

import { useState } from "react";
import { TeamSetup } from "@/components/game/TeamSetup";
import { Segmented } from "@/components/ui/Controls";
import {
  BASE_POINTS,
  DEFAULT_TURN_SECONDS,
  HINT_COST,
  TURN_SECONDS_OPTIONS,
} from "@/lib/games/jumble-rumble/engine";

const RULES = [
  { title: "Unscramble", body: "A Telugu movie title is jumbled into letter tiles. Tap them into the slots in order." },
  { title: "Beat the clock", body: `Solve it for ${BASE_POINTS} points plus 1 per second left. Hints cost ${HINT_COST} each.` },
  { title: "Steal it", body: "Playing in teams? Wrong or out of time, and the next team gets one steal: half the time, half the points." },
];

/** @param {{ pool: import("@/lib/games/jumble-rumble/moviePool").MoviePool | null }} props */
export function SetupScreen({ initialTeams, initialSeconds, pool, onStart }) {
  const [turnSeconds, setTurnSeconds] = useState(initialSeconds ?? DEFAULT_TURN_SECONDS);
  const poolLabel = !pool
    ? "loading movies…"
    : `${pool.movies.length.toLocaleString()} movies${pool.source === "offline" ? " (offline list)" : ""}`;

  return (
    <TeamSetup
      eyebrow={`Word game · ${poolLabel}`}
      title={
        <>
          Jumble
          <br />
          <span className="text-accent-2">Rumble</span>
        </>
      }
      intro="Scrambled Telugu movie titles, a ticking clock and bragging rights on the line."
      rules={RULES}
      initialTeams={initialTeams}
      onStart={(drafts) => onStart(drafts, { turnSeconds })}
    >
      <section className="card rounded-[1.75rem] p-4 sm:p-6" aria-labelledby="timer-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h2 id="timer-heading" className="font-display text-xl font-bold tracking-tight">
              Turn timer
            </h2>
            <p className="text-sm text-muted">Seconds each team gets per try.</p>
          </div>
          <Segmented
            labelledBy="timer-heading"
            value={turnSeconds}
            onChange={setTurnSeconds}
            options={TURN_SECONDS_OPTIONS.map((seconds) => ({ value: seconds, label: `${seconds}s` }))}
            className="w-full sm:w-auto sm:min-w-64"
          />
        </div>
      </section>
    </TeamSetup>
  );
}
