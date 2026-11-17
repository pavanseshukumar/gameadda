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
 *   - style "chalk":    letters chalked over blanks; empty strings are blanks still to find
 *   - style "fill":     letters; empty strings are blanks, a filled-in movie title
 *   - style "ice":      letters on ice cubes; empty strings are gaps between words
 *   - style "marks":    "LETTER:mark" strings (mark = hit | near | miss), a marked guess
 *   - style "board":    hex colours = board spaces on a winding path; "★" marks the team token
 *   - style "swipe":    "✓" / "✗" = a turn's words, got it or passed
 *   - style "emoji":    emoji on tilted stickers; empty strings are face-down stickers
 *   - style "twins":    "emoji|colour" = a face-up card; empty strings are face-down cards
 *
 * `modes` drives the hub's All / Solo filter: "solo" when one player can play
 * alone (TeamSetup's Solo switch), "teams" for team or group play.
 *
 * `hidden: true` keeps a game off the hub (its route and code stay, for later).
 *
 * `theme` is the game's look (a `.theme-<name>` class in app/game-themes.css), used
 * by its route layout and by its card on the hub.
 */
const ALL_GAMES = [
  {
    slug: "guess-the-song",
    modes: ["solo", "teams"],
    href: "/games/guess-the-song",
    title: "Guess the Telugu Song",
    tagline: "Every team gets its own hidden song title. Call letters, guard your 3 lives, and name the song for a 5× bonus.",
    players: "Solo · 2–6 teams",
    duration: "~2 min per song",
    accent: ["#f6bd4a", "#ff8aa1"],
    theme: "songbook",
    preview: { style: "hidden", tiles: ["V", "E", "", "", "", "L", "A"] },
  },
  {
    slug: "jumble-rumble",
    modes: ["solo", "teams"],
    href: "/games/jumble-rumble",
    title: "Jumble Rumble",
    tagline: "Unscramble a Telugu movie title against the clock. Miss it, and the next team gets a steal.",
    players: "Solo · 2–6 teams",
    duration: "~1 min / round",
    accent: ["#ef6448", "#0d7470"],
    theme: "tabletop",
    preview: { style: "jumble", tiles: ["K", "O", "D", "A", "U", "K", "D"] },
  },
  {
    // The slug predates the shuffle-and-blur reveal; kept so saved games and links still work.
    slug: "pixel-poster",
    modes: ["solo", "teams"],
    href: "/games/pixel-poster",
    title: "Poster Puzzle",
    tagline: "Name the movie from a shuffled, blurred poster. Guess early for 100, or wait for it to clear for 50.",
    players: "Solo · 2–6 teams",
    duration: "~1 min / round",
    accent: ["#f5c542", "#ff5a4e"],
    theme: "marquee",
    preview: { style: "scramble", tiles: [4, 1, 6, 0, 3, 5, 2] },
  },
  {
    slug: "hot-and-cold",
    modes: ["solo", "teams"],
    href: "/games/hot-and-cold",
    title: "Hot & Cold",
    tagline: "Hunt down a secret Telugu movie. Every guess gets a temperature from shared cast, director and music.",
    players: "Solo · 2–6 teams",
    duration: "~5 min / round",
    accent: ["#4cc9f0", "#ff7043"],
    theme: "thermal",
    // Readings climbing toward the secret.
    preview: { style: "thermo", tiles: [4, 12, 9, 31, 53, 78, 100] },
  },
  {
    slug: "tune-in",
    modes: ["solo", "teams"],
    href: "/games/tune-in",
    title: "Tune In",
    tagline: "Play and pause a 30-second song clip, then name the Telugu movie. Guess within 5 seconds for 100.",
    players: "Solo · 2–6 teams",
    duration: "~1 min / round",
    accent: ["#2346e0", "#e2432a"],
    theme: "dial",
    // Equaliser bar heights.
    preview: { style: "wave", tiles: [35, 70, 100, 55, 85, 40, 65] },
  },
  {
    slug: "emoji-talkies",
    modes: ["solo", "teams"],
    href: "/games/emoji-talkies",
    title: "Emoji Talkies",
    tagline: "A Telugu movie, told in emojis. Name it fast: it's worth 100 at the start and slides as the clock runs.",
    players: "Solo · 2–6 teams",
    duration: "~1 min / round",
    accent: ["#ffcf3f", "#b8266a"],
    theme: "sticker",
    // ☂️👑 = Chatrapathi, then a few still face down.
    preview: { style: "emoji", tiles: ["☂️", "👑", "🌊", "", "", "", ""] },
  },
  {
    slug: "head-rush",
    modes: ["teams"],
    href: "/games/head-rush",
    title: "Head Rush",
    tagline: "Phone on your forehead, team shouting clues. Swipe right for every word you get before the clock runs out.",
    players: "2–6 teams",
    duration: "~1 min / turn",
    accent: ["#ff8a4c", "#b3245f"],
    theme: "carnival",
    // A turn's words: got it, got it, passed…
    preview: { style: "swipe", tiles: ["✓", "✓", "✗", "✓", "✓", "✗", "✓"] },
  },
  {
    slug: "imposter",
    modes: ["teams"],
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
    slug: "word-swap",
    modes: ["solo", "teams"],
    href: "/games/word-swap",
    title: "Word Swap",
    tagline: "Set a sneaky secret word for the next team, then crack the one set for you. Six tries; every letter tells you something.",
    players: "Solo · 2–6 teams",
    duration: "~3 min / turn",
    accent: ["#2dd4bf", "#f472b6"],
    theme: "arcade",
    // A guess with every kind of mark.
    preview: { style: "marks", tiles: ["S:hit", "W:miss", "A:near", "P:hit", "S:miss", "", ""] },
  },
  {
    slug: "frozen-brains",
    modes: ["solo", "teams"],
    href: "/games/frozen-brains",
    title: "Frozen Brains",
    tagline: "FRY DRY ICE? Say the nonsense out loud, fast, until the real words pop out. Miss it and the next team steals.",
    players: "Solo · 2–6 teams",
    duration: "~1 min / card",
    accent: ["#38bdf8", "#0b2236"],
    theme: "frost",
    // "FRY DRY ICE", squeezed onto ice cubes.
    preview: { style: "ice", tiles: ["F", "R", "Y", "", "I", "C", "E"] },
  },
  {
    slug: "twin-hunt",
    modes: ["solo", "teams"],
    href: "/games/twin-hunt",
    title: "Twin Hunt",
    tagline: "Flip two cards and find the twins: same picture, same colour. Match one and go again; miss and the next team pounces.",
    players: "Solo · 2–6 teams",
    duration: "~3 min / board",
    accent: ["#ff9f6b", "#3b44b0"],
    theme: "playroom",
    // Face-down cards with two twins turned up.
    preview: { style: "twins", tiles: ["", "🦊|oklch(0.88 0.12 50)", "", "", "🦊|oklch(0.88 0.12 50)", "🐸|oklch(0.8 0.12 140)", ""] },
  },
  {
    slug: "fill-the-film",
    modes: ["solo", "teams"],
    href: "/games/fill-the-film",
    title: "Fill the Film",
    tagline: "Every team works down its own list of Telugu movie blanks. Guess right to go again; ask for a letter or clue and the turn passes.",
    players: "Solo · 2–6 teams",
    duration: "~15 min / game",
    accent: ["#c32f27", "#1d1a16"],
    theme: "listings",
    // A title with a few letters filled in.
    preview: { style: "fill", tiles: ["O", "", "K", "", "", "U", ""] },
  },
  {
    slug: "hangman",
    modes: ["solo", "teams"],
    href: "/games/hangman",
    title: "Hangman",
    tagline: "Every team gets its own hidden word. Call letters and solve it before six misses finish the stick figure.",
    players: "Solo · 2–6 teams",
    duration: "~2 min / word",
    accent: ["#f6d65c", "#ff9ab8"],
    theme: "chalkboard",
    // A half-solved word on the chalkboard.
    preview: { style: "chalk", tiles: ["G", "", "L", "", "", "W", "S"] },
  },
  {
    slug: "pictionary",
    modes: ["teams"],
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

/** Games shown on the hub. */
export const GAMES = ALL_GAMES.filter((game) => !game.hidden);

/** Hub filter options, in order. (Every game can be played in teams, so there is no Teams filter.) */
export const GAME_MODES = [
  { value: "all", label: "All" },
  { value: "solo", label: "Solo" },
];
