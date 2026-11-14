/**
 * Imposter's secret words: Pictionary Party's curated word bank, limited to the
 * categories that make good "describe it in one word" secrets (no actions or
 * All Play scenes). Shipped in the repo, so the game needs no network.
 */
import { WORDS } from "../pictionary/data/words";
import { CATEGORIES } from "../pictionary/data/categories";

export const IMPOSTER_CATEGORY_IDS = ["place", "food", "animal", "object", "person", "movies"];

export const IMPOSTER_CATEGORIES = IMPOSTER_CATEGORY_IDS.map((id) => ({
  id,
  label: CATEGORIES[id].label,
  color: CATEGORIES[id].color,
}));

export const IMPOSTER_WORDS = WORDS.filter((word) => IMPOSTER_CATEGORY_IDS.includes(word.category)).map(
  ({ id, text, category }) => ({ id, text, category }),
);

export function categoryLabel(id) {
  return CATEGORIES[id]?.label ?? "Mystery";
}

export function wordsIn(categoryIds) {
  return IMPOSTER_WORDS.filter((word) => categoryIds.includes(word.category));
}
