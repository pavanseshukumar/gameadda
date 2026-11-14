"use client";

import { useState } from "react";
import { TeamBadge } from "@/components/game/TeamBadge";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ChevronLeftIcon, EyeIcon, MaskIcon } from "@/components/ui/icons";
import { teamText } from "@/lib/games/core/teams";
import { ACTIONS, PHASES, playerMark, selectPlayer } from "@/lib/games/imposter/engine";
import { categoryLabel } from "@/lib/games/imposter/words";
import { RoundShell } from "./RoundShell";

/** The group's vote (host taps the player), then the caught imposter's one guess at the word. */
export function VoteScreen({ state, dispatch, onEnd }) {
  return state.phase === PHASES.GUESS ? (
    <GuessStep state={state} dispatch={dispatch} onEnd={onEnd} />
  ) : (
    <VoteStep state={state} dispatch={dispatch} onEnd={onEnd} />
  );
}

function VoteStep({ state, dispatch, onEnd }) {
  const [pick, setPick] = useState(null);
  const picked = selectPlayer(state, pick);
  const many = state.imposterIds.length > 1;

  return (
    <RoundShell state={state} teamColor="#ff4d6d" onEnd={onEnd} step="The vote">
      <section className="anim-rise text-center">
        <h1 className="font-display text-[clamp(1.9rem,7vw,3rem)] font-extrabold leading-tight tracking-tight">
          Who’s {many ? "an" : "the"} imposter?
        </h1>
        <p className="mx-auto mt-2 max-w-md text-muted">Count down from three and everyone points. Tap the player most people chose.</p>
      </section>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {state.players.map((player) => (
          <li key={player.id}>
            <button
              type="button"
              onClick={() => setPick(player.id)}
              className="btn btn-secondary h-auto w-full flex-col gap-2 whitespace-normal p-4"
              style={{ "--team": player.color }}
            >
              <TeamBadge color={player.color} className="size-12 text-lg">
                {playerMark(player.name)}
              </TeamBadge>
              <span className="w-full truncate text-base">{player.name}</span>
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="mx-auto mt-6 flex items-center gap-1 text-sm font-semibold text-subtle underline-offset-4 hover:text-foreground hover:underline"
        onClick={() => dispatch({ type: ACTIONS.BACK_TO_DISCUSS })}
      >
        <ChevronLeftIcon size={16} /> Back to the discussion
      </button>

      <ConfirmDialog
        open={!!picked}
        title={picked ? `Vote out ${picked.name}?` : ""}
        body="No take-backs: the card is revealed as soon as you confirm."
        confirmLabel="Vote them out"
        onCancel={() => setPick(null)}
        onConfirm={() => {
          const id = pick;
          setPick(null);
          dispatch({ type: ACTIONS.VOTE, playerId: id });
        }}
      />
    </RoundShell>
  );
}

function GuessStep({ state, dispatch, onEnd }) {
  const [revealed, setRevealed] = useState(false);
  const imposter = selectPlayer(state, state.votedId);

  return (
    <RoundShell state={state} teamColor={imposter.color} onEnd={onEnd} step="Caught!">
      <section
        className="card anim-pop mx-auto mt-2 w-full max-w-md rounded-[1.75rem] p-6 text-center sm:p-8"
        style={{ borderColor: "var(--accent-2)", boxShadow: "0 6px 0 0 var(--accent-2)" }}
      >
        <span className="mx-auto grid size-16 place-items-center rounded-full border-2 border-edge bg-accent-2 text-[var(--accent-2-ink)]">
          <MaskIcon size={34} strokeWidth={2.2} />
        </span>
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span style={{ color: teamText(imposter.color) }}>{imposter.name}</span> was {state.imposterIds.length > 1 ? "an" : "the"} imposter!
        </h1>

        {!revealed ? (
          <>
            <p className="mt-3 text-muted">
              One last chance: {imposter.name}, say your guess for the secret word out loud. Then reveal it.
            </p>
            <button type="button" autoFocus className="btn btn-primary mt-7 h-14 w-full text-base" onClick={() => setRevealed(true)}>
              <EyeIcon size={20} /> Reveal the word
            </button>
          </>
        ) : (
          <>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-subtle">The secret word was</p>
            <p className="anim-pop mt-2 break-words font-display text-[clamp(2.2rem,10vw,3.25rem)] font-extrabold leading-none">{state.word.text}</p>
            <p className="chip mx-auto mt-3 w-fit px-3 py-1 text-sm font-semibold">{categoryLabel(state.word.category)}</p>
            <p className="mt-6 font-semibold">Did {imposter.name} guess it?</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button type="button" className="btn btn-secondary h-14 text-base" onClick={() => dispatch({ type: ACTIONS.IMPOSTER_GUESS, correct: true })}>
                Got it
              </button>
              <button type="button" className="btn btn-primary h-14 text-base" onClick={() => dispatch({ type: ACTIONS.IMPOSTER_GUESS, correct: false })}>
                Missed it
              </button>
            </div>
          </>
        )}
      </section>
    </RoundShell>
  );
}
