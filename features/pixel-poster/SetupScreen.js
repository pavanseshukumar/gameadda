"use client";

import { useState } from "react";
import { TeamSetup } from "@/components/game/TeamSetup";
import { Segmented } from "@/components/ui/Controls";
import {
  CLUE_COST,
  DEFAULT_TURN_SECONDS,
  STAGE_POINTS,
  TURN_SECONDS_OPTIONS,
} from "@/lib/games/pixel-poster/engine";

const RULES = [
  { title: "Squint", body: "A Telugu movie poster (2000 onwards) is cut into shuffled, blurred tiles. Halfway through your turn it clears up a lot." },
  {
    title: "Guess early",
    body: `Type as many guesses as you like. Naming it is worth ${STAGE_POINTS[0]} at first, dropping to ${STAGE_POINTS.at(-1)} when it’s clearest. A clue costs ${CLUE_COST}.`,
  },
  { title: "Steal it", body: "Playing in teams? Out of time, and the next team gets one steal on the clearest poster: half the time, half the points." },
];

/**
 * @param {{
 *   pool: import("@/lib/games/pixel-poster/pool").PosterPool | null,
 *   starting: boolean,
 *   error: string | null,
 * }} props
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
      eyebrow={`Picture game · ${poolLabel}`}
      title={
        <>
          Poster
          <br />
          <span className="text-accent-2">Puzzle</span>
        </>
      }
      intro="Name the Telugu movie from a poster you can barely make out. The longer you stare, the less it’s worth."
      rules={RULES}
      initialTeams={initialTeams}
      startDisabled={starting}
      startLabel={starting ? "Finding a poster…" : undefined}
      onStart={(drafts) => onStart(drafts, { turnSeconds })}
    >
      <section className="card flex flex-col gap-5 rounded-[1.75rem] p-4 sm:p-6">
        <Choice
          id="timer"
          title="Turn timer"
          description="The poster clears up halfway through."
          options={TURN_SECONDS_OPTIONS}
          value={turnSeconds}
          onChange={setTurnSeconds}
          label={(seconds) => `${seconds}s`}
        />
        {error ? (
          <p role="alert" className="rounded-2xl border border-miss/40 bg-miss/10 px-4 py-3 text-sm">
            {error}
          </p>
        ) : null}
      </section>
    </TeamSetup>
  );
}

function Choice({ id, title, description, options, value, onChange, label }) {
  const headingId = `${id}-heading`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
      <div>
        <h2 id={headingId} className="font-display text-xl font-bold tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <Segmented
        labelledBy={headingId}
        value={value}
        onChange={onChange}
        options={options.map((option) => ({ value: option, label: label(option) }))}
        className="w-full sm:w-auto sm:min-w-64"
      />
    </div>
  );
}
