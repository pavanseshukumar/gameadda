"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { GameShell } from "@/components/game/GameShell";
import { Scoreboard } from "@/components/game/Scoreboard";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { Keyboard } from "@/components/game/Keyboard";
import { FeedbackToast } from "@/components/game/FeedbackToast";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { BulbIcon, FlagIcon } from "@/components/ui/icons";
import {
  ACTIONS,
  MAX_GUESSES,
  selectActiveTeam,
  selectLetterStates,
  selectNextGuessValue,
  selectTeam,
} from "@/lib/games/word-swap/engine";
import { GuessGrid } from "./GuessGrid";

export function GuessScreen({ state, dispatch }) {
  const [draft, setDraft] = useState("");
  const [shake, setShake] = useState(null);
  const [dialog, setDialog] = useState(null); // "give-up" | "end" | null
  const team = selectActiveTeam(state);
  const setter = selectTeam(state, state.setterId);
  const length = state.word.length;
  const event = state.lastEvent;

  const type = (letter) => setDraft((d) => (d.length < length ? d + letter.toUpperCase() : d));
  const backspace = () => setDraft((d) => d.slice(0, -1));
  const submit = () => {
    if (draft.length !== length) {
      setShake(`short-${Date.now()}`);
      return;
    }
    if (state.guesses.includes(draft)) {
      setShake(`repeat-${Date.now()}`);
      return;
    }
    dispatch({ type: ACTIONS.GUESS, guess: draft });
    setDraft("");
  };

  // Physical keyboard: letters, Backspace, Enter.
  const onKeyDown = useEffectEvent((e) => {
    if (dialog || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]")) return;
    if (/^[a-z]$/i.test(e.key)) type(e.key);
    else if (e.key === "Backspace") backspace();
    else if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      submit();
    }
  });
  useEffect(() => {
    const handler = (e) => onKeyDown(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toast = shake?.startsWith("short")
    ? { id: shake, tone: "info", title: `Needs ${length} letters` }
    : shake?.startsWith("repeat")
      ? { id: shake, tone: "info", title: "Already tried that one" }
      : null;

  return (
    <GameShell
      wide
      teamColor={team.color}
      right={
        <>
          <span className="chip mr-0.5 whitespace-nowrap px-3 py-1.5 text-sm font-semibold tabular-nums">Round {state.round}</span>
          <button type="button" className="btn btn-ghost h-10 px-2 text-sm sm:px-3" onClick={() => setDialog("give-up")} aria-label="Give up this word">
            <FlagIcon size={18} />
            <span className="hidden md:inline">Give up</span>
          </button>
        </>
      }
    >
      <FeedbackToast message={toast ?? (event?.type === "repeat" ? { id: event.seq, tone: "info", title: "Already tried that one" } : null)} />

      <Scoreboard teams={state.teams} activeTeamId={team.id} />

      <div className="flex flex-1 flex-col lg:mt-6 lg:flex-none lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(24rem,30rem)] lg:items-center lg:gap-10">
        <div className="min-w-0">
          <div className="mt-3 flex items-center justify-between gap-3 sm:mt-6 lg:mt-0">
            <TurnIndicator solo={state.teams.length === 1} team={team} hint={setter ? `Cracking ${setter.name}’s word` : "Cracking a random word"} />
            <p className="shrink-0 text-right leading-none">
              <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-subtle">Next guess</span>
              <span className="font-display text-2xl font-bold tabular-nums text-accent-3">+{selectNextGuessValue(state)}</span>
            </p>
          </div>

          <section aria-label="Board" className="card relative mt-3 rounded-[1.5rem] px-3 py-4 sm:mt-5 sm:rounded-[2rem] sm:px-6 sm:py-6">
            <div className="mb-4 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="chip px-3 py-1 font-semibold tabular-nums">
                {length} letters · guess {Math.min(state.guesses.length + 1, MAX_GUESSES)} of {MAX_GUESSES}
              </span>
              {state.hint ? (
                <span className="chip inline-flex items-center gap-1.5 px-3 py-1">
                  <BulbIcon size={14} className="text-accent-3" />
                  <span className="text-subtle">Hint</span> <span className="font-semibold">{state.hint}</span>
                </span>
              ) : null}
            </div>
            <GuessGrid word={state.word} guesses={state.guesses} draft={draft} shakeKey={shake} />
            <Legend />
          </section>
        </div>

        <section aria-label="Keyboard" className="dock">
          <Keyboard
            letterStates={selectLetterStates(state)}
            onKey={type}
            reusable
            onEnter={submit}
            onBackspace={backspace}
            enterLabel="Guess"
          />
          <p className="mt-3 hidden text-center text-xs text-subtle lg:block">Type on your keyboard too · Enter to guess</p>
        </section>
      </div>

      <ConfirmDialog
        open={dialog === "give-up"}
        title="Give up this word?"
        body={`We’ll show it. ${team.name} scores nothing this turn.`}
        confirmLabel="Give up"
        tone="danger"
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          setDialog(null);
          dispatch({ type: ACTIONS.GIVE_UP });
        }}
      />
    </GameShell>
  );
}

/** What the tile colours mean. */
function Legend() {
  return (
    <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-muted" aria-label="Colour key">
      {[
        ["hit", "Right spot"],
        ["near", "Wrong spot"],
        ["miss", "Not in word"],
      ].map(([state, label]) => (
        <li key={state} className="flex items-center gap-1.5">
          <span className="swap-tile swap-tile-key" data-state={state} aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  );
}

