"use client";

import { useState } from "react";
import { TeamSetup } from "@/components/game/TeamSetup";
import { Segmented } from "@/components/ui/Controls";
import { MAX_GUESSES, MAX_LENGTH, MIN_LENGTH, POINTS_PER_SPARE_GUESS } from "@/lib/games/word-swap/engine";
import { RANDOM_WORDS } from "@/lib/games/word-swap/words";

const TEAM_RULES = [
  { title: "Swap words", body: `Each round, every team secretly sets a ${MIN_LENGTH}–${MAX_LENGTH} letter word for the next team. Telugu words welcome.` },
  { title: "Crack it", body: `${MAX_GUESSES} tries. Each guess marks every letter: right spot, in the word somewhere else, or not in it at all.` },
  { title: "Score", body: `Fewer guesses, more points: ${MAX_GUESSES * POINTS_PER_SPARE_GUESS} for a first-try hit, down to ${POINTS_PER_SPARE_GUESS} on the last.` },
];

const SOLO_RULES = [
  { title: "A random word", body: `Each round deals a ${MIN_LENGTH}–${MAX_LENGTH} letter word from ${RANDOM_WORDS.length} built-in words, with a category as the hint.` },
  TEAM_RULES[1],
  { title: "Score", body: `Fewer guesses, more points: ${MAX_GUESSES * POINTS_PER_SPARE_GUESS} for a first-try hit, down to ${POINTS_PER_SPARE_GUESS} on the last. Play as many words as you like.` },
];

export function SetupScreen({ initialTeams, initialSettings, onStart }) {
  const [source, setSource] = useState(initialSettings.source);

  return (
    <TeamSetup
      eyebrow="Word game · solo or teams"
      title={
        <>
          Word
          <br />
          <span className="text-accent-2">Swap</span>
        </>
      }
      intro="Crack a secret word in six tries; every letter tells you something. Play solo against random words, or set sneaky words for rival teams."
      rules={(solo) => (solo ? SOLO_RULES : TEAM_RULES)}
      initialTeams={initialTeams}
      onStart={(drafts) => onStart(drafts, { source })}
    >
      {(solo) =>
        solo ? (
          <section className="card rounded-[1.75rem] p-3.5 sm:p-6" aria-labelledby="source-heading">
            <h2 id="source-heading" className="px-1 font-display text-lg font-bold tracking-tight sm:text-xl">
              Your words
            </h2>
            <p className="px-1 text-sm text-muted">
              Each round deals you a random word from {RANDOM_WORDS.length} built-in ones, with its category as a hint. No setup needed.
            </p>
          </section>
        ) : (
      <section className="card rounded-[1.75rem] p-3.5 sm:p-6" aria-labelledby="source-heading">
        <h2 id="source-heading" className="px-1 font-display text-lg font-bold tracking-tight sm:text-xl">
          Who picks the words?
        </h2>
        <p className="mb-3 px-1 text-sm text-muted">Teams set words for each other, or let the game deal random ones.</p>
        <Segmented
          labelledBy="source-heading"
          value={source}
          onChange={setSource}
          options={[
            { value: "teams", label: "Teams set them" },
            { value: "random", label: "Random words" },
          ]}
        />
      </section>
        )
      }
    </TeamSetup>
  );
}
