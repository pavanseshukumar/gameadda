"use client";

import { Scoreboard } from "@/components/game/Scoreboard";
import { Confetti } from "@/components/game/Confetti";
import { GameShell } from "@/components/game/GameShell";
import { RefreshIcon, TrophyIcon } from "@/components/ui/icons";
import { leadingTeams, teamInk } from "@/lib/games/core/teams";
import { ACTIONS, formatTime, pairsFound } from "@/lib/games/twin-hunt/engine";

export function FinishedScreen({ state, dispatch }) {
  const solo = state.teams.length === 1;
  const result = state.result ?? { moves: state.moves, ms: 0, cleared: false, newBest: false, previousBest: null };
  const leaders = leadingTeams(state.teams);
  const champion = !solo && leaders.length === 1 ? leaders[0] : null;
  const totalPairs = state.cards.length / 2;
  const found = pairsFound(state);
  // Every move found a pair.
  const perfect = result.cleared && result.moves === totalPairs;
  const celebrate = solo ? result.cleared : leaders.length > 0;
  const best = state.bests[String(state.settings.pairs)];

  const headline = solo
    ? result.cleared
      ? result.newBest && result.previousBest
        ? "New best!"
        : perfect
          ? "Perfect memory!"
          : "Board cleared!"
      : "Game ended"
    : champion
      ? `${champion.name} wins!`
      : leaders.length > 1
        ? `It’s a tie between ${leaders.map((t) => t.name).join(" & ")}`
        : "No pairs found";

  return (
    <GameShell teamColor={champion?.color ?? "#ff9f6b"}>
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
          {found} of {totalPairs} pairs · {result.moves} {result.moves === 1 ? "move" : "moves"} · {formatTime(result.ms)}
        </p>
        <h1 className="anim-rise mt-3 font-display text-[clamp(2.2rem,7vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">{headline}</h1>
        {solo && result.newBest && result.previousBest ? (
          <p className="anim-rise mt-3 text-muted">
            Down from {result.previousBest.moves} moves on the {state.settings.pairs}-pair board.
          </p>
        ) : null}
      </section>

      {solo ? (
        <section className="anim-rise relative mt-8 grid grid-cols-3 gap-2 text-center sm:gap-3" aria-label="Your game" style={{ animationDelay: "120ms" }}>
          <Cell label="Moves" value={result.moves} />
          <Cell label="Time" value={formatTime(result.ms)} />
          <Cell label="Best" value={best ? best.moves : "—"} tone={result.newBest ? "hit" : undefined} />
        </section>
      ) : (
        <section className="relative mt-10">
          <Scoreboard variant="ranked" teams={state.teams} />
        </section>
      )}

      <div className="relative mt-8 flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="button"
          autoFocus
          className="btn btn-primary h-14 text-base sm:h-16 sm:flex-1 sm:text-lg"
          onClick={() => dispatch({ type: ACTIONS.REMATCH, seed: Math.random(), now: Date.now() })}
        >
          <RefreshIcon size={20} /> Play again
        </button>
        <button type="button" className="btn btn-secondary h-14 px-8 text-base sm:h-16" onClick={() => dispatch({ type: ACTIONS.NEW_GAME })}>
          Change setup
        </button>
      </div>
    </GameShell>
  );
}

function Cell({ label, value, tone }) {
  return (
    <div className="card rounded-2xl px-2 py-3">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-subtle">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${tone === "hit" ? "text-hit" : ""}`}>{value}</p>
    </div>
  );
}
