import { teamInk, teamText } from "@/lib/games/core/teams";
/**
 * Large "whose turn is it" banner. Re-keys on team change so it animates in.
 *
 * @param {{ team: { id: string, name: string, color: string }, hint?: string }} props
 */
export function TurnIndicator({ team, hint }) {
  return (
    <div key={team.id} className="anim-rise flex min-w-0 flex-1 items-center gap-3 sm:gap-3.5" aria-live="polite">
      <span
        className="anim-pulse relative grid size-9 shrink-0 place-items-center rounded-full sm:size-11"
        style={{ background: team.color, color: teamInk(team.color) }}
      >
        <span className="font-display text-base font-bold sm:text-lg">
          {team.name.replace(/^team\s+/i, "").charAt(0).toUpperCase()}
        </span>
      </span>
      <div className="min-w-0">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] sm:text-xs" style={{ color: teamText(team.color) }}>
          Now playing
        </p>
        <p className="line-clamp-2 break-words font-display text-lg font-bold leading-tight tracking-tight sm:line-clamp-1 sm:text-3xl">
          {team.name}
        </p>
        {hint ? <p className="mt-0.5 hidden text-sm text-muted sm:block">{hint}</p> : null}
      </div>
    </div>
  );
}
