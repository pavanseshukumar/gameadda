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
 *   - style "lineup":   letters; "?" is the imposter, the rest are crew silhouettes
 *   - style "board":    hex colours = board spaces on a winding path; "★" marks the team token
 *
 * `theme` is the game's look (a `.theme-<name>` class in app/game-themes.css), used
 * by its route layout and by its card on the hub.
 */
export const GAMES = [
  {
    slug: "guess-the-song",
    href: "/games/guess-the-song",
    title: "Guess the Telugu Song",
    tagline: "Every team gets its own hidden song title. Call letters, guard your 3 lives, and name the song for a 5× bonus.",
    players: "2–6 teams",
    duration: "~2 min per song",
    accent: ["#f6bd4a", "#ff8aa1"],
    theme: "songbook",
    preview: { style: "hidden", tiles: ["V", "E", "", "", "", "L", "A"] },
  },
  {
    slug: "jumble-rumble",
    href: "/games/jumble-rumble",
    title: "Jumble Rumble",
    tagline: "Unscramble a Telugu movie title against the clock. Miss it, and the next team gets a steal.",
    players: "2–6 teams",
    duration: "~1 min / round",
    accent: ["#ef6448", "#0d7470"],
    theme: "tabletop",
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
    accent: ["#f5c542", "#ff5a4e"],
    theme: "marquee",
    preview: { style: "scramble", tiles: [4, 1, 6, 0, 3, 5, 2] },
  },
  {
    slug: "hot-and-cold",
    href: "/games/hot-and-cold",
    title: "Hot & Cold",
    tagline: "Hunt down a secret Telugu movie. Every guess gets a temperature from shared cast, director and music.",
    players: "2–6 teams",
    duration: "~5 min / round",
    accent: ["#4cc9f0", "#ff7043"],
    theme: "thermal",
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
    accent: ["#2346e0", "#e2432a"],
    theme: "dial",
    // Equaliser bar heights.
    preview: { style: "wave", tiles: [35, 70, 100, 55, 85, 40, 65] },
  },
  {
    slug: "imposter",
    href: "/games/imposter",
    title: "Imposter",
    tagline: "Everyone knows the secret word except one of you. Give one-word clues, then vote out the faker.",
    players: "3–12 players",
    duration: "~5 min / round",
    accent: ["#c6f432", "#ff4d6d"],
    theme: "hideout",
    // A line-up of players; the "?" is the imposter.
    preview: { style: "lineup", tiles: ["", "", "", "?", "", "", ""] },
  },
  {
    slug: "pictionary",
    href: "/games/pictionary",
    title: "Pictionary Party",
    tagline: "Draw on real paper while the phone runs the board, dice, word cards and timer. First team to the finish wins.",
    players: "2–4 teams",
    duration: "60 s per turn",
    accent: ["#f0603d", "#f2b01e"],
    theme: "paper",
    // Board spaces in category colours; the "★" space holds a team token.
    preview: { style: "board", tiles: ["#F4A62A", "#3D8BF2", "#2FAE72", "★", "#8E63E6", "#EF6A43", "#E2508E"] },
  },
];
