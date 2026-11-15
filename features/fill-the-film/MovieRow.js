import { Check, Flag, Lock, X } from "lucide-react";
import { pointsFor, titleLetters, titleWordLengths } from "@/lib/games/fill-the-film/engine";

export const CLUE_LABEL = { year: "Year", lead: "Starring" };

/** Split a title's letter indexes into words, for laying out tiles. */
export function wordIndexes(entry) {
  let index = 0;
  return titleWordLengths(entry).map((length) => Array.from({ length }, () => index++));
}

/**
 * One movie on a team's list. Lists are played in order, so a row is
 * "current" (being played), "upcoming" (locked until the ones above are done),
 * "solved" or "gave-up".
 *
 * @param {{
 *   entry: import("@/lib/games/fill-the-film/engine").ListEntry,
 *   number: number,
 *   status: "current" | "upcoming" | "solved" | "gave-up",
 *   freshLetter?: number | null,   letter just revealed by a hint (highlighted)
 *   freshClue?: string | null,     clue just given (highlighted)
 * }} props
 */
export function MovieRow({ entry, number, status, freshLetter = null, freshClue = null }) {
  const letters = titleLetters(entry);
  const shown = new Set(entry.revealed);
  const masked = letters.map((char, i) => (shown.has(i) ? char : "blank")).join(" ");
  const label = {
    solved: `Movie ${number}: ${entry.title}, solved for ${entry.points} points`,
    "gave-up": `Movie ${number}: ${entry.title}, given up`,
    current: `Movie ${number}, now playing: ${masked}${entry.clues.length ? `. Clues: ${entry.clues.map((c) => entry[c]).join(", ")}` : ""}${entry.wrongGuesses?.length ? `. Already tried: ${entry.wrongGuesses.join(", ")}` : ""}`,
    upcoming: `Movie ${number}, locked: ${masked}`,
  }[status];

  return (
    <li className="film-row flex items-center gap-3 rounded-2xl px-2.5 py-2.5 sm:gap-4 sm:px-4 sm:py-3" data-status={status} aria-label={label}>
      <span className="film-row-num grid size-7 shrink-0 place-items-center rounded-full font-display text-sm font-bold tabular-nums sm:size-8" aria-hidden="true">
        {status === "solved" ? <Check size={16} strokeWidth={3} /> : status === "gave-up" ? <Flag size={14} strokeWidth={2.5} /> : number}
      </span>
      <span className="min-w-0 flex-1" aria-hidden="true">
        <span className="flex flex-wrap gap-x-[0.6em] gap-y-1.5">
          {wordIndexes(entry).map((word, w) => (
            <span key={w} className="flex gap-[0.18em]">
              {word.map((i) => {
                const state =
                  status === "solved" ? "solved" : status === "gave-up" ? "given" : !shown.has(i) ? "blank" : i === freshLetter ? "fresh" : "shown";
                return (
                  <span key={`${i}-${state}`} className="film-tile" data-state={state}>
                    {state === "blank" ? "" : letters[i]}
                  </span>
                );
              })}
            </span>
          ))}
        </span>
        {entry.wrongGuesses?.length && status === "current" ? (
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold text-subtle">Wrong guesses:</span>
            {entry.wrongGuesses.map((guess, g) => (
              <span key={g} className="wrong-guess">
                <X size={12} strokeWidth={3} aria-hidden="true" />
                {guess}
              </span>
            ))}
          </span>
        ) : null}
        {entry.clues.length && status === "current" ? (
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            {entry.clues.map((clue) => (
              <span key={clue} className={`chip px-2 py-0.5 text-xs ${clue === freshClue ? "film-clue-fresh anim-pop" : ""}`}>
                <span className="text-subtle">{CLUE_LABEL[clue]}</span> <span className="font-semibold">{entry[clue]}</span>
              </span>
            ))}
          </span>
        ) : null}
      </span>
      <span className="shrink-0 text-right font-display text-sm font-bold tabular-nums sm:text-base" aria-hidden="true">
        {status === "solved" ? (
          <span className="text-hit">+{entry.points}</span>
        ) : status === "gave-up" ? (
          <span className="text-subtle">0</span>
        ) : status === "upcoming" ? (
          <Lock size={15} className="text-subtle" />
        ) : (
          <span className="text-accent-3">{pointsFor(entry)}</span>
        )}
      </span>
    </li>
  );
}
