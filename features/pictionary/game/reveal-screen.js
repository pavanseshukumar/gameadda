"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Ban, Eye, EyeOff, Lock, Play, Shuffle } from "lucide-react";
import { getCategory } from "@/lib/games/pictionary/data/categories";
import { teamStyle } from "@/lib/games/pictionary/data/team-colors";
import { activeTeam, skipsLeft } from "@/lib/games/pictionary/game-engine/engine";
import { showsChallenge, turnChallengeId } from "@/lib/games/pictionary/game-engine/challenges";
import { gameActions } from "@/lib/games/pictionary/store/game-store";
import { sfx } from "@/lib/games/pictionary/utils/feedback";
import { cn } from "@/lib/games/pictionary/utils";
import { Button } from "@/features/pictionary/shared/button";
import { CategoryBadge, DifficultyPips } from "@/features/pictionary/shared/category-badge";
import { ChallengeBanner, ChallengeCard } from "@/features/pictionary/challenges/challenge-visuals";

/**
 * Private screen for the drawer. With drawing challenges on, it opens on
 * the challenge card; the drawer accepts it before the word step. The word
 * starts hidden (also after a refresh, since visibility is never persisted)
 * and the timer can only start once the drawer has looked at it.
 */
export function RevealScreen({ session }) {
  const turn = session.currentTurn;
  const team = activeTeam(session);
  const [visible, setVisible] = useState(false);
  const [seen, setSeen] = useState(false);
  const resuming = turn.timer.elapsedMs > 0;
  const skips = skipsLeft(session);
  const withChallenge = showsChallenge(session.settings);
  const challengeId = turnChallengeId(turn);
  // A resumed turn (after a word skip) already showed its challenge.
  const [step, setStep] = useState(withChallenge && !resuming ? "challenge" : "word");

  useEffect(() => {
    if (step === "challenge") sfx.challenge();
  }, [step]);

  const reveal = () => {
    setVisible(true);
    setSeen(true);
  };

  return (
    <div
      className="flex flex-1 flex-col gap-6 bg-ink px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-cream sm:px-6"
      style={teamStyle(team.color)}
    >
      <header className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-cream/10 px-3 py-1.5 text-sm font-bold">
          <Lock className="size-4 text-sun" />
          {turn.drawerName} only
        </span>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-cream/70">
          <span className="size-3 rounded-full bg-[var(--team)]" />
          {team.name}
        </span>
      </header>

      {step === "challenge" ? (
        <>
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6">
            <div className="text-center">
              <h1 className="font-display text-3xl font-extrabold tracking-tight">Before you see the word…</h1>
              <p className="mt-1 text-cream/70">Here’s how you’ll be drawing this turn.</p>
            </div>
            <ChallengeCard id={challengeId} />
          </div>
          <div className="mx-auto flex w-full max-w-md flex-col gap-3">
            <Button size="xl" variant="sun" block onClick={() => setStep("word")}>
              Challenge accepted
              <ArrowRight className="size-6" strokeWidth={3} />
            </Button>
            <p className="text-center text-sm text-cream/60">Next: your secret word</p>
          </div>
        </>
      ) : (
        <>
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6">
            <div className="text-center">
              <h1 className="font-display text-3xl font-extrabold tracking-tight">
                {resuming ? "Here’s your new word" : "Your secret word"}
              </h1>
              <p className="mt-1 text-cream/70">Check nobody’s peeking over your shoulder.</p>
            </div>

            <div className="overflow-hidden rounded-[2rem] border-2 border-cream/20 bg-paper text-ink shadow-[0_6px_0_0_var(--team)] animate-pop-in">
              <div className="flex items-center justify-between gap-2 border-b-2 border-dashed border-line px-5 py-3">
                <CategoryBadge category={turn.category} />
                <DifficultyPips difficulty={turn.word.difficulty} className="text-ink-soft" />
              </div>
              <button
                type="button"
                onClick={() => (visible ? setVisible(false) : reveal())}
                aria-pressed={visible}
                className="relative flex min-h-56 w-full flex-col items-center justify-center px-6 py-10 text-center"
              >
                {visible ? (
                  <>
                    <span className="font-display text-[2.75rem] leading-[1.02] font-extrabold tracking-tight text-balance break-words sm:text-6xl animate-pop-in">
                      {turn.word.text}
                    </span>
                    {turn.word.category !== turn.category && (
                      <span className="mt-3 text-sm text-ink-muted">
                        Borrowed from {getCategory(turn.word.category).label}
                      </span>
                    )}
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted">
                      <EyeOff className="size-4" /> Tap to hide
                    </span>
                  </>
                ) : (
                  <>
                    <span aria-hidden className="flex gap-2">
                      {Array.from({ length: 7 }, (_, i) => (
                        <span key={i} className="h-10 w-6 rounded-lg bg-cream-deep" />
                      ))}
                    </span>
                    <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-display text-lg font-bold text-cream">
                      <Eye className="size-5" /> Tap to reveal
                    </span>
                  </>
                )}
              </button>
              {turn.recycledWord && (
                <p className="border-t-2 border-dashed border-line px-5 py-2 text-center text-xs text-ink-muted">
                  You’ve played through this category’s words, so this one may be a repeat.
                </p>
              )}
            </div>

            {withChallenge && <ChallengeBanner id={challengeId} className="border-cream/30" />}

            <p className="flex items-start gap-2 text-sm text-cream/75">
              <Ban className="mt-0.5 size-4 shrink-0 text-coral" />
              Draw only. No talking, letters, numbers or gestures.
            </p>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-col gap-3">
            <Button
              size="xl"
              variant="sun"
              block
              disabled={!seen}
              onClick={() => {
                setVisible(false);
                sfx.start();
                gameActions.startDrawing();
              }}
            >
              <Play className="size-6" fill="currentColor" />
              {resuming ? "Hide word & resume timer" : "Hide word & start timer"}
            </Button>
            {!seen && <p className="text-center text-sm text-cream/60">Reveal the word first.</p>}
            {session.settings.maxSkipsPerTurn > 0 && (
              <button
                type="button"
                disabled={skips <= 0}
                onClick={() => {
                  setVisible(false);
                  setSeen(false);
                  gameActions.skipWord();
                }}
                className={cn(
                  "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl font-semibold text-cream/80 transition hover:bg-cream/10",
                  "disabled:opacity-40 disabled:hover:bg-transparent",
                )}
              >
                <Shuffle className="size-4" />
                {skips > 0 ? `Swap for a different word (${skips} left)` : "No word swaps left"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
