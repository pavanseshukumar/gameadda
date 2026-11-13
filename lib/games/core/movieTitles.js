/**
 * Title helpers for the movie games (Poster Puzzle, Hot & Cold): cleaning titles
 * from outside sources and judging a typed guess.
 *
 * Telugu titles have no single English spelling ("Baahubali" / "Bahubali",
 * "Geethanjali" / "Geetanjali", "Siva" / "Shiva"), so a guess is compared on a
 * loose phonetic key and allowed a typo or two on longer titles.
 *
 * @typedef {Object} PosterMovie
 * @property {string} id
 * @property {string} title
 * @property {number} [year]
 * @property {string} [lead]
 * @property {string[]} [aliases]   other accepted spellings
 * @property {string} article       English Wikipedia article title (poster lookup)
 * @property {string} [poster]      poster image URL, once looked up
 */

/** "Jalsa (2008 film)" → "Jalsa"; "" when the title isn't plain Latin text. */
export function cleanTitle(raw) {
  const title = String(raw ?? "")
    .replace(/_/g, " ")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!/^[A-Za-z0-9\s:'’.,!?&-]+$/.test(title)) return "";
  return (title.match(/[a-z]/gi)?.length ?? 0) >= 2 ? title : "";
}

/** Lower-case letters and digits only: "Ala Vaikunthapurramuloo!" → "alavaikunthapurramuloo". */
export function titleKey(text) {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

/** Spelling-insensitive key: long vowels shortened, aspirate h dropped, doubles squeezed. */
function phoneticKey(text) {
  return titleKey(text)
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/(?<=.)h/g, "")
    .replace(/w/g, "v")
    .replace(/(.)\1+/g, "$1");
}

function editDistance(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length];
}

/** Typos forgiven: none for short titles, one from 5 letters, two from 10. */
function allowedTypos(length) {
  if (length >= 10) return 2;
  if (length >= 5) return 1;
  return 0;
}

/** Every spelling we accept for a movie, including the part before a subtitle ("Baahubali: The Beginning"). */
export function acceptedTitles(movie) {
  const titles = [movie.title, ...(movie.aliases ?? [])];
  const heads = titles.map((t) => t.split(":")[0]).filter((head) => titleKey(head).length >= 4);
  return [...new Set([...titles, ...heads])];
}

/** True when a typed guess names the movie. */
export function isGuessCorrect(movie, guess) {
  const typed = phoneticKey(guess);
  if (!movie || typed.length < 2) return false;
  return acceptedTitles(movie).some((title) => {
    const answer = phoneticKey(title);
    if (!answer) return false;
    if (typed === answer) return true;
    return editDistance(typed, answer) <= allowedTypos(Math.min(typed.length, answer.length));
  });
}
