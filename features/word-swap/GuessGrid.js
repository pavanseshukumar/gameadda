import { MAX_GUESSES, scoreGuess } from "@/lib/games/word-swap/engine";

const MARK_LABEL = { hit: "right spot", near: "wrong spot", miss: "not in the word" };

/**
 * The board: one row per guess (marked), the row being typed, then empty rows.
 *
 * @param {{ word: string, guesses: string[], draft?: string, shakeKey?: string | null, revealAll?: boolean }} props
 */
export function GuessGrid({ word, guesses, draft = "", shakeKey = null, revealAll = false }) {
  const length = word.length;
  const rows = [];
  guesses.forEach((guess, r) => {
    const marks = scoreGuess(word, guess);
    rows.push(
      <div key={`g${r}`} className="swap-row" role="row" aria-label={`Guess ${r + 1}: ${[...guess].map((c, i) => `${c} ${MARK_LABEL[marks[i]]}`).join(", ")}`}>
        {[...guess].map((char, i) => (
          <span
            key={i}
            className="swap-tile"
            data-state={marks[i]}
            // The latest row flips in letter by letter.
            style={r === guesses.length - 1 && !revealAll ? { animationDelay: `${i * 90}ms` } : undefined}
            aria-hidden="true"
          >
            {char}
          </span>
        ))}
      </div>,
    );
  });
  if (guesses.length < MAX_GUESSES && !revealAll) {
    rows.push(
      <div key={shakeKey ?? "draft"} className={`swap-row ${shakeKey ? "anim-shake" : ""}`} aria-label={`Typing: ${draft || "empty"}`}>
        {Array.from({ length }, (_, i) => (
          <span key={i} className="swap-tile" data-state={draft[i] ? "typed" : "empty"} aria-hidden="true">
            {draft[i] ?? ""}
          </span>
        ))}
      </div>,
    );
  }
  const filled = rows.length;
  if (!revealAll) {
    for (let r = filled; r < MAX_GUESSES; r += 1) {
      rows.push(
        <div key={`e${r}`} className="swap-row" aria-hidden="true">
          {Array.from({ length }, (_, i) => (
            <span key={i} className="swap-tile" data-state="empty" />
          ))}
        </div>,
      );
    }
  }
  return (
    <div className="swap-grid mx-auto flex w-full flex-col items-center gap-[var(--swap-gap)]" style={{ "--len": length }} role="grid" aria-label="Guesses">
      {rows}
    </div>
  );
}
