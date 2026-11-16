"use client";

import { useState } from "react";
import { Scoreboard } from "@/components/game/Scoreboard";
import { LyricsDisplay } from "@/components/game/LyricsDisplay";
import { Confetti } from "@/components/game/Confetti";
import { GameShell } from "@/components/game/GameShell";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ArrowRightIcon, FlagIcon } from "@/components/ui/icons";
import { isSolo, teamText } from "@/lib/games/core/teams";
import {
  ACTIONS,
  HIDDEN_LETTER_POINTS,
  MAX_MISSES,
  SOLVE_BONUS,
  selectNextTeam,
  selectRoundResults,
  selectTeam,
} from "@/lib/games/hangman/engine";
import { categoryLabel } from "@/lib/games/hangman/words";
import { Gallows } from "./Gallows";

/** Shown after each team's word: how it went, the round so far, and who plays next. */
export function RoundCompleteScreen({ state, dispatch }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const result = state.wordResult;
  const team = selectTeam(state, result.teamId);
  const solved = result.outcome === "solved";
  const nextTeam = selectNextTeam(state);
  const solo = isSolo(state.teams);
  const roundResults = selectRoundResults(state);
  const hiddenLetters = (result.bonus - SOLVE_BONUS) / HIDDEN_LETTER_POINTS;

  const detail = solved
    ? result.method === "word" && hiddenLetters > 0
      ? `Solved with ${hiddenLetters} ${hiddenLetters === 1 ? "letter" : "letters"} still hidden.`
      : `Finished with ${result.misses} ${result.misses === 1 ? "miss" : "misses"}.`
    : result.outcome === "hanged"
      ? `${MAX_MISSES} misses. The points at stake are lost.`
      : "The host revealed the word. No points this time.";

  return (
    <GameShell teamColor={team.color}>
      {solved ? <Confetti /> : null}

      <section className="relative pt-6 text-center sm:pt-10">
        <p className="anim-rise text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          Round {state.round}
          {solo ? "" : ` · word ${state.turnInRound + 1} of ${state.teams.length}`}
        </p>
        <h1 className="anim-rise mt-4 font-display text-[clamp(2.1rem,7vw,3.75rem)] font-extrabold leading-none tracking-[-0.03em]">
          {solo ? null : <>{team.name} </>}
          <span style={{ color: solved ? teamText(team.color) : "var(--miss)" }}>
            {solved ? (solo ? "Saved!" : "saved it!") : result.outcome === "hanged" ? (solo ? "Hanged!" : "got hanged!") : "Word revealed"}
          </span>
        </h1>
        <p className="anim-rise mx-auto mt-3 max-w-md text-muted">{detail}</p>
      </section>

      <section className="card anim-rise relative mt-8 rounded-[2rem] p-5 sm:p-8" style={{ animationDelay: "120ms" }}>
        <div className="flex items-center gap-4 sm:gap-8">
          <Gallows
            misses={state.misses}
            max={MAX_MISSES}
            mood={result.outcome === "hanged" ? "hanged" : solved ? "saved" : "playing"}
            className="w-20 shrink-0 sm:w-32"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">
              The word was · {categoryLabel(state.word.category)}
            </p>
            <div className="mt-4">
              <LyricsDisplay lines={[state.word.text]} guessedLetters={state.guessed} revealAll complete={solved} size="sm" />
            </div>
          </div>
        </div>
        {solved ? (
          <div className="mt-6 grid grid-cols-3 gap-2 text-center sm:gap-3">
            <PointsCell label="Letters" value={`+${result.letterPoints}`} />
            <PointsCell label="Solve" value={`+${result.bonus}`} tone="hit" />
            <PointsCell label="Total" value={`+${result.total}`} tone="accent" />
          </div>
        ) : null}
      </section>

      {!solo ? (
        <section className="anim-rise relative mt-6" style={{ animationDelay: "240ms" }} aria-labelledby="round-heading">
          <h2 id="round-heading" className="mb-3 px-1 font-display text-xl font-bold tracking-tight">
            This round
          </h2>
          <ul className="grid gap-2">
            {/* In play order: this round's starter first. */}
            {state.teams.map((_, i) => state.teams[(state.roundStarterIndex + i) % state.teams.length]).map((t) => {
              const played = roundResults.find((r) => r.team.id === t.id)?.result;
              return (
                <li key={t.id} className="card flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
                  <span className="min-w-0 truncate font-semibold" style={{ color: teamText(t.color) }}>
                    {t.name}
                  </span>
                  <span className="shrink-0 text-sm text-muted tabular-nums">
                    {played ? (
                      <>
                        {played.word.text} ·{" "}
                        <span className={`font-display text-lg font-bold ${played.total ? "text-foreground" : "text-miss"}`}>
                          {played.total ? `+${played.total}` : played.outcome === "hanged" ? "hanged" : "0"}
                        </span>
                      </>
                    ) : (
                      <span className="text-subtle">{t.id === nextTeam?.id ? "Up next" : "Waiting"}</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="relative mt-8" aria-labelledby="standings-heading">
        <h2 id="standings-heading" className="mb-3 px-1 font-display text-xl font-bold tracking-tight">
          Standings
        </h2>
        <Scoreboard variant="ranked" teams={state.teams} roundPoints={result.total ? { [team.id]: result.total } : {}} />
      </section>

      <div className="relative mt-8 flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="button"
          autoFocus
          className="btn btn-primary h-14 text-base sm:h-16 sm:flex-1 sm:text-lg"
          onClick={() => dispatch({ type: ACTIONS.NEXT_TURN, seed: Math.random() })}
        >
          <span className="min-w-0 truncate">{nextTeam ? `Next: ${nextTeam.name}` : solo ? "Next word" : `Start round ${state.round + 1}`}</span> <ArrowRightIcon className="shrink-0" size={20} />
        </button>
        <button type="button" className="btn btn-secondary h-14 px-8 text-base sm:h-16" onClick={() => setConfirmEnd(true)}>
          <FlagIcon size={18} /> Finish game
        </button>
      </div>

      <ConfirmDialog
        open={confirmEnd}
        title="Finish the game?"
        body={nextTeam ? "Teams still waiting this round won’t get their word." : "See the final standings and crown the champion."}
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
    <div className="rounded-2xl bg-surface px-2 py-3">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-subtle">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${tone === "hit" ? "text-hit" : tone === "accent" ? "text-accent-3" : ""}`}>
        {value}
      </p>
    </div>
  );
}
