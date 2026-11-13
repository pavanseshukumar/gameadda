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
    id: "inkem-inkem-inkem-kaavaale",
    title: "Inkem Inkem Inkem Kaavaale",
    movie: "Geetha Govindam",
    year: 2018,
    firstLine: "Inkem inkem inkem kaavaale",
    secondLine: "Chaalle idhi chaale",
    aliases: ["Inkem Inkem", "Inkem Inkem Inkem Kavale"],
  },
  {
    id: "vachindamma",
    title: "Vachindamma",
    movie: "Geetha Govindam",
    year: 2018,
    firstLine: "Vachindamma vachindamma",
    secondLine: "Pachchandaname panchindamma",
    aliases: [],
  },
  {
    id: "butta-bomma",
    title: "Butta Bomma",
    movie: "Ala Vaikunthapurramuloo",
    year: 2020,
    firstLine: "Inthakanna manchi polikedi",
    secondLine: "Nannu thakina thaarangame",
    aliases: [],
  },
  {
    id: "samajavaragamana",
    title: "Samajavaragamana",
    movie: "Ala Vaikunthapurramuloo",
    year: 2020,
    firstLine: "Nee kallani pattuku vadalanannavi",
    secondLine: "Choode naa kallanu",
    aliases: ["Samajavaragamana Male"],
  },
  {
    id: "ramuloo-ramulaa",
    title: "Ramuloo Ramulaa",
    movie: "Ala Vaikunthapurramuloo",
    year: 2020,
    firstLine: "Ramuloo ramulaa",
    secondLine: "Nee gundellona moguthundhi",
    aliases: [],
  },
  {
    id: "pilla-raa",
    title: "Pilla Raa",
    movie: "RX 100",
    year: 2018,
    firstLine: "Mabbulona vaana villula",
    secondLine: "Mattilona neeti jallula",
    aliases: [],
  },
  {
    id: "priyathama-priyathama",
    title: "Priyathama Priyathama",
    movie: "Majili",
    year: 2019,
    firstLine: "Priyathama priyathama",
    secondLine: "Palikinadhi hrudayame sarigama",
    aliases: [],
  },
  {
    id: "adiga-adiga",
    title: "Adiga Adiga",
    movie: "Ninnu Kori",
    year: 2017,
    firstLine: "Adiga adiga yedhalo layanadiga",
    secondLine: "Nuvve leni nannu oohinchalenu",
    aliases: [],
  },
  {
    id: "oosupodu",
    title: "Oosupodu",
    movie: "Fidaa",
    year: 2017,
    firstLine: "Oosupodu oorukodu",
    secondLine: "Undaneedu vellaneedu",
    aliases: [],
  },
  {
    id: "mellaga-tellarindoi",
    title: "Mellaga Tellarindoi",
    movie: "Shatamanam Bhavati",
    year: 2017,
    firstLine: "Mellaga tellarindoi",
    secondLine: "Elaa nidra lemanandoi",
    aliases: [],
  },
  {
    id: "ninnila",
    title: "Ninnila",
    movie: "Tholi Prema",
    year: 2018,
    firstLine: "Ninnila ninnila",
    secondLine: "Choosane kallalo kallala",
    aliases: [],
  },
  {
    id: "rangamma-mangamma",
    title: "Rangamma Mangamma",
    movie: "Rangasthalam",
    year: 2018,
    firstLine: "Rangamma mangamma",
    secondLine: "Em pilladu pakkana pettamma",
    aliases: [],
  },
  {
    id: "chilipiga",
    title: "Chilipiga",
    movie: "Orange",
    year: 2010,
    firstLine: "Chilipiga choosthavala",
    secondLine: "Penavesthavila",
    aliases: [],
  },
  {
    id: "ola-olaala-ala",
    title: "Ola Olaala Ala",
    movie: "Orange",
    year: 2010,
    firstLine: "Ola olaala ala",
    secondLine: "Chusthene chaala ila",
    aliases: [],
  },
  {
    id: "ee-hridayam",
    title: "Ee Hridayam",
    movie: "Ye Maaya Chesave",
    year: 2010,
    firstLine: "Ee hridayam kariginchi vellake",
    secondLine: "Naa maro hrudayam adi ninnu vadaladu",
    aliases: [],
  },
  {
    id: "hosanna",
    title: "Hosanna",
    movie: "Ye Maaya Chesave",
    year: 2010,
    firstLine: "Yedhane koyyake",
    secondLine: "Sodharitho cheppake",
    aliases: [],
  },
  {
    id: "kanulanu-thaake",
    title: "Kanulanu Thaake",
    movie: "Manam",
    year: 2014,
    firstLine: "Kanulanu thaake o kala",
    secondLine: "Choopulatho bhashe cheppagala",
    aliases: [],
  },
  {
    id: "life-of-ram",
    title: "The Life of Ram",
    movie: "Jaanu",
    year: 2020,
    firstLine: "Prathi chota naake swagatham",
    secondLine: "Prathi chota naake veedkolu",
    aliases: ["Life of Ram"],
  },
  {
    id: "neeli-neeli-aakasam",
    title: "Neeli Neeli Aakasam",
    movie: "30 Rojullo Preminchadam Ela",
    year: 2021,
    firstLine: "Neeli neeli aakasam",
    secondLine: "Iddam anukunna",
    aliases: [],
  },
  {
    id: "oo-antava",
    title: "Oo Antava Oo Oo Antava",
    movie: "Pushpa: The Rise",
    year: 2021,
    firstLine: "Koka koka koka kadithe",
    secondLine: "Kora kora mantu choosthaaru",
    aliases: ["Oo Antava", "Oo Antava Mawa"],
  },
  {
    id: "srivalli",
    title: "Srivalli",
    movie: "Pushpa: The Rise",
    year: 2021,
    firstLine: "Ninu choosthu unte",
    secondLine: "Kannulu rendu thippesthave",
    aliases: [],
  },
  {
    id: "sundari",
    title: "Sundari",
    movie: "Baahubali 2: The Conclusion",
    year: 2017,
    firstLine: "Hamsa naava",
    secondLine: "Hamsa naava",
    aliases: ["Hamsa Naava"],
  },
  {
    id: "dandaalayyaa",
    title: "Dandaalayyaa",
    movie: "Baahubali 2: The Conclusion",
    year: 2017,
    firstLine: "Dandaalayyaa",
    secondLine: "Dandaalayyaa",
    aliases: [],
  },
  {
    id: "nuvvosthanante",
    title: "Nuvvosthanante Nenoddantana",
    movie: "Varsham",
    year: 2004,
    firstLine: "Nuvvosthanante nenoddantana",
    secondLine: "Nuvvosthanante nenoddantana",
    aliases: ["Nuvvosthanante"],
  },
  {
    id: "manasa-vaacha",
    title: "Manasa Vaacha",
    movie: "Godavari",
    year: 2006,
    firstLine: "Manasa vaacha",
    secondLine: "Manasisthe",
    aliases: [],
  },
  {
    id: "uppongele-godavari",
    title: "Uppongele Godavari",
    movie: "Godavari",
    year: 2006,
    firstLine: "Uppongele Godavari",
    secondLine: "Oogindile cheliya",
    aliases: [],
  },
  {
    id: "gala-gala",
    title: "Gala Gala",
    movie: "Pokiri",
    year: 2006,
    firstLine: "Gala gala paaruthunna",
    secondLine: "Godaarila",
    aliases: [],
  },
  {
    id: "nuvvu-nuvvu",
    title: "Nuvvu Nuvvu",
    movie: "Khadgam",
    year: 2002,
    firstLine: "Nuvvu nuvvu",
    secondLine: "Nuvvu nuvvu",
    aliases: [],
  },
  {
    id: "manohara",
    title: "Manohara",
    movie: "Cheli",
    year: 2001,
    firstLine: "Manohara na hrudayamune",
    secondLine: "O madhubala",
    aliases: [],
  },
  {
    id: "ye-chota-nuvvunna",
    title: "Ye Chota Nuvvunna",
    movie: "Johnny",
    year: 2003,
    firstLine: "Ye chota nuvvunna",
    secondLine: "Oopirila nenuntanu",
    aliases: [],
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
