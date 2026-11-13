"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Keyboard } from "@/components/game/Keyboard";
import { LyricsDisplay } from "@/components/game/LyricsDisplay";
import { Scoreboard } from "@/components/game/Scoreboard";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { TurnTimer } from "@/components/game/TurnTimer";
import { SongGuessDialog } from "@/components/game/SongGuessDialog";
import { FeedbackToast } from "@/components/game/FeedbackToast";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { EyeIcon, FlagIcon, MusicIcon } from "@/components/ui/icons";
import {
  ACTIONS,
  SONG_COMPLETION_MULTIPLIER,
  TURN_SECONDS,
  completionBonusFor,
  selectActiveTeam,
  selectLetterStates,
  selectSong,
} from "@/lib/games/guess-the-song/engine";
import { getClues, getPuzzleLines } from "@/lib/games/guess-the-song/songs";
import { lettersIn } from "@/lib/games/guess-the-song/lyrics";
import { GameShell } from "@/components/game/GameShell";
import { feedbackFromEvent } from "./feedback";

export function PlayScreen({ state, dispatch }) {
  const [dialog, setDialog] = useState(null); // "guess" | "reveal" | "end" | null

  const song = selectSong(state);
  const lines = getPuzzleLines(song);
  const clues = getClues(song);
  const team = selectActiveTeam(state);
  const letterStates = selectLetterStates(state);
  const event = state.lastEvent;

  const totalLetters = lettersIn(lines).size;
  const foundLetters = Object.values(letterStates).filter((s) => s === "hit").length;
  const bonus = completionBonusFor(state, team.id);
  const songMissed = event?.type === "song-miss";

  const guessLetter = (letter) => dispatch({ type: ACTIONS.GUESS_LETTER, letter });

  // Physical keyboard support for the host's laptop.
  const onKeyDown = useEffectEvent((e) => {
    if (dialog || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]")) return;
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
          <span className="mr-0.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold tabular-nums whitespace-nowrap">
            Round {state.round}
          </span>
          <button type="button" className="btn btn-ghost h-10 px-2.5 text-sm sm:px-3" onClick={() => setDialog("reveal")} aria-label="Reveal the song">
            <EyeIcon size={18} />
            <span className="hidden md:inline">Reveal</span>
          </button>
          <button type="button" className="btn btn-ghost h-10 px-2.5 text-sm sm:px-3" onClick={() => setDialog("end")} aria-label="End game">
            <FlagIcon size={18} />
            <span className="hidden md:inline">End game</span>
          </button>
        </>
      }
    >
      <FeedbackToast message={feedbackFromEvent(state, event)} />

      <Scoreboard teams={state.teams} activeTeamId={team.id} roundPoints={state.roundPoints} />

      {/* Wide screens: title puzzle left, keyboard right, so everything fits without scrolling. */}
      <div className="lg:mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(24rem,30rem)] lg:items-center lg:gap-8">
      <div className="min-w-0">
      <div className="mt-3 flex items-center justify-between gap-3 sm:mt-6 lg:mt-0">
        <TurnIndicator team={team} hint="Call a letter or guess the song." />
        {/* Restarts on every event (hit, miss, timeout); paused while a dialog is open. */}
        <TurnTimer
          key={event?.seq ?? 0}
          seconds={TURN_SECONDS}
          paused={dialog !== null}
          onExpire={() => dispatch({ type: ACTIONS.TURN_TIMEOUT, eventSeq: event?.seq ?? 0 })}
        />
        <button
          type="button"
          onClick={() => setDialog("guess")}
          className="btn btn-primary h-12 shrink-0 px-4 text-sm sm:h-14 sm:px-6 sm:text-base"
        >
          <MusicIcon size={20} />
          <span className="sm:hidden">Guess</span>
          <span className="hidden sm:inline">Guess the Song</span>
          <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-xs font-extrabold tabular-nums">
            {SONG_COMPLETION_MULTIPLIER}×
          </span>
        </button>
      </div>

      <section
        aria-label="Song title"
        className={`card relative mt-3 overflow-hidden rounded-[1.5rem] px-2.5 pb-4 pt-3.5 sm:mt-5 sm:rounded-[2rem] sm:px-8 sm:py-8 lg:px-6 ${songMissed ? "anim-shake" : ""}`}
        key={songMissed ? `miss-${event.seq}` : "title"}
      >
        <div className="mb-3 flex items-center justify-between gap-3 px-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-subtle sm:mb-4 sm:text-xs">
          <span>Song title</span>
          <span className="tabular-nums">
            {foundLetters}/{totalLetters} letters
          </span>
        </div>
        <ClueChips clues={clues} />
        <LyricsDisplay
          lines={lines}
          guessedLetters={state.guessedLetters}
          freshLetter={event?.type === "letter-hit" ? event.letter : null}
        />
        <p className="mt-3 text-center text-xs text-subtle sm:mt-7 sm:text-sm">
          <span className="sm:hidden">Finish the title or name the song: </span>
          <span className="hidden sm:inline">
            Reveal every letter <span className="text-muted">or</span> name the song to win{" "}
          </span>
          <span className="font-semibold text-accent-3 tabular-nums">
            {SONG_COMPLETION_MULTIPLIER}×<span className="hidden sm:inline"> your letter points</span> (+{bonus})
          </span>
        </p>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-surface-strong" aria-hidden="true">
          <div
            className="h-full transition-[width] duration-700 ease-out"
            style={{ width: `${(foundLetters / Math.max(1, totalLetters)) * 100}%`, background: "var(--team)" }}
          />
        </div>
      </section>
      </div>

      <section aria-label="Guess a letter" className="mx-auto mt-3 w-full max-w-3xl sm:mt-6 lg:mt-0">
        <Keyboard
          letterStates={letterStates}
          onKey={guessLetter}
          lastMiss={event?.type === "letter-miss" ? { letter: event.letter, seq: event.seq } : null}
        />
        <p className="mt-3 hidden text-center text-xs text-subtle lg:block">Tip: you can type letters on a physical keyboard too.</p>
      </section>
      </div>

      <SongGuessDialog
        open={dialog === "guess"}
        team={team}
        hint={`Correct earns ${SONG_COMPLETION_MULTIPLIER}× your letter points this round (+${bonus}). Wrong passes the turn.`}
        onClose={() => setDialog(null)}
        onSubmit={(title) => {
          setDialog(null);
          dispatch({ type: ACTIONS.GUESS_SONG, title });
        }}
      />
      <ConfirmDialog
        open={dialog === "reveal"}
        title="Reveal the song?"
        body="This ends the round with no winner. Points scored so far are kept."
        confirmLabel="Reveal song"
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          setDialog(null);
          dispatch({ type: ACTIONS.REVEAL_SONG });
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
          dispatch({ type: ACTIONS.END_GAME });
        }}
      />
    </GameShell>
  );
}

/** Movie / year / composer hints above the hidden title. The movie is omitted when it would give the title away. */
function ClueChips({ clues }) {
  const items = [
    clues.movie ? { label: "Movie", value: clues.movie } : { label: "Movie", value: "Hidden: it gives the title away" },
    clues.year ? { label: "Year", value: clues.year } : null,
    clues.composer ? { label: "Music", value: clues.composer } : null,
  ].filter(Boolean);

  return (
    <ul className="mb-4 flex flex-wrap justify-center gap-1.5 sm:mb-7 sm:gap-2" aria-label="Clues">
      {items.map(({ label, value }) => (
        <li
          key={label}
          className="flex items-baseline gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs sm:text-sm"
        >
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-subtle sm:text-xs">{label}</span>
          <span className={`font-semibold ${label === "Movie" && !clues.movie ? "font-normal italic text-subtle" : ""}`}>
            {value}
          </span>
        </li>
      ))}
    </ul>
  );
}
