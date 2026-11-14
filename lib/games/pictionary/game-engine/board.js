import { STANDARD_CATEGORY_IDS } from "../data/categories.js";
import { shuffle } from "../utils/index.js";

/** @typedef {import('../types.js').BoardSpace} BoardSpace */
/** @typedef {import('../types.js').CategoryId} CategoryId */

export const BOARD_COLUMNS = 6;

export const BOARD_LENGTHS = [
  { value: 18, label: "Sprint", hint: "~20 min" },
  { value: 30, label: "Standard", hint: "~40 min" },
  { value: 42, label: "Marathon", hint: "~1 hr" },
];

/** Every Nth space is All Play (when All Play is enabled). */
const ALL_PLAY_EVERY = 6;

/**
 * Build the winding board: start, a sequence of category spaces with periodic
 * All Play spaces, then finish. Adjacent spaces never share a category.
 * @param {number} length
 * @param {CategoryId[]} categories
 * @param {() => number} [rng]
 * @returns {BoardSpace[]}
 */
export function generateBoard(length, categories, rng = Math.random) {
  const standard = categories.filter((c) => STANDARD_CATEGORY_IDS.includes(c));
  const usable = standard.length ? standard : STANDARD_CATEGORY_IDS;
  const allPlay = categories.includes("all-play");

  /** @type {BoardSpace[]} */
  const spaces = [{ index: 0, type: "start", category: null }];
  let bag = [];
  let previous = null;

  for (let index = 1; index < length - 1; index++) {
    if (allPlay && index % ALL_PLAY_EVERY === ALL_PLAY_EVERY - 2) {
      spaces.push({ index, type: "all-play", category: "all-play" });
      continue;
    }
    if (!bag.length) bag = shuffle(usable, rng);
    let i = bag.findIndex((c) => c !== previous);
    if (i === -1) i = 0;
    const [category] = bag.splice(i, 1);
    spaces.push({ index, type: "category", category });
    previous = category;
  }

  spaces.push({ index: length - 1, type: "finish", category: null });
  return spaces;
}

export function finishIndex(board) {
  return board.length - 1;
}

/**
 * Grid placement of a space on the serpentine board. Row 0 is the bottom row;
 * even rows run left→right and odd rows right→left.
 */
export function spaceGridPosition(index, columns = BOARD_COLUMNS) {
  const row = Math.floor(index / columns);
  const offset = index % columns;
  const col = row % 2 === 0 ? offset : columns - 1 - offset;
  return { row, col };
}
