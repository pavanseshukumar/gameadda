"use client";

import { useState } from "react";
import { Scoreboard } from "@/components/game/Scoreboard";
import { Confetti } from "@/components/game/Confetti";
import { GameShell } from "@/components/game/GameShell";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ArrowRightIcon, FlagIcon } from "@/components/ui/icons";
import { teamText } from "@/lib/games/core/teams";
import { ACTIONS, PERFECT_BONUS, SLOT_POINTS, correctOrder, selectActiveTeam } from "@/lib/games/release-ladder/engine";

/** After lock-in: the real order with years, and which rungs the team got right. */
export function RevealScreen({ state, dispatch, onNextRound, nextLoading }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const team = selectActiveTeam(state);
  const result = state.result;
  const right = correctOrder(state.ladder);
  // Where the team had each movie (1-based), to show next to a miss.
  const placedAt = Object.fromEntries(state.ladder.map((m, i) => [m.id, i + 1]));
  const solo = state.teams.length === 1;

  const headline = result.perfect ? "Perfect ladder!" : result.correct === 0 ? "All mixed up" : `${result.correct} of ${right.length} in place`;

  return (
    <GameShell teamColor={team.color}>
      {result.perfect ? <Confetti /> : null}

      <section className="relative pt-6 text-center sm:pt-10">
        <p className="anim-rise text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          Round {state.round}
          {result.timedOut ? " · time ran out" : ""}
        </p>
        <h1 className="anim-rise mt-3 font-display text-[clamp(2.1rem,7vw,3.75rem)] leading-none tracking-[-0.02em]">{headline}</h1>
        <p className="anim-rise mt-3 font-display text-2xl tabular-nums">
          {solo ? null : <span style={{ color: teamText(team.color) }}>{team.name} </span>}+{result.points}
        </p>
        <p className="anim-rise mt-1 text-sm text-muted">
          {result.correct} × {SLOT_POINTS}
          {result.perfect ? ` + ${PERFECT_BONUS} perfect bonus` : ""}
        </p>
      </section>

      <section aria-label="The real order" className="relative mt-6 sm:mt-8">
        <p className="ladder-end">Oldest</p>
        <ol className="ladder-list">
          {right.map((movie, index) => {
            const hit = placedAt[movie.id] === index + 1;
            return (
              <li key={movie.id} className="ladder-row card anim-rise" data-mark={hit ? "hit" : "miss"} style={{ animationDelay: `${index * 80}ms` }}>
                <span className="ladder-year">{movie.year}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg leading-tight sm:text-2xl">{movie.title}</span>
                  {movie.lead ? <span className="mt-0.5 block truncate text-xs text-muted sm:text-sm">{movie.lead}</span> : null}
                </span>
                <span className={`shrink-0 text-right text-xs font-semibold sm:text-sm ${hit ? "text-hit" : "text-miss"}`}>
                  {hit ? "✓ Right spot" : `You had #${placedAt[movie.id]}`}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="ladder-end">Newest</p>
      </section>

      {solo ? null : (
        <section className="relative mt-8" aria-labelledby="standings-heading">
          <h2 id="standings-heading" className="mb-3 px-1 font-display text-xl tracking-tight">
            Standings
          </h2>
          <Scoreboard variant="ranked" teams={state.teams} roundPoints={{ [team.id]: result.points }} />
        </section>
      )}

      <div className="relative mt-8 flex flex-col gap-3 sm:flex-row-reverse">
        <button type="button" autoFocus className="btn btn-primary h-14 text-base sm:h-16 sm:flex-1 sm:text-lg" disabled={nextLoading} onClick={onNextRound}>
          Next round <ArrowRightIcon size={20} />
        </button>
        <button type="button" className="btn btn-secondary h-14 px-8 text-base sm:h-16" onClick={() => setConfirmEnd(true)}>
          <FlagIcon size={18} /> Finish game
        </button>
      </div>

      <ConfirmDialog
        open={confirmEnd}
        title="Finish the game?"
        body={solo ? "See your final score." : "See the final standings and crown the champion."}
        confirmLabel="Show results"
        onCancel={() => setConfirmEnd(false)}
        onConfirm={() => {
          setConfirmEnd(false);
          dispatch({ type: ACTIONS.END_GAME });
        }}
      />
    </GameShell>
  );
}
