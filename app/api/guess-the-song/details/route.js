import { fetchSongDetails } from "@/lib/games/guess-the-song/itunes";

/** GET /api/guess-the-song/details?id=<songId> → `{ source: "itunes", details: SongDetails }` */
export async function GET(request) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing song id" }, { status: 400 });

  try {
    const details = await fetchSongDetails(id);
    if (!details) return Response.json({ error: "Unknown song" }, { status: 404 });
    return Response.json(
      { source: "itunes", details },
      // Netlify's CDN leaves the query string out of its cache key unless told otherwise,
      // which would serve the first song's details for every id.
      { headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800", "Netlify-Vary": "query=id" } },
    );
  } catch (error) {
    console.error("[guess-the-song] iTunes lookup failed:", error);
    return Response.json({ source: "unavailable", details: { found: false } }, { status: 502 });
  }
}
