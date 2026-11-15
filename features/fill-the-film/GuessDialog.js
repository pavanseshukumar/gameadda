"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Clapperboard, X } from "lucide-react";
import { teamInk } from "@/lib/games/core/teams";

/**
 * Modal where the active team types a movie title.
 *
 * @param {{ open: boolean, team: { name: string, color: string } | null, title: string, hint: string, tried?: string[], onSubmit: (guess: string) => void, onClose: () => void }} props
 */
export function GuessDialog({ open, team, title, hint, tried = [], onSubmit, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="film-guess-title" accent={team?.color}>
      <GuessForm team={team} title={title} hint={hint} tried={tried} onSubmit={onSubmit} onClose={onClose} />
    </Dialog>
  );
}

function GuessForm({ team, title, hint, tried, onSubmit, onClose }) {
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
          <Clapperboard size={22} />
        </span>
        <div>
          <h2 id="film-guess-title" className="font-display text-2xl font-bold tracking-tight">
            {title}
          </h2>
          {team ? <p className="text-sm text-muted">{team.name} is guessing</p> : null}
        </div>
      </div>

      <label htmlFor="film-guess" className="mt-7 block text-sm font-medium text-muted">
        Movie title (exact spelling)
      </label>
      <input
        id="film-guess"
        name="film-guess"
        autoFocus
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        value={guess}
        onChange={(event) => setGuess(event.target.value)}
        placeholder="e.g. Okkadu"
        className="field mt-2 h-14 w-full px-4 text-lg font-medium"
      />
      {tried.length ? (
        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm">
          <span className="text-subtle">Wrong guesses so far:</span>
          {tried.map((guess, i) => (
            <span key={i} className="wrong-guess">
              <X size={12} strokeWidth={3} aria-hidden="true" />
              {guess}
            </span>
          ))}
        </p>
      ) : null}
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
