"use client";

import { useEffect, useState } from "react";

/** One request per song per page load, shared by the play and round-end screens. */
const requests = new Map();

function loadDetails(songId) {
  if (!requests.has(songId)) {
    const request = fetch(`/api/guess-the-song/details?id=${encodeURIComponent(songId)}`, {
      signal: AbortSignal.timeout(15_000),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => body?.details ?? { found: false })
      .catch(() => {
        requests.delete(songId); // let a later round retry
        return { found: false };
      });
    requests.set(songId, request);
  }
  return requests.get(songId);
}

/**
 * iTunes details for a song (singers, cover art, preview clip).
 * Returns null while loading; `{ found: false }` when iTunes has no match or is down.
 * The game never waits on this: everything it adds is optional.
 */
export function useSongDetails(songId) {
  const [result, setResult] = useState({ songId: null, details: null });

  useEffect(() => {
    if (!songId) return;
    let active = true;
    loadDetails(songId).then((details) => {
      if (active) setResult({ songId, details });
    });
    return () => {
      active = false;
    };
  }, [songId]);

  return result.songId === songId ? result.details : null;
}
