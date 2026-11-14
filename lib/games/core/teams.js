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

/** Text colour that stays readable on a team-colour fill (dark ink on the light amber/cyan/orange). */
export function teamInk(color) {
  const hex = /^#([0-9a-f]{6})$/i.exec(color ?? "")?.[1];
  if (!hex) return "#fff";
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // White text needs the fill under ~0.3 luminance to read; otherwise go dark.
  return luminance > 0.3 ? "#16120a" : "#fff";
}

/**
 * Team colour for text on the page. Each game theme sets `--team-text-mix`:
 * 100% on dark themes, lower on light ones so amber or cyan names blend toward the ink and stay legible.
 */
export function teamText(color) {
  return `color-mix(in oklab, ${color} var(--team-text-mix, 100%), var(--foreground))`;
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
