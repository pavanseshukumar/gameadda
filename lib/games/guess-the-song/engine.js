/**
 * Guess the Telugu Song — pure game engine.
 *
 * The reducer has no side effects: anything random is passed in on the action
 * (e.g. `{ type: "START_GAME", random: Math.random() }`), so the same engine can
 * be unit-tested, replayed or driven by a different UI later.
 *
 * Every team plays its OWN song each round, one team after another, with
 * STARTING_LIVES lives per song. A missed letter, a wrong song guess or a
 * timeout costs a life. Losing the last life gives one last chance: no more
 * letters, just one guess at the song (a wrong guess or a timeout ends it).
 *
 *   ready ──(start)──▶ playing ──(named the song)──────▶ songOver  solved, letters × (1 + multiplier)
 *                         ├─────(revealed every letter)──▶ songOver  solved, letter points only
 *                         ├─────(out of lives, last guess wrong)─▶ songOver  failed, 0 points
 *                         └─────(host reveals)───────────▶ songOver  revealed, 0 points
 *   songOver ──(next)──▶ ready (next team, new song) … after the last team, the next round starts.
 *
 * Letter points are "at stake" while a team plays and only reach its score when it solves.
 */

import { addScore, buildTeams, nextTeamIndex } from "../core/teams";
import { drawWithoutRepeat } from "../core/random";
import { SONG_IDS, getPuzzleLines, getSongById } from "./songs";
import { countLetter, isFullyRevealed, isTitleMatch, normalizeLetter } from "./lyrics";

export const POINTS_PER_LETTER = 10;
/** Vowels show up far more often in transliterated titles, so each occurrence is worth less. */
export const POINTS_PER_VOWEL = 5;
const VOWELS = new Set(["a", "e", "i", "o", "u"]);

export function isVowel(letter) {
  return VOWELS.has(String(letter ?? "").toLowerCase());
}

/** Points earned for each occurrence of `letter` in the hidden title. */
export function pointsPerOccurrence(letter) {
  return isVowel(letter) ? POINTS_PER_VOWEL : POINTS_PER_LETTER;
}
/** Seconds a team has to call a letter (or open a song guess) before it loses a life. */
export const TURN_SECONDS = 15;
/** Lives each team gets for each song. */
export const STARTING_LIVES = 3;
/** Naming the song adds this many times the team's letter points as a bonus. */
export const SONG_COMPLETION_MULTIPLIER = 5;

export const PHASES = Object.freeze({
  SETUP: "setup",
  READY: "ready",
  PLAYING: "playing",
  SONG_OVER: "songOver",
  FINISHED: "finished",
});

export const ACTIONS = Object.freeze({
  START_GAME: "START_GAME",
  START_TURN: "START_TURN",
  GUESS_LETTER: "GUESS_LETTER",
  GUESS_SONG: "GUESS_SONG",
  REVEAL_SONG: "REVEAL_SONG",
  TURN_TIMEOUT: "TURN_TIMEOUT",
  NEXT_TURN: "NEXT_TURN",
  END_GAME: "END_GAME",
  NEW_GAME: "NEW_GAME",
});

/**
 * @typedef {Object} SongResult
 * @property {string} teamId
 * @property {string} songId
 * @property {"solved" | "failed" | "revealed"} outcome
 * @property {"title" | "letters" | null} method   how it was solved
 * @property {string | null} guess
 * @property {number} letterPoints   letter points earned (0 unless solved)
 * @property {number} multiplier     0 unless the song was named
 * @property {number} bonus
 * @property {number} total          what was added to the team's score
 */

export function createInitialState() {
  return {
    phase: PHASES.SETUP,
    teams: [],
    round: 0,
    /** Team that opens the round; rotates every round. */
    roundStarterIndex: 0,
    /** How many teams have already played in this round (0 … teams.length - 1). */
    turnInRound: 0,
    activeTeamIndex: 0,
    songId: null,
    usedSongIds: [],
    guessedLetters: [],
    lives: STARTING_LIVES,
    /** Out of lives: letters are locked and one song guess decides the song. */
    lastChance: false,
    /** Letter points the active team has at stake on its current song. */
    songPoints: 0,
    /** @type {SongResult | null} result of the song that just ended */
    songResult: null,
    /** @type {Record<string, SongResult>} results of the teams that have played this round */
    roundResults: {},
    lastEvent: null,
  };
}

/** Saves come from the same build (the store version rejects older shapes); fill any gaps. */
export function migrateState(saved) {
  if (!saved || typeof saved !== "object") return saved;
  return { ...createInitialState(), ...saved };
}

