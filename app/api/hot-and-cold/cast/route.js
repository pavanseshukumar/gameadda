import { fetchCastOrder } from "@/lib/games/hot-and-cold/wikidata";

/** GET /api/hot-and-cold/cast?id=<film qid> → `{ cast: qid[] }` in billing order (lead first). */
export async function GET(request) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!/^Q\d{1,12}$/.test(id)) return Response.json({ error: "Bad film id" }, { status: 400 });

  try {
    const cast = await fetchCastOrder(id);
    return Response.json({ cast }, { headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } });
  } catch (error) {
    console.error("[hot-and-cold] cast order lookup failed:", error);
    return Response.json({ cast: [] }, { status: 502 });
  }
}
