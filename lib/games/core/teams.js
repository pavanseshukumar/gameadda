/**
 * Shared team helpers for every local multiplayer game.
 */

/** Fewest teams in team mode. Solo mode plays with exactly one. */
export const MIN_TEAMS = 2;
export const MAX_TEAMS = 6;

/** Vibrant team colours. Green and red are reserved for correct/incorrect feedback. */
export const TEAM_COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#06b6d4", "#3b82f6", "#f97316"];

/**
 * Default names, one per slot. Each starts with a different letter because
 * the turn and handoff avatars show only the first letter.
 */
export const DEFAULT_TEAM_NAMES = [
  "Biryani Bandits",
  "Mirchi Mavericks",
  "Climax Kings",
  "Tollywood Tigers",
  "Gongura Gang",
  "Interval Bangers",
];

export function teamColor(index) {
  return TEAM_COLORS[index % TEAM_COLORS.length];
}

export function defaultTeamName(index) {
  return DEFAULT_TEAM_NAMES[index] ?? `Team ${index + 1}`;
}

/**
 * Turn setup drafts (`{ id, name }`) into scored teams.
 * Empty names fall back to the default name for that slot.
 */
export function buildTeams(drafts) {
  return drafts.slice(0, MAX_TEAMS).map((draft, index) => ({
    id: String(draft.id),
    name: draft.name?.trim() || defaultTeamName(index),
    color: teamColor(index),
    score: 0,
  }));
}

/** Solo mode: one player, so there's no steal and no passing the turn. */
export function isSolo(teams) {
  return teams.length === 1;
}

export function nextTeamIndex(currentIndex, teamCount) {
  return teamCount > 0 ? (currentIndex + 1) % teamCount : 0;
}

export function addScore(teams, teamId, points) {
  return teams.map((team) => (team.id === teamId ? { ...team, score: team.score + points } : team));
}

/** Teams sorted by score (desc), keeping original order for ties. */
export function rankTeams(teams) {
  return teams
    .map((team, index) => ({ team, index }))
    .sort((a, b) => b.team.score - a.team.score || a.index - b.index)
    .map(({ team }) => team);
}

/** All teams sharing the top score (empty if nobody has scored). */
export function leadingTeams(teams) {
  const top = Math.max(0, ...teams.map((team) => team.score));
  if (top === 0) return [];
  return teams.filter((team) => team.score === top);
}
