"use client";

import { Dialog } from "@/components/ui/Dialog";
import { ArrowRightIcon } from "@/components/ui/icons";
import { teamText } from "@/lib/games/core/teams";
import { pointsFor, titleLetters } from "@/lib/games/fill-the-film/engine";
import { CLUE_LABEL, wordIndexes } from "./MovieRow";

const ORDINALS = ["1st", "2nd", "3rd"];
const ordinal = (n) => ORDINALS[n - 1] ?? `${n}th`;

/**
 * Shows everyone what the team just asked for (a letter, a clue, or the answer
 * after giving up) before the turn passes. Closing it continues the game.
 *
 * @param {{
 *   reveal: import("@/lib/games/fill-the-film/engine").Reveal | null,
 *   entry: import("@/lib/games/fill-the-film/engine").ListEntry | null,
 *   team: { name: string, color: string },
 *   nextTeam: { name: string } | null,
 *   solo: boolean,
 *   onContinue: () => void,
 * }} props
 */
export function RevealDialog({ reveal, entry, team, nextTeam, solo, onContinue }) {
  const open = Boolean(reveal && entry);
  return (
    <Dialog open={open} onClose={onContinue} labelledBy="reveal-title" accent={team.color}>
      {open ? <RevealBody reveal={reveal} entry={entry} team={team} nextTeam={nextTeam} solo={solo} onContinue={onContinue} /> : null}
    </Dialog>
  );
}

function RevealBody({ reveal, entry, team, nextTeam, solo, onContinue }) {
  const letters = titleLetters(entry);
  const number = reveal.movieIndex + 1;
  const eyebrow = { letter: "Letter revealed", clue: "Clue", "gave-up": "Gave up" }[reveal.kind];
  const continueLabel = solo ? "Continue" : nextTeam ? `Pass to ${nextTeam.name}` : "See the results";

  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: teamText(team.color) }}>
        {team.name} · {eyebrow}
      </p>

      {reveal.kind === "letter" ? (
        <>
          <h2 id="reveal-title" className="mt-2 font-display text-2xl font-bold tracking-tight">
            The {ordinal(reveal.letterIndex + 1)} letter of movie {number} is
          </h2>
          <span className="film-tile film-tile-xl anim-pop mx-auto mt-5" data-state="fresh">
            {letters[reveal.letterIndex]}
          </span>
        </>
      ) : reveal.kind === "clue" ? (
        <>
          <h2 id="reveal-title" className="mt-2 font-display text-2xl font-bold tracking-tight">
            Clue for movie {number}
          </h2>
          <p className="anim-pop mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-subtle">{CLUE_LABEL[reveal.clue]}</p>
          <p className="anim-pop mt-1 font-display text-4xl font-extrabold leading-tight tracking-tight text-accent-3 sm:text-5xl">
            {entry[reveal.clue]}
          </p>
        </>
      ) : (
        <>
          <h2 id="reveal-title" className="mt-2 font-display text-2xl font-bold tracking-tight">
            Movie {number} was
          </h2>
          <p className="anim-pop mt-4 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{entry.title}</p>
        </>
      )}

      {/* The title as it now stands, with the new letter highlighted. */}
      <div className="mt-6 flex flex-wrap justify-center gap-x-[0.6em] gap-y-1.5" style={{ "--film-tile": "clamp(1.3rem, 6vw, 2.1rem)" }} aria-hidden="true">
        {wordIndexes(entry).map((word, w) => (
          <span key={w} className="flex gap-[0.18em]">
            {word.map((i) => {
              const state = reveal.kind === "gave-up" ? "given" : !entry.revealed.includes(i) ? "blank" : i === reveal.letterIndex ? "fresh" : "shown";
              return (
                <span key={i} className="film-tile" data-state={state}>
                  {state === "blank" ? "" : letters[i]}
                </span>
              );
            })}
          </span>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted">
        {reveal.kind === "gave-up" ? (
          "No points for this one. The next movie opens."
        ) : (
          <>
            Movie {number} is now worth <span className="font-semibold tabular-nums text-accent-3">{pointsFor(entry)}</span>
          </>
        )}
      </p>

      <button type="button" autoFocus className="btn btn-primary mt-7 h-14 w-full text-base" onClick={onContinue}>
        {continueLabel} <ArrowRightIcon size={18} />
      </button>
    </div>
  );
}
