"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Scoreboard } from "@/components/game/Scoreboard";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { Countdown } from "@/components/game/Countdown";
import { ReadyCard, SoloScore } from "@/components/game/ReadyCard";
import { FeedbackToast } from "@/components/game/FeedbackToast";
import { GameShell } from "@/components/game/GameShell";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { EndGameButton } from "@/components/game/EndGameButton";
import { GuessKeyboard, useTypedGuess } from "@/components/game/TypedGuess";
import { BulbIcon, EyeIcon, PauseIcon, RefreshIcon } from "@/components/ui/icons";
import { useClock } from "@/lib/games/core/useClock";
import {
  ACTIONS,
  CLUE_COST,
  END_POINTS,
  START_POINTS,
  TURN,
  pointsAt,
  remainingMs,
  selectActiveTeam,
  selectEmojiTiles,
  selectMovie,
  selectTeam,
  selectWordCount,
  turnSecondsFor,
} from "@/lib/games/emoji-talkies/engine";
import { EmojiRow } from "./EmojiRow";
import { feedbackFromEvent } from "./feedback";

/** @param {{ state: any, dispatch: Function }} props */
export function PlayScreen({ state, dispatch }) {
  const [dialog, setDialog] = useState(null); // "reveal" | "end" | null
  // True while a confirm sheet has the clock stopped mid-turn: the emojis stay on
  // screen behind the sheet, and Cancel picks the turn straight back up.
  const [held, setHeld] = useState(false);
  const team = selectActiveTeam(state);
  const movie = selectMovie(state);
  const tiles = selectEmojiTiles(state);
  const running = state.turn.status === TURN.RUNNING;
  const paused = state.turn.status === TURN.PAUSED;
  const showBoard = running || (held && paused);
  const solo = state.teams.length === 1;
  const now = useClock(running);
  const left = remainingMs(state, now);
  const totalMs = turnSecondsFor(state) * 1000;
  const event = state.lastEvent;
  const wrongShake = event?.type === "wrong";
  const wordCount = selectWordCount(state);

  const act = (type, extra) => dispatch({ type, ...extra });
  const startTurn = () => act(ACTIONS.START_TURN, { now: Date.now() });
  const pause = () => act(ACTIONS.PAUSE, { now: Date.now() });

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

  // Typed on the on-screen keyboard (or a laptop's keys), so the phone's own keyboard never opens.
  const guess = useTypedGuess({
    enabled: running,
    blocked: !!dialog,
    resetKey: `${state.round}-${state.activeTeamIndex}-${state.movieId}`,
    onSubmit: (title) => act(ACTIONS.GUESS, { title, now: Date.now() }),
  });

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

  return (
    <GameShell
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
          <button type="button" className="btn btn-ghost h-10 px-2 text-sm sm:px-3" onClick={() => openDialog("reveal")} aria-label="Give up this round">
            <EyeIcon size={18} />
            <span className="hidden md:inline">Give up</span>
          </button>
          <EndGameButton onClick={() => openDialog("end")} />
        </>
      }
    >
      <FeedbackToast message={feedbackFromEvent(state, event)} />

      {solo ? null : <Scoreboard teams={state.teams} activeTeamId={team.id} />}

      {showBoard ? (
        <>
          <div className={solo ? "" : "mt-3 sm:mt-6"}>
            {solo ? (
              <SoloScore score={team.score} />
            ) : (
              <TurnIndicator team={team} hint={state.steal ? "Steal! Half time, half points" : "Guess as often as you like"} />
            )}
          </div>

          <section aria-label="Emoji puzzle" className="card mt-3 rounded-[1.5rem] p-4 sm:mt-5 sm:rounded-[2rem] sm:p-8">
            <div className="flex items-center justify-between gap-2 px-0.5">
              <div className="flex min-w-0 items-center gap-3">
                <Countdown remainingMs={left} totalMs={totalMs} color={team.color} paused={!running} />
                <div className="min-w-0">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-subtle sm:text-xs">Worth right now</p>
                  <p className="font-display text-3xl font-extrabold tabular-nums text-accent-3 sm:text-4xl">{pointsAt(state, left)}</p>
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
                  onClick={() => openDialog("reveal")}
                  disabled={!running}
                  aria-label="Give up this round and reveal the movie"
                >
                  <EyeIcon size={15} /> Give up
                </button>
              </div>
            </div>

            <div className="sticker-screen mt-3 sm:mt-5 rounded-[1.25rem] px-3 py-4 sm:rounded-[1.6rem] sm:px-6 sm:py-10">
              <EmojiRow tiles={tiles} />
              <p className="mt-3 text-center text-sm font-semibold text-muted sm:mt-5">
                {wordCount === 1 ? "One word" : `${wordCount} words`} in the title
              </p>
            </div>
            <p className="mt-2 min-h-5 px-0.5 text-sm text-muted" aria-live="polite">
              {state.clueShown ? (
                <>
                  <BulbIcon size={14} className="mr-1 inline align-[-2px] text-accent-3" />
                  {movie.year} · {movie.lead}
                </>
              ) : (
                `Points slide from ${START_POINTS} to ${END_POINTS} as the clock runs. Spelling is forgiving.`
              )}
            </p>


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
          </section>

          <GuessKeyboard guess={guess} disabled={!running} placeholder="Type the movie name" shakeKey={wrongShake ? `miss-${event.seq}` : null} />
        </>
      ) : (
        <ReadyCard
          team={team}
          solo={solo}
          eyebrow={state.steal ? "Steal chance" : `Round ${state.round}`}
          paused={paused}
          pausedNote="The emojis are hidden while paused."
          seconds={Math.ceil(left / 1000)}
          onStart={startTurn}
        >
          {/* Face-down stickers: how long the clue is, without showing it. */}
          <ul className="mt-5 flex justify-center gap-1.5" aria-hidden="true">
            {tiles.map((_, i) => (
              <li key={i} className="sticker sticker-back grid size-10 place-items-center rounded-xl font-display text-lg font-bold" style={{ "--tilt": `${i % 2 ? 4 : -4}deg` }}>
                ?
              </li>
            ))}
          </ul>
          {state.steal ? (
            <p className="mt-4 text-sm font-semibold text-accent-3">Same emojis · half the time, half the points</p>
          ) : (
            <>
              <p className="mt-4 text-sm text-muted">
                {tiles.length} emojis, one Telugu movie. It&rsquo;s worth {START_POINTS} the moment you start.
              </p>
              {state.turn.status === TURN.READY ? (
                <button
                  type="button"
                  className="mx-auto mt-3 flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-subtle transition hover:bg-surface-strong hover:text-foreground"
                  onClick={() => act(ACTIONS.SKIP_MOVIE, { random: Math.random() })}
                >
                  <RefreshIcon size={13} /> Swap for another movie
                </button>
              ) : null}
            </>
          )}
        </ReadyCard>
      )}

      <ConfirmDialog
        open={dialog === "reveal"}
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
