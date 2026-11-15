"use client";

import { useState } from "react";
import { TeamSetup } from "@/components/game/TeamSetup";
import { MultiSelect, Segmented } from "@/components/ui/Controls";
import {
  DIFFICULTY_OPTIONS,
  HIDDEN_LETTER_POINTS,
  LETTER_POINTS,
  MAX_MISSES,
  SOLVE_BONUS,
  TURN_SECONDS_OPTIONS,
} from "@/lib/games/hangman/engine";
import { HANGMAN_CATEGORIES, HANGMAN_DIFFICULTIES, HANGMAN_WORDS } from "@/lib/games/hangman/words";

const RULES = [
  { title: "Your own word", body: `Each team gets its own hidden word, one team after another. Every letter you find puts ${LETTER_POINTS} per copy at stake.` },
  { title: "Dodge misses", body: `A wrong letter, a wrong guess or running out of time draws another part. ${MAX_MISSES} misses and you’re hanged: the points at stake are lost.` },
  { title: "Solve it", body: `Finish the word to bank your points plus ${SOLVE_BONUS}. Type it early for +${HIDDEN_LETTER_POINTS} per letter still hidden.` },
];

const DIFFICULTY_LABELS = { mixed: "Mixed", ...Object.fromEntries(HANGMAN_DIFFICULTIES.map((d) => [d.id, d.label])) };

export function SetupScreen({ initialTeams, initialSettings, onStart }) {
  const [settings, setSettings] = useState(initialSettings);
  const set = (key, value) => setSettings((s) => ({ ...s, [key]: value }));
  const noCategory = settings.categories.length === 0;

  return (
    <TeamSetup
      eyebrow={`Word game · ${HANGMAN_WORDS.length} words`}
      title={
        <>
          Hang<span className="text-accent-2">man</span>
        </>
      }
      intro="The classic chalkboard word game. Call letters, dodge misses, and solve it before the stick figure is finished."
      rules={RULES}
      initialTeams={initialTeams}
      startDisabled={noCategory}
      onStart={(drafts) => !noCategory && onStart(drafts, settings)}
    >
      <section className="card flex flex-col gap-6 rounded-[1.75rem] p-4 sm:p-6">
        <div>
          <h2 className="px-1 font-display text-xl font-bold tracking-tight">Word categories</h2>
          <p className="mb-3 px-1 text-sm text-muted">The category is shown as the clue.</p>
          <MultiSelect
            label="Word categories"
            values={settings.categories}
            onChange={(values) => set("categories", values)}
            options={HANGMAN_CATEGORIES.map((c) => ({ value: c.id, label: c.label, color: c.color }))}
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
          <p className="mb-3 px-1 text-sm text-muted">Hard words are longer and rarer, with famous names and phrases.</p>
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
          <p className="mb-3 px-1 text-sm text-muted">Seconds to call a letter. Running out counts as a miss.</p>
          <Segmented
            labelledBy="timer-heading"
            value={settings.turnSeconds}
            onChange={(value) => set("turnSeconds", value)}
            options={TURN_SECONDS_OPTIONS.map((seconds) => ({ value: seconds, label: seconds ? `${seconds}s` : "Off" }))}
          />
        </div>
      </section>
    </TeamSetup>
  );
}
