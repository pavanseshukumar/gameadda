import { connection } from "next/server";
import { fetchPosterMovies } from "@/lib/games/pixel-poster/wikimedia";

/** GET /api/pixel-poster/movies → `{ source: "wikidata", movies: PosterMovie[] }` (no posters yet) */
export async function GET() {
  // Fetch at request time, not during `next build`; the result is cached for days.
  await connection();
  try {
    const movies = await fetchPosterMovies();
    return Response.json(
      { source: "wikidata", movies },
      { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
    );
  } catch (error) {
    console.error("[pixel-poster] Wikidata fetch failed:", error);
    return Response.json({ source: "unavailable", movies: [] }, { status: 502 });
  }
}
