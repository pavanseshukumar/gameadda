/**
 * Server-only: Telugu films and the people behind them, from Wikidata
 * (https://query.wikidata.org, free, no API key). Hot & Cold scores how close a
 * guess is to the secret movie from these links.
 *
 * Five small queries (films, cast, directors, composers, genres) instead of one
 * big join, which would multiply every film's cast by its genres and time out.
 * Cached for days, so Wikidata sees about one burst of requests a day.
 *
 * Response shape (compact, ~250 KB):
 *   people: { [qid]: name }                 directors, cast and composers
 *   movies: [{ id, title, year?, aliases?, links, d?, c?, m?, g? }]
 *     d / c / m: director, cast and composer qids; g: genre names; links: Wikipedia count
 */

import { cacheLife } from "next/cache";
import { cleanTitle, titleKey } from "../core/movieTitles";

const ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "GameAdda-HotAndCold/0.1 (Telugu party game)";
/** Guessable films: anything with at least this many Wikipedia language editions. */
const MIN_SITELINKS = 2;
const FILMS = `?film wdt:P364 wd:Q8097 ; wdt:P31 wd:Q11424 ; wikibase:sitelinks ?links . FILTER(?links >= ${MIN_SITELINKS})`;

const QUERIES = {
  films: `SELECT ?film ?title ?links (MIN(?date) AS ?released) (GROUP_CONCAT(DISTINCT ?alias; separator="|") AS ?aliases) WHERE {
    ${FILMS}
    ?film rdfs:label ?title . FILTER(LANG(?title) = "en")
    OPTIONAL { ?film wdt:P577 ?date }
    OPTIONAL { ?film skos:altLabel ?alias . FILTER(LANG(?alias) = "en") }
  } GROUP BY ?film ?title ?links`,
  ...Object.fromEntries(
    [
      ["c", "P161"],
      ["d", "P57"],
      ["m", "P86"],
      ["g", "P136"],
    ].map(([key, prop]) => [
      key,
      `SELECT ?film ?p ?name WHERE { ${FILMS} ?film wdt:${prop} ?p . ?p rdfs:label ?name . FILTER(LANG(?name) = "en") }`,
    ]),
  ),
};

const qid = (uri) => String(uri ?? "").split("/").pop();

async function runQuery(query) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/sparql-results+json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: `query=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Wikidata responded ${res.status}`);
  return (await res.json())?.results?.bindings ?? [];
}

/** "romantic comedy film" → "romantic comedy" */
function genreName(label) {
  return String(label ?? "").replace(/\s+film$/i, "").trim().toLowerCase();
}

/**
 * Cast qids in billing order for one film. SPARQL loses statement order, but the
 * entity record keeps it, and editors list the lead first (as in the Wikipedia
 * infobox). Used for the "Starring" hint. Throws on failure (not cached).
 *
 * @param {string} id  film qid, e.g. "Q3630260"
 * @returns {Promise<string[]>}
 */
export async function fetchCastOrder(id) {
  "use cache";
  cacheLife("days");

  const params = new URLSearchParams({ action: "wbgetentities", ids: id, props: "claims", format: "json" });
  const res = await fetch(`https://www.wikidata.org/w/api.php?${params}`, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Wikidata responded ${res.status}`);
  const claims = (await res.json())?.entities?.[id]?.claims?.P161 ?? [];
  return claims.map((claim) => claim?.mainsnak?.datavalue?.value?.id).filter((qid) => typeof qid === "string");
}

/** @returns {Promise<{ people: Record<string, string>, movies: object[] }>} Throws on failure (not cached). */
export async function fetchHotColdData() {
  "use cache";
  cacheLife("days");

  const keys = Object.keys(QUERIES);
  const results = await Promise.all(keys.map((key) => runQuery(QUERIES[key])));
  const rows = Object.fromEntries(keys.map((key, i) => [key, results[i]]));

  const movies = new Map();
  for (const row of rows.films) {
    const id = qid(row.film?.value);
    const title = cleanTitle(row.title?.value);
    if (!id || !title || movies.has(id)) continue;

    const movie = { id, title, links: Number(row.links?.value) || 0 };
    const year = Number.parseInt(row.released?.value?.slice(0, 4) ?? "", 10);
    if (Number.isFinite(year)) movie.year = year;

    const seen = new Set([titleKey(title)]);
    const aliases = [];
    for (const raw of (row.aliases?.value ?? "").split("|")) {
      const alias = cleanTitle(raw);
      if (alias && !seen.has(titleKey(alias))) {
        seen.add(titleKey(alias));
        aliases.push(alias);
      }
    }
    if (aliases.length) movie.aliases = aliases.slice(0, 5);
    movies.set(id, movie);
  }
  if (movies.size === 0) throw new Error("Wikidata returned no films");

  const people = {};
  for (const key of ["c", "d", "m"]) {
    for (const row of rows[key]) {
      const movie = movies.get(qid(row.film?.value));
      const person = qid(row.p?.value);
      if (!movie || !person || !row.name?.value) continue;
      people[person] = row.name.value;
      (movie[key] ??= []).includes(person) || movie[key].push(person);
    }
  }
  for (const row of rows.g) {
    const movie = movies.get(qid(row.film?.value));
    const genre = genreName(row.name?.value);
    if (!movie || !genre) continue;
    (movie.g ??= []).includes(genre) || movie.g.push(genre);
  }

  return { people, movies: [...movies.values()] };
}
