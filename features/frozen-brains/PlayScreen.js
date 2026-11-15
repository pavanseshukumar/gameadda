"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Scoreboard } from "@/components/game/Scoreboard";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { Countdown } from "@/components/game/Countdown";
import { FeedbackToast } from "@/components/game/FeedbackToast";
import { GameShell } from "@/components/game/GameShell";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ArrowRightIcon, BulbIcon, EyeIcon, FlagIcon, PauseIcon } from "@/components/ui/icons";
import { X } from "lucide-react";
import { isSolo, teamText } from "@/lib/games/core/teams";
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
  const [guess, setGuess] = useState("");
  const inputRef = useRef(null);
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

  // A new card or a steal clears the box and puts the cursor back in it.
  const tryKey = `${state.round}-${state.activeTeamIndex}`;
  const [lastTry, setLastTry] = useState(tryKey);
  if (lastTry !== tryKey) {
    setLastTry(tryKey);
    setGuess("");
  }
  useEffect(() => {
    if (running) inputRef.current?.focus();
  }, [tryKey, running]);

  const submit = (e) => {
    e.preventDefault();
    if (!guess.trim() || !running) return;
    act(ACTIONS.GUESS, { guess });
    setGuess("");
    inputRef.current?.focus();
  };

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
          <button type="button" className="btn btn-ghost h-10 px-2 text-sm sm:px-3" onClick={() => { pause(); setDialog("reveal"); }} aria-label="Reveal the answer">
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

      <div className="mt-3 flex items-center justify-between gap-3 sm:mt-6">
        <TurnIndicator team={team} hint={state.steal ? "Steal! Half the time, half the points" : "Say it out loud, fast. Type what you hear."} />
        <Countdown remainingMs={left} totalMs={totalMs} color={team.color} paused={!running} />
      </div>

      <section
        aria-label="Puzzle"
        key={wrongShake ? `miss-${event.seq}` : "card"}
        className={`card relative mt-3 grid overflow-hidden rounded-[1.75rem] px-4 pb-5 pt-4 sm:mt-5 sm:rounded-[2rem] sm:px-10 sm:py-8 ${wrongShake ? "anim-shake" : ""}`}
      >
        <div className={`col-start-1 row-start-1 min-w-0 ${running ? "board-live" : "board-veiled"}`} aria-hidden={!running}>
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

          <form onSubmit={submit} className="mx-auto mt-4 flex w-full max-w-xl gap-2">
            <label htmlFor="fb-guess" className="sr-only">
              Your answer
            </label>
            <input
              ref={inputRef}
              id="fb-guess"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              disabled={!running}
              autoComplete="off"
              autoCapitalize="words"
              spellCheck={false}
              placeholder="What do you hear?"
              className="field h-14 min-w-0 flex-1 px-4 text-lg font-medium"
            />
            <button type="submit" className="btn btn-primary h-14 shrink-0 px-5 text-base" disabled={!running || !guess.trim()}>
              Guess <ArrowRightIcon size={18} />
            </button>
          </form>

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

        {!running ? (
          // Paused (button, hidden tab or a reload): the card is hidden until play resumes.
          <div className="z-10 col-start-1 row-start-1 grid place-items-center">
            <div className="sheet-panel anim-pop w-full max-w-sm rounded-[1.75rem] p-6 text-center" style={{ borderColor: team.color }}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: teamText(team.color) }}>
                Paused
              </p>
              <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">{team.name}</h2>
              <p className="mt-2 text-sm text-muted">The card is hidden while paused.</p>
              <button type="button" autoFocus className="btn btn-primary mt-6 h-14 w-full text-base" onClick={() => act(ACTIONS.RESUME)}>
                Resume · {Math.ceil(left / 1000)}s left <ArrowRightIcon size={18} />
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <ConfirmDialog
        open={dialog === "reveal"}
        title="Reveal the answer?"
        body="This ends the round with no points."
        confirmLabel="Reveal"
        onCancel={() => {
          setDialog(null);
          act(ACTIONS.RESUME);
        }}
        onConfirm={() => {
          setDialog(null);
          act(ACTIONS.REVEAL);
        }}
      />
      <ConfirmDialog
        open={dialog === "end"}
        title="End the game?"
        body="We’ll skip to the final standings. This card won’t count."
        confirmLabel="End game"
        tone="danger"
        onCancel={() => {
          setDialog(null);
          act(ACTIONS.RESUME);
        }}
        onConfirm={() => {
          setDialog(null);
          dispatch({ type: ACTIONS.END_GAME });
        }}
      />
    </GameShell>
  );
}
