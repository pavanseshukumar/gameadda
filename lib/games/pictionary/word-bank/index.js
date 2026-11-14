import { WORDS, makeWordId } from "../data/words.js";
import { CATEGORIES, DIFFICULTIES, STANDARD_CATEGORY_IDS } from "../data/categories.js";
import { pickRandom } from "../utils/index.js";

/** @typedef {import('../types.js').Word} Word */
/** @typedef {import('../types.js').CategoryId} CategoryId */
/** @typedef {import('../types.js').DifficultySetting} DifficultySetting */

/** Combine built-in words with the host's custom words. */
export function buildWordPool(customWords = [], { includeCustom = true } = {}) {
  return includeCustom ? [...WORDS, ...customWords] : WORDS;
}

function matchesDifficulty(word, difficulty) {
  return difficulty === "mixed" || word.difficulty === difficulty;
}

/**
 * Pick a random unused word. Falls back progressively so a game never stalls:
 *   1. category + difficulty
 *   2. category, any difficulty
 *   3. any standard category + difficulty (All Play borrows from everything)
 *   4. category + difficulty, allowing repeats (marked `recycled`)
 *
 * @param {Object} options
 * @param {Word[]} options.pool
 * @param {CategoryId} options.category
 * @param {DifficultySetting} options.difficulty
 * @param {Iterable<string>} options.usedIds
 * @param {() => number} [options.rng]
 * @returns {{ word: Word, recycled: boolean }}
 */
export function drawWord({ pool, category, difficulty, usedIds, rng = Math.random }) {
  const used = new Set(usedIds);
  const unused = pool.filter((w) => !used.has(w.id));

  const tiers = [
    unused.filter((w) => w.category === category && matchesDifficulty(w, difficulty)),
    unused.filter((w) => w.category === category),
    unused.filter((w) => STANDARD_CATEGORY_IDS.includes(w.category) && matchesDifficulty(w, difficulty)),
    unused,
  ];
  for (const candidates of tiers) {
    if (candidates.length) return { word: pickRandom(candidates, rng), recycled: false };
  }

  const repeats = pool.filter((w) => w.category === category && matchesDifficulty(w, difficulty));
  return { word: pickRandom(repeats.length ? repeats : pool, rng), recycled: true };
}

export function countWords(pool, { categories, difficulty }) {
  return pool.filter((w) => categories.includes(w.category) && matchesDifficulty(w, difficulty)).length;
}

/**
 * Validate and normalise a host-entered word. Returns `{ word }` or `{ error }`.
 * @param {{ text: string, category: string, difficulty: string }} input
 * @param {Word[]} existing
 */
export function createCustomWord(input, existing = []) {
  const text = (input.text ?? "").replace(/\s+/g, " ").trim();
  if (text.length < 2) return { error: "Words need at least 2 characters." };
  if (text.length > 40) return { error: "Keep it under 40 characters." };
  if (!CATEGORIES[input.category]) return { error: "Pick a category." };
  if (!DIFFICULTIES[input.difficulty]) return { error: "Pick a difficulty." };

  const id = `custom-${makeWordId(input.category, text)}`;
  const lower = text.toLowerCase();
  const all = [...WORDS, ...existing];
  if (all.some((w) => w.id === id || (w.category === input.category && w.text.toLowerCase() === lower))) {
    return { error: `“${text}” is already in that category.` };
  }
  return {
    word: { id, text, category: input.category, difficulty: input.difficulty, tags: ["custom"], custom: true },
  };
}

/** Keep only well-formed custom words (used when loading from storage). */
export function sanitizeCustomWords(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (w) =>
      w &&
      typeof w.id === "string" &&
      typeof w.text === "string" &&
      CATEGORIES[w.category] &&
      DIFFICULTIES[w.difficulty],
  );
}
