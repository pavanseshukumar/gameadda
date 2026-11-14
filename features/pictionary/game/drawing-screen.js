"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Eye, Pause, Play, Shuffle, X } from "lucide-react";
import { teamStyle } from "@/lib/games/pictionary/data/team-colors";
import { activeTeam, skipsLeft } from "@/lib/games/pictionary/game-engine/engine";
import { remaining } from "@/lib/games/pictionary/game-engine/timer";
import { useNow } from "@/lib/games/pictionary/hooks/use-now";
import { useWakeLock } from "@/lib/games/pictionary/hooks/use-wake-lock";
import { gameActions } from "@/lib/games/pictionary/store/game-store";
import { sfx } from "@/lib/games/pictionary/utils/feedback";
import { cn } from "@/lib/games/pictionary/utils";
import { Button } from "@/features/pictionary/shared/button";
import { CategoryBadge } from "@/features/pictionary/shared/category-badge";
import { CountdownRing } from "./countdown-ring";
import { showsChallenge, turnChallengeId } from "@/lib/games/pictionary/game-engine/challenges";
import { ChallengeBanner } from "@/features/pictionary/challenges/challenge-visuals";
import { TeamPickerDialog } from "./team-picker-dialog";

/**
 * The public screen while the drawer draws on paper. The secret word is
 * never rendered here except through the deliberate press-and-hold peek.
 */
export function DrawingScreen({ session }) {
  const turn = session.currentTurn;
  const team = activeTeam(session);
  const { timer } = turn;
  const now = useNow(timer.running);
  const left = remaining(timer, now);
  const expired = left <= 0;
  const paused = !timer.running && !expired;
  const urgent = timer.running && left > 0 && left <= 10_000;
  const [picking, setPicking] = useState(false);
  const skips = skipsLeft(session);

  useWakeLock(!expired);
  useTimerSounds(left, timer.running);

  const correct = () => {
    if (turn.isAllPlay) return setPicking(true);
    sfx.correct();
    gameActions.resolve(true);
  };
  const missed = () => {
    sfx.miss();
    gameActions.resolve(false);
  };

  return (
    <div
      style={teamStyle(team.color)}
      className={cn(
        "flex flex-1 flex-col border-t-[10px] border-[var(--team)] transition-colors duration-700",
        urgent && "bg-[#fde7df]",
        expired && "bg-[#fbd6c9]",
      )}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-display text-xl font-extrabold">
              <span className="size-3.5 shrink-0 rounded-full border-2 border-ink bg-[var(--team)]" />
              <span className="truncate">{team.name}</span>
            </p>
            <p className="text-sm text-ink-soft">
              <strong className="text-ink">{turn.drawerName}</strong> is drawing
              {turn.isAllPlay && " · everyone guesses"}
            </p>
          </div>
          <CategoryBadge category={turn.category} />
        </header>

        {showsChallenge(session.settings) && (
          <ChallengeBanner id={turnChallengeId(turn)} className="mt-4 animate-rise" />
        )}

        <div className="relative flex flex-1 flex-col items-center justify-center py-6">
          <CountdownRing remainingMs={left} durationMs={timer.durationMs} paused={paused} />

          {paused && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-cream/85 backdrop-blur-sm animate-pop-in">
              <div className="card-ink mx-4 flex max-w-sm flex-col items-center gap-4 p-6 text-center">
                <Pause className="size-10" />
                <div>
                  <p className="font-display text-3xl font-extrabold">Paused</p>
                  <p className="mt-1 text-ink-soft">Pens down, no peeking at the paper.</p>
                </div>
                <Button size="lg" variant="team" block onClick={() => gameActions.resume()}>
                  <Play className="size-5" fill="currentColor" />
                  Resume
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Button size="xl" variant="danger" onClick={missed}>
              <X className="size-7" strokeWidth={3.5} />
              {expired ? "Missed" : "Give up"}
            </Button>
            <Button size="xl" variant="success" onClick={correct}>
              <Check className="size-7" strokeWidth={3.5} />
              Got it!
            </Button>
          </div>
          {expired && (
            <p className="text-center text-sm text-ink-soft">Did they shout it right on the buzzer? Your call, host.</p>
          )}
          {!expired && (
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="paper"
                size="sm"
                className="min-h-12"
                onClick={() => (timer.running ? gameActions.pause() : gameActions.resume())}
              >
                {timer.running ? <Pause className="size-4" /> : <Play className="size-4" />}
                {timer.running ? "Pause" : "Resume"}
              </Button>
              <Button
                variant="paper"
                size="sm"
                className="min-h-12"
                disabled={skips <= 0}
                onClick={() => gameActions.skipWord()}
                title="Swap the word. The drawer sees the new one privately; the clock keeps its time."
              >
                <Shuffle className="size-4" />
                Skip{skips > 0 ? ` (${skips})` : ""}
              </Button>
              <PeekButton word={turn.word.text} />
            </div>
          )}
        </div>

        <TeamPickerDialog
          open={picking}
          teams={session.teams}
          onCancel={() => setPicking(false)}
          onPick={(teamId) => {
            setPicking(false);
            if (teamId) sfx.correct();
            else sfx.miss();
            gameActions.resolve(Boolean(teamId), teamId);
          }}
        />
      </div>
    </div>
  );
}

/** A heads-up at ten seconds, ticks for the last five, a buzzer at zero. */
function useTimerSounds(left, running) {
  const previous = useRef(null);
  const seconds = Math.ceil(left / 1000);
  useEffect(() => {
    const before = previous.current;
    previous.current = seconds;
    // Skip the first render so restoring an expired turn stays quiet.
    if (before == null || before === seconds) return;
    if (seconds === 0) sfx.timeUp();
    else if (running && seconds === 10) sfx.warning();
    else if (running && seconds <= 5) sfx.tick();
  }, [seconds, running]);
}

/** Press and hold to show the word — for the drawer only, deliberately awkward. */
function PeekButton({ word }) {
  const [held, setHeld] = useState(false);
  const show = () => setHeld(true);
  const hide = () => setHeld(false);

  return (
    <div className="relative">
      <button
        type="button"
        onPointerDown={show}
        onPointerUp={hide}
        onPointerLeave={hide}
        onPointerCancel={hide}
        onKeyDown={(e) => (e.key === " " || e.key === "Enter") && show()}
        onKeyUp={hide}
        onBlur={hide}
        onContextMenu={(e) => e.preventDefault()}
        className="btn-3d min-h-12 w-full border-2 border-ink px-3 text-sm [--btn-lift:3px] select-none"
        style={{ "--btn-bg": "var(--color-paper)", "--btn-fg": "var(--color-ink)", "--btn-depth": "var(--color-ink)" }}
        aria-label="Hold to peek at the word (drawer only)"
      >
        <Eye className="size-4" />
        Peek
      </button>
      {held && (
        <div
          role="tooltip"
          className="absolute right-0 bottom-full z-20 mb-3 w-max max-w-[70vw] rounded-2xl bg-ink px-4 py-3 font-display text-2xl font-extrabold text-cream shadow-lg animate-pop-in"
        >
          {word}
        </div>
      )}
    </div>
  );
}
