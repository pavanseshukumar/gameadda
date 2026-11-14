/** Team token palette. `deep` is for text on light surfaces and button depth; `fg` is text on `hex`. */
export const TEAM_COLORS = {
  coral: { id: "coral", label: "Coral", hex: "#F0603D", deep: "#B8381B", soft: "#FDE3DA", fg: "#FFFFFF" },
  ocean: { id: "ocean", label: "Ocean", hex: "#2E6BE6", deep: "#1A45A3", soft: "#DCE7FC", fg: "#FFFFFF" },
  sun: { id: "sun", label: "Sun", hex: "#F2B01E", deep: "#A86F00", soft: "#FDF0CC", fg: "#1B2140" },
  mint: { id: "mint", label: "Mint", hex: "#1E9E6A", deep: "#0E6A45", soft: "#D5F1E4", fg: "#FFFFFF" },
  plum: { id: "plum", label: "Plum", hex: "#8A55E0", deep: "#5B2DAA", soft: "#EADFFB", fg: "#FFFFFF" },
  rose: { id: "rose", label: "Rose", hex: "#E24A8B", deep: "#A3205A", soft: "#FADCE9", fg: "#FFFFFF" },
};

export const TEAM_COLOR_IDS = Object.keys(TEAM_COLORS);

export const DEFAULT_TEAM_NAMES = ["Coral Crew", "Blue Wave", "Sunny Side", "Mint Condition"];

export const DEFAULT_TEAM_COLORS = ["coral", "ocean", "sun", "mint"];

export function getTeamColor(id) {
  return TEAM_COLORS[id] ?? TEAM_COLORS.coral;
}

/** CSS custom properties that themed components read (`var(--team)` etc). */
export function teamStyle(colorId) {
  const c = getTeamColor(colorId);
  return { "--team": c.hex, "--team-deep": c.deep, "--team-soft": c.soft, "--team-fg": c.fg };
}
