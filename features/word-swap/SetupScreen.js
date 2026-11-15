"use client";

import { useState } from "react";
import { TeamSetup } from "@/components/game/TeamSetup";
import { Segmented } from "@/components/ui/Controls";
import { MAX_GUESSES, MAX_LENGTH, MIN_LENGTH, POINTS_PER_SPARE_GUESS } from "@/lib/games/word-swap/engine";

const RULES = [
  { title: "Swap words", body: `Each round, every team secretly sets a ${MIN_LENGTH}–${MAX_LENGTH} letter word for the next team. Telugu words welcome.` },
  { title: "Crack it", body: `${MAX_GUESSES} tries. Each guess marks every letter: right spot, in the word somewhere else, or not in it at all.` },
  { title: "Score", body: `Fewer guesses, more points: ${MAX_GUESSES * POINTS_PER_SPARE_GUESS} for a first-try hit, down to ${POINTS_PER_SPARE_GUESS} on the last.` },
];

export function SetupScreen({ initialTeams, initialSettings, onStart }) {
  const [source, setSource] = useState(initialSettings.source);

  return (
    <TeamSetup
      eyebrow="Word game · teams set the words"
      title={
        <>
          Word
          <br />
          <span className="text-accent-2">Swap</span>
        </>
      }
      intro="Set a sneaky word for your rivals, then crack the one they set for you. Six tries, every letter tells you something."
      rules={RULES}
      initialTeams={initialTeams}
      onStart={(drafts) => onStart(drafts, { source })}
    >
      <section className="card rounded-[1.75rem] p-4 sm:p-6" aria-labelledby="source-heading">
        <h2 id="source-heading" className="px-1 font-display text-xl font-bold tracking-tight">
          Who picks the words?
        </h2>
        <p className="mb-3 px-1 text-sm text-muted">Solo always uses random words.</p>
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
    </TeamSetup>
  );
}
