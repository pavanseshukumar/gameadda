/**
 * Server-only data sources for Poster Puzzle (both free, no API key):
 *
 *  - Wikidata (https://query.wikidata.org): Telugu films with an English
 *    Wikipedia article, their year, some cast and alternative English spellings.
 *  - English Wikipedia (https://en.wikipedia.org/w/api.php, PageImages): the
 *    article's lead image, which for films is nearly always the theatrical poster.
 *
 * Posters are looked up one movie at a time (one request per round) rather than
 * all at once, because Wikipedia rate-limits bulk lookups. Both are cached for days.
 *
 * Wikimedia asks automated clients to identify themselves. Set WIKIMEDIA_CONTACT
 * (a URL or email for whoever runs this deployment) to add it to the User-Agent.
 */

import { cacheLife } from "next/cache";
import { cleanTitle, titleKey } from "../core/movieTitles";

const USER_AGENT = `GameAdda-PixelPoster/0.1 (Telugu party game${
  process.env.WIKIMEDIA_CONTACT ? `; ${process.env.WIKIMEDIA_CONTACT}` : ""
})`;

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const MIN_SITELINKS = 4;
/** Films released in or after this year (ones with no known release date are left out). */
export const MIN_YEAR = 2000;
const POSTER_WIDTH = 480;

const QUERY = `
SELECT ?film ?title ?article (MIN(?date) AS ?released)
  (GROUP_CONCAT(DISTINCT ?castName; separator="|") AS ?cast)
  (GROUP_CONCAT(DISTINCT ?alias; separator="|") AS ?aliases) WHERE {
  ?film wdt:P364 wd:Q8097 ; wdt:P31 wd:Q11424 ; wikibase:sitelinks ?sitelinks .
  FILTER(?sitelinks >= ${MIN_SITELINKS})
  ?film rdfs:label ?title . FILTER(LANG(?title) = "en")
  ?article schema:about ?film ; schema:isPartOf <https://en.wikipedia.org/> .
  OPTIONAL { ?film wdt:P577 ?date }
  OPTIONAL { ?film skos:altLabel ?alias . FILTER(LANG(?alias) = "en") }
  OPTIONAL { ?film wdt:P161 ?castItem . ?castItem rdfs:label ?castName . FILTER(LANG(?castName) = "en") }
} GROUP BY ?film ?title ?article`;

/**
 * Telugu films that have an English Wikipedia article. Throws on failure (not cached).
 * @returns {Promise<import("../core/movieTitles").PosterMovie[]>}
 */
export async function fetchPosterMovies() {
  "use cache";
  cacheLife("days");

  const res = await fetch(`${SPARQL_ENDPOINT}?query=${encodeURIComponent(QUERY)}`, {
    headers: { Accept: "application/sparql-results+json", "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Wikidata responded ${res.status}`);

  const data = await res.json();
  const seen = new Set();
  const movies = [];
  for (const row of data?.results?.bindings ?? []) {
    const movie = toMovie(row);
    // Recent films only: their posters are what today's players have actually seen.
    if (!movie || seen.has(movie.id) || !(movie.year >= MIN_YEAR)) continue;
    seen.add(movie.id);
    movies.push(movie);
  }
  if (movies.length === 0) throw new Error("Wikidata returned no playable movies");
  return movies;
}

function toMovie(row) {
  const qid = row.film?.value?.split("/").pop();
  const title = cleanTitle(row.title?.value);
  const article = decodeURIComponent(row.article?.value?.split("/wiki/")[1] ?? "").replace(/_/g, " ");
  if (!qid || !title || !article) return null;

  // Other English spellings, plus the article name ("Julayi" for "Julai").
  const keys = new Set([titleKey(title)]);
  const aliases = [];
  for (const raw of [...(row.aliases?.value ?? "").split("|"), article]) {
    const alias = cleanTitle(raw);
    const key = titleKey(alias);
    if (!alias || keys.has(key)) continue;
    keys.add(key);
    aliases.push(alias);
  }

  const year = Number.parseInt(row.released?.value?.slice(0, 4) ?? "", 10);
  // Wikidata keeps cast unordered, so this is "featuring", not strictly the lead.
  const cast = (row.cast?.value ?? "").split("|").filter(Boolean).slice(0, 2);

  const movie = { id: `wd-${qid}`, title, article };
  if (aliases.length) movie.aliases = aliases.slice(0, 6);
  if (Number.isFinite(year)) movie.year = year;
  if (cast.length) movie.lead = cast.join(" & ");
  return movie;
}

/**
 * The poster (lead image) of an English Wikipedia article, or null when it has none.
 * Throws on network/rate-limit errors, which aren't cached.
 *
 * @returns {Promise<{ url: string, width: number, height: number } | null>}
 */
export async function fetchPoster(article) {
  "use cache";
  cacheLife("days");

  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    redirects: "1",
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: String(POSTER_WIDTH),
    // Film posters are non-free images, which PageImages skips unless asked.
    pilicense: "any",
    titles: article,
  });
  const res = await fetch(`${WIKIPEDIA_API}?${params}`, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`Wikipedia responded ${res.status}`);

  const thumb = (await res.json())?.query?.pages?.[0]?.thumbnail;
  if (!thumb?.source) return null;
  const url = new URL(thumb.source);
  if (url.hostname !== "upload.wikimedia.org") return null;
  url.search = "";
  return { url: url.toString(), width: thumb.width, height: thumb.height };
}
