import { drawWithoutRepeat } from "../core/random";

/**
 * Client-side loaders for Pixel Poster.
 *
 *  - `loadPosterPool()`: Telugu films from `/api/pixel-poster/movies` (shared request).
 *  - `drawPosterMovie()`: picks an unplayed film, looks up its poster and preloads
 *    the image, skipping films whose article has no poster.
 *
 * There's no offline list: without Wikimedia there are no posters to show.
 *
 * @typedef {{ movies: import("./titles").PosterMovie[], source: "online" | "unavailable" }} PosterPool
 */

/** @type {Promise<PosterPool> | null} */
let pending = null;

/** @returns {Promise<PosterPool>} */
export function loadPosterPool() {
  pending ??= fetch("/api/pixel-poster/movies", { signal: AbortSignal.timeout(30_000) })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
    .then((data) => {
      const movies = Array.isArray(data?.movies) ? data.movies : [];
      if (movies.length === 0) throw new Error("No movies");
      return { movies: Object.freeze(movies), source: "online" };
    })
    .catch(() => {
      pending = null; // try again next time
      return { movies: [], source: "unavailable" };
    });
  return pending;
}

/** Films known to have no usable poster, skipped for the rest of the session. */
const noPoster = new Set();
/** Poster lookups, one per article per page load. */
const posterRequests = new Map();

function lookupPoster(article) {
  if (!posterRequests.has(article)) {
    const request = fetch(`/api/pixel-poster/poster?article=${encodeURIComponent(article)}`, {
      signal: AbortSignal.timeout(12_000),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((body) => body?.poster?.url ?? null)
      .catch((error) => {
        posterRequests.delete(article); // a network blip shouldn't blacklist the film
        throw error;
      });
    posterRequests.set(article, request);
  }
  return posterRequests.get(article);
}

/** Resolves once the browser has the image cached (so the first frame isn't blank). */
function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error("Poster image failed to load"));
    img.src = url;
  });
}

const MAX_TRIES = 6;

/**
 * Draw the next movie (with its poster) for a round.
 *
 * @param {{ usedMovieIds: string[], avoidId?: string | null }} state
 * @returns {Promise<{ movie: import("./titles").PosterMovie, recycled: boolean } | null>}
 *   null when no poster could be found (offline or Wikimedia down).
 */
export async function drawPosterMovie({ usedMovieIds, avoidId = null }) {
  const { movies } = await loadPosterPool();
  let used = usedMovieIds;
  let recycledAny = false;

  for (let attempt = 0; attempt < MAX_TRIES; attempt += 1) {
    const ids = movies.filter((m) => !noPoster.has(m.id)).map((m) => m.id);
    if (ids.length === 0) return null;
    const draw = drawWithoutRepeat(ids, used, Math.random(), avoidId);
    recycledAny ||= draw.recycled;
    const movie = movies.find((m) => m.id === draw.id);
    try {
      const poster = await lookupPoster(movie.article);
      if (!poster) {
        noPoster.add(movie.id);
        continue;
      }
      await preloadImage(poster);
      return { movie: { ...movie, poster }, recycled: recycledAny };
    } catch {
      // Rate limit or a broken image: try a different film.
      used = draw.usedIds;
    }
  }
  return null;
}
