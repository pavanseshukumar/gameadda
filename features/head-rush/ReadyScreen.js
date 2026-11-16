"use client";

import { useState } from "react";
import { GameShell } from "@/components/game/GameShell";
import { Scoreboard } from "@/components/game/Scoreboard";
import { ReadyCard } from "@/components/game/ReadyCard";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { FlagIcon } from "@/components/ui/icons";
import { ACTIONS, selectActiveTeam } from "@/lib/games/head-rush/engine";

/** Between turns: who's up, how to hold the phone, and the Start button. */
export function ReadyScreen({ state, dispatch, onStart }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const team = selectActiveTeam(state);
  const { turnSeconds, wordsPerTurn, rounds } = state.settings;

  return (
    <GameShell
      teamColor={team.color}
      right={
        <>
          <span className="chip whitespace-nowrap px-3 py-1.5 text-sm font-semibold tabular-nums">
            Round {state.round}/{rounds}
          </span>
          <button type="button" className="btn btn-ghost h-10 px-2 text-sm sm:px-3" onClick={() => setConfirmEnd(true)} aria-label="End game">
            <FlagIcon size={18} />
            <span className="hidden md:inline">End</span>
          </button>
        </>
      }
    >
      <Scoreboard teams={state.teams} activeTeamId={team.id} />

      <ReadyCard team={team} eyebrow={`Round ${state.round} · Your turn`} seconds={turnSeconds} onStart={onStart}>
        {/* A phone tipped sideways, as it'll sit on the guesser's forehead. */}
        <div className="mx-auto mt-5 grid h-16 w-28 place-items-center rounded-2xl border-[3px] border-[var(--foreground)] bg-[var(--panel)] font-display text-xl" aria-hidden="true">
          ?
        </div>
        <ol className="mx-auto mt-4 max-w-xs space-y-1.5 text-left text-sm text-muted">
          <li>
            <span className="font-semibold text-foreground">1.</span> Pick a guesser and hand them the phone.
          </li>
          <li>
            <span className="font-semibold text-foreground">2.</span> Tap Start, then hold it to your forehead, sideways, screen out.
          </li>
          <li>
            <span className="font-semibold text-foreground">3.</span> Swipe right when you get it, left to pass.
          </li>
        </ol>
        <p className="mt-3 text-sm text-subtle">
          {wordsPerTurn} words · {turnSeconds} seconds
        </p>
      </ReadyCard>

      <ConfirmDialog
        open={confirmEnd}
        title="End the game?"
        body="We’ll skip to the final standings."
        confirmLabel="End game"
        tone="danger"
        onCancel={() => setConfirmEnd(false)}
        onConfirm={() => {
          setConfirmEnd(false);
          dispatch({ type: ACTIONS.END_GAME });
        }}
      />
    </GameShell>
  );
}
