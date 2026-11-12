/**
 * Per-team scoring for one round: alphabet points, completion bonus and total.
 *
 * @param {{
 *   rows: { team: { id: string, name: string, color: string }, alphabet: number, bonus: number, total: number, isWinner: boolean }[],
 *   multiplier: number,
 * }} props
 */
export function RoundBreakdown({ rows, multiplier }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <table className="w-full table-fixed text-left">
        <caption className="sr-only">Points earned this round</caption>
        <colgroup>
          <col />
          <col className="w-12 sm:w-24" />
          <col className="hidden sm:table-column sm:w-32" />
          <col className="w-[3.75rem] sm:w-24" />
        </colgroup>
        <thead>
          <tr className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-subtle sm:tracking-[0.14em]">
            <th scope="col" className="px-3 py-3 font-semibold sm:px-4">Team</th>
            <th scope="col" className="px-1.5 py-3 text-right font-semibold sm:px-2">
              <span className="sm:hidden" aria-hidden="true">A–Z</span>
              <span className="sr-only sm:not-sr-only">Letters</span>
            </th>
            <th scope="col" className="hidden px-2 py-3 text-right font-semibold sm:table-cell">Bonus</th>
            <th scope="col" className="py-3 pl-1.5 pr-3 text-right font-semibold sm:px-4">Round</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ team, alphabet, bonus, total, isWinner }) => (
            <tr
              key={team.id}
              className="border-t border-line"
              style={isWinner ? { background: `color-mix(in oklab, ${team.color} 14%, transparent)` } : undefined}
            >
              <th scope="row" className="px-3 py-3 font-medium sm:px-4">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: team.color }} />
                  <span className="truncate">{team.name}</span>
                </span>
                {isWinner ? (
                  <span className="mt-1 ml-5 inline-flex items-center gap-1 text-sm whitespace-nowrap sm:hidden">
                    <span className="rounded-md bg-accent-3 px-1.5 py-0.5 text-xs font-extrabold text-[#1a1205]">
                      {multiplier}×
                    </span>
                    <span className="font-semibold text-accent-3 tabular-nums">+{bonus} bonus</span>
                  </span>
                ) : null}
              </th>
              <td className="px-1.5 py-3 text-right tabular-nums sm:px-2 text-muted">{alphabet}</td>
              <td className="hidden px-2 py-3 text-right tabular-nums sm:table-cell">
                {isWinner ? (
                  <span className="inline-flex items-center gap-1 whitespace-nowrap sm:gap-1.5">
                    <span className="rounded-md bg-accent-3 px-1.5 py-0.5 text-xs font-extrabold text-[#1a1205]">
                      {multiplier}×
                    </span>
                    <span className="font-semibold text-accent-3">+{bonus}</span>
                  </span>
                ) : (
                  <span className="text-subtle">–</span>
                )}
              </td>
              <td className="py-3 pl-1.5 pr-3 text-right font-display sm:px-4 text-lg font-bold tabular-nums">{total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
