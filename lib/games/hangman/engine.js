/**
 * Hangman — pure game engine.
 *
 * Every team plays its OWN hidden word each round, one team after another
 * (the category is the clue). The team keeps calling letters until its word is
 * finished or its stick figure is complete:
 *   - a hit puts LETTER_POINTS per occurrence at stake;
 *   - a miss (wrong letter, wrong word guess or time up) draws the next part.
 * After MAX_MISSES misses the figure is complete: the word is lost, with its points.
 *
 * Finishing the word banks the letter points plus SOLVE_BONUS. Typing the whole
 * word early also earns HIDDEN_LETTER_POINTS for every letter still hidden.
 *
 * Purity: anything random comes in on the action (`seed: Math.random()`).
 *
 *   ready ──START_TURN──▶ playing ──(word complete)──▶ wordOver  solved
 *                            ├──────(6th miss)───────▶ wordOver  hanged, 0 points
 *                            └──────(host reveals)───▶ wordOver  revealed, 0 points
 *   wordOver ──NEXT_TURN──▶ ready (next team, new word) … after the last team, a new round.
 */

import { addScore, buildTeams, nextTeamIndex } from "../core/teams";
import { drawWithoutRepeat } from "../core/random";
import { DIFFICULTY_IDS, HANGMAN_CATEGORY_IDS, HANGMAN_WORDS, isPlayableWord, lettersOf, wordsFor } from "./words";

export const LETTER_POINTS = 10;
export const SOLVE_BONUS = 30;
export const HIDDEN_LETTER_POINTS = 20;
/** Head, body, two arms, two legs. */
export const MAX_MISSES = 6;
/** Seconds to call a letter before it counts as a miss. 0 = no timer. */
export const TURN_SECONDS_OPTIONS = [0, 10, 15, 30];
export const DEFAULT_TURN_SECONDS = 15;
export const DIFFICULTY_OPTIONS = ["mixed", ...DIFFICULTY_IDS];

export const PHASES = Object.freeze({
  SETUP: "setup",
  READY: "ready",
  PLAYING: "playing",
  WORD_OVER: "wordOver",
  FINISHED: "finished",
});

export const ACTIONS = Object.freeze({
  START_GAME: "START_GAME",
  START_TURN: "START_TURN",
  GUESS_LETTER: "GUESS_LETTER",
  GUESS_WORD: "GUESS_WORD",
  TURN_TIMEOUT: "TURN_TIMEOUT",
  REVEAL_WORD: "REVEAL_WORD",
  NEXT_TURN: "NEXT_TURN",
  END_GAME: "END_GAME",
  NEW_GAME: "NEW_GAME",
});

/**
 * @typedef {Object} WordResult
 * @property {string} teamId
 * @property {{ id: string, text: string, category: string }} word
 * @property {"solved" | "hanged" | "revealed"} outcome
 * @property {"letters" | "word" | null} method   how it was solved
 * @property {number} letterPoints   letter points banked (0 unless solved)
 * @property {number} bonus          SOLVE_BONUS + hidden-letter bonus (0 unless solved)
 * @property {number} total          what was added to the team's score
 * @property {number} misses
 */

export function defaultSettings() {
  return { categories: [...HANGMAN_CATEGORY_IDS], difficulty: "mixed", turnSeconds: DEFAULT_TURN_SECONDS };
}

