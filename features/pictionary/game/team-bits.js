import { getTeamColor, teamStyle } from "@/lib/games/pictionary/data/team-colors";
import { cn } from "@/lib/games/pictionary/utils";

/** Round token in a team's colour, used on the board and in lists. */
export function TeamToken({ color, size = 28, className, children }) {
  const c = getTeamColor(color);
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full border-2 border-ink font-display font-extrabold", className)}
      style={{ width: size, height: size, background: c.hex, color: c.fg, boxShadow: "inset 0 -3px 0 rgba(0,0,0,.18)" }}
    >
      {children}
    </span>
  );
}

export function TeamPill({ team, className }) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 font-display font-bold", className)}
      style={{ ...teamStyle(team.color), background: "var(--team-soft)", color: "var(--team-deep)" }}
    >
      <span className="size-2.5 rounded-full bg-[var(--team)]" />
      {team.name}
    </span>
  );
}

/**
 * Compact standings list. `metric` picks what the big number shows.
 * @param {{ teams: any[], activeId?: string, metric: (team) => string | number, metricLabel?: string, highlightId?: string }} props
 */
export function Standings({ teams, activeId, metric, metricLabel, highlightId }) {
  return (
    <ol className="flex flex-col gap-2">
      {teams.map((team) => {
        const active = team.id === activeId;
        return (
          <li
            key={team.id}
            style={teamStyle(team.color)}
            className={cn(
              "flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 transition",
              active ? "border-ink bg-[var(--team-soft)] shadow-[0_3px_0_0_var(--color-ink)]" : "border-line bg-paper",
            )}
          >
            <TeamToken color={team.color} size={30} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display font-bold">{team.name}</span>
              {active && <span className="block text-xs font-semibold text-[var(--team-deep)]">Up now</span>}
            </span>
            <span className="text-right">
              <span
                key={`${team.id}-${metric(team)}`}
                className={cn(
                  "block font-display text-2xl font-extrabold tabular-nums",
                  highlightId === team.id && "animate-score-bump text-[var(--team-deep)]",
                )}
              >
                {metric(team)}
              </span>
              {metricLabel && <span className="block text-[11px] font-semibold text-ink-muted">{metricLabel}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