/** Used by the persistent store to reject corrupt or outdated saves. */
export function isValidState(state) {
  if (!state || typeof state !== "object") return false;
  if (!Object.values(PHASES).includes(state.phase)) return false;
  if (!Array.isArray(state.teams) || !Array.isArray(state.guessedLetters)) return false;
  if ([PHASES.READY, PHASES.PLAYING, PHASES.SONG_OVER].includes(state.phase)) {
    if (state.teams.length < 2 || !getSongById(state.songId)) return false;
    if (state.activeTeamIndex >= state.teams.length) return false;
    if (typeof state.lives !== "number" || !state.roundResults || typeof state.roundResults !== "object") return false;
  }
  return true;
}

function makeEvent(state, event) {
  return { seq: (state.lastEvent?.seq ?? 0) + 1, ...event };
}

/** Deal a new song to `teamIndex` and wait for that team to start. */
function dealSong(state, teamIndex, random) {
  const draw = drawWithoutRepeat(SONG_IDS, state.usedSongIds, random, state.songId);
  return {
    ...state,
    phase: PHASES.READY,
    activeTeamIndex: teamIndex,
    songId: draw.id,
    usedSongIds: draw.usedIds,
    guessedLetters: [],
    lives: STARTING_LIVES,
    lastChance: false,
    songPoints: 0,
    songResult: null,
    lastEvent: draw.recycled ? makeEvent(state, { type: "songs-recycled" }) : null,
  };
}

function startRound(state, { round, starterIndex, random }) {
  return dealSong({ ...state, round, roundStarterIndex: starterIndex, turnInRound: 0, roundResults: {} }, starterIndex, random);
}

/** Bonus the active team would receive for naming the song right now. */
export function completionBonusFor(state) {
  return state.songPoints * SONG_COMPLETION_MULTIPLIER;
}

/** End the active team's song. Always leaves `playing`, so points can't be awarded twice. */
function endSong(state, { outcome, method = null, guess = null }, event) {
  const team = state.teams[state.activeTeamIndex];
  const solved = outcome === "solved";
  const letterPoints = solved ? state.songPoints : 0;
  // Only naming the song earns the multiplier; revealing every letter keeps just the letter points.
  const multiplier = solved && method === "title" ? SONG_COMPLETION_MULTIPLIER : 0;
  const bonus = letterPoints * multiplier;
  const total = letterPoints + bonus;
  /** @type {SongResult} */
  const result = { teamId: team.id, songId: state.songId, outcome, method, guess, letterPoints, multiplier, bonus, total };
  return {
    ...state,
    teams: total ? addScore(state.teams, team.id, total) : state.teams,
    phase: PHASES.SONG_OVER,
    songResult: result,
    roundResults: { ...state.roundResults, [team.id]: result },
    lastEvent: makeEvent(state, { teamId: team.id, ...event }),
  };
}

/**
 * Take a life. Losing the last one opens the last chance; failing during the
 * last chance ends the song with 0. `event` describes what cost the life.
 */
function loseLife(state, extra, event) {
  const teamId = state.teams[state.activeTeamIndex].id;
  if (state.lastChance) return endSong({ ...state, ...extra }, { outcome: "failed" }, { type: "out-of-lives", cause: event.type });
  const lives = Math.max(0, state.lives - 1);
  const lastChance = lives === 0;
  return {
    ...state,
    ...extra,
    lives,
    lastChance,
    lastEvent: makeEvent(state, { teamId, lives, lastChance, ...event }),
  };
}

