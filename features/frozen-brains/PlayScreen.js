"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Scoreboard } from "@/components/game/Scoreboard";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { Countdown } from "@/components/game/Countdown";
import { FeedbackToast } from "@/components/game/FeedbackToast";
import { GameShell } from "@/components/game/GameShell";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { EndGameButton } from "@/components/game/EndGameButton";
import { GuessKeyboard, useTypedGuess } from "@/components/game/TypedGuess";
import { BulbIcon, EyeIcon, PauseIcon } from "@/components/ui/icons";
import { X } from "lucide-react";
import { isSolo } from "@/lib/games/core/teams";
import { ReadyCard } from "@/components/game/ReadyCard";
import { useClock } from "@/lib/games/core/useClock";
import {
  ACTIONS,
  CLOCK,
  HINT_COST,
  hintFor,
  potentialBase,
  remainingMs,
  selectActiveTeam,
  selectTeam,
  turnSecondsFor,
} from "@/lib/games/frozen-brains/engine";
import { categoryOf } from "@/lib/games/frozen-brains/puzzles";
import { feedbackFromEvent } from "./feedback";

const TILT = [-2.5, 1.5, -1, 2.5, -2, 1];

export function PlayScreen({ state, dispatch }) {
  const [dialog, setDialog] = useState(null); // "reveal" | "end" | null
  // True while a confirm sheet has the clock stopped mid-turn: the card stays on
  // screen behind the sheet, and Cancel picks the turn straight back up.
  const [held, setHeld] = useState(false);
  const team = selectActiveTeam(state);
  const puzzle = state.puzzle;
  const category = categoryOf(puzzle.category);
  const running = state.clock.status === CLOCK.RUNNING;
  const now = useClock(running);
  const left = remainingMs(state, now);
  const totalMs = turnSecondsFor(state) * 1000;
  const solo = isSolo(state.teams);
  const event = state.lastEvent;
  const wrongShake = event?.type === "wrong";

  const act = (type, extra) => dispatch({ type, now: Date.now(), ...extra });
  const pause = () => act(ACTIONS.PAUSE);
  const showBoard = running || held;

  // Reveal / End: stop the clock while the player decides, without swapping the card out.
  const openDialog = (name) => {
    if (running) {
      pause();
      setHeld(true);
    }
    setDialog(name);
  };
  const cancelDialog = () => {
    setDialog(null);
    if (held) {
      setHeld(false);
      act(ACTIONS.RESUME);
    }
  };

  // Time's up: the engine double-checks the clock, so an early tick is ignored.
  const timedOut = running && left <= 0;
  useEffect(() => {
    if (timedOut) dispatch({ type: ACTIONS.TIME_UP, now: Date.now() });
  }, [timedOut, dispatch]);

  // Hold the clock while the tab is hidden.
  const pauseIfRunning = useEffectEvent(() => {
    if (running) pause();
  });
  useEffect(() => {
    const onVisibility = () => document.visibilityState === "hidden" && pauseIfRunning();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Typed on the on-screen keyboard (or a laptop's keys), so the phone's own keyboard
  // never opens. A new card or a steal clears the box.
  const guess = useTypedGuess({
    enabled: running,
    blocked: !!dialog,
    resetKey: `${state.round}-${state.activeTeamIndex}`,
    onSubmit: (text) => act(ACTIONS.GUESS, { guess: text }),
  });

  return (
    <GameShell
      wide
      teamColor={team.color}
      right={
        <>
          <span className="mr-0.5 whitespace-nowrap chip px-3 py-1.5 text-sm font-semibold tabular-nums">
            <span className="hidden min-[360px]:inline">Card </span>
            {state.round}
          </span>
          <button type="button" className="btn btn-ghost h-10 px-2 text-sm sm:px-3" onClick={pause} disabled={!running} aria-label="Pause timer">
            <PauseIcon size={18} />
            <span className="hidden md:inline">Pause</span>
          </button>
          <button type="button" className="btn btn-ghost h-10 px-2 text-sm sm:px-3" onClick={() => openDialog("reveal")} aria-label="Reveal the answer">
            <EyeIcon size={18} />
            <span className="hidden md:inline">Reveal</span>
          </button>
          <EndGameButton onClick={() => openDialog("end")} />
        </>
      }
    >
      <FeedbackToast message={feedbackFromEvent(state, event)} />

      <Scoreboard teams={state.teams} activeTeamId={team.id} />

      {showBoard ? (
      <>
      <div className="mt-3 flex items-center justify-between gap-3 sm:mt-6">
        <TurnIndicator solo={state.teams.length === 1} team={team} hint={state.steal ? "Steal! Half the time, half the points" : "Say it out loud, fast. Type what you hear."} />
        <Countdown remainingMs={left} totalMs={totalMs} color={team.color} paused={!running} />
      </div>

      <section
        aria-label="Puzzle"
        key={wrongShake ? `miss-${event.seq}` : "card"}
        className={`card mt-3 rounded-[1.75rem] px-4 pb-5 pt-4 sm:mt-5 sm:rounded-[2rem] sm:px-10 sm:py-8 ${wrongShake ? "anim-shake" : ""}`}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="chip inline-flex items-center gap-2 px-3 py-1 text-xs sm:text-sm">
              <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: category.color }} />
              <span className="font-semibold">{category.label}</span>
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle sm:text-sm">
              Worth <span className="tabular-nums text-accent-3">{state.steal ? "½ × (" : ""}{potentialBase(state.hintUsed)} + speed{state.steal ? ")" : ""}</span>
            </p>
          </div>

          {/* The clue: each word an ice cube, read left to right. */}
          <p className="sr-only">Clue: {puzzle.clue}</p>
          <div aria-hidden="true" className="my-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-4 sm:my-10 sm:gap-x-4 sm:gap-y-5">
            {puzzle.clue.split(/\s+/).map((word, i) => (
              <span key={i} className="ice-word anim-pop" style={{ "--tilt": `${TILT[i % TILT.length]}deg`, animationDelay: `${i * 70}ms` }}>
                {word}
              </span>
            ))}
          </div>

          <p className="min-h-6 text-center text-sm text-muted sm:text-base" aria-live="polite">
            {state.hintUsed ? (
              <>
                <BulbIcon size={15} className="mr-1 inline align-[-2px] text-accent-3" />
                {hintFor(puzzle)}
              </>
            ) : null}
          </p>


          {state.wrongGuesses.length ? (
            <div className="mx-auto mt-3 flex max-w-xl flex-wrap items-center gap-1.5 text-xs">
              <span className="font-semibold text-subtle">Wrong guesses:</span>
              {state.wrongGuesses.map((g, i) => (
                <span key={i} className="wrong-guess" title={selectTeam(state, g.teamId)?.name}>
                  <X size={12} strokeWidth={3} aria-hidden="true" />
                  {g.text}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mx-auto mt-5 grid max-w-xl grid-cols-2 gap-2">
            <button type="button" className="btn btn-secondary h-12 text-sm" onClick={() => act(ACTIONS.USE_HINT)} disabled={!running || state.hintUsed}>
              <BulbIcon size={16} /> Hint <span className="text-miss">−{HINT_COST}</span>
            </button>
            <button type="button" className="btn btn-secondary h-12 text-sm" onClick={() => act(ACTIONS.PASS)} disabled={!running}>
              Pass
              <span className="text-subtle">{state.steal || solo ? "· ends round" : "· next team steals"}</span>
            </button>
          </div>
        </div>

      </section>

      <GuessKeyboard guess={guess} disabled={!running} placeholder="What do you hear?" />
      </>
      ) : (
        // Paused (button, hidden tab or a reload): the card is hidden until play resumes.
        <ReadyCard
          team={team}
          solo={solo}
          eyebrow={`Card ${state.round}`}
          paused
          pausedNote="The card is hidden while paused."
          seconds={Math.ceil(left / 1000)}
          onStart={() => act(ACTIONS.RESUME)}
        />
      )}

      <ConfirmDialog
        open={dialog === "reveal"}
        title="Reveal the answer?"
        body="This ends the round with no points."
        confirmLabel="Reveal"
        onCancel={cancelDialog}
        onConfirm={() => {
          setDialog(null);
          setHeld(false);
          act(ACTIONS.REVEAL);
        }}
      />
      <ConfirmDialog
        open={dialog === "end"}
        title="End the game?"
        body="We’ll skip to the final standings. This card won’t count."
        confirmLabel="End game"
        tone="danger"
        onCancel={cancelDialog}
        onConfirm={() => {
          setDialog(null);
          setHeld(false);
          dispatch({ type: ACTIONS.END_GAME });
        }}
      />
    </GameShell>
  );
}
