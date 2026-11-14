"use client";

import { useEffect } from "react";
import { House, RotateCcw, Settings2, Trophy } from "lucide-react";
import { sfx } from "@/lib/games/pictionary/utils/feedback";
import { getTeamColor, teamStyle } from "@/lib/games/pictionary/data/team-colors";
import { teamById } from "@/lib/games/pictionary/game-engine/engine";
import { computeGameStats, formatDuration } from "@/lib/games/pictionary/game-engine/stats";
import { rankTeams } from "@/lib/games/pictionary/scoring";
import { gameActions } from "@/lib/games/pictionary/store/game-store";
import { cn, formatSeconds, ordinal } from "@/lib/games/pictionary/utils";
import { Button, ButtonLink } from "@/features/pictionary/shared/button";
import { TeamToken } from "@/features/pictionary/game/team-bits";
import { Confetti } from "./confetti";

export function ResultsScreen({ session }) {
  // Classic already played the fanfare when the token crossed the finish.
  useEffect(() => {
    if (session.mode === "quick") sfx.fanfare();
  }, [session.mode]);

  const winners = session.winnerTeamIds.map((id) => teamById(session, id)).filter(Boolean);
  const tie = winners.length > 1;
  const champ = winners[0];
  const ranked = rankTeams(session);
  const stats = computeGameStats(session);
  const classic = session.mode === "classic";
  const fastestTeam = stats.fastest ? teamById(session, stats.fastest.teamId) : null;

  return (
    <div className="flex flex-1 flex-col gap-6">
      {champ && <Confetti color={getTeamColor(champ.color).hex} />}

      <section
        className="relative overflow-hidden rounded-[2rem] border-2 border-ink bg-[var(--team)] px-6 pt-10 pb-8 text-center text-[var(--team-fg)] shadow-[0_6px_0_0_var(--color-ink)] animate-pop-in"
        style={teamStyle(champ?.color ?? "sun")}
      >
        <Sunburst />
        <span className="relative mx-auto inline-flex size-24 items-center justify-center rounded-full border-[3px] border-ink bg-sun text-ink shadow-[0_5px_0_0_var(--color-ink)] animate-wiggle">
          <Trophy className="size-12" strokeWidth={2.25} />
        </span>
        <p className="relative mt-5 font-display text-sm font-bold tracking-[0.16em] uppercase opacity-85">
          {session.endedEarly ? "Game called early" : "Game over"}
        </p>
        <h1 className="relative mt-1 font-display text-[2.75rem] leading-none font-extrabold tracking-tight text-balance sm:text-6xl">
          {tie ? "It’s a tie!" : `${champ?.name ?? "Nobody"} wins!`}
        </h1>
        <p className="relative mt-3 text-lg font-semibold opacity-90">
          {tie
            ? `${winners.map((w) => w.name).join(" & ")} share the crown`
            : classic
              ? session.endedEarly
                ? `Furthest along the board, on space ${champ?.position}`
                : "First across the finish line"
              : `${champ?.score} point${champ?.score === 1 ? "" : "s"} — top of the table`}
        </p>
        {!tie && champ?.players.length > 0 && (
          <p className="relative mx-auto mt-5 w-fit rounded-full bg-black/15 px-4 py-1.5 text-sm font-semibold">
            Starring {champ.players.map((p) => p.name).join(", ")}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl font-extrabold tracking-tight">Final standings</h2>
        <ol className="flex flex-col gap-2">
          {ranked.map((team, i) => {
            const rate = team.stats.turns ? Math.round((team.stats.correct / team.stats.turns) * 100) : 0;
            return (
              <li
                key={team.id}
                style={{ ...teamStyle(team.color), animationDelay: `${150 + i * 90}ms` }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border-2 border-ink px-4 py-3 animate-rise",
                  team.rank === 1 ? "bg-[var(--team-soft)] shadow-[0_4px_0_0_var(--color-ink)]" : "bg-paper",
                )}
              >
                <span className="w-9 font-display text-xl font-extrabold text-ink-muted">{ordinal(team.rank)}</span>
                <TeamToken color={team.color} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg font-extrabold">{team.name}</span>
                  <span className="block text-sm text-ink-soft">
                    {team.stats.correct}/{team.stats.turns} drawings guessed · {rate}%
                    {team.stats.steals > 0 && ` · ${team.stats.steals} steal${team.stats.steals === 1 ? "" : "s"}`}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-display text-2xl font-extrabold tabular-nums">
                    {classic ? team.position : team.score}
                  </span>
                  <span className="block text-[11px] font-semibold text-ink-muted">{classic ? "space" : "points"}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" variant="sun" className="flex-1" onClick={() => gameActions.rematch()}>
          <RotateCcw className="size-5" strokeWidth={2.75} />
          Play again
        </Button>
        <ButtonLink href="/games/pictionary/setup" size="lg" variant="paper" className="flex-1">
          <Settings2 className="size-5" />
          Change setup
        </ButtonLink>
        <ButtonLink href="/games/pictionary" size="lg" variant="paper" className="flex-1">
          <House className="size-5" />
          Home
        </ButtonLink>
      </div>

      <section>
        <h2 className="mb-3 font-display text-2xl font-extrabold tracking-tight">Game night in numbers</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Turns played" value={stats.turnsPlayed} />
          <Stat label="Guess rate" value={`${Math.round(stats.guessRate * 100)}%`} />
          <Stat label="Game time" value={formatDuration(stats.durationMs)} />
          <Stat label="Words skipped" value={stats.skips} />
          {stats.fastest && (
            <Stat
              wide
              label="Fastest guess"
              value={formatSeconds(stats.fastest.timeUsedMs)}
              detail={`“${stats.fastest.word.text}” · ${fastestTeam?.name ?? ""}`}
            />
          )}
          {stats.toughest && (
            <Stat
              wide
              label="Toughest category"
              value={stats.toughest.label}
              detail={`${stats.toughest.correct} of ${stats.toughest.played} guessed`}
            />
          )}
        </div>
      </section>

    </div>
  );
}

function Stat({ label, value, detail, wide }) {
  return (
    <div className={cn("rounded-2xl border-2 border-line bg-paper p-4", wide && "col-span-2")}>
      <p className="text-xs font-bold tracking-wider text-ink-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold tracking-tight">{value}</p>
      {detail && <p className="mt-0.5 truncate text-sm text-ink-soft">{detail}</p>}
    </div>
  );
}

/** Slow-turning rays behind the trophy. */
function Sunburst() {
  return (
    <svg
      aria-hidden
      viewBox="-100 -100 200 200"
      className="pointer-events-none absolute top-[-9rem] left-1/2 size-[30rem] -translate-x-1/2 animate-[spin_40s_linear_infinite] opacity-[0.16] motion-reduce:animate-none"
    >
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d="M0 0 L-7 -100 L7 -100 Z" fill="currentColor" transform={`rotate(${i * 22.5})`} />
      ))}
    </svg>
  );
}
