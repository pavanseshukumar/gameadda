/**
 * Telugu movie titles for Jumble Rumble.
 *
 * The game prefers a larger pool fetched from Wikidata at runtime
 * (see `wikidata.js` and `/api/jumble-rumble/movies`). This hand-picked
 * list is always mixed in, and is the whole pool when the fetch fails.
 *
 * To add a movie, append an object to MOVIE_LIST:
 *
 *   {
 *     id: "unique-kebab-id",   // required, unique; don't rename once played
 *     title: "Movie Title",    // required, letters A–Z and spaces only are used for tiles
 *     year: 2024,              // optional, shown by the clue hint
 *     lead: "Actor Name",      // optional, shown by the clue hint
 *   }
 *
 * Keep titles in their common English spelling: the tiles come straight from it.
 * Digits and punctuation are ignored, so prefer titles that are mostly letters.
 *
 * @typedef {Object} Movie
 * @property {string} id
 * @property {string} title
 * @property {number} [year]
 * @property {string} [lead]
 */

/** @type {Movie[]} */
const MOVIE_LIST = [
  { id: "mayabazar", title: "Mayabazar", year: 1957, lead: "NTR, ANR & Savitri" },
  { id: "shankarabharanam", title: "Shankarabharanam", year: 1980, lead: "J. V. Somayajulu" },
  { id: "sagara-sangamam", title: "Sagara Sangamam", year: 1983, lead: "Kamal Haasan" },
  { id: "siva", title: "Siva", year: 1989, lead: "Nagarjuna" },
  { id: "geethanjali", title: "Geethanjali", year: 1989, lead: "Nagarjuna" },
  { id: "tholi-prema", title: "Tholi Prema", year: 1998, lead: "Pawan Kalyan" },
  { id: "nuvve-kavali", title: "Nuvve Kavali", year: 2000, lead: "Tarun" },
  { id: "khushi", title: "Khushi", year: 2001, lead: "Pawan Kalyan" },
  { id: "murari", title: "Murari", year: 2001, lead: "Mahesh Babu" },
  { id: "nuvvu-naaku-nachav", title: "Nuvvu Naaku Nachav", year: 2001, lead: "Venkatesh" },
  { id: "indra", title: "Indra", year: 2002, lead: "Chiranjeevi" },
  { id: "okkadu", title: "Okkadu", year: 2003, lead: "Mahesh Babu" },
  { id: "simhadri", title: "Simhadri", year: 2003, lead: "Jr NTR" },
  { id: "arya", title: "Arya", year: 2004, lead: "Allu Arjun" },
  { id: "athadu", title: "Athadu", year: 2005, lead: "Mahesh Babu" },
  { id: "chatrapathi", title: "Chatrapathi", year: 2005, lead: "Prabhas" },
  { id: "pokiri", title: "Pokiri", year: 2006, lead: "Mahesh Babu" },
  { id: "bommarillu", title: "Bommarillu", year: 2006, lead: "Siddharth" },
  { id: "happy-days", title: "Happy Days", year: 2007, lead: "Ensemble cast" },
  { id: "yamadonga", title: "Yamadonga", year: 2007, lead: "Jr NTR" },
  { id: "jalsa", title: "Jalsa", year: 2008, lead: "Pawan Kalyan" },
  { id: "magadheera", title: "Magadheera", year: 2009, lead: "Ram Charan" },
  { id: "kick", title: "Kick", year: 2009, lead: "Ravi Teja" },
  { id: "vedam", title: "Vedam", year: 2010, lead: "Allu Arjun & Anushka" },
  { id: "khaleja", title: "Khaleja", year: 2010, lead: "Mahesh Babu" },
  { id: "ye-maaya-chesave", title: "Ye Maaya Chesave", year: 2010, lead: "Naga Chaitanya & Samantha" },
  { id: "dookudu", title: "Dookudu", year: 2011, lead: "Mahesh Babu" },
  { id: "eega", title: "Eega", year: 2012, lead: "Nani" },
  { id: "gabbar-singh", title: "Gabbar Singh", year: 2012, lead: "Pawan Kalyan" },
  { id: "businessman", title: "Businessman", year: 2012, lead: "Mahesh Babu" },
  { id: "mirchi", title: "Mirchi", year: 2013, lead: "Prabhas" },
  { id: "attarintiki-daredi", title: "Attarintiki Daredi", year: 2013, lead: "Pawan Kalyan" },
  { id: "manam", title: "Manam", year: 2014, lead: "ANR, Nagarjuna & Naga Chaitanya" },
  { id: "baahubali", title: "Baahubali", year: 2015, lead: "Prabhas" },
  { id: "srimanthudu", title: "Srimanthudu", year: 2015, lead: "Mahesh Babu" },
  { id: "pelli-choopulu", title: "Pelli Choopulu", year: 2016, lead: "Vijay Deverakonda" },
  { id: "arjun-reddy", title: "Arjun Reddy", year: 2017, lead: "Vijay Deverakonda" },
  { id: "fidaa", title: "Fidaa", year: 2017, lead: "Varun Tej & Sai Pallavi" },
  { id: "rangasthalam", title: "Rangasthalam", year: 2018, lead: "Ram Charan" },
  { id: "mahanati", title: "Mahanati", year: 2018, lead: "Keerthy Suresh" },
  { id: "jersey", title: "Jersey", year: 2019, lead: "Nani" },
  { id: "ala-vaikunthapurramuloo", title: "Ala Vaikunthapurramuloo", year: 2020, lead: "Allu Arjun" },
  { id: "bheeshma", title: "Bheeshma", year: 2020, lead: "Nithiin" },
  { id: "pushpa", title: "Pushpa", year: 2021, lead: "Allu Arjun" },
  { id: "sita-ramam", title: "Sita Ramam", year: 2022, lead: "Dulquer Salmaan" },
  { id: "hi-nanna", title: "Hi Nanna", year: 2023, lead: "Nani" },
];

