import { drawWithoutRepeat } from "../core/random";
import { titleKey } from "../core/movieTitles";
import { buildWeights, prepareSecret } from "./temperature";

/**
 * Client-side pool for Hot & Cold: every guessable Telugu film from
 * `/api/hot-and-cold/movies`, rarity weights, the secret-eligible subset and
 * a title search for the guess box. One shared request per tab.
 *
 * @typedef {{
 *   source: "online" | "unavailable",
 *   movies: object[],
 *   people: Record<string, string>,
 *   byId: Map<string, object>,
 *   weights: ReturnType<typeof buildWeights>,
 *   secretIds: string[],
 * }} HotColdPool
 */

/** Secrets are films people will know: 2000 onwards, well covered, with a director and cast. */
const SECRET_MIN_YEAR = 2000;
const SECRET_MIN_LINKS = 4;
const SECRET_MIN_CAST = 2;

function isSecretCandidate(movie) {
  return (
    movie.year >= SECRET_MIN_YEAR &&
    movie.links >= SECRET_MIN_LINKS &&
    (movie.d?.length ?? 0) > 0 &&
    (movie.c?.length ?? 0) >= SECRET_MIN_CAST
  );
}

const EMPTY = Object.freeze({ source: "unavailable", movies: [], people: {}, byId: new Map(), weights: null, secretIds: [] });

/** @type {Promise<HotColdPool> | null} */
let pending = null;

/** @returns {Promise<HotColdPool>} */
export function loadHotColdPool() {
  pending ??= fetch("/api/hot-and-cold/movies", { signal: AbortSignal.timeout(60_000) })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
    .then((data) => {
      const movies = Array.isArray(data?.movies) ? data.movies : [];
      const secretIds = movies.filter(isSecretCandidate).map((m) => m.id);
      if (secretIds.length === 0) throw new Error("No movies");
      // Search keys computed once: the title and any alternative spellings.
      for (const movie of movies) movie.keys = [movie.title, ...(movie.aliases ?? [])].map(titleKey);
      return {
        source: "online",
        movies,
        people: data.people ?? {},
        byId: new Map(movies.map((m) => [m.id, m])),
        weights: buildWeights(movies),
        secretIds,
      };
    })
    .catch(() => {
      pending = null; // try again next time
      return EMPTY;
    });
  return pending;
}

/**
 * Draw a secret for the next round.
 * @returns {Promise<{ secret: object, recycled: boolean } | null>} null when the pool couldn't load.
 */
export async function drawSecret({ usedSecretIds, avoidId = null }) {
  const pool = await loadHotColdPool();
  if (pool.secretIds.length === 0) return null;
  const draw = drawWithoutRepeat(pool.secretIds, usedSecretIds, Math.random(), avoidId);
  const movie = pool.byId.get(draw.id);
  return { secret: prepareSecret(movie, pool.people, pool.weights, await fetchCastOrder(movie.id)), recycled: draw.recycled };
}

/** Billing order for the "Starring" hint; empty (fall back to a guess) if the lookup fails. */
async function fetchCastOrder(id) {
  try {
    const res = await fetch(`/api/hot-and-cold/cast?id=${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(8_000) });
    const body = res.ok ? await res.json() : null;
    return Array.isArray(body?.cast) ? body.cast : [];
  } catch {
    return [];
  }
}

/**
 * Up to `limit` films matching typed text: exact title first, then titles
 * starting with it, then anywhere inside; better-known films first within each.
 */
export function searchMovies(pool, text, limit = 6) {
  const query = titleKey(text);
  if (!pool || query.length < 2) return [];
  const ranked = [];
  for (const movie of pool.movies) {
    let rank = 3;
    for (const key of movie.keys) {
      if (key === query) rank = Math.min(rank, 0);
      else if (key.startsWith(query)) rank = Math.min(rank, 1);
      else if (key.includes(query)) rank = Math.min(rank, 2);
    }
    if (rank < 3) ranked.push({ movie, rank });
  }
  ranked.sort((a, b) => a.rank - b.rank || b.movie.links - a.movie.links || (b.movie.year ?? 0) - (a.movie.year ?? 0));
  return ranked.slice(0, limit).map((r) => r.movie);
}
