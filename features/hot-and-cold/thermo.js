import { bandFor } from "@/lib/games/hot-and-cold/temperature";

/** Colour per temperature band (cold blues → hot reds; found = the "hit" green). */
const TONE_COLORS = {
  freezing: "#60a5fa",
  cold: "#22d3ee",
  warm: "#fbbf24",
  hot: "#f97316",
  burning: "#ef4444",
  found: "var(--hit)",
};

export function temperatureStyle(score) {
  const band = bandFor(score);
  return { band, color: TONE_COLORS[band.tone] };
}

/** "Secret is newer (3 yrs)" style chip text, or null without years. */
export function yearClue(yearDiff) {
  if (yearDiff === null || yearDiff === undefined) return null;
  if (yearDiff === 0) return "Same year";
  const years = Math.abs(yearDiff);
  return `Secret is ${yearDiff > 0 ? "newer" : "older"} · ${years} yr${years === 1 ? "" : "s"}`;
}
