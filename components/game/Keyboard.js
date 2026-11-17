"use client";

import { ArrowRightIcon, BackspaceIcon } from "@/components/ui/icons";

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

const STATE_LABEL = { hit: "correct", near: "in the word, wrong spot", miss: "incorrect" };

/**
 * On-screen QWERTY keyboard.
 *
 * By default a used letter is spent (disabled), as in Guess the Song and Hangman.
 * Pass `reusable` for games where letters can be typed again (Word Swap), and
 * `onBackspace` to add a delete key at the end of the last row. `onEnter` and
 * `onSpace` add a bottom row: a space bar (games that take whole titles: Emoji
 * Talkies, Frozen Brains) and, on the right, the submit key in the game's primary
 * colour, where a thumb expects it.
 *
 * @param {{
 *   letterStates: Record<string, "hit" | "near" | "miss">,
 *   onKey: (letter: string) => void,
 *   disabled?: boolean,
 *   lastMiss?: { letter: string, seq: number } | null,
 *   reusable?: boolean,
 *   onEnter?: () => void,
 *   onBackspace?: () => void,
 *   enterLabel?: string,
 *   onSpace?: () => void,
 *   enterDisabled?: boolean,   e.g. nothing typed yet
 * }} props
 */
export function Keyboard({ letterStates, onKey, disabled = false, lastMiss = null, reusable = false, onEnter, onBackspace, enterLabel = "Enter", onSpace, enterDisabled = false }) {
  return (
    <div role="group" aria-label="Letter keyboard" className="flex w-full flex-col gap-[clamp(0.35rem,1.2vw,0.6rem)]">
      {ROWS.map((row, rowIndex) => {
        const last = rowIndex === ROWS.length - 1;
        return (
          <div key={rowIndex} className="flex justify-center gap-[clamp(0.3rem,1.1vw,0.55rem)]">
            {row.map((letter) => {
              const state = letterStates[letter] ?? "idle";
              const used = state !== "idle";
              const shaking = lastMiss?.letter === letter;
              // Re-key the most recent miss so its shake animation replays.
              return (
                <button
                  key={shaking ? `${letter}-${lastMiss.seq}` : letter}
                  type="button"
                  className={`key ${shaking ? "anim-shake" : ""} ${state === "hit" && !reusable ? "anim-pop" : ""}`}
                  data-state={state}
                  disabled={disabled || (used && !reusable)}
                  aria-label={`Letter ${letter.toUpperCase()}${used ? `, ${STATE_LABEL[state]}` : ""}`}
                  onClick={() => onKey(letter)}
                >
                  {letter.toUpperCase()}
                </button>
              );
            })}
            {last && onBackspace ? (
              <button type="button" className="key key-wide" disabled={disabled} onClick={onBackspace} aria-label="Delete letter">
                <BackspaceIcon size={20} />
              </button>
            ) : null}
          </div>
        );
      })}
      {onSpace || onEnter ? (
        <div className="flex justify-center gap-[clamp(0.3rem,1.1vw,0.55rem)]">
          {onSpace ? (
            <button type="button" className="key text-base" style={{ flex: "2 1 0", maxWidth: "20rem" }} disabled={disabled} onClick={onSpace}>
              Space
            </button>
          ) : null}
          {onEnter ? (
            <button
              type="button"
              className="key key-primary gap-1.5 text-base"
              style={onSpace ? { flex: "1 1 0", maxWidth: "11rem" } : { flex: "0 1 60%", maxWidth: "24rem" }}
              disabled={disabled || enterDisabled}
              onClick={onEnter}
            >
              <span className="inline-flex items-center gap-1.5">
                {enterLabel} <ArrowRightIcon size={18} />
              </span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
