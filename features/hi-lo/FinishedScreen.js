"use client";

import { Scoreboard } from "@/components/game/Scoreboard";
import { Confetti } from "@/components/game/Confetti";
import { GameShell } from "@/components/game/GameShell";
import { RefreshIcon, TrophyIcon } from "@/components/ui/icons";
import { leadingTeams, teamInk } from "@/lib/games/core/teams";
import { ACTIONS } from "@/lib/games/hi-lo/engine";
import { PlayingCard } from "./PlayingCard";

export function FinishedScreen({ state, dispatch }) {
  const solo = state.teams.length === 1;
  const hand = state.settings.handSize;
  const leaders = leadingTeams(state.teams);
  const champion = !solo && leaders.length === 1 ? leaders[0] : null;
  const result = state.result;
  const best = state.bests[String(hand)];
  const kept = solo ? state.teams[0].score : 0;
  const celebrate = solo ? result?.newBest || kept === hand : leaders.length > 0;

  const headline = solo
    ? kept === hand
      ? "A perfect hand!"
      : result?.newBest && result.previousBest != null
        ? "New best!"
        : `You won ${kept} of ${hand}`
    : champion
      ? `${champion.name} wins!`
      : leaders.length > 1
        ? `It’s a tie between ${leaders.map((t) => t.name).join(" & ")}`
        : "Nobody won a card";

  // The winner's (or your) won cards, fanned out.
  const showcaseId = solo ? state.teams[0].id : champion?.id;
  const showcase = showcaseId ? (state.won[showcaseId] ?? []) : [];

  return (
    <GameShell teamColor={champion?.color ?? "#1f7a4d"}>
      {celebrate ? <Confetti count={60} /> : null}

      <section className="relative pt-8 text-center sm:pt-14">
        <div
          className="clay-color anim-pop mx-auto grid size-24 place-items-center rounded-[2rem]"
          style={{
            color: champion ? teamInk(champion.color) : "var(--btn-primary-fg)",
            background: champion?.color ?? "var(--btn-primary-bg)",
            "--tint": champion?.color ?? "var(--btn-primary-depth)",
          }}
        >
          <TrophyIcon size={44} />
        </div>
        <p className="anim-rise mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          {hand} cards each{state.bestStreak > 1 ? ` · best streak ${state.bestStreak}` : ""}
        </p>
        <h1 className="anim-rise mt-3 font-display text-[clamp(2.2rem,7vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">{headline}</h1>
        {solo ? (
          <p className="anim-rise mt-3 text-muted">
            {result?.complete === false
              ? "Ended early, so this hand doesn’t count toward your best."
              : result?.newBest && result.previousBest != null
                ? `Up from ${result.previousBest} on a ${hand}-card hand.`
                : best != null
                  ? `Your best with ${hand} cards: ${best}.`
                  : null}
          </p>
        ) : null}
      </section>

      {showcase.length ? (
        <section className="anim-rise relative mt-8 flex justify-center" aria-label="Cards won" style={{ animationDelay: "120ms" }}>
          <div className="flex -space-x-6 sm:-space-x-8">
            {showcase.map((card, i) => (
              <div
                key={`${card}-${i}`}
                className="w-14 sm:w-20"
                style={{ rotate: `${(i - (showcase.length - 1) / 2) * Math.min(6, 40 / showcase.length)}deg`, translate: `0 ${Math.abs(i - (showcase.length - 1) / 2) * 3}px` }}
              >
                <PlayingCard card={card} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {solo ? null : (
        <section className="relative mt-8" aria-labelledby="standings-heading">
          <h2 id="standings-heading" className="mb-3 px-1 font-display text-xl font-bold tracking-tight">
            Cards won
          </h2>
          <Scoreboard variant="ranked" teams={state.teams} />
        </section>
      )}

      <div className="relative mt-8">
        <button type="button" autoFocus className="btn btn-primary h-14 w-full text-base sm:h-16 sm:text-lg" onClick={() => dispatch({ type: ACTIONS.NEW_GAME })}>
          <RefreshIcon size={20} /> Play again
        </button>
      </div>
    </GameShell>
  );
}
