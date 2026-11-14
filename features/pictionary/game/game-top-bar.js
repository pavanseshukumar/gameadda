"use client";

import { useState } from "react";
import Link from "next/link";
import { Flag, House, Settings2 } from "lucide-react";
import { gameActions } from "@/lib/games/pictionary/store/game-store";
import { totalQuickTurns } from "@/lib/games/pictionary/game-engine/engine";
import { ConfirmDialog } from "@/features/pictionary/shared/confirm-dialog";
import { IconButton } from "@/features/pictionary/shared/button";

export function GameTopBar({ session }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const finished = session.phase === "finished";

  let progress = null;
  if (session.phase !== "lobby" && !finished) {
    progress =
      session.mode === "quick"
        ? `Round ${session.round} of ${session.settings.rounds}`
        : `Turn ${session.turnNumber}`;
  }

  return (
    <header className="flex items-center justify-between gap-3 pt-1">
      <Link
        href="/games/pictionary"
        aria-label="Home (your game is saved)"
        title="Home — your game is saved"
        className="inline-flex size-11 items-center justify-center rounded-full border-2 border-ink bg-paper transition hover:bg-cream-deep active:scale-95"
      >
        <House className="size-5" />
      </Link>

      <div className="flex min-w-0 flex-col items-center text-center leading-tight">
        <span className="text-xs font-bold tracking-[0.14em] text-ink-muted uppercase">
          {session.mode === "classic" ? "Classic Board" : "Quick Play"}
        </span>
        {progress && <span className="font-display font-bold">{progress}</span>}
        {session.mode === "quick" && progress && (
          <QuickProgress done={session.history.length} total={totalQuickTurns(session)} />
        )}
      </div>

      {finished ? (
        <span className="size-11" aria-hidden />
      ) : session.phase === "lobby" ? (
        // Nothing to end yet; editing the setup is the useful action here.
        <Link
          href="/games/pictionary/setup"
          aria-label="Change setup"
          title="Change setup"
          className="inline-flex size-11 items-center justify-center rounded-full border-2 border-ink bg-paper transition hover:bg-cream-deep active:scale-95"
        >
          <Settings2 className="size-5" />
        </Link>
      ) : (
        <IconButton label="End game" onClick={() => setConfirmEnd(true)}>
          <Flag className="size-5" />
        </IconButton>
      )}

      <ConfirmDialog
        open={confirmEnd}
        title="End the game now?"
        body="We’ll crown whoever is leading right now. The current turn won’t count."
        confirmLabel="End game"
        onCancel={() => setConfirmEnd(false)}
        onConfirm={() => {
          setConfirmEnd(false);
          gameActions.endEarly();
        }}
      />
    </header>
  );
}

function QuickProgress({ done, total }) {
  return (
    <span className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-cream-deep" aria-hidden>
      <span
        className="block h-full rounded-full bg-ink transition-[width] duration-500"
        style={{ width: `${Math.min(100, (done / total) * 100)}%` }}
      />
    </span>
  );
}
