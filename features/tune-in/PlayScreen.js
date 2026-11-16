"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Scoreboard } from "@/components/game/Scoreboard";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { Countdown } from "@/components/game/Countdown";
import { ReadyCard } from "@/components/game/ReadyCard";
import { FeedbackToast } from "@/components/game/FeedbackToast";
import { GameShell } from "@/components/game/GameShell";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { BulbIcon, EyeIcon, FlagIcon, PauseIcon, RefreshIcon } from "@/components/ui/icons";
import { useClock } from "@/lib/games/core/useClock";
import {
  ACTIONS,
  CLUE_COST,
  TURN,
  pointsNow,
  remainingMs,
  secondsToNextTier,
  selectActiveTeam,
  selectTeam,
  selectWordCount,
  turnSecondsFor,
} from "@/lib/games/tune-in/engine";
import { ClipPlayer } from "./ClipPlayer";
import { feedbackFromEvent } from "./feedback";

/**
 * @param {{ state: any, dispatch: Function, onSkip: () => Promise<void>, skipping: boolean }} props
 */
export function PlayScreen({ state, dispatch, onSkip, skipping }) {
  const [dialog, setDialog] = useState(null); // "giveUp" | "end" | null
  // True while a confirm sheet has the clock stopped mid-turn: the player stays on
  // screen behind the sheet, and Cancel picks the turn straight back up.
  const [held, setHeld] = useState(false);
  const [guess, setGuess] = useState("");
  const inputRef = useRef(null);
  const team = selectActiveTeam(state);
  const song = state.song;
  const running = state.turn.status === TURN.RUNNING;
  const paused = state.turn.status === TURN.PAUSED;
  const showBoard = running || (held && paused);
  const now = useClock(running);
  const left = remainingMs(state, now);
  const totalMs = turnSecondsFor(state) * 1000;
  const event = state.lastEvent;
  const wrongShake = event?.type === "wrong";
  const wordCount = selectWordCount(state);
  const dropIn = secondsToNextTier(state.heardSeconds);

  const act = (type, extra) => dispatch({ type, ...extra });
  const startTurn = () => act(ACTIONS.START_TURN, { now: Date.now() });
  const pause = () => act(ACTIONS.PAUSE, { now: Date.now() });
  // Give up / End: stop the clock while the player decides, without swapping the board out.
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
      startTurn();
    }
  };
  const confirmDialog = (type) => {
    setDialog(null);
    setHeld(false);
    act(type);
  };

  // Time's up: the engine double-checks the clock, so an early tick is ignored.
  const timedOut = running && left <= 0;
  useEffect(() => {
    if (timedOut) dispatch({ type: ACTIONS.TIME_UP, now: Date.now() });
  }, [timedOut, dispatch]);

  // Keep the cursor in the guess box when a turn starts, and after a wrong guess.
  const eventSeq = event?.seq;
  useEffect(() => {
    if (running) inputRef.current?.focus();
  }, [running, eventSeq]);

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

  // Enter starts or resumes a turn (typing happens in the guess box).
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

  const submitGuess = (e) => {
    e.preventDefault();
    if (!running || !guess.trim()) return;
    act(ACTIONS.GUESS, { title: guess, now: Date.now() });
    setGuess("");
  };

  const clue = [song.year, song.composer && `Music: ${song.composer}`].filter(Boolean).join(" · ");

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
          <button type="button" className="btn btn-ghost h-10 px-2 text-sm sm:px-3" onClick={() => openDialog("end")} aria-label="End game">
            <FlagIcon size={18} />
            <span className="hidden md:inline">End</span>
          </button>
        </>
      }
    >
      <FeedbackToast message={feedbackFromEvent(state, event)} />

      <Scoreboard teams={state.teams} activeTeamId={team.id} />

      {showBoard ? (
      <>
      <div className="mt-3 sm:mt-6">
        <TurnIndicator solo={state.teams.length === 1} team={team} hint={state.steal ? "Steal! Half time, half points" : "Play, pause, and guess the movie"} />
      </div>

      <section aria-label="Song clip" className="card mt-3 rounded-[1.5rem] p-4 sm:mt-5 sm:rounded-[2rem] sm:p-8">
        <div className="min-w-0">
          <div className="lg:grid lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-center lg:gap-12">
            <ClipPlayer
              src={song.preview}
              enabled={running}
              heardSeconds={state.heardSeconds}
              color={team.color}
              onHeard={(seconds) => act(ACTIONS.HEARD, { seconds })}
            />

            <div className="mt-6 lg:mt-0">
              <div className="flex items-center justify-between gap-2 px-0.5">
                <div className="flex min-w-0 items-center gap-3">
                  <Countdown remainingMs={left} totalMs={totalMs} color={team.color} paused={!running} />
                  <div className="min-w-0">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-subtle sm:text-xs">Worth right now</p>
                    <p className="font-display text-3xl font-extrabold tabular-nums text-accent-3 sm:text-4xl">{pointsNow(state)}</p>
                    <p className="text-xs tabular-nums text-subtle">
                      {dropIn == null ? "Lowest prize" : dropIn === 0 ? "Drops on the next second" : `Drops after ${dropIn}s more`}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary h-9 px-3 text-xs sm:text-sm"
                    onClick={() => act(ACTIONS.USE_CLUE)}
                    disabled={!running || state.clueShown}
                    aria-label={`Show clue, costs ${CLUE_COST} points`}
                  >
                    <BulbIcon size={15} /> Clue <span className="text-miss">−{CLUE_COST}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary h-9 px-3 text-xs hover:border-miss/60 hover:text-miss sm:text-sm"
                    onClick={() => openDialog("giveUp")}
                    disabled={!running}
                    aria-label="Give up this round and reveal the movie"
                  >
                    <EyeIcon size={15} /> Give up
                  </button>
                </div>
              </div>

              <p className="mt-4 min-h-5 text-sm text-muted" aria-live="polite">
                {state.clueShown ? (
                  <>
                    <BulbIcon size={14} className="mr-1 inline align-[-2px] text-accent-3" />
                    {clue || "No clue for this one, sorry!"}
                  </>
                ) : (
                  `${wordCount === 1 ? "One word" : `${wordCount} words`} in the movie title`
                )}
              </p>

              <form onSubmit={submitGuess} className={`mt-3 flex gap-2 ${wrongShake ? "anim-shake" : ""}`} key={wrongShake ? `miss-${event.seq}` : "form"}>
                <label htmlFor="tune-guess" className="sr-only">
                  Movie name
                </label>
                <input
                  ref={inputRef}
                  id="tune-guess"
                  name="tune-guess"
                  autoComplete="off"
                  autoCapitalize="words"
                  spellCheck={false}
                  enterKeyHint="send"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  disabled={!running}
                  placeholder="Name the movie"
                  className="h-12 min-w-0 flex-1 field px-4 text-base font-medium sm:h-14 sm:text-lg"
                />
                <button type="submit" className="btn btn-primary h-12 shrink-0 px-5 text-base sm:h-14 sm:px-7" disabled={!running || !guess.trim()}>
                  Guess
                </button>
              </form>
              <p className="mt-1.5 px-1 text-xs text-subtle">Spelling is forgiving: Bahubali, Baahubali, both count.</p>

              {state.guesses.length ? (
                <ul aria-label="Wrong guesses" className="mt-3 flex flex-wrap gap-1.5">
                  {state.guesses.map((g, i) => (
                    <li
                      key={`${i}-${g.text}`}
                      className="chip px-2.5 py-1 text-xs text-muted line-through decoration-miss/70"
                      style={{ borderColor: selectTeam(state, g.teamId)?.color }}
                    >
                      {g.text}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>

      </section>
      </>
      ) : (
        <ReadyCard
          team={team}
          solo={state.teams.length === 1}
          eyebrow={state.steal ? "Steal chance" : `Round ${state.round}`}
          paused={paused}
          pausedNote="The music stops while paused."
          seconds={Math.ceil(left / 1000)}
          onStart={startTurn}
        >
          {/* A still equaliser: the clip is waiting. */}
          <div className="mx-auto mt-5 flex h-12 items-end justify-center gap-1.5" aria-hidden="true">
            {[45, 80, 60, 100, 70, 90, 50, 75, 40].map((h, i) => (
              <span key={i} className="w-2.5 rounded-full" style={{ height: `${h}%`, background: `color-mix(in oklab, ${team.color} ${55 + (i % 3) * 15}%, transparent)` }} />
            ))}
          </div>
          {state.steal ? (
            <p className="mt-4 text-sm font-semibold text-accent-3">Half time, half points · play the clip as much as you like</p>
          ) : (
            <>
              <p className="mt-4 text-sm text-muted">Press play when you’re ready. The less you hear, the more it’s worth.</p>
              <button
                type="button"
                className="mx-auto mt-3 flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-subtle transition hover:bg-surface-strong hover:text-foreground disabled:opacity-50"
                onClick={onSkip}
                disabled={skipping}
              >
                <RefreshIcon size={13} /> {skipping ? "Finding another…" : "Swap for another song"}
              </button>
            </>
          )}
        </ReadyCard>
      )}

      <ConfirmDialog
        open={dialog === "giveUp"}
        title="Give up this round?"
        body="The movie is revealed and nobody scores. The next round starts fresh."
        confirmLabel="Give up & reveal"
        onCancel={cancelDialog}
        onConfirm={() => confirmDialog(ACTIONS.GIVE_UP)}
      />
      <ConfirmDialog
        open={dialog === "end"}
        title="End the game?"
        body="We’ll skip to the final standings. This round won’t be finished."
        confirmLabel="End game"
        tone="danger"
        onCancel={cancelDialog}
        onConfirm={() => confirmDialog(ACTIONS.END_GAME)}
      />
    </GameShell>
  );
}
