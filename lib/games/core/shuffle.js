/**
 * Deterministic shuffling so reducers stay pure: callers pass a `seed` in [0, 1)
 * (e.g. Math.random() from an event handler) and the same seed always gives the
 * same order.
 */

/** mulberry32 — tiny, fast PRNG. Returns a function producing numbers in [0, 1). */
export function createRandom(seed) {
  let a = Math.floor((seed % 1) * 4294967296) >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates shuffle into a new array. */
export function shuffle(items, seed) {
  const random = createRandom(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Shuffle, but never return the original order when another order exists
 * (so a jumble is never already solved).
 */
export function shuffleChanged(items, seed, isSameOrder = (a, b) => a.every((x, i) => x === b[i])) {
  let result = shuffle(items, seed);
  if (items.length > 1 && isSameOrder(result, items)) {
    result = [...result.slice(1), result[0]];
  }
  return result;
}
