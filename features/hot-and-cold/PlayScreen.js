"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Scoreboard } from "@/components/game/Scoreboard";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { Countdown } from "@/components/game/Countdown";
import { TurnHandoff } from "@/components/game/TurnHandoff";
import { FeedbackToast } from "@/components/game/FeedbackToast";
import { GameShell } from "@/components/game/GameShell";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { BulbIcon, EyeIcon, FlagIcon, PauseIcon } from "@/components/ui/icons";
import { useClock } from "@/lib/games/core/useClock";
import {
  ACTIONS,
  HINT_COST,
  TURN,
  currentPot,
  remainingMs,
  selectActiveTeam,
  selectCanHint,
  selectHints,
  selectRankedGuesses,
} from "@/lib/games/hot-and-cold/engine";
import { toGuessMovie } from "@/lib/games/hot-and-cold/temperature";
import { GuessBoard } from "./GuessBoard";
import { MovieSearch } from "./MovieSearch";
import { feedbackFromEvent } from "./feedback";

/**
 * @param {{ state: any, dispatch: Function, pool: import("@/lib/games/hot-and-cold/pool").HotColdPool | null }} props
 */
export function PlayScreen({ state, dispatch, pool }) {
  const [dialog, setDialog] = useState(null); // "reveal" | "end" | null
  const inputRef = useRef(null);
  const team = selectActiveTeam(state);
  const running = state.turn.status === TURN.RUNNING;
  const paused = state.turn.status === TURN.PAUSED;
  const now = useClock(running);
  const left = remainingMs(state, now);
  const totalMs = state.settings.turnSeconds * 1000;
  const event = state.lastEvent;
  const hints = selectHints(state);
  const guessedIds = new Set(state.guesses.map((g) => g.movie.id));

  const act = (type, extra) => dispatch({ type, ...extra });
  const startTurn = () => act(ACTIONS.START_TURN, { now: Date.now() });
  const pause = () => act(ACTIONS.PAUSE, { now: Date.now() });

  const timedOut = running && left <= 0;
  useEffect(() => {
    if (timedOut) dispatch({ type: ACTIONS.TIME_UP, now: Date.now() });
  }, [timedOut, dispatch]);

  // Each turn (and each new reading) puts the cursor back in the guess box.
  const eventSeq = event?.seq;
  useEffect(() => {
    if (running) inputRef.current?.focus();
  }, [running, eventSeq, team.id]);

  // Pause when the tab is hidden or the screen unmounts mid-turn.
  const pauseIfRunning = useEffectEvent(() => {
    if (running) pause();
  });
  useEffect(() => {
    const onVisibility = () => document.visibilityState === "hidden" && pauseIfRunning();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      pauseIfRunning();
    };
  }, []);

  // Enter starts or resumes a turn from the hand-off card.
  const onKeyDown = useEffectEvent((e) => {
    if (dialog || running || e.key !== "Enter") return;
    if (e.target instanceof HTMLElement && e.target.closest("input, textarea, button, [contenteditable]")) return;
    startTurn();
  });
  useEffect(() => {
    const handler = (e) => onKeyDown(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <GameShell
      wide
      teamColor={team.color}
      right={
        <>
          <span className="mr-0.5 whitespace-nowrap chip px-3 py-1.5 text-sm font-semibold tabular-nums">
            <span className="hidden min-[360px]:inline">Round </span>
            <span className="min-[360px]:hidden" aria-hidden="true">R</span>
            {state.round}
          </span>
          <button type="button" className="btn btn-ghost h-10 px-2 text-sm sm:px-3" onClick={pause} disabled={!running} aria-label="Pause timer">
            <PauseIcon size={18} />
            <span className="hidden md:inline">Pause</span>
          </button>
          <button type="button" className="btn btn-ghost h-10 px-2 text-sm sm:px-3" onClick={() => { pause(); setDialog("reveal"); }} aria-label="Reveal the movie">
            <EyeIcon size={18} />
            <span className="hidden md:inline">Reveal</span>
          </button>
          <button type="button" className="btn btn-ghost h-10 px-2 text-sm sm:px-3" onClick={() => { pause(); setDialog("end"); }} aria-label="End game">
            <FlagIcon size={18} />
            <span className="hidden md:inline">End</span>
          </button>
        </>
      }
    >
      <FeedbackToast message={feedbackFromEvent(state, event)} />

      <Scoreboard teams={state.teams} activeTeamId={team.id} />

      <div className="mt-3 sm:mt-6">
        <TurnIndicator team={team} hint="One guess per turn. Hotter means closer." />
      </div>

      <div className="mt-3 grid gap-4 sm:mt-5 lg:grid-cols-[minmax(0,24rem)_1fr] lg:items-start lg:gap-8">
        {/* Controls: timer, pot and hints sit right by the guess box. Sticky on laptops so it stays in view as the board grows. */}
        <section aria-label="Your guess" className="card relative rounded-[1.5rem] p-4 sm:rounded-[2rem] sm:p-6 lg:sticky lg:top-4">
          {running ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <Countdown remainingMs={left} totalMs={totalMs} color={team.color} />
                  <div className="min-w-0">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-subtle sm:text-xs">Pot</p>
                    <p className="font-display text-3xl font-extrabold tabular-nums text-accent-3 sm:text-4xl">{currentPot(state)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary h-9 shrink-0 px-3 text-xs sm:text-sm"
                  onClick={() => act(ACTIONS.USE_HINT)}
                  disabled={!selectCanHint(state)}
                  aria-label={`Reveal a hint, costs ${HINT_COST} points from the pot`}
                >
                  <BulbIcon size={15} /> Hint <span className="text-miss">−{HINT_COST}</span>
                </button>
              </div>

              <div className="mt-4">
                <MovieSearch
                  ref={inputRef}
                  pool={pool}
                  guessedIds={guessedIds}
                  disabled={!running}
                  onPick={(movie) => act(ACTIONS.GUESS, { movie: toGuessMovie(movie), now: Date.now() })}
                />
              </div>
              <p className="mt-1.5 px-1 text-xs text-subtle">Pick from the list. A guess passes the turn on.</p>
            </>
          ) : (
            <div className="grid place-items-center">
              <TurnHandoff
                team={team}
                paused={paused}
                seconds={Math.ceil(left / 1000)}
                detail={
                  paused
                    ? "Timer paused."
                    : state.guesses.length === 0
                      ? "Any Telugu movie will do for a first reading."
                      : `Pot is at ${currentPot(state)}. Study the board!`
                }
                onStart={startTurn}
              />
            </div>
          )}

          {hints.length ? (
            <ul className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4" aria-label="Hints">
              {hints.map((hint) => (
                <li key={hint.kind} className="flex items-baseline gap-2 text-sm">
                  <BulbIcon size={14} className="shrink-0 translate-y-0.5 text-accent-3" />
                  <span className="text-muted">{hint.label}</span>
                  <span className="font-semibold">{hint.text}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section aria-labelledby="board-heading">
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 id="board-heading" className="font-display text-xl font-bold tracking-tight">
              Readings
            </h2>
            <span className="text-sm text-subtle tabular-nums">
              {state.guesses.length} guess{state.guesses.length === 1 ? "" : "es"}
            </span>
          </div>
          <GuessBoard
            guesses={selectRankedGuesses(state)}
            teams={state.teams}
            latestIndex={event?.type === "guess" ? state.guesses.length - 1 : -1}
          />
        </section>
      </div>

      <ConfirmDialog
        open={dialog === "reveal"}
        title="Reveal the movie?"
        body="This ends the round with no winner."
        confirmLabel="Reveal movie"
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          setDialog(null);
          act(ACTIONS.GIVE_UP);
        }}
      />
      <ConfirmDialog
        open={dialog === "end"}
        title="End the game?"
        body="We’ll skip to the final standings. This round won’t be finished."
        confirmLabel="End game"
        tone="danger"
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          setDialog(null);
          act(ACTIONS.END_GAME);
        }}
      />
    </GameShell>
  );
}
