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
  const celebrate = solo ? result?.newBest && kept > 0 : leaders.length > 0;

  const headline = solo
    ? result?.newBest && result.previousBest != null
      ? "New best!"
      : `You won ${kept} ${kept === 1 ? "card" : "cards"}`
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
          {hand} cards each{state.bestStreak > 1 ? ` · longest run ${state.bestStreak}` : ""}
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

      {showcase.length ? <CardFan cards={showcase} /> : null}

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

/** Most cards shown in the fan; a longer haul shows the latest ones and a count. */
const FAN_MAX = 16;

/**
 * The cards won, fanned out. The overlap tightens as the count grows so the fan
 * always fits the screen (no sideways scrolling): each card after the first is
 * pulled left by whatever it takes to fit, but always leaves at least 1rem showing.
 */
function CardFan({ cards }) {
  const shown = cards.slice(-FAN_MAX);
  const hidden = cards.length - shown.length;
  const n = shown.length;
  const mid = (n - 1) / 2;
  // Margin percentages are of the container's width, so this fits n cards of width --w into it.
  const pull = n > 1 ? `max(calc(1rem - var(--w)), min(-1.25rem, calc((100% - ${n} * var(--w)) / ${n - 1})))` : "0";
  return (
    <section className="anim-rise relative mt-8 overflow-x-clip px-2 pb-2 pt-1" aria-label={`${cards.length} cards won`} style={{ animationDelay: "120ms" }}>
      <div className="flex w-full justify-center [--w:3.5rem] sm:[--w:5rem]">
        {shown.map((card, i) => (
          <div
            key={`${card}-${i}`}
            className="w-[var(--w)] shrink-0"
            style={{
              marginLeft: i === 0 ? 0 : pull,
              rotate: `${(i - mid) * Math.min(6, 40 / n)}deg`,
              translate: `0 ${Math.abs(i - mid) * Math.min(3, 24 / n)}px`,
            }}
          >
            <PlayingCard card={card} />
          </div>
        ))}
      </div>
      {hidden > 0 ? (
        <p className="mt-5 text-center text-sm font-semibold text-subtle">
          The last {shown.length} of {cards.length} cards won
        </p>
      ) : null}
    </section>
  );
}
