"use client";

import { useEffect, useRef } from "react";
import { teamStyle } from "@/lib/games/pictionary/data/team-colors";
import { TeamToken } from "./team-bits";

/** All Play: the host taps whichever team shouted the answer first. */
export function TeamPickerDialog({ open, teams, onPick, onCancel }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => e.target === ref.current && onCancel()}
      className="m-auto w-[min(92vw,26rem)] rounded-[1.75rem] open:animate-pop-in border-2 border-ink bg-paper p-0 text-ink shadow-[0_6px_0_0_var(--color-ink)] backdrop:bg-ink/55"
    >
      {/* The pop-in runs on the <dialog> (open:animate-pop-in): on this inner box its overshoot overflowed the dialog and flashed a scrollbar. */}
      {open && (
        <div className="p-6">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Who guessed first?</h2>
          <p className="mt-1 text-ink-soft">The team that shouted it takes the point.</p>
          <div className="mt-5 flex flex-col gap-2">
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => onPick(team.id)}
                style={teamStyle(team.color)}
                className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-ink bg-[var(--team-soft)] px-4 text-left font-display text-lg font-bold shadow-[0_3px_0_0_var(--color-ink)] transition active:translate-y-[3px] active:shadow-none"
              >
                <TeamToken color={team.color} size={28} />
                {team.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onPick(null)}
              className="mt-2 min-h-12 rounded-2xl font-semibold text-ink-soft hover:bg-cream-deep"
            >
              Nobody got it
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
