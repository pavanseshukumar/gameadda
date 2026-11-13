"use client";

import { TeamSetup } from "@/components/game/TeamSetup";
import { POINTS_PER_LETTER, POINTS_PER_VOWEL, SONG_COMPLETION_MULTIPLIER, TURN_SECONDS } from "@/lib/games/guess-the-song/engine";
import { SONGS } from "@/lib/games/guess-the-song/songs";

const RULES = [
  { title: "Crack the title", body: "A Telugu song title, written in English letters, starts fully hidden. The movie, year and composer are your clues." },
  {
    title: "Call a letter",
    body: `Each hit scores ${POINTS_PER_LETTER} points per occurrence (vowels ${POINTS_PER_VOWEL}) and you keep the turn. A miss, or ${TURN_SECONDS}s without a call, passes it on.`,
  },
  {
    title: "Win the song",
    body: `Name the song to earn ${SONG_COMPLETION_MULTIPLIER}× your letter points this round. Revealing the final letter wins the round too, but with no multiplier.`,
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
