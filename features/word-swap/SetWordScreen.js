"use client";

import { useState } from "react";
import { GameShell } from "@/components/game/GameShell";
import { Scoreboard } from "@/components/game/Scoreboard";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { EndGameButton } from "@/components/game/EndGameButton";
import { ArrowRightIcon, EyeIcon, ShuffleIcon } from "@/components/ui/icons";
import { EyeOff } from "lucide-react";
import { teamInk, teamText } from "@/lib/games/core/teams";
import { ACTIONS, HINT_MAX, MAX_LENGTH, MIN_LENGTH, cleanWord, isValidWord, selectActiveTeam, selectSetter } from "@/lib/games/word-swap/engine";

/** The setting team types a secret word for the next team, who look away. */
export function SetWordScreen({ state, dispatch }) {
  const [word, setWord] = useState("");
  const [hint, setHint] = useState("");
  const [show, setShow] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const guesser = selectActiveTeam(state);
  const setter = selectSetter(state);
  const clean = cleanWord(word);
  const valid = isValidWord(clean);
  const tooLong = clean.length > MAX_LENGTH;

  return (
    <GameShell
      teamColor={setter.color}
      right={
        <>
          <span className="chip mr-0.5 whitespace-nowrap px-3 py-1.5 text-sm font-semibold tabular-nums">Round {state.round}</span>
          <EndGameButton onClick={() => setConfirmEnd(true)} />
        </>
      }
    >
      <Scoreboard teams={state.teams} activeTeamId={setter.id} />

      <section className="card anim-rise mx-auto mt-6 w-full max-w-lg rounded-[2rem] p-5 sm:mt-10 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full font-display text-xl font-extrabold" style={{ background: setter.color, color: teamInk(setter.color) }}>
            {setter.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: teamText(setter.color) }}>
              Set a word
            </p>
            <h1 className="font-display text-2xl font-bold leading-tight tracking-tight">
              {setter.name}, pick one for {guesser.name}
            </h1>
          </div>
        </div>
        <p className="mt-4 rounded-2xl bg-surface-strong px-4 py-3 text-sm font-semibold">
          <span style={{ color: teamText(guesser.color) }}>{guesser.name}</span>: look away until the word is locked in!
        </p>

        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) dispatch({ type: ACTIONS.SET_WORD, word: clean, hint });
          }}
        >
          <label htmlFor="secret-word" className="block text-sm font-medium text-muted">
            Secret word ({MIN_LENGTH}–{MAX_LENGTH} letters)
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="secret-word"
              autoFocus
              value={word}
              onChange={(e) => setWord(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              className={`field h-14 min-w-0 flex-1 px-4 font-display text-2xl font-bold uppercase tracking-[0.2em] ${show ? "" : "secret-input"}`}
            />
            <button type="button" className="btn btn-secondary size-14 shrink-0 p-0" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide word" : "Show word"} aria-pressed={show}>
              {show ? <EyeOff size={20} /> : <EyeIcon size={20} />}
            </button>
          </div>
          <p className="mt-2 text-sm text-subtle tabular-nums" aria-live="polite">
            {clean.length} letters
            {tooLong ? ` · ${MAX_LENGTH} max` : clean.length && clean.length < MIN_LENGTH ? ` · at least ${MIN_LENGTH}` : ""}
          </p>

          <label htmlFor="word-hint" className="mt-5 block text-sm font-medium text-muted">
            Hint for them <span className="text-subtle">(optional)</span>
          </label>
          <input
            id="word-hint"
            value={hint}
            maxLength={HINT_MAX}
            onChange={(e) => setHint(e.target.value)}
            autoComplete="off"
            placeholder="e.g. a fruit, a Telugu movie"
            className="field mt-2 h-12 w-full px-4"
          />

          <button type="submit" className="btn btn-primary mt-7 h-14 w-full text-base" disabled={!valid}>
            Lock it in <ArrowRightIcon size={18} />
          </button>
          <button type="button" className="btn btn-ghost mt-2 h-11 w-full text-sm" onClick={() => dispatch({ type: ACTIONS.USE_RANDOM_WORD, seed: Math.random() })}>
            <ShuffleIcon size={16} /> Can’t think of one? Use a random word
          </button>
        </form>
      </section>

      <ConfirmDialog
        open={confirmEnd}
        title="End the game?"
        body="We’ll skip to the final standings."
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
