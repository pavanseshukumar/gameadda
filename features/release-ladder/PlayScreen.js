"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Scoreboard } from "@/components/game/Scoreboard";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { Countdown } from "@/components/game/Countdown";
import { GameShell } from "@/components/game/GameShell";
import { EndGameButton } from "@/components/game/EndGameButton";
import { ReadyCard } from "@/components/game/ReadyCard";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ArrowRightIcon, PauseIcon } from "@/components/ui/icons";
import { useClock } from "@/lib/games/core/useClock";
import { ACTIONS, CLOCK, PERFECT_BONUS, PHASES, SLOT_POINTS, isTimed, remainingMs, selectActiveTeam, turnMs } from "@/lib/games/release-ladder/engine";
import { LadderList } from "./LadderList";

/** The ready card before a turn, then the ladder to sort. */
export function PlayScreen({ state, dispatch }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const team = selectActiveTeam(state);
  const solo = state.teams.length === 1;
  const timed = isTimed(state);
  const playing = state.phase === PHASES.PLAYING;
  const running = playing && state.clock.status === CLOCK.RUNNING;
  const paused = playing && timed && !running;
  const now = useClock(running);
  const left = remainingMs(state, now);

  const act = (type, extra) => dispatch({ type, now: Date.now(), ...extra });

  // Time's up: the engine double-checks the clock, so an early tick is ignored.
  const timedOut = running && left <= 0;
  useEffect(() => {
    if (timedOut) dispatch({ type: ACTIONS.TIME_UP, now: Date.now() });
  }, [timedOut, dispatch]);

  const pauseIfRunning = useEffectEvent(() => {
    if (running) act(ACTIONS.PAUSE);
  });
  useEffect(() => {
    const onVisibility = () => document.visibilityState === "hidden" && pauseIfRunning();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <GameShell
      teamColor={team.color}
      right={
        <>
          <span className="mr-0.5 whitespace-nowrap chip px-3 py-1.5 text-sm font-semibold tabular-nums">
            <span className="hidden min-[360px]:inline">Round </span>
            {state.round}
          </span>
          {timed && playing ? (
            <button type="button" className="btn btn-ghost h-10 px-2 text-sm sm:px-3" onClick={() => act(ACTIONS.PAUSE)} disabled={!running} aria-label="Pause timer">
              <PauseIcon size={18} />
              <span className="hidden md:inline">Pause</span>
            </button>
          ) : null}
          <EndGameButton onClick={() => setConfirmEnd(true)} />
        </>
      }
    >
      <Scoreboard teams={state.teams} activeTeamId={team.id} />

      {state.phase === PHASES.READY || paused ? (
        <ReadyCard
          team={team}
          solo={solo}
          eyebrow={`Round ${state.round}`}
          paused={paused}
          pausedNote="The clock is stopped. Your order is kept."
          seconds={timed ? Math.ceil((paused ? left : turnMs(state)) / 1000) : 0}
          onStart={() => act(paused ? ACTIONS.RESUME : ACTIONS.START_TURN)}
        >
          <p className="mt-2 text-sm text-muted">
            {state.ladder.length} Telugu movies, all mixed up. Put them in release order, oldest at the top.
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-subtle">
            {SLOT_POINTS} a movie · +{PERFECT_BONUS} for a perfect ladder
          </p>
        </ReadyCard>
      ) : (
        <>
          <div className="mt-3 flex items-center justify-between gap-3 sm:mt-6">
            <TurnIndicator solo={solo} team={team} hint="Drag the movies into release order." />
            {timed ? <Countdown remainingMs={left} totalMs={turnMs(state)} color={team.color} paused={!running} /> : null}
          </div>

          <section aria-label="Release ladder" className="mt-4 sm:mt-6">
            <p className="ladder-end">Oldest</p>
            <LadderList items={state.ladder} onMove={(from, to) => act(ACTIONS.MOVE, { from, to })} />
            <p className="ladder-end">Newest</p>
          </section>

          <div className="cta-bar mt-auto pt-5">
            <button type="button" className="btn btn-primary h-14 w-full text-base sm:h-16 sm:text-lg" onClick={() => act(ACTIONS.LOCK_IN)}>
              Lock it in <ArrowRightIcon size={20} />
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmEnd}
        title="End the game?"
        body="We’ll skip to the final standings. This ladder won’t count."
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
