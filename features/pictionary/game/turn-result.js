"use client";

import { Check, RotateCcw, X } from "lucide-react";
import { teamStyle } from "@/lib/games/pictionary/data/team-colors";
import { teamById } from "@/lib/games/pictionary/game-engine/engine";
import { canUndoResult, gameActions } from "@/lib/games/pictionary/store/game-store";
import { sfx } from "@/lib/games/pictionary/utils/feedback";
import { cn, formatSeconds } from "@/lib/games/pictionary/utils";
import { CategoryBadge } from "@/features/pictionary/shared/category-badge";
import { showsChallenge, turnChallengeId } from "@/lib/games/pictionary/game-engine/challenges";
import { ChallengeBanner } from "@/features/pictionary/challenges/challenge-visuals";

/** Banner after a turn: reveals the word to the room and who scored. */
export function TurnResult({ session }) {
  const turn = session.currentTurn;
  if (!turn?.result) return null;
  const success = turn.result === "correct";
  const scorer = teamById(session, turn.scoringTeamId);
  const drawingTeam = teamById(session, turn.teamId);
  const steal = success && scorer && scorer.id !== drawingTeam.id;
  const undoable = canUndoResult(session);

  let headline;
  if (!success) headline = turn.isAllPlay ? "Nobody cracked it" : `So close, ${drawingTeam.name}`;
  else if (steal) headline = `${scorer.name} stole it!`;
  else headline = `${scorer.name} got it${turn.timeUsedMs != null ? ` in ${formatSeconds(turn.timeUsedMs)}` : ""}!`;

  return (
    <section
      className="card-ink overflow-hidden animate-pop-in"
      style={teamStyle((scorer ?? drawingTeam).color)}
      aria-live="polite"
    >
      <div
        className={cn(
          "flex items-center gap-3 px-5 py-3",
          success ? "bg-[var(--team)] text-[var(--team-fg)]" : "bg-cream-deep",
        )}
      >
        <span
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-paper animate-stamp",
            success ? "text-mint" : "text-coral",
          )}
        >
          {success ? <Check className="size-6" strokeWidth={4} /> : <X className="size-6" strokeWidth={4} />}
        </span>
        <p className="min-w-0 flex-1 font-display text-lg leading-tight font-extrabold">{headline}</p>
        {success && turn.points > 0 && (
          <span className="rounded-full bg-paper px-3 py-1 font-display text-lg font-extrabold text-ink animate-stamp [animation-delay:120ms]">
            +{turn.points}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-wider text-ink-muted uppercase">The word was</p>
          <p className="font-display text-3xl font-extrabold tracking-tight break-words">{turn.word.text}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <CategoryBadge category={turn.category} size="sm" />
          {showsChallenge(session.settings) && turnChallengeId(turn) !== "normal" && (
            <ChallengeBanner id={turnChallengeId(turn)} compact />
          )}
        </div>
      </div>
      {undoable && (
        <button
          type="button"
          onClick={() => {
            sfx.undo();
            gameActions.undoResult();
          }}
          className="flex min-h-11 w-full items-center justify-center gap-2 border-t-2 border-dashed border-line text-sm font-semibold text-ink-soft transition hover:bg-cream-deep hover:text-ink"
        >
          <RotateCcw className="size-4" />
          Wrong button? Undo
        </button>
      )}
    </section>
  );
}