/** Upper-case words of letters only, e.g. "Hi Nanna" → ["HI", "NANNA"]. */
export function answerWords(movie) {
  return movie.title
    .toUpperCase()
    .replace(/[^A-Z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

/** Dedupe key: two movies with the same tile letters are the same puzzle. */
function answerKey(movie) {
  return answerWords(movie).join(" ");
}

const MIN_LETTERS = 3;
const MAX_LETTERS = 22;
const MAX_WORDS = 4;

/**
 * Turn a raw English title from an outside source into a tile-friendly one,
 * or return "" when it can't be played: "Jalsa (2008 film)" → "Jalsa",
 * accents dropped, anything with digits or non-Latin letters rejected
 * ("Arya 2" would jumble to just ARYA, which is a different movie).
 */
export function cleanTitle(raw) {
  const title = String(raw ?? "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!title || /\d/.test(title) || !/^[A-Za-z\s:'’.,!?&-]+$/.test(title)) return "";
  return title;
}

/** True when a movie makes a fair puzzle: 3–22 letters across at most 4 words. */
export function isPlayable(movie) {
  if (!movie || typeof movie.id !== "string" || typeof movie.title !== "string") return false;
  const words = answerWords(movie);
  const letters = words.join("").length;
  return words.length <= MAX_WORDS && letters >= MIN_LETTERS && letters <= MAX_LETTERS;
}

/** Combine pools, keeping the first copy of each title. */
export function mergeMovies(...lists) {
  const seen = new Set();
  const merged = [];
  for (const movie of lists.flat()) {
    if (!isPlayable(movie)) continue;
    const key = answerKey(movie);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(movie);
  }
  return merged;
}

function defineMovies(list) {
  if (process.env.NODE_ENV !== "production") {
    const seen = new Set();
    for (const movie of list) {
      if (!movie.id || !movie.title) console.warn(`[movies] Movie "${movie.id ?? movie.title}" is missing fields.`);
      if (answerWords(movie).join("").length < 3) console.warn(`[movies] "${movie.title}" is too short to jumble.`);
      if (seen.has(movie.id)) console.warn(`[movies] Duplicate movie id "${movie.id}".`);
      seen.add(movie.id);
    }
  }
  return Object.freeze(list.map((movie) => Object.freeze({ ...movie })));
}

export const MOVIES = defineMovies(MOVIE_LIST);
export const MOVIE_IDS = MOVIES.map((movie) => movie.id);
const MOVIES_BY_ID = new Map(MOVIES.map((movie) => [movie.id, movie]));

export function getMovieById(id) {
  return MOVIES_BY_ID.get(id) ?? null;
}
