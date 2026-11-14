"use client";

import { useState } from "react";
import { Confetti } from "@/components/game/Confetti";
import { GameShell } from "@/components/game/GameShell";
import { Scoreboard } from "@/components/game/Scoreboard";
import { TeamBadge } from "@/components/game/TeamBadge";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ArrowRightIcon, FlagIcon } from "@/components/ui/icons";
import { teamText } from "@/lib/games/core/teams";
import { ACTIONS, playerMark, selectPlayer } from "@/lib/games/imposter/engine";
import { categoryLabel } from "@/lib/games/imposter/words";

const HEADLINES = {
  caught: { title: "The crew wins!", tone: "var(--hit)" },
  stolen: { title: "Caught, but they stole it!", tone: "var(--accent-2)" },
  escaped: { title: "The imposter got away!", tone: "var(--accent-2)" },
};

export function RoundOverScreen({ state, dispatch }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const result = state.roundResult;
  const voted = selectPlayer(state, result.votedId);
  const imposters = state.imposterIds.map((id) => selectPlayer(state, id)).filter(Boolean);
  const many = imposters.length > 1;
  const headline = { ...HEADLINES[result.outcome] };
  if (result.outcome === "escaped" && many) headline.title = "The imposters got away!";

  const detail =
    result.outcome === "caught"
      ? `${voted.name} was voted out and couldn’t name the word.`
      : result.outcome === "stolen"
        ? `${voted.name} was voted out but named the secret word.`
        : `${voted.name} was voted out, and they were innocent.`;

  return (
    <GameShell teamColor={result.outcome === "caught" ? "#3ddc84" : "#ff4d6d"}>
      <Confetti />

      <section className="relative pt-4 text-center sm:pt-8">
        <p className="anim-rise text-xs font-semibold uppercase tracking-[0.2em] text-subtle">Round {state.round} complete</p>
        <h1
          className="anim-rise mt-3 font-display text-[clamp(2.1rem,7vw,3.75rem)] font-extrabold leading-none tracking-[-0.03em]"
          style={{ color: headline.tone }}
        >
          {headline.title}
        </h1>
        <p className="anim-rise mx-auto mt-3 max-w-md text-muted">{detail}</p>
      </section>

      <section className="card anim-rise relative mt-7 grid gap-5 rounded-[1.75rem] p-5 sm:grid-cols-2 sm:p-7" style={{ animationDelay: "120ms" }}>
        <div className="text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">The secret word</p>
          <p className="mt-2 break-words font-display text-[clamp(2rem,7vw,2.75rem)] font-extrabold leading-tight">{state.word.text}</p>
          <p className="chip mx-auto mt-2 w-fit px-3 py-1 text-sm font-semibold sm:mx-0">{categoryLabel(state.word.category)}</p>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">{many ? "The imposters" : "The imposter"}</p>
          <ul className="mt-3 flex flex-col items-center gap-2 sm:items-start">
            {imposters.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <TeamBadge color={p.color}>{playerMark(p.name)}</TeamBadge>
                <span className="font-display text-2xl font-bold" style={{ color: teamText(p.color) }}>
                  {p.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative mt-8" aria-labelledby="standings-heading">
        <h2 id="standings-heading" className="mb-3 px-1 font-display text-xl font-bold tracking-tight">
          Standings
        </h2>
        <Scoreboard variant="ranked" teams={state.players} roundPoints={result.points} />
      </section>

      <div className="relative mt-8 flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="button"
          autoFocus
          className="btn btn-primary h-14 text-base sm:h-16 sm:flex-1 sm:text-lg"
          onClick={() => dispatch({ type: ACTIONS.NEXT_ROUND, seed: Math.random() })}
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
