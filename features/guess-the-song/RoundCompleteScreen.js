"use client";

import { useState } from "react";
import { LyricsDisplay } from "@/components/game/LyricsDisplay";
import { Scoreboard } from "@/components/game/Scoreboard";
import { RoundBreakdown } from "@/components/game/RoundBreakdown";
import { Confetti } from "@/components/game/Confetti";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ArrowRightIcon, FlagIcon } from "@/components/ui/icons";
import { teamInk, teamText } from "@/lib/games/core/teams";
import {
  ACTIONS,
  SONG_COMPLETION_MULTIPLIER,
  selectNextTeam,
  selectRoundBreakdown,
  selectSong,
  selectTeam,
} from "@/lib/games/guess-the-song/engine";
import { getPuzzleLines } from "@/lib/games/guess-the-song/songs";
import { GameShell } from "@/components/game/GameShell";
import { useSongDetails } from "./useSongDetails";


export function RoundCompleteScreen({ state, dispatch }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const song = selectSong(state);
  const result = state.songResult;
  const team = selectTeam(state, result?.teamId);
  const nextTeam = selectNextTeam(state);
  const solved = result?.outcome === "solved";
  const byLetters = solved && result.method === "letters";
  const multiplier = result?.multiplier || SONG_COMPLETION_MULTIPLIER;
  const breakdown = selectRoundBreakdown(state);
  const roundTotals = Object.fromEntries(breakdown.map((row) => [row.team.id, row.total]));
  const roundDone = nextTeam === null;

  return (
    <GameShell teamColor={team?.color ?? "#64748b"}>
      {solved ? <Confetti /> : null}

      <section className="relative pt-6 text-center sm:pt-10">
        <p className="anim-rise text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          Round {state.round} · Team {state.turnInRound + 1} of {state.teams.length}
        </p>
        {team ? (
          <div
            className="anim-pop mx-auto mt-6 grid size-20 place-items-center rounded-[1.75rem] font-display text-3xl font-extrabold"
            style={{
              background: solved ? team.color : "var(--surface-strong)",
              color: solved ? teamInk(team.color) : teamText(team.color),
              boxShadow: "0 5px 0 0 var(--depth)",
              border: "2px solid var(--edge)",
            }}
          >
            {team.name.replace(/^team\s+/i, "").charAt(0).toUpperCase()}
          </div>
        ) : null}
        <h1 className="anim-rise mt-5 font-display text-[clamp(2.2rem,7vw,3.75rem)] font-extrabold leading-none tracking-[-0.03em]">
          {team?.name}{" "}
          {solved ? (
            <span style={{ color: teamText(team?.color) }}>got it!</span>
          ) : (
            <span className="text-miss">{result?.outcome === "failed" ? "is out of lives" : "skipped it"}</span>
          )}
        </h1>
        <p className="anim-rise mx-auto mt-3 max-w-md text-muted">
          {solved
            ? byLetters
              ? `Revealed every letter: ${result.letterPoints} letter points. The ${SONG_COMPLETION_MULTIPLIER}× bonus is for naming the song.`
              : state.lives === 0
                ? "Named it on the last chance!"
                : `Named the song with ${state.lives} ${state.lives === 1 ? "life" : "lives"} to spare.`
            : result?.outcome === "failed"
              ? "The last-chance guess missed. No points for this song."
              : "The host revealed the song. No points for this song."}
        </p>
        {solved && !byLetters ? (
          <BonusBurst alphabetPoints={result.letterPoints} multiplier={multiplier} bonus={result.bonus} />
        ) : null}
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
          <LyricsDisplay lines={getPuzzleLines(song)} guessedLetters={state.guessedLetters} revealAll complete={byLetters} size="sm" />
        </div>
        <SongMedia songId={song.id} title={song.title} />
      </section>

      <section className="relative mt-8" aria-labelledby="round-points-heading">
        <h2 id="round-points-heading" className="mb-3 px-1 font-display text-xl font-bold tracking-tight">
          {roundDone ? `Round ${state.round} results` : "This round so far"}
        </h2>
        <RoundBreakdown rows={breakdown} multiplier={SONG_COMPLETION_MULTIPLIER} />
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
          onClick={() => dispatch({ type: ACTIONS.NEXT_TURN, random: Math.random() })}
        >
          {roundDone ? `Start round ${state.round + 1}` : `Next: ${nextTeam.name}`} <ArrowRightIcon size={20} />
        </button>
        <button type="button" className="btn btn-secondary h-14 px-8 text-base sm:h-16" onClick={() => setConfirmEnd(true)}>
          <FlagIcon size={18} /> Finish game
        </button>
      </div>

      <ConfirmDialog
        open={confirmEnd}
        title="Finish the game?"
        body={roundDone ? "See the final standings and crown the champion." : "Teams that haven’t played this round won’t get their turn. See the final standings now?"}
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
        <span className="anim-rise card rounded-2xl px-4 py-2 text-2xl sm:text-3xl" style={{ animationDelay: "250ms" }}>
          {alphabetPoints}
          <span className="ml-1 text-sm font-semibold text-subtle">pts</span>
        </span>
        <span
          className="anim-bonus grid size-16 place-items-center rounded-[1.25rem] text-3xl text-[var(--accent-3-ink)] sm:size-20 sm:text-4xl"
          style={{ background: "var(--accent-3)", boxShadow: "0 5px 0 0 var(--depth)", border: "2px solid var(--edge)", animationDelay: "450ms" }}
        >
          {multiplier}×
        </span>
        <span className="anim-pop text-3xl text-accent-3 sm:text-4xl" style={{ animationDelay: "800ms" }}>
          +{bonus}
        </span>
      </div>
      <p className="anim-rise text-sm text-muted" style={{ animationDelay: "900ms" }}>
        Song completion bonus{alphabetPoints === 0 ? ". No letter points yet, so nothing to multiply" : ""}
      </p>
    </div>
  );
}

/** Cover art, 30-second preview and store link from iTunes. Renders nothing until (and unless) a match is found. */
function SongMedia({ songId, title }) {
  const details = useSongDetails(songId);
  if (!details?.found || (!details.artworkUrl && !details.previewUrl)) return null;

  return (
    <div className="anim-rise mt-7 flex flex-col items-center gap-4 border-t border-line pt-7 sm:flex-row sm:items-center sm:gap-6">
      {details.artworkUrl ? (
        // Plain <img>: iTunes serves browsers directly; Netlify's image CDN would proxy (and cache) it.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={details.artworkUrl}
          src={details.artworkUrl}
          alt={details.album ? `Cover art: ${details.album}` : `Cover art for ${title}`}
          width={112}
          height={112}
          className="size-28 shrink-0 rounded-2xl object-cover shadow-lg"
        />
      ) : null}
      <div className="flex w-full min-w-0 flex-col gap-3 text-center sm:text-left">
        <div className="min-w-0">
          {details.artist ? <p className="font-semibold">{details.artist}</p> : null}
          {details.album ? <p className="truncate text-sm text-muted">{details.album}</p> : null}
        </div>
        {details.previewUrl ? (
          <audio controls preload="none" src={details.previewUrl} className="w-full max-w-md">
            Your browser can’t play this preview.
          </audio>
        ) : null}
        {details.trackUrl ? (
          <a
            href={details.trackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-accent underline-offset-4 hover:underline"
          >
            Listen on Apple Music ↗
          </a>
        ) : null}
      </div>
    </div>
  );
}
