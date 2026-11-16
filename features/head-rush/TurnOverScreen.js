"use client";

import { useState } from "react";
import { GameShell } from "@/components/game/GameShell";
import { Scoreboard } from "@/components/game/Scoreboard";
import { Confetti } from "@/components/game/Confetti";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ArrowRightIcon, FlagIcon } from "@/components/ui/icons";
import { teamText } from "@/lib/games/core/teams";
import { ACTIONS, selectActiveTeam, selectIsLastTurn, selectNextTeam, selectTurnScore } from "@/lib/games/head-rush/engine";
import { getWord } from "@/lib/games/head-rush/words";

/**
 * After a turn: how many the team got, every word with a tap-to-fix mark (for
 * mis-swipes), and the standings with this turn's points pending.
 */
export function TurnOverScreen({ state, dispatch }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const team = selectActiveTeam(state);
  const got = selectTurnScore(state);
  const next = selectNextTeam(state);
  const last = selectIsLastTurn(state);
  const unplayed = state.deck.slice(state.results.length).map(getWord).filter(Boolean);
  // Show standings as they'll be once this turn's points are banked.
  const standings = state.teams.map((t) => (t.id === team.id ? { ...t, score: t.score + got } : t));

  const nextLabel = last ? "See final results" : next ? "Next turn" : `Start round ${state.round + 1}`;
  const nextDetail = last ? null : next ? `${next.name} is up` : `${state.teams[(state.roundStarterIndex + 1) % state.teams.length].name} goes first`;

  return (
    <GameShell teamColor={team.color}>
      {got ? <Confetti count={got * 6} /> : null}

      <section className="relative pt-4 text-center sm:pt-10">
        <p className="anim-rise text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          Round {state.round} · {state.turnEnd === "time" ? "Time’s up!" : "All words done!"}
        </p>
        <h1 className="anim-rise mt-3 font-display text-[clamp(2.1rem,9vw,3.75rem)] leading-none tracking-[-0.02em]">
          {team.name} <span style={{ color: teamText(team.color) }}>got {got}</span>
        </h1>
        <p className="anim-rise mx-auto mt-2 max-w-md text-sm text-muted">Mis-swiped one? Tap it to fix before the points count.</p>
      </section>

      <section className="card anim-rise mt-5 rounded-[1.75rem] p-3.5 sm:mt-8 sm:p-6" aria-label="Words this turn">
        <ul className="flex flex-wrap justify-center gap-2">
          {state.results.map((r, i) => {
            const word = getWord(r.id);
            const correct = r.result === "correct";
            return (
              <li key={r.id}>
                <button
                  type="button"
                  aria-pressed={correct}
                  onClick={() => dispatch({ type: ACTIONS.TOGGLE_RESULT, index: i })}
                  className={`flex min-h-11 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition active:scale-95 ${
                    correct ? "clay-color text-white" : "clay-well text-muted line-through decoration-2"
                  }`}
                  style={correct ? { background: "var(--hit)", "--tint": "var(--hit-deep)" } : undefined}
                  aria-label={`${word?.text}: ${correct ? "got it" : "passed"}. Tap to change.`}
                >
                  <span aria-hidden="true">{correct ? "✓" : "✗"}</span>
                  {word?.text}
                </button>
              </li>
            );
          })}
        </ul>
        {unplayed.length ? (
          <p className="mt-4 text-center text-xs text-subtle">
            Didn’t get to: {unplayed.map((w) => w.text).join(", ")}
          </p>
        ) : null}
        {state.results.length === 0 ? <p className="text-center text-sm text-muted">No words played this turn.</p> : null}
      </section>

      <section className="relative mt-6 sm:mt-8" aria-labelledby="standings-heading">
        <h2 id="standings-heading" className="mb-3 px-1 font-display text-xl tracking-tight">
          Standings
        </h2>
        <Scoreboard variant="ranked" teams={standings} roundPoints={got ? { [team.id]: got } : {}} />
      </section>

      <div className="cta-bar mt-auto flex flex-col gap-3 pt-6 sm:flex-row-reverse">
        <button
          type="button"
          autoFocus
          className="btn btn-primary min-h-14 flex-col gap-0 px-5 py-2 text-base sm:min-h-16 sm:flex-1 sm:text-lg"
          onClick={() => dispatch({ type: ACTIONS.NEXT_TURN, seed: Math.random() })}
        >
          <span className="flex items-center gap-2">
            {nextLabel} <ArrowRightIcon size={20} />
          </span>
          {nextDetail ? <span className="max-w-full whitespace-normal text-xs font-semibold opacity-80 sm:text-sm">{nextDetail}</span> : null}
        </button>
        {last ? null : (
          <button type="button" className="btn btn-secondary h-14 px-8 text-base sm:h-16" onClick={() => setConfirmEnd(true)}>
            <FlagIcon size={18} /> Finish game
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmEnd}
        title="Finish the game?"
        body="This turn’s points count. Teams still waiting won’t get their turn."
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

