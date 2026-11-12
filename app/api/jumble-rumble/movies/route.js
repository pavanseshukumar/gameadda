import { connection } from "next/server";
import { fetchTollywoodMovies } from "@/lib/games/jumble-rumble/wikidata";

/** GET /api/jumble-rumble/movies → `{ source: "wikidata", movies: Movie[] }` */
export async function GET() {
  // Fetch at request time, not during `next build`; the result is cached for a day.
  await connection();
  try {
    const movies = await fetchTollywoodMovies();
    return Response.json(
      { source: "wikidata", movies },
      { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
    );
  } catch (error) {
    console.error("[jumble-rumble] Wikidata fetch failed:", error);
    return Response.json({ source: "unavailable", movies: [] }, { status: 502 });
  }
}
