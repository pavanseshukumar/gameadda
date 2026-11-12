/**
 * Pure text helpers for masking lyrics and checking guesses.
 * Letters are compared in lower case; display layers may upper-case them.
 */

const LETTER = /^[a-z]$/i;

export function isLetter(char) {
  return LETTER.test(char);
}

/** Normalise a single-letter guess, or return null if it isn't A–Z. */
export function normalizeLetter(input) {
  const letter = String(input ?? "").trim().toLowerCase();
  return LETTER.test(letter) ? letter : null;
}

/** Count every occurrence of `letter` across the given lines. */
export function countLetter(lines, letter) {
  const target = letter.toLowerCase();
  let count = 0;
  for (const line of lines) {
    for (const char of line.toLowerCase()) if (char === target) count += 1;
  }
  return count;
}

/** Distinct lower-case letters used in the lines. */
export function lettersIn(lines) {
  const set = new Set();
  for (const line of lines) {
    for (const char of line.toLowerCase()) if (isLetter(char)) set.add(char);
  }
  return set;
}

export function isFullyRevealed(lines, guessedLetters) {
  const guessed = new Set(guessedLetters);
  for (const letter of lettersIn(lines)) if (!guessed.has(letter)) return false;
  return true;
}

/**
 * Break a line into words of character cells for rendering.
 * @returns {{ chars: { char: string, letter: boolean }[] }[]}
 */
export function tokenizeLine(line) {
  return line
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => ({ chars: [...word].map((char) => ({ char, letter: isLetter(char) })) }));
}

/** Text version of the masked line, e.g. "N__n_ ch____". Useful for screen readers. */
export function maskLine(line, guessedLetters) {
  const guessed = new Set(guessedLetters);
  return [...line].map((char) => (isLetter(char) && !guessed.has(char.toLowerCase()) ? "_" : char)).join("");
}

/** Lower-case, strip accents and punctuation, collapse whitespace. */
export function normalizeTitle(input) {
  return String(input ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isTitleMatch(song, guess) {
  const answer = normalizeTitle(guess);
  if (!answer || !song) return false;
  return [song.title, ...(song.aliases ?? [])].some((title) => normalizeTitle(title) === answer);
}
