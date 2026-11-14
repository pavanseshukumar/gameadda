"use client";

import { useState } from "react";
import { GameShell } from "@/components/game/GameShell";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { FlagIcon } from "@/components/ui/icons";

/** Frame for every in-round screen: round badge, current step, End game. */
export function RoundShell({ state, teamColor, step, onEnd, children }) {
  const [confirmEnd, setConfirmEnd] = useState(false);

  return (
    <GameShell
      teamColor={teamColor}
      right={
        <>
          <span className="chip mr-0.5 whitespace-nowrap px-3 py-1.5 text-sm font-semibold tabular-nums">Round {state.round}</span>
          <button type="button" className="btn btn-ghost h-10 px-2 text-sm sm:px-3" onClick={() => setConfirmEnd(true)} aria-label="End game">
            <FlagIcon size={18} />
            <span className="hidden md:inline">End</span>
          </button>
        </>
      }
    >
      <p className="mb-3 text-center font-display text-sm font-bold uppercase tracking-[0.16em] text-accent-2">{step}</p>
      <div className="flex flex-1 flex-col">{children}</div>

      <ConfirmDialog
        open={confirmEnd}
        title="End the game?"
        body="We’ll skip to the final standings. This round won’t count."
        confirmLabel="End game"
        tone="danger"
        onCancel={() => setConfirmEnd(false)}
        onConfirm={() => {
          setConfirmEnd(false);
          onEnd();
        }}
      />
    </GameShell>
  );
}