export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_GAME: {
      const teams = buildTeams(action.teams ?? []);
      if (teams.length < 2) return state;
      return startRound({ ...state, teams }, { round: 1, starterIndex: 0, random: action.random ?? 0 });
    }

    case ACTIONS.START_TURN: {
      if (state.phase !== PHASES.READY) return state;
      return {
        ...state,
        phase: PHASES.PLAYING,
        lastEvent: makeEvent(state, { type: "turn-start", teamId: state.teams[state.activeTeamIndex].id }),
      };
    }

    case ACTIONS.GUESS_LETTER: {
      if (state.phase !== PHASES.PLAYING || state.lastChance) return state;
      const letter = normalizeLetter(action.letter);
      if (!letter || state.guessedLetters.includes(letter)) return state;

      const lines = getPuzzleLines(getSongById(state.songId));
      const count = countLetter(lines, letter);
      const guessedLetters = [...state.guessedLetters, letter];

      if (count === 0) return loseLife(state, { guessedLetters }, { type: "letter-miss", letter });

      const points = count * pointsPerOccurrence(letter);
      const scored = {
        ...state,
        guessedLetters,
        songPoints: state.songPoints + points,
        lastEvent: makeEvent(state, { type: "letter-hit", teamId: state.teams[state.activeTeamIndex].id, letter, count, points }),
      };
      return isFullyRevealed(lines, guessedLetters)
        ? endSong(scored, { outcome: "solved", method: "letters" }, { type: "song-hit", method: "letters" })
        : scored;
    }

    case ACTIONS.GUESS_SONG: {
      if (state.phase !== PHASES.PLAYING) return state;
      const guess = String(action.title ?? "").trim();
      if (!guess) return state;
      if (isTitleMatch(getSongById(state.songId), guess)) {
        return endSong(state, { outcome: "solved", method: "title", guess }, { type: "song-hit", method: "title", guess });
      }
      return loseLife(state, {}, { type: "song-miss", guess });
    }

    case ACTIONS.TURN_TIMEOUT: {
      if (state.phase !== PHASES.PLAYING) return state;
      // `eventSeq` is the event the timer started from; anything newer means the team
      // already acted, so a late timeout must not cost a life.
      if (action.eventSeq !== (state.lastEvent?.seq ?? 0)) return state;
      return loseLife(state, {}, { type: "turn-timeout" });
    }

    case ACTIONS.REVEAL_SONG: {
      if (state.phase !== PHASES.PLAYING && state.phase !== PHASES.READY) return state;
      return endSong(state, { outcome: "revealed" }, { type: "song-revealed" });
    }

    case ACTIONS.NEXT_TURN: {
      if (state.phase !== PHASES.SONG_OVER) return state;
      const random = action.random ?? 0;
      const played = state.turnInRound + 1;
      if (played < state.teams.length) {
        return dealSong({ ...state, turnInRound: played }, nextTeamIndex(state.activeTeamIndex, state.teams.length), random);
      }
      return startRound(state, {
        round: state.round + 1,
        starterIndex: nextTeamIndex(state.roundStarterIndex, state.teams.length),
        random,
      });
    }

    case ACTIONS.END_GAME: {
      if (![PHASES.READY, PHASES.PLAYING, PHASES.SONG_OVER].includes(state.phase)) return state;
      return { ...state, phase: PHASES.FINISHED, lastEvent: null };
    }

    case ACTIONS.NEW_GAME: {
      // Back to setup, keeping team names so the same group can play again quickly.
      return {
        ...createInitialState(),
        teams: state.teams.map((team) => ({ ...team, score: 0 })),
        usedSongIds: state.usedSongIds,
      };
    }

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* Selectors                                                            */
/* ------------------------------------------------------------------ */

export function selectSong(state) {
  return getSongById(state.songId);
}

export function selectActiveTeam(state) {
  return state.teams[state.activeTeamIndex] ?? null;
}

export function selectTeam(state, teamId) {
  return state.teams.find((team) => team.id === teamId) ?? null;
}

/** The team that plays after the current song, or null when the round is complete. */
export function selectNextTeam(state) {
  if (state.turnInRound + 1 >= state.teams.length) return null;
  return state.teams[nextTeamIndex(state.activeTeamIndex, state.teams.length)] ?? null;
}

/** `{ [letter]: "hit" | "miss" }` for every letter guessed on the current song. */
export function selectLetterStates(state) {
  const lines = getPuzzleLines(selectSong(state));
  const result = {};
  for (const letter of state.guessedLetters) {
    result[letter] = countLetter(lines, letter) > 0 ? "hit" : "miss";
  }
  return result;
}

/**
 * Scoring for the teams that have played this round, in play order:
 * `[{ team, result, alphabet, bonus, total, isWinner }]`. `isWinner` marks a named song (bonus earned).
 */
export function selectRoundBreakdown(state) {
  const n = state.teams.length;
  const rows = [];
  for (let i = 0; i < n; i += 1) {
    const team = state.teams[(state.roundStarterIndex + i) % n];
    const result = state.roundResults[team.id];
    if (!result) continue;
    rows.push({
      team,
      result,
      alphabet: result.letterPoints,
      bonus: result.bonus,
      total: result.total,
      isWinner: result.bonus > 0 || result.method === "title",
      note: result.outcome === "failed" ? "Out of lives" : result.outcome === "revealed" ? "Skipped" : null,
    });
  }
  return rows;
}
