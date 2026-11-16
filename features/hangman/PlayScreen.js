"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Keyboard } from "@/components/game/Keyboard";
import { LyricsDisplay } from "@/components/game/LyricsDisplay";
import { Scoreboard } from "@/components/game/Scoreboard";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { TurnTimer } from "@/components/game/TurnTimer";
import { ReadyCard, WordShape } from "@/components/game/ReadyCard";
import { FeedbackToast } from "@/components/game/FeedbackToast";
import { GameShell } from "@/components/game/GameShell";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { BulbIcon, EyeIcon, FlagIcon } from "@/components/ui/icons";
import {
  ACTIONS,
  MAX_MISSES,
  PHASES,
  selectActiveTeam,
  selectLetterStates,
  selectMissedLetters,
  selectSolveValue,
} from "@/lib/games/hangman/engine";
import { categoryColor, categoryLabel, lettersOf } from "@/lib/games/hangman/words";
import { Gallows } from "./Gallows";
import { WordGuessDialog } from "./WordGuessDialog";
import { feedbackFromEvent } from "./feedback";

export function PlayScreen({ state, dispatch }) {
  const [dialog, setDialog] = useState(null); // "guess" | "reveal" | "end" | null
  const team = selectActiveTeam(state);
  const event = state.lastEvent;
  const ready = state.phase === PHASES.READY;
  const seconds = state.settings.turnSeconds;
  const missed = selectMissedLetters(state);
  const missesLeft = MAX_MISSES - state.misses;
  const solveValue = selectSolveValue(state);
  const justMissed = ["letter-miss", "word-miss", "timeout"].includes(event?.type);
  const wordCount = state.word.text.split(/\s+/).length;
  const letterCount = lettersOf(state.word.text).length;

  const guessLetter = (letter) => dispatch({ type: ACTIONS.GUESS_LETTER, letter });
  const start = () => dispatch({ type: ACTIONS.START_TURN });

  // Physical keyboard for the host's laptop: letters call, Enter starts the round.
  const onKeyDown = useEffectEvent((e) => {
    if (dialog || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]")) return;
    if (ready) {
      if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) start();
      return;
    }
    if (/^[a-z]$/i.test(e.key)) guessLetter(e.key);
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
          <button type="button" className="btn btn-ghost h-10 px-2 text-sm sm:px-3" onClick={() => setDialog("reveal")} aria-label="Reveal the word">
            <EyeIcon size={18} />
            <span className="hidden md:inline">Reveal</span>
          </button>
          <button type="button" className="btn btn-ghost h-10 px-2 text-sm sm:px-3" onClick={() => setDialog("end")} aria-label="End game">
            <FlagIcon size={18} />
            <span className="hidden md:inline">End</span>
          </button>
        </>
      }
    >
      <FeedbackToast message={feedbackFromEvent(state, event)} />

      <Scoreboard teams={state.teams} activeTeamId={team.id} roundPoints={{ [team.id]: state.wordPoints }} />

      {ready ? (
        <ReadyCard team={team} solo={state.teams.length === 1} eyebrow={`Round ${state.round} · Your word`} seconds={seconds} onStart={start}>
          <p className="chip mx-auto mt-4 inline-flex items-center gap-2 px-3 py-1 text-sm">
            <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: categoryColor(state.word.category) }} />
            <span className="font-semibold">{categoryLabel(state.word.category)}</span>
          </p>
          <WordShape lengths={state.word.text.split(/\s+/).map((w) => lettersOf(w).length)} variant="line" />
          <p className="mt-3 text-sm text-muted">
            {wordCount === 1 ? "One word" : `${wordCount} words`} · {letterCount} letters · {MAX_MISSES} misses allowed
          </p>
        </ReadyCard>
      ) : (
        <div className="flex flex-1 flex-col lg:mt-6 lg:flex-none lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(24rem,30rem)] lg:items-center lg:gap-8">
          <div className="min-w-0">
            <div className="mt-3 flex items-center justify-between gap-3 sm:mt-6 lg:mt-0">
              <TurnIndicator
                solo={state.teams.length === 1}
                team={team}
                hint="Your own word. Call letters or solve it; every miss adds a part."
              />
              {seconds ? (
                // Restarts on every event (hit, miss, timeout); held while a dialog is open.
                <TurnTimer
                  key={event?.seq ?? 0}
                  seconds={seconds}
                  paused={dialog !== null}
                  onExpire={() => dispatch({ type: ACTIONS.TURN_TIMEOUT, eventSeq: event?.seq ?? 0 })}
                />
              ) : null}
              <button type="button" onClick={() => setDialog("guess")} className="btn btn-primary h-12 shrink-0 px-4 text-sm sm:h-14 sm:px-6 sm:text-base">
                <BulbIcon size={20} />
                <span className="sm:hidden">Solve</span>
                <span className="hidden sm:inline">Solve it</span>
                <span className="rounded-md bg-black/10 px-1.5 py-0.5 text-xs font-extrabold tabular-nums">+{solveValue}</span>
              </button>
            </div>

            <section
              aria-label="Hidden word"
              key={justMissed ? `miss-${event.seq}` : "board"}
              className={`card relative mt-3 overflow-hidden rounded-[1.5rem] px-3 pb-4 pt-3.5 sm:mt-5 sm:rounded-[2rem] sm:px-8 sm:py-7 lg:px-6 ${justMissed ? "anim-shake" : ""}`}
            >
              <div className="flex items-center gap-3 sm:gap-6">
                <Gallows misses={state.misses} max={MAX_MISSES} drawLatest={justMissed} className="w-24 shrink-0 sm:w-36 lg:w-40" />
                <div className="min-w-0 flex-1">
                  <p className="chip inline-flex items-center gap-2 px-3 py-1 text-xs sm:text-sm">
                    <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: categoryColor(state.word.category) }} />
                    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-subtle sm:text-xs">Category</span>
                    <span className="font-semibold">{categoryLabel(state.word.category)}</span>
                  </p>
                  <p className="mt-3 font-display text-2xl font-bold tabular-nums leading-none sm:text-4xl" aria-live="polite">
                    <span className={missesLeft <= 2 ? "text-miss" : ""}>{missesLeft}</span>
                    <span className="text-base font-semibold text-muted sm:text-lg"> {missesLeft === 1 ? "miss" : "misses"} left</span>
                  </p>
                  <p className="mt-2 min-h-6 text-sm text-muted" aria-label={missed.length ? `Missed letters: ${missed.join(", ")}` : "No misses yet"}>
                    {missed.length ? (
                      <span aria-hidden="true" className="font-display text-lg font-bold tracking-[0.2em] text-miss line-through decoration-2">
                        {missed.join("").toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-subtle">No misses yet</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 sm:mt-6">
                <LyricsDisplay
                  lines={[state.word.text]}
                  guessedLetters={state.guessed}
                  freshLetter={event?.type === "letter-hit" ? event.letter : null}
                />
              </div>
              <p className="mt-3 text-center text-xs text-subtle sm:mt-5 sm:text-sm">
                <span className="tabular-nums">+{state.wordPoints}</span> at stake, lost if hanged · solve now for{" "}
                <span className="font-semibold tabular-nums text-accent-3">+{solveValue}</span>
              </p>
            </section>
          </div>

          <section aria-label="Call a letter" className="dock">
            <Keyboard
              letterStates={selectLetterStates(state)}
              onKey={guessLetter}
              lastMiss={event?.type === "letter-miss" ? { letter: event.letter, seq: event.seq } : null}
            />
            <p className="mt-3 hidden text-center text-xs text-subtle lg:block">Tip: you can type letters on a physical keyboard too.</p>
          </section>
        </div>
      )}

      <WordGuessDialog
        open={dialog === "guess"}
        team={team}
        hint={`Right banks +${solveValue}. Wrong counts as a miss.`}
        onClose={() => setDialog(null)}
        onSubmit={(guess) => {
          setDialog(null);
          dispatch({ type: ACTIONS.GUESS_WORD, guess });
        }}
      />
      <ConfirmDialog
        open={dialog === "reveal"}
        title="Reveal the word?"
        body={`This ends ${team.name}’s word with 0 points.`}
        confirmLabel="Reveal word"
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          setDialog(null);
          dispatch({ type: ACTIONS.REVEAL_WORD });
        }}
      />
      <ConfirmDialog
        open={dialog === "end"}
        title="End the game?"
        body="We’ll skip to the final standings. Points at stake on this word are lost."
        confirmLabel="End game"
        tone="danger"
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          setDialog(null);
          dispatch({ type: ACTIONS.END_GAME });
        }}
      />
    </GameShell>
  );
}
