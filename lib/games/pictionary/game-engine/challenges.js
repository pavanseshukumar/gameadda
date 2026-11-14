/**
 * Drawing-challenge rules: how a turn's handicap is chosen. Definitions live
 * in data/challenges.js; this file only decides which one applies.
 */
import { CHALLENGES, CHALLENGE_IDS, NORMAL_CHALLENGE } from "../data/challenges.js";
import { pickRandom } from "../utils/index.js";

/** @typedef {'normal' | 'random' | 'host'} ChallengeMode */

export const DEFAULT_CHALLENGE_SETTINGS = {
  challengeMode: "normal",
  challengePool: [...CHALLENGE_IDS],
};

/**
 * Normalise challenge settings, e.g. for saved games and setups from before
 * challenges existed (they become Normal Only).
 */
export function normalizeChallengeSettings(settings = {}) {
  const mode = ["normal", "random", "host"].includes(settings.challengeMode) ? settings.challengeMode : "normal";
  const pool = Array.isArray(settings.challengePool) ? settings.challengePool.filter((id) => CHALLENGES[id]) : [];
  return { challengeMode: mode, challengePool: pool.length ? pool : [...CHALLENGE_IDS] };
}

/** Challenges the host can choose from, or the random draw uses. */
export function availableChallenges(settings) {
  const { challengeMode, challengePool } = normalizeChallengeSettings(settings);
  return challengeMode === "random" ? challengePool : CHALLENGE_IDS;
}

/**
 * The challenge for a brand-new turn.
 * - normal: always Normal Drawing.
 * - random: from the enabled pool, avoiding the previous turn's challenge
 *   whenever another option exists.
 * - host: null until the host picks one on the handoff screen.
 * @returns {string | null}
 */
export function assignChallenge(settings, previousId, rng = Math.random) {
  const { challengeMode } = normalizeChallengeSettings(settings);
  if (challengeMode === "normal") return NORMAL_CHALLENGE;
  if (challengeMode === "host") return null;
  const pool = availableChallenges(settings);
  const fresh = pool.filter((id) => id !== previousId);
  return pickRandom(fresh.length ? fresh : pool, rng);
}

/** Challenge id for a turn; turns saved before challenges existed are Normal. */
export function turnChallengeId(turn) {
  return turn?.challengeId ?? NORMAL_CHALLENGE;
}

/** Whether the drawer should see a challenge card before the word. */
export function showsChallenge(settings) {
  return normalizeChallengeSettings(settings).challengeMode !== "normal";
}
