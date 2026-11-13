import { connection } from "next/server";
import { fetchHotColdData } from "@/lib/games/hot-and-cold/wikidata";

/** GET /api/hot-and-cold/movies → `{ source: "wikidata", people, movies }` */
export async function GET() {
  // Fetch at request time, not during `next build`; the result is cached for days.
  await connection();
  try {
    const { people, movies } = await fetchHotColdData();
    return Response.json(
      { source: "wikidata", people, movies },
      { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
    );
  } catch (error) {
    console.error("[hot-and-cold] Wikidata fetch failed:", error);
    return Response.json({ source: "unavailable", people: {}, movies: [] }, { status: 502 });
  }
}
