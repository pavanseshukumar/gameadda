"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { BulbIcon } from "@/components/ui/icons";
import { teamInk } from "@/lib/games/core/teams";

/**
 * Modal where the active team types the whole word.
 *
 * @param {{ open: boolean, team: { name: string, color: string } | null, hint: string, onSubmit: (guess: string) => void, onClose: () => void }} props
 */
export function WordGuessDialog({ open, team, hint, onSubmit, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="word-guess-title" accent={team?.color}>
      <WordGuessForm team={team} hint={hint} onSubmit={onSubmit} onClose={onClose} />
    </Dialog>
  );
}

function WordGuessForm({ team, hint, onSubmit, onClose }) {
  const [guess, setGuess] = useState("");
  const canSubmit = /[a-z]/i.test(guess);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit(guess);
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="grid size-11 place-items-center rounded-2xl"
          style={{ background: team?.color ?? "var(--accent)", color: team ? teamInk(team.color) : "var(--btn-primary-fg)" }}
        >
          <BulbIcon size={22} />
        </span>
        <div>
          <h2 id="word-guess-title" className="font-display text-2xl font-bold tracking-tight">
            Solve it
          </h2>
          {team ? <p className="text-sm text-muted">{team.name} is guessing</p> : null}
        </div>
      </div>

      <label htmlFor="word-guess" className="mt-7 block text-sm font-medium text-muted">
        The whole word or phrase
      </label>
      <input
        id="word-guess"
        name="word-guess"
        autoFocus
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        value={guess}
        onChange={(event) => setGuess(event.target.value)}
        placeholder="Type your answer"
        className="field mt-2 h-14 w-full px-4 text-lg font-medium"
      />
      <p className="mt-2.5 text-sm text-subtle">{hint}</p>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" className="btn btn-secondary h-12 px-6" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary h-12 px-7" disabled={!canSubmit}>
          Lock it in
        </button>
      </div>
    </form>
  );
}
