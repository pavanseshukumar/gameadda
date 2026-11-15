"use client";

import { useState } from "react";
import { GameShell } from "@/components/game/GameShell";
import { Scoreboard } from "@/components/game/Scoreboard";
import { Confetti } from "@/components/game/Confetti";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ArrowRightIcon, FlagIcon } from "@/components/ui/icons";
import { isSolo, teamText } from "@/lib/games/core/teams";
import { ACTIONS, MAX_GUESSES, selectActiveTeam, selectNextPairing, selectTeam } from "@/lib/games/word-swap/engine";
import { GuessGrid } from "./GuessGrid";

export function TurnOverScreen({ state, dispatch }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const team = selectActiveTeam(state);
  const setter = selectTeam(state, state.setterId);
  const result = state.turnResult;
  const solved = result.outcome === "solved";
  const next = selectNextPairing(state);
  const solo = isSolo(state.teams);
  const usesRandom = solo || state.settings.source === "random";

  const nextLabel = next
    ? usesRandom
      ? `Next: ${next.guesser.name}`
      : `Next: ${next.setter.name} sets for ${next.guesser.name}`
    : solo
      ? "Next word"
      : `Start round ${state.round + 1}`;

  return (
    <GameShell teamColor={team.color}>
      {solved ? <Confetti /> : null}

      <section className="relative pt-6 text-center sm:pt-10">
        <p className="anim-rise text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          Round {state.round}
          {setter ? ` · ${setter.name}’s word` : ""}
        </p>
        <h1 className="anim-rise mt-4 font-display text-[clamp(2.1rem,7vw,3.75rem)] font-extrabold leading-none tracking-[-0.03em]">
          {solo ? null : <>{team.name} </>}
          <span style={{ color: solved ? teamText(team.color) : "var(--miss)" }}>
            {solved ? (solo ? "Cracked it!" : "cracked it!") : result.outcome === "failed" ? (solo ? "Out of guesses" : "ran out of guesses") : solo ? "Gave up" : "gave up"}
          </span>
        </h1>
        <p className="anim-rise mx-auto mt-3 max-w-md text-muted">
          {solved
            ? `In ${state.guesses.length} of ${MAX_GUESSES} guesses · +${result.points}`
            : "No points this turn."}
        </p>
      </section>

      <section className="card anim-rise relative mt-8 rounded-[2rem] p-5 text-center sm:p-8" style={{ animationDelay: "120ms" }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">The word was</p>
        <p className="anim-pop mt-2 font-display text-5xl font-extrabold tracking-[0.12em] text-accent-2">{state.word}</p>
        {state.hint ? <p className="mt-1 text-sm text-subtle">Hint: {state.hint}</p> : null}
        {state.guesses.length ? (
          <div className="mx-auto mt-6 max-w-sm" style={{ "--swap-tile": "clamp(1.8rem, 8vw, 2.6rem)" }}>
            <GuessGrid word={state.word} guesses={state.guesses} revealAll />
          </div>
        ) : null}
      </section>

      <section className="relative mt-8" aria-labelledby="standings-heading">
        <h2 id="standings-heading" className="mb-3 px-1 font-display text-xl font-bold tracking-tight">
          Standings
        </h2>
        <Scoreboard variant="ranked" teams={state.teams} roundPoints={result.points ? { [team.id]: result.points } : {}} />
      </section>

      <div className="relative mt-8 flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="button"
          autoFocus
          className="btn btn-primary h-14 text-base sm:h-16 sm:flex-1 sm:text-lg"
          onClick={() => dispatch({ type: ACTIONS.NEXT_TURN, seed: Math.random() })}
        >
          {nextLabel} <ArrowRightIcon size={20} />
        </button>
        <button type="button" className="btn btn-secondary h-14 px-8 text-base sm:h-16" onClick={() => setConfirmEnd(true)}>
          <FlagIcon size={18} /> Finish game
        </button>
      </div>

      <ConfirmDialog
        open={confirmEnd}
        title="Finish the game?"
        body={next ? "Teams still waiting this round won’t get their turn." : "See the final standings and crown the champion."}
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
