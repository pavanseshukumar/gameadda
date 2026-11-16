"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Scoreboard } from "@/components/game/Scoreboard";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { Countdown } from "@/components/game/Countdown";
import { AnswerSlots } from "@/components/game/AnswerSlots";
import { TileRack } from "@/components/game/TileRack";
import { FeedbackToast } from "@/components/game/FeedbackToast";
import { GameShell } from "@/components/game/GameShell";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { BackspaceIcon, BulbIcon, EyeIcon, FlagIcon, PauseIcon, ShuffleIcon } from "@/components/ui/icons";
import { ReadyCard, SoloScore, WordShape } from "@/components/game/ReadyCard";
import { useClock } from "@/lib/games/core/useClock";
import {
  ACTIONS,
  HINT_COST,
  MAX_HINTS,
  TURN,
  potentialBase,
  remainingMs,
  turnSecondsFor,
  selectActiveTeam,
  selectCanRevealLetter,
  selectMovie,
  selectSlotChars,
  selectWordLengths,
} from "@/lib/games/jumble-rumble/engine";
import { feedbackFromEvent } from "./feedback";

export function PlayScreen({ state, dispatch }) {
  const [dialog, setDialog] = useState(null); // "reveal" | "end" | null
  // True while a confirm sheet has the clock stopped mid-turn: the board stays on
  // screen behind the sheet, and Cancel picks the turn straight back up.
  const [held, setHeld] = useState(false);
  const team = selectActiveTeam(state);
  const movie = selectMovie(state);
  const running = state.turn.status === TURN.RUNNING;
  const now = useClock(running);
  const left = remainingMs(state, now);
  const totalMs = turnSecondsFor(state) * 1000;
  const wordLengths = selectWordLengths(state);
  const paused = state.turn.status === TURN.PAUSED;
  const showBoard = running || (held && paused);
  const solo = state.teams.length === 1;

  const chars = selectSlotChars(state);
  const usedIds = new Set(state.slots.filter(Boolean));
  const full = !state.slots.includes(null);
  const hintsLeft = state.hintsUsed < MAX_HINTS;
  const event = state.lastEvent;
  const wrongShake = event?.type === "wrong" || event?.type === "timeout";

  const act = (type, extra) => dispatch({ type, ...extra });
  const startTurn = () => act(ACTIONS.START_TURN, { now: Date.now() });
  const submit = () => act(ACTIONS.SUBMIT, { now: Date.now() });
  const pause = () => act(ACTIONS.PAUSE, { now: Date.now() });

  // Reveal / End: stop the clock while the player decides, without swapping the board out.
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

  // Physical keyboard: letters place tiles, Backspace removes, Enter submits/starts.
  const onKeyDown = useEffectEvent((e) => {
    if (dialog || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]")) return;
    if (!running) {
      if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) startTurn();
      return;
    }
    if (/^[a-z]$/i.test(e.key)) act(ACTIONS.PLACE_LETTER, { letter: e.key });
    else if (e.key === "Backspace") act(ACTIONS.BACKSPACE);
    else if (e.key === "Enter" && full) {
      e.preventDefault();
      submit();
    }
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
          <button type="button" className="btn btn-ghost h-10 px-2 text-sm sm:px-3" onClick={() => openDialog("reveal")} aria-label="Reveal the movie">
            <EyeIcon size={18} />
            <span className="hidden md:inline">Reveal</span>
          </button>
          <button type="button" className="btn btn-ghost h-10 px-2 text-sm sm:px-3" onClick={() => openDialog("end")} aria-label="End game">
            <FlagIcon size={18} />
            <span className="hidden md:inline">End</span>
          </button>
        </>
      }
    >
      <FeedbackToast message={feedbackFromEvent(state, event)} />

      {/* Solo: the score lives in the turn row instead, so nothing is shown twice. */}
      {solo ? null : <Scoreboard teams={state.teams} activeTeamId={team.id} />}

      {showBoard ? (
        <>
          <div className={`flex items-center justify-between gap-3 ${solo ? "" : "mt-3 sm:mt-6"}`}>
            {solo ? (
              <SoloScore score={team.score} />
            ) : (
              <TurnIndicator team={team} hint={state.steal ? "Steal! Half time, half points" : "First try, full points"} />
            )}
            <Countdown remainingMs={left} totalMs={totalMs} color={team.color} paused={!running} />
          </div>

          {/* Phones: puzzle up top, tiles and controls docked in the thumb zone.
              Laptops: answer on the left, tiles and controls on the right. */}
          <div className="flex flex-1 flex-col lg:mt-5 lg:flex-none lg:grid lg:grid-cols-2 lg:items-center lg:gap-8">
            <section
              aria-label="Puzzle"
              key={wrongShake ? `miss-${event.seq}` : "board"}
              className={`card mt-3 rounded-[1.5rem] px-3 pb-3 pt-3 sm:mt-5 sm:rounded-[2rem] sm:px-8 sm:py-7 lg:mt-0 ${wrongShake ? "anim-shake" : ""}`}
            >
              {/* What it's worth + hint buttons. */}
              <div className="mb-3 flex items-center justify-between gap-2 px-0.5 sm:mb-5">
                <p className="min-w-0 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-subtle sm:text-xs">
                  <span className="hidden sm:inline">Unscramble · </span>
                  <span className="tabular-nums text-accent-3">
                    {state.steal ? "½ × (" : ""}
                    {potentialBase(state.hintsUsed)} + speed{state.steal ? ")" : ""}
                  </span>
                </p>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    className="btn btn-secondary h-9 px-3 text-xs sm:text-sm"
                    onClick={() => act(ACTIONS.USE_CLUE)}
                    disabled={state.clueShown || !hintsLeft}
                    aria-label={`Show clue, costs ${HINT_COST} points`}
                  >
                    <BulbIcon size={15} /> Clue <span className="text-miss">−{HINT_COST}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary h-9 px-3 text-xs sm:text-sm"
                    onClick={() => act(ACTIONS.REVEAL_LETTER)}
                    disabled={!selectCanRevealLetter(state)}
                    aria-label={`Reveal a letter, costs ${HINT_COST} points`}
                  >
                    <EyeIcon size={15} /> Letter <span className="text-miss">−{HINT_COST}</span>
                  </button>
                </div>
              </div>

              <AnswerSlots
                wordLengths={wordLengths}
                chars={chars}
                locked={state.locked}
                onRemove={(index) => act(ACTIONS.REMOVE_SLOT, { index })}
              />
              <p className="mt-2 min-h-5 text-center text-sm text-muted sm:mt-3" aria-live="polite">
                {state.clueShown ? (
                  <>
                    <BulbIcon size={14} className="mr-1 inline align-[-2px] text-accent-3" />
                    {[movie.year, movie.lead].filter(Boolean).join(" · ")}
                  </>
                ) : null}
              </p>
            </section>

            <section aria-label="Letter tiles" className="dock">
              <TileRack tiles={state.tiles} usedIds={usedIds} onPick={(tileId) => act(ACTIONS.PLACE_TILE, { tileId })} />
              <div className="mt-3 flex items-center gap-2 sm:mt-5">
                <button type="button" className="btn btn-secondary size-12 shrink-0 p-0" onClick={() => act(ACTIONS.SHUFFLE, { seed: Math.random() })} aria-label="Shuffle tiles">
                  <ShuffleIcon size={20} />
                </button>
                <button type="button" className="btn btn-secondary size-12 shrink-0 p-0" onClick={() => act(ACTIONS.BACKSPACE)} aria-label="Remove last letter">
                  <BackspaceIcon size={20} />
                </button>
                <button type="button" className="btn btn-secondary h-12 shrink-0 px-4 text-sm" onClick={() => act(ACTIONS.CLEAR)}>
                  Clear
                </button>
                <button type="button" className="btn btn-primary h-12 min-w-0 flex-1 px-4 text-base" onClick={submit} disabled={!full}>
                  Submit
                </button>
              </div>
              <p className="mt-3 hidden text-center text-xs text-subtle lg:block">Tip: type letters, Backspace to undo, Enter to submit.</p>
            </section>
          </div>
        </>
      ) : (
        <ReadyCard
          team={team}
          solo={solo}
          eyebrow={state.steal ? "Steal chance" : `Round ${state.round}`}
          paused={paused}
          pausedNote="The tiles are hidden while paused."
          seconds={Math.ceil(left / 1000)}
          onStart={startTurn}
        >
          <WordShape lengths={wordLengths} />
          <p className="mt-3 text-sm text-muted">
            {wordLengths.length === 1 ? "One word" : `${wordLengths.length} words`} · {state.tiles.length} letters
          </p>
          {state.steal ? <p className="mt-1 text-sm font-semibold text-accent-3">Half the time, half the points</p> : null}
        </ReadyCard>
      )}

      <ConfirmDialog
        open={dialog === "reveal"}
        title="Reveal the movie?"
        body="This ends the round with no winner."
        confirmLabel="Reveal movie"
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

