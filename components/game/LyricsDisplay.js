import { maskLine, tokenizeLine } from "@/lib/games/guess-the-song/lyrics";

/**
 * Renders lyric lines as letter tiles. Letters stay hidden until guessed;
 * spaces and punctuation are always visible.
 *
 * @param {{
 *   lines: string[],
 *   guessedLetters: string[],
 *   freshLetter?: string | null,   letter revealed by the latest guess (animated)
 *   revealAll?: boolean,           show every letter (end of round)
 * }} props
 */
export function LyricsDisplay({
  lines,
  guessedLetters,
  freshLetter = null,
  revealAll = false,
  complete = false,
  size = "lg",
}) {
  const guessed = new Set(guessedLetters);
  // Running letter index across both lines, used to stagger the "complete" wave.
  let letterIndex = 0;
  // Characters in the longest word: tiles are sized so it fits on one line.
  const longest = Math.max(4, ...lines.flatMap((line) => tokenizeLine(line).map((word) => word.chars.length)));

  return (
    <div className="lyrics-box w-full">
    <div
      className={`lyrics ${size === "sm" ? "lyrics-sm" : ""} flex flex-col items-center gap-[calc(var(--tile-w)*0.75)]`}
      style={{ "--longest": longest }}
    >
      {lines.map((line, lineIndex) => (
        <p key={lineIndex} className="w-full">
          <span className="sr-only">{revealAll ? line : maskLine(line, guessedLetters).replace(/_/g, " blank ")}</span>
          <span
            aria-hidden="true"
            className="flex flex-wrap justify-center gap-x-[calc(var(--tile-w)*0.7)] gap-y-[calc(var(--tile-w)*0.32)] [perspective:600px]"
          >
            {tokenizeLine(line).map((word, wordIndex) => (
              <span key={wordIndex} className="flex gap-[calc(var(--tile-w)*0.12)]">
                {word.chars.map(({ char, letter }, charIndex) => {
                  if (!letter) {
                    return (
                      <span key={charIndex} className="tile-punct self-end">
                        {char}
                      </span>
                    );
                  }
                  const lower = char.toLowerCase();
                  const isGuessed = guessed.has(lower);
                  const order = letterIndex++;
                  const state = complete
                    ? "complete"
                    : isGuessed
                      ? lower === freshLetter
                        ? "fresh"
                        : "revealed"
                      : revealAll
                        ? "unsolved"
                        : "hidden";
                  const delay =
                    state === "complete"
                      ? `${order * 28}ms`
                      : state === "fresh" || state === "unsolved"
                        ? `${charIndex * 35}ms`
                        : null;
                  // Changing key remounts the tile so its reveal animation plays.
                  return (
                    <span
                      key={`${charIndex}-${state}`}
                      className="tile"
                      data-state={state}
                      style={delay ? { animationDelay: delay } : undefined}
                    >
                      {state === "hidden" ? "" : char}
                    </span>
                  );
                })}
              </span>
            ))}
          </span>
        </p>
      ))}
    </div>
    </div>
  );
}
