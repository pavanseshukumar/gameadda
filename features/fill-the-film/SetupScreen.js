"use client";

import { useState } from "react";
import { TeamSetup } from "@/components/game/TeamSetup";
import { Segmented } from "@/components/ui/Controls";
import { FIRST_FINISH_BONUS, LIST_SIZE_OPTIONS, POINTS_PER_HIDDEN, TURN_SECONDS_OPTIONS } from "@/lib/games/fill-the-film/engine";

const RULES = [
  { title: "Your own list", body: "Every team gets its own list of Telugu movies as blanks, played top to bottom. The first letter and one more are already showing." },
  { title: "Guess or ask", body: "Type the movie you’re on, spelled exactly as the tiles show. Right, and you go on to the next. Wrong, a letter, a clue or giving up, and the turn passes." },
  {
    title: "Score",
    body: `A movie is worth ${POINTS_PER_HIDDEN} for every letter still hidden when you solve it. First team to clear its list gets +${FIRST_FINISH_BONUS}.`,
  },
];

/** @param {{ pool: import("@/lib/games/jumble-rumble/moviePool").MoviePool | null, starting: boolean }} props */
export function SetupScreen({ initialTeams, initialSettings, pool, starting, onStart }) {
  const [listSize, setListSize] = useState(initialSettings.listSize);
  const [turnSeconds, setTurnSeconds] = useState(initialSettings.turnSeconds);
  const poolLabel = !pool
    ? "loading movies…"
    : `${pool.movies.length.toLocaleString()} movies${pool.source === "offline" ? " (offline list)" : ""}`;

  return (
    <TeamSetup
      eyebrow={`Movie game · ${poolLabel}`}
      title={
        <>
          Fill the
          <br />
          <span className="text-accent-2">Film</span>
        </>
      }
      intro="Each team gets a list of Telugu movie titles with the letters blanked out. Fill them in, one movie at a time."
      rules={RULES}
      initialTeams={initialTeams}
      startDisabled={starting}
      startLabel={starting ? "Dealing the lists…" : "Deal the lists"}
      onStart={(drafts) => onStart(drafts, { listSize, turnSeconds })}
    >
      <section className="card flex flex-col gap-6 rounded-[1.75rem] p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h2 id="size-heading" className="font-display text-xl font-bold tracking-tight">
              Movies per team
            </h2>
            <p className="text-sm text-muted">Longer lists, longer game.</p>
          </div>
          <Segmented
            labelledBy="size-heading"
            value={listSize}
            onChange={setListSize}
            options={LIST_SIZE_OPTIONS.map((n) => ({ value: n, label: String(n) }))}
            className="w-full sm:w-auto sm:min-w-64"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-line px-1 pt-5">
          <div>
            <h2 id="timer-heading" className="font-display text-xl font-bold tracking-tight">
              Turn timer
            </h2>
            <p className="text-sm text-muted">Restarts after every right answer. Time up passes the turn.</p>
          </div>
          <Segmented
            labelledBy="timer-heading"
            value={turnSeconds}
            onChange={setTurnSeconds}
            options={TURN_SECONDS_OPTIONS.map((s) => ({ value: s, label: s ? `${s}s` : "Off" }))}
            className="w-full sm:w-auto sm:min-w-64"
          />
        </div>
      </section>
    </TeamSetup>
  );
}
