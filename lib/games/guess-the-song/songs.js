/**
 * Local song database for "Guess the Telugu Song".
 *
 * All lyrics, titles and movies below are ORIGINAL FICTIONAL demo content
 * written for development. They are not real songs.
 *
 * To add a song, append an object to SONGS:
 *
 *   {
 *     id: "unique-kebab-id",         // required, unique, never reuse/rename once played
 *     title: "Song Title",           // required, what teams must guess
 *     movie: "Movie Name",           // required
 *     year: 2024,                    // optional
 *     firstLine: "First lyric line", // required, English transliteration
 *     secondLine: "Second line",     // required, English transliteration
 *     aliases: ["Alt Spelling"],     // optional, other accepted answers
 *   }
 *
 * Answers are matched case-insensitively, ignoring punctuation and extra spaces,
 * so aliases are only needed for genuinely different spellings or names.
 *
 * @typedef {Object} Song
 * @property {string} id
 * @property {string} title
 * @property {string} movie
 * @property {number} [year]
 * @property {string} firstLine
 * @property {string} secondLine
 * @property {string[]} [aliases]
 */

/** @type {Song[]} */
const SONG_LIST = [
  {
    id: "vennela-vaana",
    title: "Vennela Vaana",
    movie: "Akasha Deepalu",
    year: 2019,
    firstLine: "Vennela vaanalo thadisina ee raathiri",
    secondLine: "Nee navvu chusi naa gunde paadindhi",
    aliases: ["Vennela Vana"],
  },
  {
    id: "gaaliki-cheppana",
    title: "Gaaliki Cheppana",
    movie: "Neeli Kalalu",
    year: 2021,
    firstLine: "Gaaliki cheppana nee peru prathi roju",
    secondLine: "Kaalam aagi chuse ee kshanam kosam",
    aliases: ["Galiki Cheppana"],
  },
  {
    id: "chinukula-sandadi",
    title: "Chinukula Sandadi",
    movie: "Varsha Ruthuvu",
    year: 2016,
    firstLine: "Chinuku chinuku kalisi sandadi chesindhi",
    secondLine: "Manasu manasu kalisi paata paadindhi",
  },
  {
    id: "rangula-kala",
    title: "Rangula Kala",
    movie: "Pachani Prayanam",
    year: 2022,
    firstLine: "Rangula kalalo nuvve oka rangu",
    secondLine: "Ninnu choosina kannulaki pandaga roju",
  },
  {
    id: "sandhya-ragam",
    title: "Sandhya Ragam",
    movie: "Godari Theeram",
    year: 2014,
    firstLine: "Sandhya velalo nee needa vethiki",
    secondLine: "Godari theeraana nadichaanu nenu",
    aliases: ["Sandhya Raagam"],
  },
  {
    id: "pallaki-paata",
    title: "Pallaki Paata",
    movie: "Pelli Sandadi Nights",
    year: 2018,
    firstLine: "Pallaki ekki vachindhi pelli kooturu",
    secondLine: "Dappu mogindhi oorantha sandadi",
  },
  {
    id: "nakshatra-dhaara",
    title: "Nakshatra Dhaara",
    movie: "Ningi Nela",
    year: 2023,
    firstLine: "Nakshatraala dhaarallo nee kalale",
    secondLine: "Ningi nela kalise chotu nuvve",
    aliases: ["Nakshatra Dhara"],
  },
  {
    id: "chalo-chalo",
    title: "Chalo Chalo",
    movie: "Dosthi Express",
    year: 2020,
    firstLine: "Chalo chalo ani dosthulu pilichaaru",
    secondLine: "Bike meedha road antha manade ra",
  },
  {
    id: "jola-paata",
    title: "Jola Paata",
    movie: "Amma Intlo",
    year: 2012,
    firstLine: "Jo jo laali ani amma paadindhi",
    secondLine: "Chandamama vachi kathalu cheppindhi",
    aliases: ["Jo Jo Laali"],
  },
  {
    id: "marala-marala",
    title: "Marala Marala",
    movie: "Dooram Dagara",
    year: 2017,
    firstLine: "Marala marala nee vaipe adugulu",
    secondLine: "Dooram ento theliyani prema idhi",
  },
  {
    id: "panduga-vachindhi",
    title: "Panduga Vachindhi",
    movie: "Sankranthi Sandhadi",
    year: 2015,
    firstLine: "Panduga vachindhi intiki velugu techindhi",
    secondLine: "Muggula meedha pasupu kumkuma navvindhi",
    aliases: ["Panduga Vachindi"],
  },
  {
    id: "kotha-prayanam",
    title: "Kotha Prayanam",
    movie: "Mundhuku Saagu",
    year: 2024,
    firstLine: "Kotha dhaarullo kotha kalale modhalu",
    secondLine: "Gathaanni vadili mundhuku saagudham",
  },
];

function defineSongs(list) {
  if (process.env.NODE_ENV !== "production") {
    const seen = new Set();
    for (const song of list) {
      if (!song.id || !song.title || !song.movie || !song.firstLine || !song.secondLine) {
        console.warn(`[songs] Song "${song.id ?? song.title}" is missing required fields.`);
      }
      if (seen.has(song.id)) console.warn(`[songs] Duplicate song id "${song.id}".`);
      seen.add(song.id);
    }
  }
  return Object.freeze(list.map((song) => Object.freeze({ aliases: [], ...song })));
}

export const SONGS = defineSongs(SONG_LIST);

const SONGS_BY_ID = new Map(SONGS.map((song) => [song.id, song]));

export const SONG_IDS = SONGS.map((song) => song.id);

export function getSongById(id) {
  return SONGS_BY_ID.get(id) ?? null;
}

export function getLyricLines(song) {
  return song ? [song.firstLine, song.secondLine] : [];
}
