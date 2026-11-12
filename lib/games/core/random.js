/**
 * Draw an item from a pool without repeats until the pool is exhausted.
 * `random` is a number in [0, 1) supplied by the caller so reducers stay pure.
 *
 * @param {string[]} allIds
 * @param {string[]} usedIds   ids already drawn in the current cycle
 * @param {number} random
 * @param {string|null} [avoidId] id to avoid right after a reshuffle (e.g. the current item)
 * @returns {{ id: string|undefined, usedIds: string[], recycled: boolean }}
 */
export function drawWithoutRepeat(allIds, usedIds, random, avoidId = null) {
  let used = usedIds.filter((id) => allIds.includes(id));
  let available = allIds.filter((id) => !used.includes(id));
  let recycled = false;

  if (available.length === 0) {
    recycled = true;
    used = [];
    available = allIds.length > 1 ? allIds.filter((id) => id !== avoidId) : allIds;
  }

  const index = Math.min(available.length - 1, Math.floor(random * available.length));
  const id = available[index];
  return { id, usedIds: id ? [...used, id] : used, recycled };
}
