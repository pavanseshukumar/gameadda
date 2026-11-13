import { fetchPoster } from "@/lib/games/pixel-poster/wikimedia";

/** GET /api/pixel-poster/poster?article=<Wikipedia title> → `{ poster: { url, width, height } | null }` */
export async function GET(request) {
  const article = request.nextUrl.searchParams.get("article")?.trim();
  if (!article || article.length > 200) return Response.json({ error: "Missing article" }, { status: 400 });

  try {
    const poster = await fetchPoster(article);
    return Response.json({ poster }, { headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } });
  } catch (error) {
    console.error("[pixel-poster] Wikipedia poster lookup failed:", error);
    return Response.json({ poster: null, error: "unavailable" }, { status: 502 });
  }
}
