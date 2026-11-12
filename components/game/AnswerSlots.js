/**
 * Answer slots grouped into words. Tapping a filled slot sends its tile back.
 *
 * @param {{
 *   wordLengths: number[],
 *   chars: (string | null)[],      letter in each slot, or null
 *   locked?: boolean[],            hint-revealed slots
 *   solved?: boolean,              show every slot as correct
 *   onRemove?: (index: number) => void,
 *   disabled?: boolean,
 * }} props
 */
export function AnswerSlots({ wordLengths, chars, locked = [], solved = false, onRemove, disabled = false }) {
  const longest = Math.max(1, ...wordLengths);
  // Split the longest word into even lines of at most 10 (19 letters → 10 + 9, not 10 + 9 + …).
  const perLine = Math.ceil(longest / Math.ceil(longest / 10));
  // Index of each word's first slot in the flat `chars` array.
  const starts = wordLengths.map((_, i) => wordLengths.slice(0, i).reduce((sum, n) => sum + n, 0));

  return (
    <div
      className="jumble-slots flex w-full flex-wrap justify-center gap-2"
      style={{ "--per-line": perLine }}
      role="group"
      aria-label={`Answer: ${wordLengths.length} ${wordLengths.length === 1 ? "word" : "words"}`}
    >
      {wordLengths.map((length, wordIndex) => {
        const start = starts[wordIndex];
        return (
          <div key={wordIndex} className="jword">
            {Array.from({ length }, (_, i) => {
              const index = start + i;
              const char = chars[index];
              const state = solved ? "solved" : locked[index] ? "locked" : char ? "filled" : "empty";
              const removable = state === "filled" && !disabled && onRemove;
              return (
                <button
                  key={`${index}-${state}-${char ?? ""}`}
                  type="button"
                  className="jslot"
                  data-state={state}
                  disabled={!removable}
                  onClick={() => removable && onRemove(index)}
                  aria-label={
                    char
                      ? `Slot ${index + 1}: ${char}${state === "locked" ? ", revealed" : removable ? ", tap to remove" : ""}`
                      : `Slot ${index + 1}: empty`
                  }
                  style={state === "solved" ? { animationDelay: `${index * 40}ms` } : undefined}
                >
                  {char ?? ""}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
