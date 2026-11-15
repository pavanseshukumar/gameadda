/**
 * Word Swap's built-in words, for solo play, the "random words" option, and a setter
 * who can't think of one: single words from Pictionary Party's curated word bank
 * (shipped in the repo, no network). The category becomes the hint.
 */
import { WORDS } from "../pictionary/data/words";
import { CATEGORIES } from "../pictionary/data/categories";

const MIN = 4;
const MAX = 8;
const CATEGORY_IDS = ["animal", "food", "object", "place", "person", "action"];

export const RANDOM_WORDS = WORDS.filter(
  (w) => CATEGORY_IDS.includes(w.category) && /^[A-Za-z]+$/.test(w.text) && w.text.length >= MIN && w.text.length <= MAX,
).map((w) => ({ id: w.id, word: w.text.toUpperCase(), hint: CATEGORIES[w.category].label }));
