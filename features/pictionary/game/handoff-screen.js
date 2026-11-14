"use client";

import { ArrowRightLeft, EyeOff, Info, Sparkles, Users } from "lucide-react";
import { getCategory } from "@/lib/games/pictionary/data/categories";
import { teamStyle } from "@/lib/games/pictionary/data/team-colors";
import { activeTeam } from "@/lib/games/pictionary/game-engine/engine";
import { availableChallenges } from "@/lib/games/pictionary/game-engine/challenges";
import { ChallengePicker } from "@/features/pictionary/challenges/challenge-visuals";
import { gameActions } from "@/lib/games/pictionary/store/game-store";
import { sfx } from "@/lib/games/pictionary/utils/feedback";
import { Button } from "@/features/pictionary/shared/button";
import { CategoryBadge } from "@/features/pictionary/shared/category-badge";

/**
 * Between turns: make the next drawer unmistakable from across the room and
 * get the device into their hands before anything secret appears.
 */
export function HandoffScreen({ session }) {
  const team = activeTeam(session);
  const turn = session.currentTurn;
  const drawer = turn.drawerName;
  const named = team.players.length > 0;
  const { challengeMode } = session.settings;
  const needsPick = turn.challengeId === null;
  const borrowed = !turn.isAllPlay && turn.requestedCategory && turn.requestedCategory !== turn.category;

  return (
    <div className="flex flex-1 flex-col gap-5" style={teamStyle(team.color)}>
      <section className="relative overflow-hidden rounded-[2rem] border-2 border-ink bg-[var(--team)] px-6 pt-7 pb-8 text-center text-[var(--team-fg)] shadow-[0_6px_0_0_var(--color-ink)] animate-pop-in">
        <Scribbles />
        <p className="relative inline-flex items-center gap-2 rounded-full bg-black/15 px-3 py-1 font-display text-sm font-bold">
          Turn {turn.number} · {team.name}
        </p>
        <p className="relative mt-5 text-lg font-semibold opacity-90">{named ? "Up to draw" : "Pick someone to draw"}</p>
        <h1 className="relative mt-1 font-display text-[clamp(2.75rem,15vw,5rem)] leading-[0.95] font-extrabold tracking-tight text-balance break-words">
          {named ? drawer : team.name}
        </h1>
        <div className="relative mt-6 flex justify-center">
          <CategoryBadge category={turn.category} size="lg" className="border-2 border-ink shadow-[0_3px_0_0_var(--color-ink)]" />
        </div>
      </section>

      {turn.isAllPlay && (
        <Notice icon={Users} tone="sun">
          <strong className="font-display text-lg">All Play!</strong>{" "}
          {named ? drawer : "The drawer"} draws, but <strong>every team</strong> guesses. First team to shout it takes
          the point{session.mode === "classic" ? " and the roll" : ""}.
        </Notice>
      )}
      {borrowed && (
        <Notice icon={Info}>
          The {getCategory(turn.requestedCategory).label} words have run out, so this turn draws from{" "}
          <strong>{getCategory(turn.category).label}</strong> instead.
        </Notice>
      )}

      {challengeMode === "host" && (
        <section className="card-ink p-4 animate-rise" aria-labelledby="pick-style">
          <h2 id="pick-style" className="mb-3 flex items-center gap-2 font-display text-lg font-extrabold">
            <Sparkles className="size-5 text-coral" />
            Host: pick the drawing style
          </h2>
          <ChallengePicker
            label="Drawing style for this turn"
            ids={availableChallenges(session.settings)}
            value={turn.challengeId}
            onChange={(id) => {
              sfx.tap();
              gameActions.selectChallenge(id);
            }}
          />
          {turn.isAllPlay && (
            <p className="mt-3 text-sm text-ink-muted">All Play: the same challenge applies whichever team guesses.</p>
          )}
        </section>
      )}
      {challengeMode === "random" && (
        <Notice icon={Sparkles} tone="sun">
          <strong>A drawing challenge awaits.</strong> {named ? drawer : "The drawer"} sees it first, before the word.
        </Notice>
      )}

      <section className="flex items-center gap-4 rounded-[1.75rem] border-2 border-dashed border-ink/30 p-5 animate-rise [animation-delay:120ms]">
        <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-ink text-sun">
          <ArrowRightLeft className="size-7" />
        </span>
        <p className="text-ink-soft">
          <strong className="block font-display text-lg text-ink">
            Pass the phone to {named ? drawer : "your drawer"}
          </strong>
          Everyone else, eyes off the screen until the timer starts.
        </p>
      </section>

      <div className="mt-auto pt-2">
        <Button
          size="xl"
          variant="team"
          block
          disabled={needsPick}
          onClick={() => {
            sfx.unlock();
            gameActions.openReveal();
          }}
        >
          <EyeOff className="size-6" />
          {needsPick
            ? "Pick a drawing style first"
            : named && drawer.length <= 12
              ? `I’m ${drawer}, show me`
              : "I’m the drawer, show me"}
        </Button>
      </div>
    </div>
  );
}

function Notice({ icon: Icon, tone, children }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border-2 border-ink p-4 animate-rise ${tone === "sun" ? "bg-sun-soft" : "bg-paper"}`}
    >
      <Icon className="mt-0.5 size-5 shrink-0" />
      <p className="text-ink-soft [&_strong]:text-ink">{children}</p>
    </div>
  );
}

function Scribbles() {
  return (
    <svg aria-hidden viewBox="0 0 400 220" className="absolute inset-0 size-full opacity-20" preserveAspectRatio="none">
      <path d="M-10 40 C 60 10, 90 80, 150 40 S 260 0, 300 50" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="350" cy="170" r="34" stroke="currentColor" strokeWidth="6" fill="none" />
      <path d="M30 190 l20 -20 l20 20 l20 -20 l20 20" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
