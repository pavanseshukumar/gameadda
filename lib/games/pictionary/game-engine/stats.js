import { getCategory } from "../data/categories.js";

/** @typedef {import('../types.js').GameSession} GameSession */

/**
 * Derived end-of-game statistics, computed from turn history.
 * @param {GameSession} s
 */
export function computeGameStats(s) {
  const turns = s.history;
  const correct = turns.filter((t) => t.result === "correct");

  let fastest = null;
  for (const t of correct) {
    if (t.timeUsedMs != null && (!fastest || t.timeUsedMs < fastest.timeUsedMs)) fastest = t;
  }

  const byCategory = {};
  for (const t of turns) {
    const c = (byCategory[t.category] ??= { played: 0, correct: 0 });
    c.played++;
    if (t.result === "correct") c.correct++;
  }
  const toughest = Object.entries(byCategory)
    .filter(([, c]) => c.played >= 2)
    .map(([id, c]) => ({ id, label: getCategory(id).label, rate: c.correct / c.played, ...c }))
    .sort((a, b) => a.rate - b.rate || b.played - a.played)[0] ?? null;

  return {
    turnsPlayed: turns.length,
    correctCount: correct.length,
    guessRate: turns.length ? correct.length / turns.length : 0,
    fastest,
    skips: turns.reduce((n, t) => n + t.skips, 0),
    allPlays: turns.filter((t) => t.isAllPlay).length,
    durationMs: (s.finishedAt ?? s.updatedAt) - s.createdAt,
    toughest,
  };
}

export function formatDuration(ms) {
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