export function createInitialState() {
  return {
    phase: PHASES.SETUP,
    teams: [],
    settings: defaultSettings(),
    round: 0,
    /** Team that opens the round; rotates every round. */
    roundStarterIndex: 0,
    /** How many teams have already played in this round (0 … teams.length - 1). */
    turnInRound: 0,
    activeTeamIndex: 0,
    /** The active team's word: `{ id, text, category }` */
    word: null,
    usedWordIds: [],
    /** Lower-case letters called on this word, in order. */
    guessed: [],
    misses: 0,
    /** Letter points at stake on this word; banked only when it's solved. */
    wordPoints: 0,
    /** @type {WordResult | null} result of the word that just ended */
    wordResult: null,
    /** @type {Record<string, WordResult>} results of the teams that have played this round */
    roundResults: {},
    lastEvent: null,
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function makeEvent(state, event) {
  return { seq: (state.lastEvent?.seq ?? 0) + 1, ...event };
}

function difficultyIds(difficulty) {
  return difficulty === "mixed" ? DIFFICULTY_IDS : [difficulty];
}

function sanitizeSettings(raw) {
  const base = defaultSettings();
  const categories = Array.isArray(raw?.categories) ? raw.categories.filter((id) => HANGMAN_CATEGORY_IDS.includes(id)) : [];
  return {
    categories: categories.length ? categories : base.categories,
    difficulty: DIFFICULTY_OPTIONS.includes(raw?.difficulty) ? raw.difficulty : base.difficulty,
    turnSeconds: TURN_SECONDS_OPTIONS.includes(raw?.turnSeconds) ? raw.turnSeconds : base.turnSeconds,
  };
}

/** The words a team can be dealt; falls back to the whole bank if the filters leave nothing. */
function poolFor(settings) {
  const pool = wordsFor(settings.categories, difficultyIds(settings.difficulty));
  return pool.length ? pool : HANGMAN_WORDS;
}

/** Hidden letter occurrences left in the word. */
function hiddenCount(word, guessed) {
  const called = new Set(guessed);
  return [...lettersOf(word.text)].filter((letter) => !called.has(letter)).length;
}

/** Deal a fresh word to `teamIndex` and wait for that team to start. */
function dealWord(state, teamIndex, seed) {
  const pool = poolFor(state.settings);
  const draw = drawWithoutRepeat(pool.map((w) => w.id), state.usedWordIds, seed, state.word?.id ?? null);
  const { id, text, category } = pool.find((w) => w.id === draw.id);
  return {
    ...state,
    phase: PHASES.READY,
    activeTeamIndex: teamIndex,
    word: { id, text, category },
    usedWordIds: draw.usedIds,
    guessed: [],
    misses: 0,
    wordPoints: 0,
    wordResult: null,
    lastEvent: draw.recycled ? makeEvent(state, { type: "words-recycled" }) : null,
  };
}

function startRound(state, { round, starterIndex, seed }) {
  return dealWord({ ...state, round, roundStarterIndex: starterIndex, turnInRound: 0, roundResults: {} }, starterIndex, seed);
}

/** End the active team's word. Always leaves `playing`, so points can't be awarded twice. */
function endWord(state, { outcome, method = null, hiddenBonus = 0, guess = null }) {
  const team = state.teams[state.activeTeamIndex];
  const solved = outcome === "solved";
  const letterPoints = solved ? state.wordPoints : 0;
  const bonus = solved ? SOLVE_BONUS + hiddenBonus : 0;
  const total = letterPoints + bonus;
  /** @type {WordResult} */
  const result = { teamId: team.id, word: state.word, outcome, method, letterPoints, bonus, total, misses: state.misses };
  return {
    ...state,
    teams: total ? addScore(state.teams, team.id, total) : state.teams,
    phase: PHASES.WORD_OVER,
    // Typing the word (or the host revealing it) shows every letter.
    guessed: method === "word" ? [...new Set([...state.guessed, ...lettersOf(state.word.text)])] : state.guessed,
    wordResult: result,
    roundResults: { ...state.roundResults, [team.id]: result },
    lastEvent: makeEvent(state, { type: outcome, teamId: team.id, method, guess, points: total }),
  };
}

/** Draw the next body part; the last one loses the word. `event` says what caused it. */
function miss(state, extra, event) {
  const misses = state.misses + 1;
  const next = { ...state, ...extra, misses };
  if (misses >= MAX_MISSES) return endWord(next, { outcome: "hanged" });
  return { ...next, lastEvent: makeEvent(state, { ...event, teamId: state.teams[state.activeTeamIndex].id, misses }) };
}

/* ------------------------------------------------------------------ */
/* Reducer                                                              */
/* ------------------------------------------------------------------ */

export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_GAME: {
      if (state.phase !== PHASES.SETUP) return state;
      const teams = buildTeams(action.teams ?? []);
      if (teams.length < 1) return state;
      return startRound(
        { ...state, teams, settings: sanitizeSettings(action.settings) },
        { round: 1, starterIndex: 0, seed: action.seed ?? 0 },
      );
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
      if (state.phase !== PHASES.PLAYING) return state;
      const letter = String(action.letter ?? "").trim().toLowerCase();
      if (!/^[a-z]$/.test(letter) || state.guessed.includes(letter)) return state;
      const guessed = [...state.guessed, letter];
      const count = [...lettersOf(state.word.text)].filter((l) => l === letter).length;

      if (count === 0) return miss(state, { guessed }, { type: "letter-miss", letter });

      const points = count * LETTER_POINTS;
      const scored = { ...state, guessed, wordPoints: state.wordPoints + points };
      if (hiddenCount(state.word, guessed) === 0) return endWord(scored, { outcome: "solved", method: "letters" });
      return {
        ...scored,
        lastEvent: makeEvent(state, { type: "letter-hit", teamId: state.teams[state.activeTeamIndex].id, letter, count, points }),
      };
    }

    case ACTIONS.GUESS_WORD: {
      if (state.phase !== PHASES.PLAYING) return state;
      const guess = String(action.guess ?? "").trim();
      if (!lettersOf(guess)) return state;
      if (lettersOf(guess) === lettersOf(state.word.text)) {
        const hiddenBonus = hiddenCount(state.word, state.guessed) * HIDDEN_LETTER_POINTS;
        return endWord(state, { outcome: "solved", method: "word", hiddenBonus, guess });
      }
      return miss(state, {}, { type: "word-miss", guess });
    }

    case ACTIONS.TURN_TIMEOUT: {
      if (state.phase !== PHASES.PLAYING || !state.settings.turnSeconds) return state;
      // `eventSeq` is the event the timer started from; anything newer means the team already acted.
      if (action.eventSeq !== (state.lastEvent?.seq ?? 0)) return state;
      return miss(state, {}, { type: "timeout" });
    }

    case ACTIONS.REVEAL_WORD: {
      if (state.phase !== PHASES.PLAYING && state.phase !== PHASES.READY) return state;
      return endWord(state, { outcome: "revealed" });
    }

    case ACTIONS.NEXT_TURN: {
      if (state.phase !== PHASES.WORD_OVER) return state;
      const seed = action.seed ?? 0;
      const played = state.turnInRound + 1;
      if (played < state.teams.length) {
        return dealWord({ ...state, turnInRound: played }, nextTeamIndex(state.activeTeamIndex, state.teams.length), seed);
      }
      return startRound(state, {
        round: state.round + 1,
        starterIndex: nextTeamIndex(state.roundStarterIndex, state.teams.length),
        seed,
      });
    }

    case ACTIONS.END_GAME: {
      if (![PHASES.READY, PHASES.PLAYING, PHASES.WORD_OVER].includes(state.phase)) return state;
      return { ...state, phase: PHASES.FINISHED, lastEvent: null };
    }

    case ACTIONS.NEW_GAME: {
      // Back to setup, keeping names and settings so the same group can go again.
      return {
        ...createInitialState(),
        teams: state.teams.map((team) => ({ ...team, score: 0 })),
        settings: state.settings,
        usedWordIds: state.usedWordIds,
      };
    }

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* Persistence                                                          */
/* ------------------------------------------------------------------ */

export function migrateState(saved) {
  if (!saved || typeof saved !== "object") return saved;
  return { ...createInitialState(), ...saved, settings: sanitizeSettings(saved.settings) };
}

export function isValidState(state) {
  if (!state || typeof state !== "object") return false;
  if (!Object.values(PHASES).includes(state.phase)) return false;
  if (!Array.isArray(state.teams) || !Array.isArray(state.guessed)) return false;
  if ([PHASES.READY, PHASES.PLAYING, PHASES.WORD_OVER].includes(state.phase)) {
    if (!isPlayableWord(state.word) || state.teams.length < 1) return false;
    if (state.activeTeamIndex >= state.teams.length || typeof state.misses !== "number") return false;
    if (!state.roundResults || typeof state.roundResults !== "object") return false;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Selectors                                                            */
/* ------------------------------------------------------------------ */

export function selectActiveTeam(state) {
  return state.teams[state.activeTeamIndex] ?? null;
}

export function selectTeam(state, teamId) {
  return state.teams.find((team) => team.id === teamId) ?? null;
}

/** The team that plays after the current word, or null when the round is complete. */
export function selectNextTeam(state) {
  if (state.turnInRound + 1 >= state.teams.length) return null;
  return state.teams[nextTeamIndex(state.activeTeamIndex, state.teams.length)] ?? null;
}

/** `{ [letter]: "hit" | "miss" }` for every letter called on this word. */
export function selectLetterStates(state) {
  const inWord = new Set(lettersOf(state.word?.text));
  return Object.fromEntries(state.guessed.map((letter) => [letter, inWord.has(letter) ? "hit" : "miss"]));
}

export function selectMissedLetters(state) {
  const inWord = new Set(lettersOf(state.word?.text));
  return state.guessed.filter((letter) => !inWord.has(letter));
}

/** Hidden letter occurrences left in the word. */
export function selectHiddenCount(state) {
  return state.word ? hiddenCount(state.word, state.guessed) : 0;
}

/** What typing the word right now would earn (letter points at stake + bonuses). */
export function selectSolveValue(state) {
  return state.wordPoints + SOLVE_BONUS + selectHiddenCount(state) * HIDDEN_LETTER_POINTS;
}

/** Results of the teams that have played this round, in play order: `[{ team, result }]`. */
export function selectRoundResults(state) {
  const n = state.teams.length;
  return Array.from({ length: n }, (_, i) => state.teams[(state.roundStarterIndex + i) % n])
    .filter((team) => state.roundResults[team.id])
    .map((team) => ({ team, result: state.roundResults[team.id] }));
}
