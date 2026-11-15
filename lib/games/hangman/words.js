/**
 * Hangman's secret words: Pictionary Party's curated word bank (shipped in the
 * repo, so the game needs no network). The category is shown as the clue.
 * All Play scenes are left out; they're a Pictionary game mode, not a category.
 */
import { WORDS } from "../pictionary/data/words";
import { CATEGORIES, DIFFICULTIES } from "../pictionary/data/categories";

export const HANGMAN_CATEGORY_IDS = ["animal", "food", "object", "place", "person", "action", "movies"];
export const DIFFICULTY_IDS = ["easy", "medium", "hard"];

export const HANGMAN_CATEGORIES = HANGMAN_CATEGORY_IDS.map((id) => ({
  id,
  label: CATEGORIES[id].label,
  color: CATEGORIES[id].color,
}));

export const HANGMAN_DIFFICULTIES = DIFFICULTY_IDS.map((id) => ({ id, label: DIFFICULTIES[id].label }));

/** Lower-case a–z only: "Mr. India" → "mrindia". */
export function lettersOf(text) {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

/**
 * Playable: plain Latin text (letters, spaces, a little punctuation that's always shown)
 * with at least 3 letters, and no word too long to fit the board on a phone.
 */
export function isPlayableWord(word) {
  if (!word || typeof word.text !== "string" || typeof word.id !== "string") return false;
  if (!/^[A-Za-z][A-Za-z .'-]*$/.test(word.text)) return false;
  if (lettersOf(word.text).length < 3) return false;
  return word.text.split(/\s+/).every((part) => part.length <= 14);
}

export const HANGMAN_WORDS = WORDS.filter(
  (word) => HANGMAN_CATEGORY_IDS.includes(word.category) && isPlayableWord(word),
).map(({ id, text, category, difficulty }) => ({ id, text, category, difficulty }));

export function categoryLabel(id) {
  return CATEGORIES[id]?.label ?? "Mystery";
}

export function categoryColor(id) {
  return CATEGORIES[id]?.color ?? "var(--accent)";
}

/** Words in any of the chosen categories, at any of the chosen difficulties. */
export function wordsFor(categoryIds, difficultyIds) {
  return HANGMAN_WORDS.filter((word) => categoryIds.includes(word.category) && difficultyIds.includes(word.difficulty));
}
