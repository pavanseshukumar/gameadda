"use client";

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

const STATE_LABEL = { hit: "correct", miss: "incorrect" };

/**
 * On-screen QWERTY keyboard.
 *
 * @param {{
 *   letterStates: Record<string, "hit" | "miss">,
 *   onKey: (letter: string) => void,
 *   disabled?: boolean,
 *   lastMiss?: { letter: string, seq: number } | null,
 * }} props
 */
export function Keyboard({ letterStates, onKey, disabled = false, lastMiss = null }) {
  return (
    <div role="group" aria-label="Letter keyboard" className="flex w-full flex-col gap-[clamp(0.35rem,1.2vw,0.6rem)]">
      {ROWS.map((row, rowIndex) => (
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
                className={`key ${shaking ? "anim-shake" : ""} ${state === "hit" ? "anim-pop" : ""}`}
                data-state={state}
                disabled={disabled || used}
                aria-label={`Letter ${letter.toUpperCase()}${used ? `, ${STATE_LABEL[state]}` : ""}`}
                onClick={() => onKey(letter)}
              >
                {letter.toUpperCase()}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
