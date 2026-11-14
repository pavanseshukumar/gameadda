"use client";

import { temperatureStyle, yearClue } from "./thermo";

/**
 * Every guess this round, hottest first, with what it shares with the secret.
 *
 * @param {{
 *   guesses: { teamId: string, movie: { id: string, title: string, year?: number }, result: object, index: number }[],
 *   teams: { id: string, name: string, color: string }[],
 *   latestIndex?: number,   index of the newest guess, highlighted
 * }} props
 */
export function GuessBoard({ guesses, teams, latestIndex = -1 }) {
  if (guesses.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-muted">
        No guesses yet. Name any Telugu movie to take the first reading.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2" aria-label="Guesses, hottest first">
      {guesses.map((guess) => (
        <GuessRow key={guess.movie.id} guess={guess} team={teams.find((t) => t.id === guess.teamId)} latest={guess.index === latestIndex} />
      ))}
    </ol>
  );
}

function GuessRow({ guess, team, latest }) {
  const { result, movie } = guess;
  const { band, color } = temperatureStyle(result.score);
  const chips = [
    ...result.directors.map((name) => ({ icon: "🎬", text: name })),
    ...result.cast.slice(0, 3).map((name) => ({ icon: "⭐", text: name })),
    ...(result.cast.length > 3 ? [{ icon: "⭐", text: `+${result.cast.length - 3} more` }] : []),
    ...result.composers.map((name) => ({ icon: "🎵", text: name })),
    ...result.genres.map((name) => ({ icon: "🎭", text: name })),
  ];
  const year = yearClue(result.yearDiff);

  return (
    <li
      className={`relative overflow-hidden rounded-2xl border-2 bg-panel px-3 py-2.5 sm:px-4 ${latest ? "anim-pop" : ""}`}
      style={{ borderColor: latest ? color : "var(--edge)", boxShadow: `0 4px 0 0 ${latest ? color : "var(--depth)"}` }}
    >
      {/* Thermometer fill behind the row. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 opacity-15"
        style={{ width: `${Math.max(3, result.score)}%`, background: color }}
      />
      <div className="relative flex items-center gap-3">
        <span className="w-14 shrink-0 text-right font-display text-2xl font-extrabold tabular-nums" style={{ color }}>
          {result.score}°
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {movie.title}
            {movie.year ? <span className="ml-1.5 text-sm font-normal text-subtle">{movie.year}</span> : null}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <span className="size-2 shrink-0 rounded-full" style={{ background: team?.color }} aria-hidden="true" />
            <span className="truncate">{team?.name ?? "A team"}</span>
            <span aria-hidden="true">·</span>
            <span style={{ color }}>{band.label}</span>
          </p>
        </div>
      </div>
      {chips.length || year ? (
        <ul className="relative mt-2 flex flex-wrap gap-1.5 pl-[4.25rem]" aria-label="Shared with the secret">
          {chips.map((chip) => (
            <li key={`${chip.icon}${chip.text}`} className="chip px-2 py-0.5 text-xs">
              <span aria-hidden="true">{chip.icon}</span> {chip.text}
            </li>
          ))}
          {year ? <li className="rounded-full border border-dashed border-line-strong px-2 py-0.5 text-xs text-muted">📅 {year}</li> : null}
        </ul>
      ) : null}
    </li>
  );
}
