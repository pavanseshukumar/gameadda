/** Join class names, skipping falsy values. */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

let counter = 0;

/** Short unique id; good enough for local-only entities. */
export function uid(prefix = "id") {
  counter = (counter + 1) % 1e6;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function randomInt(maxExclusive, rng = Math.random) {
  return Math.floor(rng() * maxExclusive);
}

export function pickRandom(items, rng = Math.random) {
  return items[randomInt(items.length, rng)];
}

export function shuffle(items, rng = Math.random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, rng);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** 63_400 → "1:03" */
export function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** 8_400 → "8.4s" */
export function formatSeconds(ms) {
  if (ms == null) return "—";
  return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)}s`;
}

export function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
