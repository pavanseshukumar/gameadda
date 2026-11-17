"use client";

import { useState } from "react";
import { TeamSetup } from "@/components/game/TeamSetup";
import { Segmented } from "@/components/ui/Controls";
import { PERFECT_BONUS, SIZE_OPTIONS, SLOT_POINTS, SPREAD_OPTIONS, TURN_SECONDS_OPTIONS } from "@/lib/games/release-ladder/engine";

const rulesFor = (solo) => [
  { title: "Mixed-up movies", body: "You get a handful of Telugu movies, with their stars, in a random order." },
  { title: "Climb the ladder", body: "Drag them into release order, oldest at the top. Lock it in before the clock runs out." },
  {
    title: "Score every rung",
    body: solo
      ? `${SLOT_POINTS} for each movie in the right spot, +${PERFECT_BONUS} for a perfect ladder.`
      : `${SLOT_POINTS} for each movie in the right spot, +${PERFECT_BONUS} for a perfect ladder. Teams take turns.`,
  },
];

const SPREAD_LABELS = { easy: "Easy", medium: "Medium", hard: "Hard" };

/** @param {{ pool: import("@/lib/games/jumble-rumble/moviePool").MoviePool | null }} props */
export function SetupScreen({ initialTeams, initialSettings, pool, onStart }) {
  const [settings, setSettings] = useState(initialSettings);
  const set = (key, value) => setSettings((s) => ({ ...s, [key]: value }));
  const poolLabel = !pool ? "loading movies…" : `${pool.movies.length.toLocaleString()} movies${pool.source === "offline" ? " (offline list)" : ""}`;

  return (
    <TeamSetup
      eyebrow={`Movie timeline · ${poolLabel}`}
      title={
        <>
          Release
          <br />
          <span className="text-accent-2">Ladder</span>
        </>
      }
      intro="Which came first? Put Telugu movies in the order they hit theatres."
      rules={rulesFor}
      initialTeams={initialTeams}
      onStart={(drafts) => onStart(drafts, settings)}
    >
      <section className="card flex flex-col gap-6 rounded-[1.75rem] p-4 sm:p-6">
        <div>
          <h2 id="size-heading" className="px-1 font-display text-xl tracking-tight">
            Movies per ladder
          </h2>
          <p className="mb-3 px-1 text-sm text-muted">More movies, more places to slip.</p>
          <Segmented labelledBy="size-heading" value={settings.size} onChange={(value) => set("size", value)} options={SIZE_OPTIONS.map((n) => ({ value: n, label: String(n) }))} />
        </div>

        <div>
          <h2 id="spread-heading" className="px-1 font-display text-xl tracking-tight">
            Difficulty
          </h2>
          <p className="mb-3 px-1 text-sm text-muted">How close the release years can be.</p>
          <Segmented
            labelledBy="spread-heading"
            value={settings.spread}
            onChange={(value) => set("spread", value)}
            options={Object.entries(SPREAD_OPTIONS).map(([id, gap]) => ({ value: id, label: SPREAD_LABELS[id], hint: gap === 1 ? "any gap" : `${gap}+ yrs apart` }))}
          />
        </div>

        <div>
          <h2 id="timer-heading" className="px-1 font-display text-xl tracking-tight">
            Turn timer
          </h2>
          <p className="mb-3 px-1 text-sm text-muted">When it runs out, your ladder locks in as it is.</p>
          <Segmented
            labelledBy="timer-heading"
            value={settings.turnSeconds}
            onChange={(value) => set("turnSeconds", value)}
            options={TURN_SECONDS_OPTIONS.map((s) => ({ value: s, label: s ? `${s}s` : "Off" }))}
          />
        </div>
      </section>
    </TeamSetup>
  );
}
