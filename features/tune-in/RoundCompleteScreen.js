"use client";

import { useState } from "react";
import Image from "next/image";
import { Scoreboard } from "@/components/game/Scoreboard";
import { Confetti } from "@/components/game/Confetti";
import { GameShell } from "@/components/game/GameShell";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ArrowRightIcon, FlagIcon, MusicIcon } from "@/components/ui/icons";
import { ACTIONS, selectTeam } from "@/lib/games/tune-in/engine";

/**
 * @param {{ state: any, dispatch: Function, onNextRound: () => Promise<void>, loadingNext: boolean, error: string | null }} props
 */
export function RoundCompleteScreen({ state, dispatch, onNextRound, loadingNext, error }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const song = state.song;
  const result = state.roundResult;
  const winner = selectTeam(state, result?.winnerTeamId);
  const solved = result?.outcome === "solved" && winner;
  const heard = result?.heardSeconds ?? 0;

  return (
    <GameShell teamColor={winner?.color ?? "#64748b"}>
      {solved ? <Confetti /> : null}

      <section className="relative pt-6 text-center sm:pt-10">
        <p className="anim-rise text-xs font-semibold uppercase tracking-[0.2em] text-subtle">Round {state.round} complete</p>
        <h1 className="anim-rise mt-4 font-display text-[clamp(2.1rem,7vw,3.75rem)] font-extrabold leading-none tracking-[-0.03em]">
          {solved ? (
            <>
              {winner.name} <span style={{ color: winner.color }}>{result.steal ? "stole it!" : "got it!"}</span>
            </>
          ) : result?.outcome === "revealed" ? (
            "Round given up"
          ) : (
            "Nobody got it"
          )}
        </h1>
        <p className="anim-rise mx-auto mt-3 max-w-md text-muted">
          {solved
            ? heard <= 1
              ? "Named it from the very first notes!"
              : `Named it after hearing ${heard}s of the clip.`
            : result?.outcome === "revealed"
              ? "You gave up on this one, so no points this round."
              : "The first try and the steal both ran out of time. No points this round."}
        </p>
      </section>

      <section
        className="card anim-rise relative mt-8 grid gap-5 rounded-[2rem] p-5 sm:grid-cols-[10rem_1fr] sm:items-center sm:p-8"
        style={{ animationDelay: "120ms" }}
      >
        {song.artwork ? (
          <Image
            src={song.artwork}
            alt={`Cover art for ${song.songTitle || song.title}`}
            width={160}
            height={160}
            className="mx-auto size-36 rounded-2xl object-cover shadow-2xl sm:size-40"
          />
        ) : (
          <span className="mx-auto grid size-36 place-items-center rounded-2xl bg-surface-strong text-subtle sm:size-40">
            <MusicIcon size={48} />
          </span>
        )}
        <div className="min-w-0 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">The movie was</p>
          <p className="mt-2 font-display text-[clamp(1.9rem,6vw,2.75rem)] font-extrabold leading-tight tracking-tight">{song.title}</p>
          <p className="mt-1 text-muted">
            “{song.songTitle}”{song.year ? ` · ${song.year}` : ""}
            {song.composer ? ` · ${song.composer}` : ""}
          </p>
          {song.artist ? <p className="mt-0.5 truncate text-sm text-subtle">{song.artist}</p> : null}
          <audio controls preload="none" src={song.preview} className="mt-4 w-full max-w-md">
            Your browser can’t play this preview.
          </audio>
          {song.trackUrl ? (
            <a
              href={song.trackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-semibold text-accent underline-offset-4 hover:underline"
            >
              Listen on Apple Music ↗
            </a>
          ) : null}
        </div>
      </section>

      {solved ? (
        <section className="anim-rise relative mt-6" style={{ animationDelay: "240ms" }} aria-label="Points this round">
          <div className={`grid gap-2 text-center sm:gap-3 ${result.steal ? "grid-cols-3" : "grid-cols-2"}`}>
            <PointsCell label={`Heard ${heard}s`} value={`+${result.tierPoints}`} />
            <PointsCell label="Clue" value={result.cluePenalty ? `−${result.cluePenalty}` : "0"} tone={result.cluePenalty ? "miss" : undefined} />
            {result.steal ? <PointsCell label="Steal" value="×½" tone="accent" /> : null}
          </div>
          <p className="mt-3 text-center font-display text-2xl font-extrabold tabular-nums">
            <span style={{ color: winner.color }}>{winner.name}</span> +{result.points}
          </p>
        </section>
      ) : null}

      <section className="relative mt-8" aria-labelledby="standings-heading">
        <h2 id="standings-heading" className="mb-3 px-1 font-display text-xl font-bold tracking-tight">
          Standings
        </h2>
        <Scoreboard variant="ranked" teams={state.teams} roundPoints={solved ? { [winner.id]: result.points } : {}} />
      </section>

      {error ? (
        <p role="alert" className="mt-6 rounded-2xl border border-miss/40 bg-miss/10 px-4 py-3 text-center text-sm">
          {error}
        </p>
      ) : null}

      <div className="relative mt-8 flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="button"
          autoFocus
          className="btn btn-primary h-14 text-base sm:h-16 sm:flex-1 sm:text-lg"
          onClick={onNextRound}
          disabled={loadingNext}
        >
          {loadingNext ? "Finding a song…" : "Next round"} <ArrowRightIcon size={20} />
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

function PointsCell({ label, value, tone }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-2 py-3">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-subtle">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${tone === "miss" ? "text-miss" : tone === "accent" ? "text-accent-3" : ""}`}>
        {value}
      </p>
    </div>
  );
}
