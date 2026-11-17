"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Scoreboard } from "@/components/game/Scoreboard";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { FeedbackToast } from "@/components/game/FeedbackToast";
import { GameShell } from "@/components/game/GameShell";
import { EndGameButton } from "@/components/game/EndGameButton";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { useClock } from "@/lib/games/core/useClock";
import { ACTIONS, elapsedMs, formatTime, pairsFound, selectActiveTeam } from "@/lib/games/twin-hunt/engine";
import { Board } from "./Board";
import { feedbackFromEvent } from "./feedback";

/** How long two non-twins stay face up before turning back. */
const MISS_HOLD_MS = 1100;

export function PlayScreen({ state, dispatch }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const team = selectActiveTeam(state);
  const solo = state.teams.length === 1;
  const running = !!state.clock.since;
  const now = useClock(running);
  const totalPairs = state.cards.length / 2;
  const found = pairsFound(state);
  const event = state.lastEvent;
  const best = state.bests[String(state.settings.pairs)];
  const paused = !running && state.moves > 0;

  const act = (type, extra) => dispatch({ type, now: Date.now(), ...extra });

  // Two non-twins: let everyone see them, then turn them back (and pass the turn).
  useEffect(() => {
    if (!state.miss) return undefined;
    const timer = setTimeout(() => dispatch({ type: ACTIONS.HIDE_MISS, now: Date.now() }), MISS_HOLD_MS);
    return () => clearTimeout(timer);
  }, [state.miss, dispatch]);

  // Hold the clock while the tab is hidden; the next flip starts it again.
  const pauseIfRunning = useEffectEvent(() => {
    if (running) act(ACTIONS.PAUSE);
  });
  useEffect(() => {
    const onVisibility = () => document.visibilityState === "hidden" && pauseIfRunning();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const teamColors = solo ? null : Object.fromEntries(state.teams.map((t) => [t.id, t.color]));

  return (
    <GameShell
      wide
      teamColor={team.color}
      right={
        <>
          <span className="mr-0.5 whitespace-nowrap chip px-3 py-1.5 text-sm font-semibold tabular-nums" aria-label={`${found} of ${totalPairs} pairs found`}>
            {found}/{totalPairs}
            <span className="hidden min-[360px]:inline"> pairs</span>
          </span>
          <EndGameButton onClick={() => setConfirmEnd(true)} />
        </>
      }
    >
      <FeedbackToast message={feedbackFromEvent(state, event)} />

      <Scoreboard teams={state.teams} activeTeamId={team.id} />

      <div className="mb-3 mt-3 flex items-center justify-between gap-3 sm:mb-5 sm:mt-5">
        {solo ? (
          <div className="flex min-w-0 flex-1 items-end gap-5 sm:gap-8">
            <Stat label="Moves" value={state.moves} />
            <Stat label="Time" value={formatTime(elapsedMs(state, now))} muted={paused} />
            {best ? <Stat label="Best" value={`${best.moves} moves`} small /> : null}
          </div>
        ) : (
          <TurnIndicator team={team} hint="Flip two cards. Find twins to go again." />
        )}
        {paused ? <span className="chip shrink-0 px-3 py-1.5 text-xs font-semibold text-muted sm:text-sm">Paused · flip to go on</span> : null}
      </div>

      <Board
        cards={state.cards}
        flipped={state.flipped}
        miss={state.miss}
        freshPair={event?.type === "match" ? event.pair : []}
        teamColors={teamColors}
        disabled={state.miss || confirmEnd}
        onFlip={(index) => act(ACTIONS.FLIP, { index })}
      />

      <ConfirmDialog
        open={confirmEnd}
        title="End the game?"
        body={solo ? "This board won’t count toward your best." : "We’ll skip to the final standings with the pairs found so far."}
        confirmLabel="End game"
        tone="danger"
        onCancel={() => setConfirmEnd(false)}
        onConfirm={() => {
          setConfirmEnd(false);
          act(ACTIONS.END_GAME);
        }}
      />
    </GameShell>
  );
}

function Stat({ label, value, muted = false, small = false }) {
  return (
    <p className="min-w-0">
      <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-subtle sm:text-xs">{label}</span>
      <span
        className={`block whitespace-nowrap font-display font-bold tabular-nums leading-none ${small ? "mt-1 text-lg sm:text-xl" : "text-3xl sm:text-4xl"} ${muted ? "text-subtle" : ""}`}
      >
        {value}
      </span>
    </p>
  );
}
