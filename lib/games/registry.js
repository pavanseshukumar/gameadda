/**
 * Catalogue of party games on the platform. Add an entry here when a new game
 * gets its own route under app/games/<slug>.
 *
 * Keep `tagline` and `duration` in step with the game's rules on its setup screen.
 *
 * `preview` drives the little tile strip on the home card:
 *   - style "hidden":   letters; empty strings render as hidden letter slots
 *   - style "jumble":   letters drawn tilted, like a scrambled rack
 *   - style "scramble": numbers = which strip of a poster sits in each slot, blurred
 *   - style "thermo":   numbers = temperature readings (0–100°), drawn as filled bars
 *   - style "wave":     numbers = equaliser bar heights (0–100%)
 */
export const GAMES = [
  {
    slug: "guess-the-song",
    href: "/games/guess-the-song",
    title: "Guess the Telugu Song",
    tagline: "Every team gets its own hidden song title. Call letters, guard your 3 lives, and name the song for a 5× bonus.",
    players: "2–6 teams",
    duration: "~2 min per song",
    accent: ["#8b5cf6", "#ec4899"],
    preview: { style: "hidden", tiles: ["V", "E", "", "", "", "L", "A"] },
  },
  {
    slug: "jumble-rumble",
    href: "/games/jumble-rumble",
    title: "Jumble Rumble",
    tagline: "Unscramble a Telugu movie title against the clock. Miss it, and the next team gets a steal.",
    players: "2–6 teams",
    duration: "~1 min / round",
    accent: ["#f59e0b", "#ec4899"],
    preview: { style: "jumble", tiles: ["K", "O", "D", "A", "U", "K", "D"] },
  },
  {
    // The slug predates the shuffle-and-blur reveal; kept so saved games and links still work.
    slug: "pixel-poster",
    href: "/games/pixel-poster",
    title: "Poster Puzzle",
    tagline: "Name the movie from a shuffled, blurred poster. Guess early for 100, or wait for it to clear for 50.",
    players: "2–6 teams",
    duration: "~1 min / round",
    accent: ["#06b6d4", "#8b5cf6"],
    preview: { style: "scramble", tiles: [4, 1, 6, 0, 3, 5, 2] },
  },
  {
    slug: "hot-and-cold",
    href: "/games/hot-and-cold",
    title: "Hot & Cold",
    tagline: "Hunt down a secret Telugu movie. Every guess gets a temperature from shared cast, director and music.",
    players: "2–6 teams",
    duration: "~5 min / round",
    accent: ["#3b82f6", "#ef4444"],
    // Readings climbing toward the secret.
    preview: { style: "thermo", tiles: [4, 12, 9, 31, 53, 78, 100] },
  },
  {
    slug: "tune-in",
    href: "/games/tune-in",
    title: "Tune In",
    tagline: "Play and pause a 30-second song clip, then name the Telugu movie. Guess within 5 seconds for 100.",
    players: "2–6 teams",
    duration: "~1 min / round",
    accent: ["#10b981", "#8b5cf6"],
    // Equaliser bar heights.
    preview: { style: "wave", tiles: [35, 70, 100, 55, 85, 40, 65] },
  },
];
