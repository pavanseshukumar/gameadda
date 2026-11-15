"use client";

import { useState } from "react";
import { TeamSetup } from "@/components/game/TeamSetup";
import { MultiSelect, Segmented } from "@/components/ui/Controls";
import { BASE_POINTS, DIFFICULTY_OPTIONS, HINT_COST, TURN_SECONDS_OPTIONS } from "@/lib/games/frozen-brains/engine";
import { CATEGORIES, PUZZLES } from "@/lib/games/frozen-brains/puzzles";

const RULES = [
  { title: "Say it fast", body: "The card shows words that make no sense, like FRY DRY ICE. Say them out loud, faster and faster, until you hear it: Fried Rice!" },
  { title: "Type it in", body: `Guess as often as you like before time runs out. Get it for ${BASE_POINTS} plus 1 per second left. A hint costs ${HINT_COST}.` },
  { title: "Steal it", body: "Pass or run out of time, and the next team gets one steal: half the time, half the points." },
];

const DIFFICULTY_LABELS = { mixed: "Mixed", easy: "Easy", medium: "Medium", hard: "Hard" };

export function SetupScreen({ initialTeams, initialSettings, onStart }) {
  const [settings, setSettings] = useState(initialSettings);
  const set = (key, value) => setSettings((s) => ({ ...s, [key]: value }));
  const noCategory = settings.categories.length === 0;

  return (
    <TeamSetup
      eyebrow={`Sound-alike puzzles · ${PUZZLES.length} cards`}
      title={
        <>
          Frozen
          <br />
          <span className="text-accent-2">Brains</span>
        </>
      }
      intro="Read the nonsense out loud, fast, until your brain unfreezes and the real words pop out."
      rules={RULES}
      initialTeams={initialTeams}
      startDisabled={noCategory}
      onStart={(drafts) => !noCategory && onStart(drafts, settings)}
    >
      <section className="card flex flex-col gap-6 rounded-[1.75rem] p-4 sm:p-6">
        <div>
          <h2 className="px-1 font-display text-xl font-bold tracking-tight">Categories</h2>
          <p className="mb-3 px-1 text-sm text-muted">The category shows on every card.</p>
          <MultiSelect
            label="Categories"
            values={settings.categories}
            onChange={(values) => set("categories", values)}
            options={CATEGORIES.map((c) => ({ value: c.id, label: c.label, color: c.color }))}
            className="grid-cols-2 sm:grid-cols-4"
          />
          {noCategory ? (
            <p role="alert" className="mt-2 px-1 text-sm font-semibold text-miss">
              Pick at least one category.
            </p>
          ) : null}
        </div>

        <div>
          <h2 id="difficulty-heading" className="px-1 font-display text-xl font-bold tracking-tight">
            Difficulty
          </h2>
          <p className="mb-3 px-1 text-sm text-muted">Hard cards have longer answers and trickier sounds.</p>
          <Segmented
            labelledBy="difficulty-heading"
            value={settings.difficulty}
            onChange={(value) => set("difficulty", value)}
            options={DIFFICULTY_OPTIONS.map((id) => ({ value: id, label: DIFFICULTY_LABELS[id] }))}
          />
        </div>

        <div>
          <h2 id="timer-heading" className="px-1 font-display text-xl font-bold tracking-tight">
            Turn timer
          </h2>
          <p className="mb-3 px-1 text-sm text-muted">Starts as soon as the card appears. A steal gets half.</p>
          <Segmented
            labelledBy="timer-heading"
            value={settings.turnSeconds}
            onChange={(value) => set("turnSeconds", value)}
            options={TURN_SECONDS_OPTIONS.map((s) => ({ value: s, label: `${s}s` }))}
          />
        </div>
      </section>
    </TeamSetup>
  );
}
