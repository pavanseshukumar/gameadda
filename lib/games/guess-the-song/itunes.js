/**
 * Song details from the iTunes Search API (https://itunes.apple.com/search):
 * singers, soundtrack album, cover art and a 30-second preview clip.
 *
 * Server-only: called from `/api/guess-the-song/details`. Results are cached for
 * days, since iTunes allows roughly 20 searches per minute per IP.
 *
 * iTunes lists many remixes, lofi re-uploads, dubbed versions and compilations
 * for the same song, so results are scored to prefer the original soundtrack track.
 */

import { cacheLife } from "next/cache";
import { getSongById } from "./songs";

const SEARCH_URL = "https://itunes.apple.com/search";

/** Re-recordings and edits we never want instead of the original. */
const ALTERED = /remix|lo-?fi|reprise|version|cover|instrumental|karaoke|slowed|reverb|unplugged|mashup|\b8d\b|jukebox/i;
/** Dubbed releases of the same film. */
const OTHER_LANGUAGE = /\b(tamil|hindi|malayalam|kannada)\b/i;

const compact = (text) =>
  String(text ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Collapse runs of the same letter: "soocute" → "socute". */
const squeeze = (text) => text.replace(/(.)\1+/g, "$1");

/** "Buttabomma (From \"Ala Vaikunthapurramuloo\")" → "buttabomma" */
const baseTrackName = (name) => compact(String(name ?? "").replace(/\s*[([][^)\]]*[)\]]/g, ""));

function scoreResult(result, song) {
  if (result.kind !== "song" || !result.trackName) return -Infinity;

  const track = baseTrackName(result.trackName);
  const titles = [song.title, ...song.aliases].map(compact);
  let score;
  if (titles.includes(track)) score = 10;
  // Transliteration spellings drift by doubled letters: "So Cute" / "Soo Cute", "Kaavaale" / "Kavale".
  else if (titles.some((t) => squeeze(t) === squeeze(track))) score = 8;
  else if (titles.some((t) => track.startsWith(t) || t.startsWith(track))) score = 5;
  else return -Infinity; // a different song entirely

  // The film must match: same-named songs from other films are common ("Anaganaga
  // Aakasam Undi"), and so are title tracks reused in sequels ("DJ Tillu" in Tillu Square).
  // Only the album and a `(From "Movie")` note count, never the track title itself.
  const fromNote = /from\s+["“]([^"”]+)["”]/i.exec(result.trackName)?.[1] ?? "";
  const source = compact(`${result.collectionName ?? ""} ${fromNote}`);
  const movie = compact(song.movie);
  const movieHead = compact(song.movie.split(/[:\-–(]/)[0]);
  if (movie && source.includes(movie)) score += 4;
  else if (movieHead.length >= 3 && source.startsWith(movieHead)) score += 3;
  else if (movieHead.length >= 3 && compact(fromNote).startsWith(movieHead)) score += 3;
  else return -Infinity;

  const labels = `${result.trackName} ${result.collectionName ?? ""}`;
  if (/soundtrack/i.test(result.collectionName ?? "")) score += 2;
  if (ALTERED.test(labels)) score -= 8;
  if (OTHER_LANGUAGE.test(labels)) score -= 5;
  if (result.previewUrl) score += 1;
  return score;
}

async function search(term) {
  const params = new URLSearchParams({ term, country: "IN", media: "music", entity: "song", limit: "20" });
  const response = await fetch(`${SEARCH_URL}?${params}`, { signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`iTunes search failed: HTTP ${response.status}`);
  const body = await response.json();
  return Array.isArray(body.results) ? body.results : [];
}

function pickBest(results, song) {
  let best = null;
  let bestScore = 0; // anything that doesn't clear the title check scores -Infinity
  for (const result of results) {
    const score = scoreResult(result, song);
    if (score > bestScore) {
      best = result;
      bestScore = score;
    }
  }
  return best;
}

/**
 * @typedef {Object} SongDetails
 * @property {boolean} found
 * @property {string} [artist]       singers (iTunes sometimes includes composer/lyricist)
 * @property {string} [album]
 * @property {number} [releaseYear]  iTunes' date, often a later digital release for old films
 * @property {string} [artworkUrl]   600×600 cover art
 * @property {string} [previewUrl]   30-second AAC preview
 * @property {string} [trackUrl]     Apple Music / iTunes page
 */

/** @returns {Promise<SongDetails | null>} null when the id isn't one of our songs. */
export async function fetchSongDetails(songId) {
  "use cache";
  cacheLife("days");

  const song = getSongById(songId);
  if (!song) return null;

  let match = pickBest(await search(`${song.title} ${song.movie}`), song);
  // Some films are listed under a different spelling; fall back to the title alone.
  if (!match) match = pickBest(await search(song.title), song);
  if (!match) return { found: false };

  return {
    found: true,
    artist: match.artistName ?? null,
    album: match.collectionName ?? null,
    releaseYear: match.releaseDate ? new Date(match.releaseDate).getFullYear() : null,
    artworkUrl: match.artworkUrl100 ? match.artworkUrl100.replace(/\/\d+x\d+bb\./, "/600x600bb.") : null,
    previewUrl: match.previewUrl ?? null,
    trackUrl: match.trackViewUrl ?? null,
  };
}
