"use client";

import { BackspaceIcon } from "@/components/ui/icons";

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
 * `onEnter` / `onBackspace` to add those keys around the last row.
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
 * }} props
 */
export function Keyboard({ letterStates, onKey, disabled = false, lastMiss = null, reusable = false, onEnter, onBackspace, enterLabel = "Enter" }) {
  return (
    <div role="group" aria-label="Letter keyboard" className="flex w-full flex-col gap-[clamp(0.35rem,1.2vw,0.6rem)]">
      {ROWS.map((row, rowIndex) => {
        const last = rowIndex === ROWS.length - 1;
        return (
          <div key={rowIndex} className="flex justify-center gap-[clamp(0.3rem,1.1vw,0.55rem)]">
            {last && onEnter ? (
              <button type="button" className="key key-wide" disabled={disabled} onClick={onEnter}>
                {enterLabel}
              </button>
            ) : null}
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
    </div>
  );
}
