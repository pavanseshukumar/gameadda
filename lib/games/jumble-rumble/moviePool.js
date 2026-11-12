import { MOVIES, mergeMovies } from "./movies";

/**
 * Client-side loader for the movie pool: the built-in list (its hand-written clues win on
 * duplicates) plus Wikidata movies from our API route.
 * Falls back to the built-in list alone when offline.
 * The request is shared, so every caller in the tab gets the same pool.
 *
 * @typedef {{ movies: import("./movies").Movie[], source: "online" | "offline" }} MoviePool
 */

/** @type {Promise<MoviePool> | null} */
let pending = null;

/** @returns {Promise<MoviePool>} */
export function loadMoviePool() {
  pending ??= fetch("/api/jumble-rumble/movies", { signal: AbortSignal.timeout(20_000) })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
    .then((data) => {
      const remote = Array.isArray(data?.movies) ? data.movies : [];
      if (remote.length === 0) throw new Error("No movies");
      return { movies: Object.freeze(mergeMovies(MOVIES, remote)), source: "online" };
    })
    .catch(() => {
      pending = null; // try again next time
      return { movies: MOVIES, source: "offline" };
    });
  return pending;
}
