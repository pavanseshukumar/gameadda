"use client";

import { useState } from "react";
import { TeamSetup } from "@/components/game/TeamSetup";
import { Segmented } from "@/components/ui/Controls";
import {
  CLUE_COST,
  DEFAULT_TURN_SECONDS,
  END_POINTS,
  MOVIE_COUNT,
  START_POINTS,
  TURN_SECONDS_OPTIONS,
} from "@/lib/games/emoji-talkies/engine";

const RULES = [
  { title: "Read the row", body: "A Telugu movie is spelled out in emojis: what the title means, or the scene everyone remembers. ☂️👑 is Chatrapathi." },
  {
    title: "Be quick",
    body: `Type as many guesses as you like. Naming it is worth ${START_POINTS} at the start, sliding to ${END_POINTS} as the clock runs. The clue (year and star) costs ${CLUE_COST}.`,
  },
  { title: "Steal it", body: "Playing in teams? Out of time, and the next team gets one steal: half the time, half the points." },
];

export function SetupScreen({ initialTeams, initialSeconds, onStart }) {
  const [turnSeconds, setTurnSeconds] = useState(initialSeconds ?? DEFAULT_TURN_SECONDS);

  return (
    <TeamSetup
      eyebrow={`Emoji game · ${MOVIE_COUNT} movies`}
      title={
        <>
          Emoji
          <br />
          <span className="text-accent-2">Talkies</span> <span aria-hidden="true">🎬</span>
        </>
      }
      intro="A Telugu movie, told in emojis. Crack the title before the clock (and your points) run down."
      rules={RULES}
      initialTeams={initialTeams}
      onStart={(drafts) => onStart(drafts, { turnSeconds })}
    >
      <section className="card flex flex-col gap-5 rounded-[1.75rem] p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h2 id="timer-heading" className="font-display text-xl font-bold tracking-tight">
              Turn timer
            </h2>
            <p className="text-sm text-muted">Points slide down across the whole turn.</p>
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
