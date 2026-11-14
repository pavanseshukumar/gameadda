"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { MusicIcon } from "@/components/ui/icons";
import { teamInk } from "@/lib/games/core/teams";

/**
 * Modal where the active team types the full song title.
 *
 * @param {{
 *   open: boolean,
 *   team: { name: string, color: string } | null,
 *   onSubmit: (title: string) => void,
 *   onClose: () => void,
 * }} props
 */
export function SongGuessDialog({
  open,
  team,
  onSubmit,
  onClose,
  hint = "A wrong answer passes the turn to the next team.",
}) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="song-guess-title" accent={team?.color}>
      <SongGuessForm team={team} onSubmit={onSubmit} onClose={onClose} hint={hint} />
    </Dialog>
  );
}

function SongGuessForm({ team, onSubmit, onClose, hint }) {
  const [title, setTitle] = useState("");
  const canSubmit = title.trim().length > 0;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit(title);
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="grid size-11 place-items-center rounded-2xl"
          style={{ background: team?.color ?? "var(--accent)", color: team ? teamInk(team.color) : "var(--btn-primary-fg, #fff)" }}
        >
          <MusicIcon size={22} />
        </span>
        <div>
          <h2 id="song-guess-title" className="font-display text-2xl font-bold tracking-tight">
            Name that song
          </h2>
          {team ? <p className="text-sm text-muted">{team.name} is guessing</p> : null}
        </div>
      </div>

      <label htmlFor="song-title" className="mt-7 block text-sm font-medium text-muted">
        Song title
      </label>
      <input
        id="song-title"
        name="song-title"
        autoFocus
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="e.g. Vennela Vaana"
        className="mt-2 h-14 w-full field px-4 text-lg font-medium"
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
