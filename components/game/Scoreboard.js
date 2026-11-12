import { rankTeams } from "@/lib/games/core/teams";

/**
 * Team scoreboard.
 *  - variant "strip": compact horizontal cards for the gameplay header.
 *  - variant "ranked": sorted leaderboard for round/final results.
 *
 * @param {{
 *   teams: { id: string, name: string, color: string, score: number }[],
 *   activeTeamId?: string | null,
 *   roundPoints?: Record<string, number>,
 *   variant?: "strip" | "ranked",
 * }} props
 */
export function Scoreboard({ teams, activeTeamId = null, roundPoints = {}, variant = "strip" }) {
  if (variant === "ranked") return <RankedScoreboard teams={teams} roundPoints={roundPoints} />;

  const n = teams.length;
  // Every team stays visible, no sideways scrolling:
  //   phones:  2–3 teams → one row · 4 → 2×2 · 5–6 → two rows of 3
  //   tablets: up to 4 in one row · 5–6 → two rows of 3
  //   desktop: one row
  const columns = {
    "--cols-base": n <= 3 ? n : n === 4 ? 2 : 3,
    "--cols-md": n <= 4 ? n : Math.ceil(n / 2),
    "--cols-lg": n,
  };

  return (
    <ol
      aria-label="Scoreboard"
      className="grid grid-cols-[repeat(var(--cols-base),minmax(0,1fr))] gap-2 sm:grid-cols-[repeat(var(--cols-md),minmax(0,1fr))] sm:gap-2.5 lg:grid-cols-[repeat(var(--cols-lg),minmax(0,1fr))]"
      style={columns}
    >
      {teams.map((team) => {
        const active = team.id === activeTeamId;
        const gained = roundPoints[team.id] ?? 0;
        return (
          <li
            key={team.id}
            aria-current={active ? "true" : undefined}
            className="min-w-0 rounded-xl border px-2.5 py-2 transition-[background,border-color,box-shadow] duration-500 sm:rounded-2xl sm:px-3.5 sm:py-3"
            style={{
              borderColor: active ? team.color : "var(--line)",
              background: active
                ? `linear-gradient(160deg, color-mix(in oklab, ${team.color} 30%, transparent), color-mix(in oklab, ${team.color} 8%, transparent))`
                : "var(--surface)",
              boxShadow: active ? `0 0 0 1px ${team.color}, 0 12px 30px -16px ${team.color}` : "none",
            }}
          >
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <span className="size-2 shrink-0 rounded-full sm:size-2.5" style={{ background: team.color }} />
              <span className={`min-w-0 flex-1 truncate text-xs font-medium sm:text-sm ${active ? "text-foreground" : "text-muted"}`}>
                {/* Phones: drop a leading "Team " so the distinctive part of the name fits. */}
                <span className="sm:hidden" aria-hidden="true">
                  {team.name.replace(/^team\s+(?=\S)/i, "")}
                </span>
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">{team.name}</span>
              </span>
              {active ? (
                <span
                  className="hidden shrink-0 rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-white sm:inline"
                  style={{ background: team.color }}
                >
                  Turn
                </span>
              ) : null}
            </div>
            <div className="mt-0.5 flex min-w-0 items-baseline justify-between gap-1.5 sm:mt-1">
              <span key={team.score} className="anim-pop font-display text-lg font-bold tabular-nums tracking-tight sm:text-2xl">
                {team.score}
              </span>
              {gained > 0 ? (
                <span className="truncate text-[0.65rem] font-semibold text-hit tabular-nums sm:text-xs" title="Letter points this round">
                  +{gained}
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function RankedScoreboard({ teams, roundPoints }) {
  const ranked = rankTeams(teams);
  const top = Math.max(1, ...teams.map((team) => team.score));

  return (
    <ol aria-label="Standings" className="flex flex-col gap-2">
      {ranked.map((team, index) => {
        const gained = roundPoints[team.id] ?? 0;
        const tiedWithPrevious = index > 0 && ranked[index - 1].score === team.score;
        return (
          <li
            key={team.id}
            className="anim-rise relative overflow-hidden rounded-2xl border border-line bg-surface px-4 py-3.5"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 transition-[width] duration-700"
              style={{
                width: `${(team.score / top) * 100}%`,
                background: `linear-gradient(90deg, color-mix(in oklab, ${team.color} 26%, transparent), transparent)`,
              }}
            />
            <div className="relative flex items-center gap-3">
              <span className="w-6 text-center font-display text-lg font-bold text-subtle tabular-nums">
                {tiedWithPrevious ? "=" : index + 1}
              </span>
              <span className="size-3 shrink-0 rounded-full" style={{ background: team.color }} />
              {/* Phones: round gain sits under the name so the name gets the full width. */}
              <span className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-3">
                <span className="min-w-0 truncate font-medium sm:flex-1">{team.name}</span>
                {gained > 0 ? (
                  <span className="text-xs font-semibold text-hit tabular-nums sm:rounded-full sm:bg-hit/15 sm:px-2 sm:py-0.5">
                    +{gained}
                    <span className="sm:hidden"> this round</span>
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-right font-display text-2xl font-bold tabular-nums">{team.score}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
