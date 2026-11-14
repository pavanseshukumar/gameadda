"use client";

import { useState } from "react";
import { TeamSetup } from "@/components/game/TeamSetup";
import { Segmented } from "@/components/ui/Controls";
import { CLUE_COST, DEFAULT_TURN_SECONDS, LISTEN_TIERS, TURN_SECONDS_OPTIONS } from "@/lib/games/tune-in/engine";

const [first, second] = LISTEN_TIERS;
const RULES = [
  { title: "Listen", body: "Each round plays a 30-second clip of a Telugu film song. Play and pause it as often as you like during your turn." },
  {
    title: "Name the movie",
    body: `Type the movie the song is from. Within the first ${first[0]}s of the clip it’s worth ${first[1]}, by ${second[0]}s it’s ${second[1]}, then less. A clue costs ${CLUE_COST}.`,
  },
  { title: "Steal it", body: "Playing in teams? Out of time, and the next team gets one steal: half the time, half the points." },
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
          <Segmented
            labelledBy="timer-heading"
            value={turnSeconds}
            onChange={setTurnSeconds}
            options={TURN_SECONDS_OPTIONS.map((seconds) => ({ value: seconds, label: `${seconds}s` }))}
            className="w-full sm:w-auto sm:min-w-64"
          />
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
