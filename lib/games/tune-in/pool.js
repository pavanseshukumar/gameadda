import { drawWithoutRepeat } from "../core/random";
import { SONGS } from "../guess-the-song/songs";

/**
 * Client-side loader for Tune In: picks an unplayed song from the Guess the Song
 * list, looks up its iTunes preview via `/api/guess-the-song/details` and waits
 * until the browser can play it. Songs with no preview are skipped for the session.
 */

/** Songs iTunes has no preview clip for. */
const noPreview = new Set();
/** Detail lookups, one per song per page load. */
const detailRequests = new Map();

function lookupDetails(songId) {
  if (!detailRequests.has(songId)) {
    const request = fetch(`/api/guess-the-song/details?id=${encodeURIComponent(songId)}`, {
      signal: AbortSignal.timeout(15_000),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((body) => body?.details ?? { found: false })
      .catch((error) => {
        detailRequests.delete(songId); // a network blip shouldn't blacklist the song
        throw error;
      });
    detailRequests.set(songId, request);
  }
  return detailRequests.get(songId);
}

/** Resolves once the browser has enough of the clip to start playing. */
function preloadAudio(url) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = "auto";
    const timer = setTimeout(() => done(resolve), 8_000); // slow network: let it buffer while the team gets ready
    function done(settle, value) {
      clearTimeout(timer);
      audio.oncanplay = audio.onerror = null;
      settle(value);
    }
    audio.oncanplay = () => done(resolve);
    audio.onerror = () => done(reject, new Error("Preview clip failed to load"));
    audio.src = url;
  });
}

const MAX_TRIES = 8;

/**
 * Draw the next song (with its preview clip) for a round.
 *
 * @param {{ usedSongIds: string[], avoidId?: string | null }} state
 * @returns {Promise<{ song: object, recycled: boolean } | null>} null when no clip could be found (offline or iTunes down).
 */
export async function drawClipSong({ usedSongIds, avoidId = null }) {
  let used = usedSongIds;
  let recycledAny = false;

  for (let attempt = 0; attempt < MAX_TRIES; attempt += 1) {
    const ids = SONGS.filter((s) => !noPreview.has(s.id)).map((s) => s.id);
    if (ids.length === 0) return null;
    const draw = drawWithoutRepeat(ids, used, Math.random(), avoidId);
    recycledAny ||= draw.recycled;
    const song = SONGS.find((s) => s.id === draw.id);
    try {
      const details = await lookupDetails(song.id);
      if (!details?.found || !details.previewUrl) {
        noPreview.add(song.id);
        continue;
      }
      await preloadAudio(details.previewUrl);
      return {
        song: {
          id: song.id,
          title: song.movie,
          songTitle: song.title,
          year: song.year,
          composer: song.composer,
          preview: details.previewUrl,
          artwork: details.artworkUrl ?? undefined,
          artist: details.artist ?? undefined,
          trackUrl: details.trackUrl ?? undefined,
        },
        recycled: recycledAny,
      };
    } catch {
      // Rate limit or a broken clip: try a different song.
      used = draw.usedIds;
    }
  }
  return null;
}
