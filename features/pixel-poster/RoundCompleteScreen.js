"use client";

import { useState } from "react";
import { Scoreboard } from "@/components/game/Scoreboard";
import { Confetti } from "@/components/game/Confetti";
import { GameShell } from "@/components/game/GameShell";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ArrowRightIcon, FlagIcon } from "@/components/ui/icons";
import { teamText } from "@/lib/games/core/teams";
import { ACTIONS, STAGE_COUNT, selectTeam } from "@/lib/games/pixel-poster/engine";

/**
 * @param {{ state: any, dispatch: Function, onNextRound: () => Promise<void>, loadingNext: boolean, error: string | null }} props
 */
export function RoundCompleteScreen({ state, dispatch, onNextRound, loadingNext, error }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const movie = state.movie;
  const result = state.roundResult;
  const winner = selectTeam(state, result?.winnerTeamId);
  const solved = result?.outcome === "solved" && winner;
  const wikiUrl = movie.article ? `https://en.wikipedia.org/wiki/${encodeURIComponent(movie.article.replace(/ /g, "_"))}` : null;

  return (
    <GameShell teamColor={winner?.color ?? "#64748b"}>
      {solved ? <Confetti /> : null}

      <section className="relative pt-6 text-center sm:pt-10">
        <p className="anim-rise text-xs font-semibold uppercase tracking-[0.2em] text-subtle">Round {state.round} complete</p>
        <h1 className="anim-rise mt-4 font-display text-[clamp(2.1rem,7vw,3.75rem)] font-extrabold leading-none tracking-[-0.03em]">
          {solved ? (
            <>
              {winner.name} <span style={{ color: teamText(winner.color) }}>{result.steal ? "stole it!" : "spotted it!"}</span>
            </>
          ) : (
            result?.outcome === "revealed" ? "Round given up" : state.teams.length === 1 ? "So close!" : "Nobody spotted it"
          )}
        </h1>
        <p className="anim-rise mx-auto mt-3 max-w-md text-muted">
          {solved
            ? result.stage === 0
              ? "Named on the very first look!"
              : `Named at reveal ${result.stage + 1} of ${STAGE_COUNT}.`
            : result?.outcome === "revealed"
              ? "You gave up on this one, so no points this round."
              : state.teams.length === 1
                ? "Time ran out. No points this round."
                : "The first try and the steal both ran out of time. No points this round."}
        </p>
      </section>

      <section
        className="card anim-rise relative mt-8 grid gap-5 rounded-[2rem] p-5 sm:grid-cols-[12rem_1fr] sm:items-center sm:p-8"
        style={{ animationDelay: "120ms" }}
      >
        {/* Plain <img>: Wikimedia serves browsers directly, and the Next image optimizer would refetch it server-side. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={movie.poster}
          alt={`Poster of ${movie.title}`}
          className="mx-auto w-40 rounded-2xl shadow-2xl sm:w-full"
          referrerPolicy="no-referrer"
        />
        <div className="text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">The movie was</p>
          <p className="mt-2 font-display text-[clamp(1.9rem,6vw,2.75rem)] font-extrabold leading-tight tracking-tight">{movie.title}</p>
          {movie.year || movie.lead ? <p className="mt-1 text-muted">{[movie.year, movie.lead].filter(Boolean).join(" · ")}</p> : null}
          {wikiUrl ? (
            <a href={wikiUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-subtle underline underline-offset-4 hover:text-foreground">
              Poster via Wikipedia
            </a>
          ) : null}
        </div>
      </section>

      {solved ? (
        <section className="anim-rise relative mt-6" style={{ animationDelay: "240ms" }} aria-label="Points this round">
          <div className={`grid gap-2 text-center sm:gap-3 ${result.steal ? "grid-cols-3" : "grid-cols-2"}`}>
            <PointsCell label="Reveal" value={`+${result.stagePoints}`} />
            <PointsCell label="Clue" value={result.cluePenalty ? `−${result.cluePenalty}` : "0"} tone={result.cluePenalty ? "miss" : undefined} />
            {result.steal ? <PointsCell label="Steal" value="×½" tone="accent" /> : null}
          </div>
          <p className="mt-3 text-center font-display text-2xl font-extrabold tabular-nums">
            <span style={{ color: teamText(winner.color) }}>{winner.name}</span> +{result.points}
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
          {loadingNext ? "Finding a poster…" : "Next round"} <ArrowRightIcon size={20} />
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
    <div className="card rounded-2xl px-2 py-3">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-subtle">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${tone === "miss" ? "text-miss" : tone === "accent" ? "text-accent-3" : ""}`}>
        {value}
      </p>
    </div>
  );
}
