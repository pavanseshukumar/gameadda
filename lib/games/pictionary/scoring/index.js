/**
 * Central scoring rules. Every point and every ranking decision goes through
 * here so house rules can be changed in one place.
 */

/** @typedef {import('../types.js').GameSession} GameSession */
/** @typedef {import('../types.js').Team} Team */

export const SCORING_RULES = {
  correctPoints: 1,
  failedPoints: 0,
  /** Extra points when `settings.difficultyBonus` is on. */
  difficultyBonus: { easy: 0, medium: 1, hard: 2 },
  /** Classic: a successful turn earns a dice roll. */
  rollOnSuccess: true,
  dieSides: 6,
};

/**
 * Points awarded for a resolved turn.
 * @param {{ success: boolean, difficulty: 'easy'|'medium'|'hard', settings: import('../types.js').GameSettings }} input
 */
export function getTurnPoints({ success, difficulty, settings }) {
  if (!success) return SCORING_RULES.failedPoints;
  const bonus = settings.difficultyBonus ? SCORING_RULES.difficultyBonus[difficulty] ?? 0 : 0;
  return SCORING_RULES.correctPoints + bonus;
}

/**
 * Teams ordered best-first, each with a 1-based `rank` (ties share a rank).
 * Classic ranks by board position then points; Quick Play by points then
 * fastest guess.
 * @param {GameSession} session
 * @returns {(Team & { rank: number })[]}
 */
export function rankTeams(session) {
  const key = (t) =>
    session.mode === "classic" ? [t.position, t.score] : [t.score, -(t.stats.fastestMs ?? Infinity)];
  const compare = (a, b) => {
    const ka = key(a);
    const kb = key(b);
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i];
    return 0;
  };
  const sorted = [...session.teams].sort(compare);
  // Tied teams share the rank of the first team they tie with.
  return sorted.map((team) => ({
    ...team,
    rank: sorted.findIndex((other) => compare(other, team) === 0) + 1,
  }));
}

/** Ids of the team(s) currently in first place. */
export function leadingTeamIds(session) {
  return rankTeams(session)
    .filter((t) => t.rank === 1)
    .map((t) => t.id);
}

export function rollDie(rng = Math.random) {
  return 1 + Math.floor(rng() * SCORING_RULES.dieSides);
}
