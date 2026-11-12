/**
 * Catalogue of party games on the platform. Add an entry here when a new game
 * gets its own route under app/games/<slug>.
 *
 * `preview` drives the little tile strip on the home card:
 *   - style "hidden": empty strings render as hidden letter slots
 *   - style "jumble": tiles are drawn tilted, like a scrambled rack
 */
export const GAMES = [
  {
    slug: "guess-the-song",
    href: "/games/guess-the-song",
    title: "Guess the Telugu Song",
    tagline: "Crack the lyrics letter by letter, then name that song.",
    players: "2–6 teams",
    duration: "5 min / round",
    accent: ["#8b5cf6", "#ec4899"],
    preview: { style: "hidden", tiles: ["V", "E", "", "", "", "L", "A"] },
  },
  {
    slug: "jumble-rumble",
    href: "/games/jumble-rumble",
    title: "Jumble Rumble",
    tagline: "Unscramble Telugu movie titles before the clock runs out.",
    players: "2–6 teams",
    duration: "2 min / round",
    accent: ["#f59e0b", "#ec4899"],
    preview: { style: "jumble", tiles: ["K", "O", "D", "A", "U", "K", "D"] },
  },
];
