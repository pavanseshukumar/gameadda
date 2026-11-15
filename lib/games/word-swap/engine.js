/**
 * Word Swap — pure game engine.
 *
 * Teams set secret words for each other. Each round every team guesses once,
 * in order; the team before it sets its word (A sets for B, B for C … the last
 * sets for A). The guessing team has MAX_GUESSES tries; every guess marks each
 * letter "hit" (right spot), "near" (in the word, wrong spot) or "miss".
 *
 * Words can be anything of MIN_LENGTH–MAX_LENGTH letters (Telugu names welcome),
 * so guesses aren't checked against a dictionary: the room keeps it honest.
 * In solo, or with the "random" word source, words come from the built-in list.
 *
 * Points for solving: POINTS_PER_SPARE_GUESS × (MAX_GUESSES − guesses used + 1).
 *
 * Purity: anything random comes in on the action (`seed: Math.random()`).
 *
 *   setting ──SET_WORD──▶ guessing ──(solved / out of guesses / give up)──▶ turnOver
 *   turnOver ──NEXT_TURN──▶ setting (next pair) … after the last team, a new round.
 *   (Random words skip "setting".)
 */

import { addScore, buildTeams, isSolo, nextTeamIndex } from "../core/teams";
import { drawWithoutRepeat } from "../core/random";
import { RANDOM_WORDS } from "./words";

export const MIN_LENGTH = 4;
export const MAX_LENGTH = 8;
export const MAX_GUESSES = 6;
export const POINTS_PER_SPARE_GUESS = 10;
export const HINT_MAX = 40;
export const WORD_SOURCES = ["teams", "random"];

export const PHASES = Object.freeze({
  SETUP: "setup",
  SETTING: "setting",
  GUESSING: "guessing",
  TURN_OVER: "turnOver",
  FINISHED: "finished",
});

export const ACTIONS = Object.freeze({
  START_GAME: "START_GAME",
  SET_WORD: "SET_WORD",
  USE_RANDOM_WORD: "USE_RANDOM_WORD",
  GUESS: "GUESS",
  GIVE_UP: "GIVE_UP",
  NEXT_TURN: "NEXT_TURN",
  END_GAME: "END_GAME",
  NEW_GAME: "NEW_GAME",
});

