"use client";

import { useState } from "react";
import { Scoreboard } from "@/components/game/Scoreboard";
import { Confetti } from "@/components/game/Confetti";
import { GameShell } from "@/components/game/GameShell";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ArrowRightIcon, FlagIcon } from "@/components/ui/icons";
import { teamText } from "@/lib/games/core/teams";
import { ACTIONS, selectRankedGuesses, selectTeam } from "@/lib/games/hot-and-cold/engine";
import { GuessBoard } from "./GuessBoard";

/**
 * @param {{ state: any, dispatch: Function, onNextRound: () => Promise<void>, loadingNext: boolean, error: string | null }} props
 */
export function RoundCompleteScreen({ state, dispatch, onNextRound, loadingNext, error }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const secret = state.secret;
  const result = state.roundResult;
  const winner = selectTeam(state, result?.winnerTeamId);
  const solved = result?.outcome === "solved" && winner;
  const star = secret.hints.find((h) => h.kind === "star")?.text;
  const facts = [
    secret.directors.length ? ["Director", secret.directors.map((p) => p.name).join(" & ")] : null,
    star ? ["Starring", star] : null,
    secret.composers.length ? ["Music", secret.composers.map((p) => p.name).join(" & ")] : null,
    secret.genres.length ? ["Genre", secret.genres.map((g) => g.name).join(", ")] : null,
  ].filter(Boolean);
  // The winning guess is already the headline; show the trail that led there.
  const trail = selectRankedGuesses(state).filter((g) => g.movie.id !== secret.id).slice(0, 5);

  return (
    <GameShell teamColor={winner?.color ?? "#64748b"}>
      {solved ? <Confetti /> : null}

      <section className="relative pt-6 text-center sm:pt-10">
        <p className="anim-rise text-xs font-semibold uppercase tracking-[0.2em] text-subtle">Round {state.round} complete</p>
        <h1 className="anim-rise mt-4 font-display text-[clamp(2.1rem,7vw,3.75rem)] font-extrabold leading-none tracking-[-0.03em]">
          {solved ? (
            <>
              {winner.name} <span style={{ color: teamText(winner.color) }}>found it!</span>
            </>
          ) : (
            "The secret is out"
          )}
        </h1>
        <p className="anim-rise mx-auto mt-3 max-w-md text-muted">
          {solved
            ? `On guess ${result.guessCount}, for a pot of ${result.points}.`
            : `The host revealed it after ${result?.guessCount ?? 0} guess${result?.guessCount === 1 ? "" : "es"}.`}
        </p>
      </section>

      <section className="card anim-rise relative mt-8 rounded-[2rem] p-5 text-center sm:p-8" style={{ animationDelay: "120ms" }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">The secret movie</p>
        <p className="mt-2 font-display text-[clamp(2rem,7vw,3rem)] font-extrabold leading-tight tracking-tight">{secret.title}</p>
        {secret.year ? <p className="text-muted">{secret.year}</p> : null}
        {facts.length ? (
          <dl className="mx-auto mt-5 grid max-w-lg gap-x-4 gap-y-1.5 text-left text-sm sm:grid-cols-[auto_1fr]">
            {facts.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-subtle">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </section>

      {trail.length ? (
        <section className="anim-rise relative mt-6" style={{ animationDelay: "240ms" }} aria-labelledby="trail-heading">
          <h2 id="trail-heading" className="mb-3 px-1 font-display text-xl font-bold tracking-tight">
            Closest guesses
          </h2>
          <GuessBoard guesses={trail} teams={state.teams} />
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
          {loadingNext ? "Picking a secret…" : "Next round"} <ArrowRightIcon size={20} />
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
