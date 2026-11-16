"use client";

import { useState } from "react";
import { TeamSetup } from "@/components/game/TeamSetup";
import { MultiSelect, Segmented } from "@/components/ui/Controls";
import { ROUND_OPTIONS, TURN_SECONDS_OPTIONS, WORDS_PER_TURN_OPTIONS } from "@/lib/games/head-rush/engine";
import { HEAD_RUSH_CATEGORIES, HEAD_RUSH_WORDS, wordIdsIn } from "@/lib/games/head-rush/words";

const RULES = [
  { title: "Phone on your forehead", body: "One player per team holds the phone to their forehead, screen facing out, without peeking." },
  { title: "Clue it out", body: "The team shouts clues, acts it out, hums the song. Anything but saying the word itself." },
  { title: "Swipe it", body: "Got it? Swipe right for a point. Stuck? Swipe left to pass. Most words when the rounds are up wins." },
];

export function SetupScreen({ initialTeams, initialSettings, onStart }) {
  const [settings, setSettings] = useState(initialSettings);
  const set = (key, value) => setSettings((s) => ({ ...s, [key]: value }));
  const noCategory = settings.categories.length === 0;
  const poolSize = wordIdsIn(settings.categories).length;

  return (
    <TeamSetup
      allowSolo={false}
      eyebrow={`Party game · ${HEAD_RUSH_WORDS.length} words`}
      title={
        <>
          Head <span className="text-accent-2">Rush</span>
        </>
      }
      intro="Phone on your forehead, team shouting clues. Guess as many words as you can before the clock runs out."
      rules={RULES}
      initialTeams={initialTeams}
      startDisabled={noCategory}
      onStart={(drafts) => !noCategory && onStart(drafts, settings)}
    >
      <section className="card flex flex-col gap-5 rounded-[1.75rem] p-3.5 sm:gap-6 sm:p-6">
        <div>
          <h2 id="time-heading" className="px-1 font-display text-lg tracking-tight sm:text-xl">
            Time per turn
          </h2>
          <p className="mb-3 px-1 text-sm text-muted">How long each guesser gets.</p>
          <Segmented
            labelledBy="time-heading"
            value={settings.turnSeconds}
            onChange={(value) => set("turnSeconds", value)}
            options={TURN_SECONDS_OPTIONS.map((s) => ({ value: s, label: `${s}s` }))}
          />
        </div>

        <div>
          <h2 id="words-heading" className="px-1 font-display text-lg tracking-tight sm:text-xl">
            Words per turn
          </h2>
          <p className="mb-3 px-1 text-sm text-muted">The turn ends early if a team gets through them all.</p>
          <Segmented
            labelledBy="words-heading"
            value={settings.wordsPerTurn}
            onChange={(value) => set("wordsPerTurn", value)}
            options={WORDS_PER_TURN_OPTIONS.map((n) => ({ value: n, label: String(n) }))}
          />
        </div>

        <div>
          <h2 id="rounds-heading" className="px-1 font-display text-lg tracking-tight sm:text-xl">
            Rounds
          </h2>
          <p className="mb-3 px-1 text-sm text-muted">Every team plays one turn per round.</p>
          <Segmented
            labelledBy="rounds-heading"
            value={settings.rounds}
            onChange={(value) => set("rounds", value)}
            options={ROUND_OPTIONS.map((n) => ({ value: n, label: String(n) }))}
          />
        </div>

        <div>
          <h2 className="px-1 font-display text-lg tracking-tight sm:text-xl">Word categories</h2>
          <p className="mb-3 px-1 text-sm text-muted">
            {noCategory ? "Pick at least one." : `${poolSize} words in the mix. The category shows above each word.`}
          </p>
          <MultiSelect
            label="Word categories"
            values={settings.categories}
            onChange={(values) => set("categories", values)}
            options={HEAD_RUSH_CATEGORIES.map((c) => ({ value: c.id, label: c.label, color: c.color }))}
            className="grid-cols-2 sm:grid-cols-3"
          />
          {noCategory ? (
            <p role="alert" className="mt-2 px-1 text-sm font-semibold text-miss">
              Pick at least one category.
            </p>
          ) : null}
        </div>
      </section>
    </TeamSetup>
  );
}
