"use client";

import { TeamSetup } from "@/components/game/TeamSetup";
import { POINTS_PER_LETTER, POINTS_PER_VOWEL, SONG_COMPLETION_MULTIPLIER, STARTING_LIVES, TURN_SECONDS } from "@/lib/games/guess-the-song/engine";
import { SONGS } from "@/lib/games/guess-the-song/songs";

const RULES = [
  {
    title: "Your own song",
    body: `Each round, every team gets its own hidden Telugu song title and ${STARTING_LIVES} lives. The movie, year and music are your clues.`,
  },
  {
    title: "Call letters",
    body: `Each hit scores ${POINTS_PER_LETTER} points per occurrence (vowels ${POINTS_PER_VOWEL}). A miss, a wrong song guess or ${TURN_SECONDS}s without a call costs a life.`,
  },
  {
    title: "Win the song",
    body: `Name the song to add a ${SONG_COMPLETION_MULTIPLIER}× bonus to your letter points; revealing every letter keeps just the letter points. Lose all ${STARTING_LIVES} lives and you get one last guess at the song; miss it and you score 0.`,
  },
];

export function SetupScreen({ initialTeams, onStart }) {
  return (
    <TeamSetup
      eyebrow={`Party game · ${SONGS.length} songs`}
      title={
        <>
          Guess the
          <br />
          <span className="text-accent">Telugu Song</span>
        </>
      }
      intro="Gather round one screen, pick your teams, and race to crack the song title."
      rules={RULES}
      initialTeams={initialTeams}
      onStart={onStart}
    />
  );
}
