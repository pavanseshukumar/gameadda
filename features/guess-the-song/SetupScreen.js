"use client";

import { TeamSetup } from "@/components/game/TeamSetup";
import { POINTS_PER_LETTER, SONG_COMPLETION_MULTIPLIER } from "@/lib/games/guess-the-song/engine";
import { SONGS } from "@/lib/games/guess-the-song/songs";

const RULES = [
  { title: "Read the lyric", body: "Two lines of a Telugu song, written in English letters, start fully hidden." },
  {
    title: "Call a letter",
    body: `Each hit scores ${POINTS_PER_LETTER} points per occurrence and you keep the turn. A miss passes it on.`,
  },
  {
    title: "Win the song",
    body: `Name the song, or reveal its final letter, to earn ${SONG_COMPLETION_MULTIPLIER}× your letter points this round.`,
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
      intro="Gather round one screen, pick your teams, and race to crack the lyrics."
      rules={RULES}
      initialTeams={initialTeams}
      onStart={onStart}
    />
  );
}