export function createInitialState() {
  return {
    phase: PHASES.SETUP,
    teams: [],
    settings: { source: "teams" },
    round: 0,
    roundStarterIndex: 0,
    /** How many teams have guessed in this round (0 … teams.length - 1). */
    turnInRound: 0,
    /** The team guessing now. */
    activeTeamIndex: 0,
    /** Upper-case secret word, or null while it's being set. */
    word: null,
    /** Optional hint from the setter (or the category, for random words). */
    hint: "",
    /** Who set the word: a team id, or null for a random word. */
    setterId: null,
    /** Upper-case guesses, oldest first. */
    guesses: [],
    usedWordIds: [],
    /** `{ outcome: "solved"|"failed"|"gave-up", points }` */
    turnResult: null,
    lastEvent: null,
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function makeEvent(state, event) {
  return { seq: (state.lastEvent?.seq ?? 0) + 1, ...event };
}

/** Letters only, upper-case: "Pushpa!" → "PUSHPA". */
export function cleanWord(text) {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

export function isValidWord(word) {
  return typeof word === "string" && /^[A-Z]+$/.test(word) && word.length >= MIN_LENGTH && word.length <= MAX_LENGTH;
}

/**
 * Mark each letter of a guess: "hit" (right spot), "near" (elsewhere in the word)
 * or "miss". Repeated letters are only marked as often as the word has them.
 */
export function scoreGuess(word, guess) {
  const marks = Array(guess.length).fill("miss");
  const left = {};
  for (let i = 0; i < word.length; i += 1) {
    if (guess[i] === word[i]) marks[i] = "hit";
    else left[word[i]] = (left[word[i]] ?? 0) + 1;
  }
  for (let i = 0; i < guess.length; i += 1) {
    if (marks[i] === "hit") continue;
    if (left[guess[i]] > 0) {
      marks[i] = "near";
      left[guess[i]] -= 1;
    }
  }
  return marks;
}

function usesRandomWords(state) {
  return state.settings.source === "random" || isSolo(state.teams);
}

/** The team that sets the active team's word: the one before it. */
export function setterIndexFor(state, guesserIndex = state.activeTeamIndex) {
  const n = state.teams.length;
  return (guesserIndex - 1 + n) % n;
}

function drawRandom(state, seed) {
  const draw = drawWithoutRepeat(RANDOM_WORDS.map((w) => w.id), state.usedWordIds, seed);
  const pick = RANDOM_WORDS.find((w) => w.id === draw.id);
  return { word: pick.word, hint: pick.hint, usedWordIds: draw.usedIds };
}

/** Begin the turn for `guesserIndex`: wait for the setter, or deal a random word. */
function beginTurn(state, guesserIndex, seed) {
  const base = {
    ...state,
    activeTeamIndex: guesserIndex,
    word: null,
    hint: "",
    setterId: null,
    guesses: [],
    turnResult: null,
  };
  if (!usesRandomWords(state)) {
    return { ...base, phase: PHASES.SETTING, lastEvent: makeEvent(state, { type: "set-word" }) };
  }
  const { word, hint, usedWordIds } = drawRandom(state, seed);
  return { ...base, phase: PHASES.GUESSING, word, hint, usedWordIds, lastEvent: makeEvent(state, { type: "turn-start" }) };
}

function startRound(state, { round, starterIndex, seed }) {
  return beginTurn({ ...state, round, roundStarterIndex: starterIndex, turnInRound: 0 }, starterIndex, seed);
}

function endTurn(state, outcome) {
  const team = state.teams[state.activeTeamIndex];
  const points = outcome === "solved" ? (MAX_GUESSES - state.guesses.length + 1) * POINTS_PER_SPARE_GUESS : 0;
  return {
    ...state,
    teams: points ? addScore(state.teams, team.id, points) : state.teams,
    phase: PHASES.TURN_OVER,
    turnResult: { outcome, points },
    lastEvent: makeEvent(state, { type: outcome, teamId: team.id, points }),
  };
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
      const source = WORD_SOURCES.includes(action.settings?.source) ? action.settings.source : "teams";
      return startRound({ ...state, teams, settings: { source } }, { round: 1, starterIndex: 0, seed: action.seed ?? 0 });
    }

    case ACTIONS.SET_WORD: {
      if (state.phase !== PHASES.SETTING) return state;
      const word = cleanWord(action.word);
      if (!isValidWord(word)) return state;
      const hint = String(action.hint ?? "").trim().slice(0, HINT_MAX);
      return {
        ...state,
        phase: PHASES.GUESSING,
        word,
        hint,
        setterId: state.teams[setterIndexFor(state)].id,
        lastEvent: makeEvent(state, { type: "turn-start" }),
      };
    }

    case ACTIONS.USE_RANDOM_WORD: {
      // The setter can't think of one: deal from the built-in list instead.
      if (state.phase !== PHASES.SETTING) return state;
      const { word, hint, usedWordIds } = drawRandom(state, action.seed ?? 0);
      return { ...state, phase: PHASES.GUESSING, word, hint, usedWordIds, setterId: null, lastEvent: makeEvent(state, { type: "turn-start" }) };
    }

    case ACTIONS.GUESS: {
      if (state.phase !== PHASES.GUESSING) return state;
      const guess = cleanWord(action.guess);
      if (guess.length !== state.word.length) return state;
      if (state.guesses.includes(guess)) {
        return { ...state, lastEvent: makeEvent(state, { type: "repeat", guess }) };
      }
      const next = { ...state, guesses: [...state.guesses, guess] };
      if (guess === state.word) return endTurn(next, "solved");
      if (next.guesses.length >= MAX_GUESSES) return endTurn(next, "failed");
      return { ...next, lastEvent: makeEvent(state, { type: "guessed", guess }) };
    }

    case ACTIONS.GIVE_UP: {
      if (state.phase !== PHASES.GUESSING) return state;
      return endTurn(state, "gave-up");
    }

    case ACTIONS.NEXT_TURN: {
      if (state.phase !== PHASES.TURN_OVER) return state;
      const seed = action.seed ?? 0;
      const played = state.turnInRound + 1;
      if (played < state.teams.length) {
        return beginTurn({ ...state, turnInRound: played }, nextTeamIndex(state.activeTeamIndex, state.teams.length), seed);
      }
      return startRound(state, {
        round: state.round + 1,
        starterIndex: nextTeamIndex(state.roundStarterIndex, state.teams.length),
        seed,
      });
    }

    case ACTIONS.END_GAME: {
      if (![PHASES.SETTING, PHASES.GUESSING, PHASES.TURN_OVER].includes(state.phase)) return state;
      return { ...state, phase: PHASES.FINISHED, lastEvent: null };
    }

    case ACTIONS.NEW_GAME: {
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
  return { ...createInitialState(), ...saved };
}

export function isValidState(state) {
  if (!state || typeof state !== "object") return false;
  if (!Object.values(PHASES).includes(state.phase)) return false;
  if (!Array.isArray(state.teams) || !Array.isArray(state.guesses)) return false;
  if ([PHASES.SETTING, PHASES.GUESSING, PHASES.TURN_OVER].includes(state.phase)) {
    if (state.teams.length < 1 || state.activeTeamIndex >= state.teams.length) return false;
    if (state.phase !== PHASES.SETTING && !isValidWord(state.word)) return false;
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

export function selectSetter(state) {
  return state.teams[setterIndexFor(state)] ?? null;
}

/** Best mark seen for each letter so far: `{ A: "hit" | "near" | "miss" }`. */
export function selectLetterStates(state) {
  const rank = { miss: 1, near: 2, hit: 3 };
  const result = {};
  for (const guess of state.guesses) {
    scoreGuess(state.word, guess).forEach((mark, i) => {
      const letter = guess[i].toLowerCase();
      if (!result[letter] || rank[mark] > rank[result[letter]]) result[letter] = mark;
    });
  }
  return result;
}

/** What solving on the next guess would earn. */
export function selectNextGuessValue(state) {
  return (MAX_GUESSES - state.guesses.length) * POINTS_PER_SPARE_GUESS;
}

/** The pairing for the turn after this one: `{ setter, guesser }`, or null when the round ends. */
export function selectNextPairing(state) {
  if (state.turnInRound + 1 >= state.teams.length) return null;
  const guesserIndex = nextTeamIndex(state.activeTeamIndex, state.teams.length);
  return { guesser: state.teams[guesserIndex], setter: state.teams[setterIndexFor(state, guesserIndex)] };
}
