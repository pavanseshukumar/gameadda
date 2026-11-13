"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Keyboard } from "@/components/game/Keyboard";
import { LyricsDisplay } from "@/components/game/LyricsDisplay";
import { Scoreboard } from "@/components/game/Scoreboard";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { TurnTimer } from "@/components/game/TurnTimer";
import { TurnHandoff } from "@/components/game/TurnHandoff";
import { SongGuessDialog } from "@/components/game/SongGuessDialog";
import { FeedbackToast } from "@/components/game/FeedbackToast";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { EyeIcon, FlagIcon, MusicIcon } from "@/components/ui/icons";
import {
  ACTIONS,
  PHASES,
  SONG_COMPLETION_MULTIPLIER,
  STARTING_LIVES,
  TURN_SECONDS,
  completionBonusFor,
  selectActiveTeam,
  selectLetterStates,
  selectSong,
} from "@/lib/games/guess-the-song/engine";
import { getClues, getPuzzleLines, revealsTitle } from "@/lib/games/guess-the-song/songs";
import { useSongDetails } from "./useSongDetails";
import { lettersIn } from "@/lib/games/guess-the-song/lyrics";
import { GameShell } from "@/components/game/GameShell";
import { feedbackFromEvent } from "./feedback";

export function PlayScreen({ state, dispatch }) {
  const [dialog, setDialog] = useState(null); // "guess" | "reveal" | "end" | null

  const song = selectSong(state);
  const lines = getPuzzleLines(song);
  const details = useSongDetails(song?.id);
  // Singers from iTunes, unless the credit line happens to contain part of the title.
  const singers = details?.found && details.artist && !revealsTitle(song, details.artist) ? details.artist : null;
  const clues = { ...getClues(song), singers };
  const team = selectActiveTeam(state);
  const letterStates = selectLetterStates(state);
  const event = state.lastEvent;

  const totalLetters = lettersIn(lines).size;
  const foundLetters = Object.values(letterStates).filter((s) => s === "hit").length;
  const bonus = completionBonusFor(state);
  const ready = state.phase === PHASES.READY;
  const lastChance = state.lastChance;
  const lostLife = event?.type === "song-miss" || event?.type === "turn-timeout";

  const guessLetter = (letter) => dispatch({ type: ACTIONS.GUESS_LETTER, letter });

  // Physical keyboard support for the host's laptop.
  const onKeyDown = useEffectEvent((e) => {
    if (ready || lastChance || dialog || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
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

      <Scoreboard teams={state.teams} activeTeamId={team.id} roundPoints={{ [team.id]: state.songPoints }} />

      {ready ? (
        <div className="grid place-items-center py-10 sm:py-16">
          <TurnHandoff
            team={team}
            seconds={TURN_SECONDS}
            detail={`Your own song · ${STARTING_LIVES} lives · ${totalLetters} different letters`}
            onStart={() => dispatch({ type: ACTIONS.START_TURN })}
          />
        </div>
      ) : (
      <>
      {/* Wide screens: title puzzle left, keyboard right, so everything fits without scrolling. */}
      <div className="lg:mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(24rem,30rem)] lg:items-center lg:gap-8">
      <div className="min-w-0">
      <div className="mt-3 flex items-center justify-between gap-3 sm:mt-6 lg:mt-0">
        <TurnIndicator
          team={team}
          hint={lastChance ? "No lives left. One guess at the song decides it." : "Call letters or guess the song. Each miss costs a life."}
        />
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
        className={`card relative mt-3 overflow-hidden rounded-[1.5rem] px-2.5 pb-4 pt-3.5 sm:mt-5 sm:rounded-[2rem] sm:px-8 sm:py-8 lg:px-6 ${lostLife ? "anim-shake" : ""}`}
        key={lostLife ? `miss-${event.seq}` : "title"}
      >
        <div className="mb-3 flex items-center justify-between gap-3 px-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-subtle sm:mb-4 sm:text-xs">
          <span>Song title</span>
          <span className="flex items-center gap-3 tabular-nums">
            <Lives lives={state.lives} max={STARTING_LIVES} />
            <span>
              {foundLetters}/{totalLetters} letters
            </span>
          </span>
        </div>
        <ClueChips clues={clues} />
        <LyricsDisplay
          lines={lines}
          guessedLetters={state.guessedLetters}
          freshLetter={event?.type === "letter-hit" ? event.letter : null}
        />
        <p className="mt-3 text-center text-xs text-subtle sm:mt-7 sm:text-sm">
          <span className="sm:hidden">Name the song early: </span>
          <span className="hidden sm:inline">
            Name the song before the letters run out to win{" "}
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

      {lastChance ? (
        <p role="status" className="anim-pop mt-3 rounded-2xl border border-miss/40 bg-miss/10 px-4 py-3 text-center text-sm font-semibold sm:text-base lg:hidden">
          Last chance! Letters are locked. Name the song to save it.
        </p>
      ) : null}
      <section aria-label="Guess a letter" className="mx-auto mt-3 w-full max-w-3xl sm:mt-6 lg:mt-0">
        <Keyboard
          letterStates={letterStates}
          onKey={guessLetter}
          disabled={lastChance}
          lastMiss={event?.type === "letter-miss" ? { letter: event.letter, seq: event.seq } : null}
        />
        {lastChance ? (
          <p role="status" className="mt-3 hidden rounded-2xl border border-miss/40 bg-miss/10 px-4 py-3 text-center font-semibold lg:block">
            Last chance! Letters are locked. Name the song to save it.
          </p>
        ) : (
          <p className="mt-3 hidden text-center text-xs text-subtle lg:block">Tip: you can type letters on a physical keyboard too.</p>
        )}
      </section>
      </div>
      </>
      )}

      <SongGuessDialog
        open={dialog === "guess"}
        team={team}
        hint={
          lastChance
            ? `Last chance. Correct still earns the ${SONG_COMPLETION_MULTIPLIER}× bonus (+${bonus}). Wrong ends the song with 0.`
            : `Correct adds a ${SONG_COMPLETION_MULTIPLIER}× bonus on your letter points (+${bonus}). Wrong costs a life.`
        }
        onClose={() => setDialog(null)}
        onSubmit={(title) => {
          setDialog(null);
          dispatch({ type: ACTIONS.GUESS_SONG, title });
        }}
      />
      <ConfirmDialog
        open={dialog === "reveal"}
        title="Reveal the song?"
        body={`This ends ${team.name}’s song with 0 points.`}
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
        body="We’ll skip to the final standings. Points at stake on this song are lost."
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
    clues.singers ? { label: "Artists", value: clues.singers } : null,
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

/** Hearts for the lives left on this song. Re-keys on change so a lost life animates. */
function Lives({ lives, max }) {
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={`${lives} of ${max} lives left`}>
      {Array.from({ length: max }, (_, i) => {
        const alive = i < lives;
        return (
          <svg
            key={`${i}-${alive}`}
            viewBox="0 0 24 24"
            className={`size-4 sm:size-5 ${alive ? "" : "anim-pop opacity-30"}`}
            aria-hidden="true"
          >
            <path
              d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.3 5 6.8 5c2 0 3.5 1.1 5.2 3 1.7-1.9 3.2-3 5.2-3 3.5 0 5.6 3.6 4.3 6.8C19.5 16.4 12 21 12 21Z"
              fill={alive ? "var(--miss)" : "none"}
              stroke={alive ? "var(--miss)" : "currentColor"}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </span>
  );
}
