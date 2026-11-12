"use client";

import { useState } from "react";
import { Scoreboard } from "@/components/game/Scoreboard";
import { AnswerSlots } from "@/components/game/AnswerSlots";
import { Confetti } from "@/components/game/Confetti";
import { GameShell } from "@/components/game/GameShell";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ArrowRightIcon, FlagIcon } from "@/components/ui/icons";
import { ACTIONS, BASE_POINTS, selectMovie, selectTeam } from "@/lib/games/jumble-rumble/engine";
import { answerWords } from "@/lib/games/jumble-rumble/movies";

export function RoundCompleteScreen({ state, dispatch, onNextRound }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const movie = selectMovie(state);
  const result = state.roundResult;
  const winner = selectTeam(state, result?.winnerTeamId);
  const solved = result?.outcome === "solved" && winner;
  const words = answerWords(movie);

  return (
    <GameShell teamColor={winner?.color ?? "#64748b"}>
      {solved ? <Confetti /> : null}

      <section className="relative pt-6 text-center sm:pt-10">
        <p className="anim-rise text-xs font-semibold uppercase tracking-[0.2em] text-subtle">Round {state.round} complete</p>
        <h1 className="anim-rise mt-4 font-display text-[clamp(2.1rem,7vw,3.75rem)] font-extrabold leading-none tracking-[-0.03em]">
          {solved ? (
            <>
              {winner.name} <span style={{ color: winner.color }}>{result.steal ? "stole it!" : "cracked it!"}</span>
            </>
          ) : (
            "Nobody cracked it"
          )}
        </h1>
        {!solved ? (
          <p className="anim-rise mx-auto mt-3 max-w-md text-muted">
            {result?.outcome === "revealed" ? "The host revealed the movie." : "The first try and the steal both missed. No points this round."}
          </p>
        ) : null}
      </section>

      <section className="card anim-rise relative mt-8 rounded-[2rem] p-5 sm:p-8" style={{ animationDelay: "120ms" }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">The movie was</p>
        <div className="mt-4">
          <AnswerSlots wordLengths={words.map((w) => w.length)} chars={[...words.join("")]} solved />
        </div>
        <p className="mt-5 text-center text-muted">
          <span className="font-display text-xl font-bold text-foreground">{movie.title}</span>
          {movie.year || movie.lead ? (
            <span className="block text-sm text-subtle sm:ml-2 sm:inline">{[movie.year, movie.lead].filter(Boolean).join(" · ")}</span>
          ) : null}
        </p>
      </section>

      {solved ? (
        <section className="anim-rise relative mt-6" style={{ animationDelay: "240ms" }} aria-label="Points this round">
          <div className={`grid gap-2 text-center sm:gap-3 ${result.steal ? "grid-cols-4" : "grid-cols-3"}`}>
            <PointsCell label="Solve" value={`+${BASE_POINTS}`} />
            <PointsCell label="Hints" value={result.hintPenalty ? `−${result.hintPenalty}` : "0"} tone={result.hintPenalty ? "miss" : undefined} />
            <PointsCell label="Speed" value={`+${result.speedBonus}`} tone="hit" />
            {result.steal ? <PointsCell label="Steal" value="×½" tone="accent" /> : null}
          </div>
          <p className="mt-3 text-center font-display text-2xl font-extrabold tabular-nums">
            <span style={{ color: winner.color }}>{winner.name}</span> +{result.points}
          </p>
        </section>
      ) : null}

      <section className="relative mt-8" aria-labelledby="standings-heading">
        <h2 id="standings-heading" className="mb-3 px-1 font-display text-xl font-bold tracking-tight">
          Standings
        </h2>
        <Scoreboard variant="ranked" teams={state.teams} roundPoints={solved ? { [winner.id]: result.points } : {}} />
      </section>

      <div className="relative mt-8 flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="button"
          autoFocus
          className="btn btn-primary h-14 text-base sm:h-16 sm:flex-1 sm:text-lg"
          onClick={onNextRound}
        >
          Next round <ArrowRightIcon size={20} />
        </button>
        <button type="button" className="btn btn-secondary h-14 px-8 text-base sm:h-16" onClick={() => setConfirmEnd(true)}>
          <FlagIcon size={18} /> Finish game
        </button>
      </div>

      <ConfirmDialog
        open={confirmEnd}
        title="Finish the game?"
        body="See the final standings and crown the champion."
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

function PointsCell({ label, value, tone }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-2 py-3">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-subtle">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${tone === "hit" ? "text-hit" : tone === "miss" ? "text-miss" : tone === "accent" ? "text-accent-3" : ""}`}>
        {value}
      </p>
    </div>
  );
}
