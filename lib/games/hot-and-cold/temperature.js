/**
 * Hot & Cold — how "warm" a guessed movie is relative to the secret one.
 *
 * Pure functions over the compact Wikidata records from `wikidata.js`:
 *   { id, title, year?, aliases?, links, d?: qid[], c?: qid[], m?: qid[], g?: string[] }
 *
 * Temperature (0–99, 100 = the secret itself) adds up what the two films share:
 *   director   30            (any shared director)
 *   cast       up to 40      (each shared actor 2–24, rarer actors worth more)
 *   music      12            (any shared composer)
 *   year       up to 12      (same year 12, fading to 0 at 8 years apart)
 *   genre      up to 6       (rarer genres worth more)
 *
 * Rarity matters because some actors are in hundreds of films: sharing
 * Brahmanandam says little, sharing a lead pair says a lot.
 */

export const WEIGHTS = Object.freeze({ director: 30, castMax: 40, music: 12, year: 12, yearSpan: 8, genreMax: 6 });

/** 1 for something in a single film, ~0 for the most common one. */
function rarity(count, maxCount) {
  if (count <= 1 || maxCount <= 1) return 1;
  return Math.max(0, Math.min(1, 1 - Math.log(count) / Math.log(maxCount)));
}

function frequencies(movies, key) {
  const counts = new Map();
  for (const movie of movies) for (const item of movie[key] ?? []) counts.set(item, (counts.get(item) ?? 0) + 1);
  return counts;
}

/**
 * Rarity per actor and genre across the whole pool, plus film counts per actor
 * (to find a secret's best-known star for the hint).
 */
export function buildWeights(movies) {
  const castCounts = frequencies(movies, "c");
  const genreCounts = frequencies(movies, "g");
  const maxCast = Math.max(1, ...castCounts.values());
  const maxGenre = Math.max(1, ...genreCounts.values());
  return {
    castCounts,
    cast: new Map([...castCounts].map(([id, n]) => [id, rarity(n, maxCast)])),
    genre: new Map([...genreCounts].map(([name, n]) => [name, rarity(n, maxGenre)])),
  };
}

/** Actors this prolific are character actors, not the star of the film. */
const CHARACTER_ACTOR_FILMS = 120;

function decadeOf(year) {
  return `${Math.floor(year / 10) * 10}s`;
}

/**
 * Everything the engine needs about the secret, with names and weights baked in
 * so a saved game can be scored without the pool.
 */
export function prepareSecret(movie, people, weights, castOrder = []) {
  const named = (ids = []) => ids.filter((id) => people[id]).map((id) => ({ id, name: people[id] }));
  const cast = named(movie.c).map((person) => ({
    ...person,
    w: weights.cast.get(person.id) ?? 1,
    films: weights.castCounts.get(person.id) ?? 1,
  }));
  const genres = (movie.g ?? []).map((name) => ({ name, w: weights.genre.get(name) ?? 1 }));
  const directors = named(movie.d);
  const composers = named(movie.m);

  // Hints, vaguest first: decade → music → director → the star.
  // The lead is first in billing order; without it, guess: the busiest actor who isn't a character actor.
  const star =
    castOrder.map((id) => cast.find((p) => p.id === id)).find(Boolean) ??
    [...cast].filter((p) => p.films < CHARACTER_ACTOR_FILMS).sort((a, b) => b.films - a.films)[0] ??
    cast[0];
  const hints = [];
  if (movie.year) hints.push({ kind: "decade", label: "Released in", text: `the ${decadeOf(movie.year)}` });
  if (composers.length) hints.push({ kind: "music", label: "Music by", text: composers.map((p) => p.name).join(" & ") });
  if (directors.length) hints.push({ kind: "director", label: "Directed by", text: directors.map((p) => p.name).join(" & ") });
  if (star) hints.push({ kind: "star", label: "Starring", text: star.name });

  const secret = { id: movie.id, title: movie.title, directors, composers, cast, genres, hints };
  if (movie.year) secret.year = movie.year;
  if (movie.aliases?.length) secret.aliases = movie.aliases;
  return secret;
}

/** The slice of a guessed movie the engine keeps (ids only; names come from the secret). */
export function toGuessMovie(movie) {
  const guess = { id: movie.id, title: movie.title, d: movie.d ?? [], c: movie.c ?? [], m: movie.m ?? [], g: movie.g ?? [] };
  if (movie.year) guess.year = movie.year;
  return guess;
}

/**
 * @returns {{ score: number, exact: boolean, directors: string[], composers: string[],
 *   cast: string[], genres: string[], yearDiff: number | null }}
 *   yearDiff: secret year − guess year (positive = the secret is newer).
 */
export function compareMovies(secret, guess) {
  const yearDiff = secret.year && guess.year ? secret.year - guess.year : null;
  if (secret.id === guess.id) {
    return { score: 100, exact: true, directors: [], composers: [], cast: [], genres: [], yearDiff: 0 };
  }

  const shares = (list, ids) => list.filter((item) => ids.includes(item.id));
  const directors = shares(secret.directors, guess.d);
  const composers = shares(secret.composers, guess.m);
  const cast = shares(secret.cast, guess.c).sort((a, b) => b.w - a.w);
  const genres = secret.genres.filter((genre) => guess.g.includes(genre.name));

  let score = 0;
  if (directors.length) score += WEIGHTS.director;
  if (composers.length) score += WEIGHTS.music;
  score += Math.min(WEIGHTS.castMax, cast.reduce((sum, p) => sum + 2 + 22 * p.w, 0));
  if (yearDiff !== null) score += WEIGHTS.year * Math.max(0, 1 - Math.abs(yearDiff) / WEIGHTS.yearSpan);
  score += Math.min(WEIGHTS.genreMax, genres.reduce((sum, g) => sum + 1 + 5 * g.w, 0));

  return {
    score: Math.min(99, Math.round(score)),
    exact: false,
    directors: directors.map((p) => p.name),
    composers: composers.map((p) => p.name),
    cast: cast.map((p) => p.name),
    genres: genres.map((g) => g.name),
    yearDiff,
  };
}

/** Labels for a temperature reading, coldest first. */
export const BANDS = Object.freeze([
  { min: 0, label: "Freezing", tone: "freezing" },
  { min: 10, label: "Cold", tone: "cold" },
  { min: 25, label: "Warm", tone: "warm" },
  { min: 45, label: "Hot", tone: "hot" },
  { min: 70, label: "Burning", tone: "burning" },
  { min: 100, label: "Found it", tone: "found" },
]);

export function bandFor(score) {
  return BANDS.findLast((band) => score >= band.min) ?? BANDS[0];
}
