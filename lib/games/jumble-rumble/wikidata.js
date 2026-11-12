import { cacheLife } from "next/cache";
import { cleanTitle, mergeMovies } from "./movies";

/**
 * Telugu films from Wikidata (free, no API key): https://query.wikidata.org
 *
 * Films whose original language is Telugu (Q8097) with an English label.
 * `sitelinks` (how many Wikipedias cover the film) is a rough fame filter,
 * so the random picks are movies people have heard of.
 */
const ENDPOINT = "https://query.wikidata.org/sparql";
const MIN_SITELINKS = 4;
const QUERY = `
SELECT ?film ?title (MIN(?date) AS ?released) (GROUP_CONCAT(DISTINCT ?castName; separator="|") AS ?cast) WHERE {
  ?film wdt:P364 wd:Q8097 ; wdt:P31 wd:Q11424 ; wikibase:sitelinks ?sitelinks .
  FILTER(?sitelinks >= ${MIN_SITELINKS})
  ?film rdfs:label ?title . FILTER(LANG(?title) = "en")
  OPTIONAL { ?film wdt:P577 ?date }
  OPTIONAL { ?film wdt:P161 ?castItem . ?castItem rdfs:label ?castName . FILTER(LANG(?castName) = "en") }
} GROUP BY ?film ?title`;

/**
 * Fetch and normalise the pool. Cached on the server for a day, so Wikidata
 * sees at most a request or so per day. Throws on failure, which isn't cached.
 *
 * @returns {Promise<import("./movies").Movie[]>}
 */
export async function fetchTollywoodMovies() {
  "use cache";
  cacheLife("days");

  const url = `${ENDPOINT}?query=${encodeURIComponent(QUERY)}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/sparql-results+json",
      // Wikidata asks automated clients to identify themselves.
      "User-Agent": "GameAdda/0.1 (party word game)",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Wikidata responded ${res.status}`);

  const data = await res.json();
  const movies = (data?.results?.bindings ?? []).map(toMovie).filter(Boolean);
  if (movies.length === 0) throw new Error("Wikidata returned no playable movies");
  return mergeMovies(movies);
}

function toMovie(row) {
  const qid = row.film?.value?.split("/").pop();
  const title = cleanTitle(row.title?.value);
  if (!qid || !title) return null;

  const year = Number.parseInt(row.released?.value?.slice(0, 4) ?? "", 10);
  // Wikidata keeps cast unordered, so this is "featuring", not strictly the lead.
  const cast = (row.cast?.value ?? "").split("|").filter(Boolean).slice(0, 2);

  const movie = { id: `wd-${qid}`, title };
  if (Number.isFinite(year)) movie.year = year;
  if (cast.length) movie.lead = cast.join(" & ");
  return movie;
}
