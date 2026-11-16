/**
 * Head Rush's word deck, built from content already shipped in the repo, so the
 * game needs no network:
 *
 *   - Telugu Movies and Tollywood Stars: Jumble Rumble's hand-picked movie list
 *     (lib/games/jumble-rumble/movies.js) and the leads credited on it.
 *   - Everything else: Pictionary Party's curated word bank
 *     (lib/games/pictionary/data/words.js), all difficulties.
 *
 * To add words, add them to those sources; ids stay stable because they come
 * from the source ids (saved games reference them in `usedWordIds`).
 */
import { WORDS } from "../pictionary/data/words";
import { CATEGORIES } from "../pictionary/data/categories";
import { MOVIES } from "../jumble-rumble/movies";

/** Credits that aren't one person you could act out. */
const NOT_A_STAR = new Set(["ensemble cast"]);

function starsFrom(movies) {
  const seen = new Map();
  for (const movie of movies) {
    for (const raw of String(movie.lead ?? "").split(/,|&|\band\b/)) {
      const name = raw.trim();
      const key = name.toLowerCase();
      if (name && !NOT_A_STAR.has(key) && !seen.has(key)) seen.set(key, name);
    }
  }
  return [...seen.values()];
}

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Deck categories, in the order the setup screen lists them. */
export const HEAD_RUSH_CATEGORIES = [
  { id: "telugu-movies", label: "Telugu Movies", color: "#E2508E" },
  { id: "tollywood-stars", label: "Tollywood Stars", color: "#F4A62A" },
  { id: "movies", label: "World Movies", color: CATEGORIES.movies?.color ?? "#1FA0B8" },
  { id: "person", label: CATEGORIES.person.label, color: CATEGORIES.person.color },
  { id: "place", label: CATEGORIES.place.label, color: CATEGORIES.place.color },
  { id: "animal", label: CATEGORIES.animal.label, color: CATEGORIES.animal.color },
  { id: "object", label: CATEGORIES.object.label, color: CATEGORIES.object.color },
  { id: "action", label: CATEGORIES.action.label, color: CATEGORIES.action.color },
  { id: "food", label: CATEGORIES.food.label, color: CATEGORIES.food.color },
];

export const DEFAULT_CATEGORY_IDS = ["telugu-movies", "tollywood-stars", "person", "animal", "food", "action"];

/** `{ id, text, category }` for every card in the deck. */
export const HEAD_RUSH_WORDS = [
  ...MOVIES.map((movie) => ({ id: `tm:${movie.id}`, text: movie.title, category: "telugu-movies" })),
  ...starsFrom(MOVIES).map((name) => ({ id: `ts:${slug(name)}`, text: name, category: "tollywood-stars" })),
  ...WORDS.filter((word) => HEAD_RUSH_CATEGORIES.some((c) => c.id === word.category)).map(({ id, text, category }) => ({
    id,
    text,
    category,
  })),
];

const BY_ID = new Map(HEAD_RUSH_WORDS.map((word) => [word.id, word]));

export function getWord(id) {
  return BY_ID.get(id) ?? null;
}

export function wordIdsIn(categoryIds) {
  return HEAD_RUSH_WORDS.filter((word) => categoryIds.includes(word.category)).map((word) => word.id);
}

export function categoryOf(id) {
  return HEAD_RUSH_CATEGORIES.find((c) => c.id === id) ?? { id, label: "Mystery", color: "#8E63E6" };
}
