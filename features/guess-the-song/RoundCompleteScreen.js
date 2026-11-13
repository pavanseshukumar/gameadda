"use client";

import { useState } from "react";
import { LyricsDisplay } from "@/components/game/LyricsDisplay";
import { Scoreboard } from "@/components/game/Scoreboard";
import { RoundBreakdown } from "@/components/game/RoundBreakdown";
import { Confetti } from "@/components/game/Confetti";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ArrowRightIcon, FlagIcon } from "@/components/ui/icons";
import {
  ACTIONS,
  SONG_COMPLETION_MULTIPLIER,
  selectRoundBreakdown,
  selectSong,
  selectTeam,
} from "@/lib/games/guess-the-song/engine";
import { getPuzzleLines } from "@/lib/games/guess-the-song/songs";
import { GameShell } from "@/components/game/GameShell";


export function RoundCompleteScreen({ state, dispatch }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const song = selectSong(state);
  const result = state.roundResult;
  const winner = selectTeam(state, result?.winnerTeamId);
  const solved = result?.outcome === "solved" && winner;
  const byLyrics = solved && result.method === "lyrics";
  const multiplier = result?.multiplier ?? SONG_COMPLETION_MULTIPLIER;
  const breakdown = selectRoundBreakdown(state);
  const roundTotals = Object.fromEntries(breakdown.map((row) => [row.team.id, row.total]));

  return (
    <GameShell teamColor={winner?.color ?? "#64748b"}>
      {solved ? <Confetti /> : null}

      <section className="relative pt-6 text-center sm:pt-10">
        <p className="anim-rise text-xs font-semibold uppercase tracking-[0.2em] text-subtle">Round {state.round} complete</p>
        {solved ? (
          <>
            <div
              className="anim-pop mx-auto mt-6 grid size-20 place-items-center rounded-[1.75rem] font-display text-3xl font-extrabold text-white"
              style={{ background: winner.color, boxShadow: `0 24px 60px -18px ${winner.color}` }}
            >
              {winner.name.replace(/^team\s+/i, "").charAt(0).toUpperCase()}
            </div>
            <h1 className="anim-rise mt-5 font-display text-[clamp(2.2rem,7vw,3.75rem)] font-extrabold leading-none tracking-[-0.03em]">
              {winner.name} <span style={{ color: winner.color }}>got it!</span>
            </h1>
            <p className="anim-rise mt-3 text-muted">
              {byLyrics ? "Revealed the final letter of the title." : "Named the song."}
            </p>
            <BonusBurst alphabetPoints={result.alphabetPoints ?? 0} multiplier={multiplier} bonus={result.bonus ?? 0} />
          </>
        ) : (
          <>
            <h1 className="anim-rise mt-5 font-display text-[clamp(2.2rem,7vw,3.75rem)] font-extrabold leading-none tracking-[-0.03em]">
              Nobody guessed it!
            </h1>
            <p className="anim-rise mx-auto mt-3 max-w-md text-muted">The host revealed the song. Letter points still count.</p>
          </>
        )}
      </section>

      <section className="card anim-rise relative mt-8 rounded-[2rem] p-5 sm:p-8" style={{ animationDelay: "120ms" }}>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">The song was</p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">{song.title}</h2>
          </div>
          <p className="text-muted">
            {song.movie}
            {song.year ? <span className="text-subtle"> · {song.year}</span> : null}
            {song.composer ? <span className="text-subtle"> · {song.composer}</span> : null}
          </p>
        </div>
        <div className="mt-7 border-t border-line pt-7">
          <LyricsDisplay lines={getPuzzleLines(song)} guessedLetters={state.guessedLetters} revealAll complete={byLyrics} size="sm" />
        </div>
      </section>

      <section className="relative mt-8" aria-labelledby="round-points-heading">
        <h2 id="round-points-heading" className="mb-3 px-1 font-display text-xl font-bold tracking-tight">
          This round
        </h2>
        <RoundBreakdown rows={breakdown} multiplier={multiplier} />
      </section>

      <section className="relative mt-8" aria-labelledby="standings-heading">
        <h2 id="standings-heading" className="mb-3 px-1 font-display text-xl font-bold tracking-tight">
          Overall standings
        </h2>
        <Scoreboard variant="ranked" teams={state.teams} roundPoints={roundTotals} />
      </section>

      <div className="relative mt-8 flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="button"
          autoFocus
          className="btn btn-primary h-14 text-base sm:h-16 sm:flex-1 sm:text-lg"
          onClick={() => dispatch({ type: ACTIONS.NEXT_ROUND, random: Math.random() })}
        >
          Next round <ArrowRightIcon size={20} />
        </button>
        <button type="button" className="btn btn-secondary h-14 px-8 text-base sm:h-16" onClick={() => setConfirmEnd(true)}>
          <FlagIcon size={18} /> Finish game
        </button>
      </div>

      <ConfirmDialog
        open={confirmEnd}
        title="Finish the game?"
        body="See the final standings and crown the champion."
        confirmLabel="Show results"
        onCancel={() => setConfirmEnd(false)}
        onConfirm={() => {
          setConfirmEnd(false);
          dispatch({ type: ACTIONS.END_GAME });
        }}
      />
    </GameShell>
  );
}

/** Animated "letters × 5 = bonus" reveal for the solving team. */
function BonusBurst({ alphabetPoints, multiplier, bonus }) {
  return (
    <div className="mt-7 flex flex-col items-center gap-3" aria-label={`Completion bonus: ${alphabetPoints} times ${multiplier} equals ${bonus}`}>
      <div className="flex items-center gap-3 font-display font-extrabold tabular-nums">
        <span className="anim-rise rounded-2xl border border-line bg-surface px-4 py-2 text-2xl sm:text-3xl" style={{ animationDelay: "250ms" }}>
          {alphabetPoints}
          <span className="ml-1 text-sm font-semibold text-subtle">pts</span>
        </span>
        <span
          className="anim-bonus grid size-16 place-items-center rounded-[1.25rem] text-3xl text-[#1a1205] sm:size-20 sm:text-4xl"
          style={{ background: "var(--accent-3)", boxShadow: "0 18px 50px -14px var(--accent-3)", animationDelay: "450ms" }}
        >
          {multiplier}×
        </span>
        <span className="anim-pop text-3xl text-accent-3 sm:text-4xl" style={{ animationDelay: "800ms" }}>
          +{bonus}
        </span>
      </div>
      <p className="anim-rise text-sm text-muted" style={{ animationDelay: "900ms" }}>
        Song completion bonus{alphabetPoints === 0 ? ". No letter points this round, so nothing to multiply" : ""}
      </p>
    </div>
  );
}
