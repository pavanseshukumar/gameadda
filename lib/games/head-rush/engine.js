/**
 * Head Rush — pure game engine.
 *
 * Teams take turns. On a turn one player holds the phone to their forehead (screen
 * facing the room); their team gives clues and the guesser swipes: right when they
 * get the word, left to pass. A turn deals `wordsPerTurn` cards and lasts
 * `turnSeconds`; it ends when either runs out.
 *
 * After a turn the team can fix mis-swipes; points (+1 per word got) are banked when
 * the next turn begins. A round is one turn per team; the game lasts `rounds` rounds.
 *
 *   ready ──START_TURN──▶ playing ──(deck done / TIME_UP)──▶ turnOver
 *     ▲                     │  ▲                                │
 *     │                PAUSE│  │RESUME                          │
 *     │                     ▼  │                                │
 *     │                    paused                               │
 *     └───────────────────NEXT_TURN◀────────────────────────────┘ (… FINISHED after the last round)
 *
 * Purity: randomness and time come in on the action (`seed: Math.random()`, `now: Date.now()`).
 */

import { addScore, buildTeams, nextTeamIndex } from "../core/teams";
import { drawWithoutRepeat } from "../core/random";
import { createRandom } from "../core/shuffle";
import { DEFAULT_CATEGORY_IDS, HEAD_RUSH_CATEGORIES, getWord, wordIdsIn } from "./words";

export const MIN_TEAMS = 2;
export const TURN_SECONDS_OPTIONS = [30, 60, 90];
export const WORDS_PER_TURN_OPTIONS = [5, 10, 15, 20];
export const ROUND_OPTIONS = [1, 2, 3, 5];
export const DEFAULTS = Object.freeze({ turnSeconds: 60, wordsPerTurn: 10, rounds: 3, categories: DEFAULT_CATEGORY_IDS });
/** A swipe that lands this soon after time runs out still counts. */
const TIME_GRACE_MS = 400;

export const PHASES = Object.freeze({
  SETUP: "setup",
  READY: "ready",
  PLAYING: "playing",
  TURN_OVER: "turnOver",
  FINISHED: "finished",
});

export const CLOCK = Object.freeze({ RUNNING: "running", PAUSED: "paused" });

export const ACTIONS = Object.freeze({
  START_GAME: "START_GAME",
  START_TURN: "START_TURN",
  MARK: "MARK",
  PAUSE: "PAUSE",
  RESUME: "RESUME",
  TIME_UP: "TIME_UP",
  TOGGLE_RESULT: "TOGGLE_RESULT",
  NEXT_TURN: "NEXT_TURN",
  END_GAME: "END_GAME",
  NEW_GAME: "NEW_GAME",
});

export function createInitialState() {
  return {
    phase: PHASES.SETUP,
    teams: [],
    settings: { ...DEFAULTS },
    round: 0,
    roundStarterIndex: 0,
    /** Teams that have played this round (0 … teams.length - 1). */
    turnInRound: 0,
    activeTeamIndex: 0,
    /** Word ids dealt for this turn, in play order. */
    deck: [],
    /** Index of the card on screen. */
    cardIndex: 0,
    /** One entry per card played this turn: `{ id, result: "correct" | "pass" }`. */
    results: [],
    usedWordIds: [],
    clock: { status: CLOCK.PAUSED, endsAt: null, remainingMs: DEFAULTS.turnSeconds * 1000 },
    /** How the last turn ended: "time" | "deck" | null. */
    turnEnd: null,
    lastEvent: null,
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function makeEvent(state, event) {
  return { seq: (state.lastEvent?.seq ?? 0) + 1, ...event };
}

function turnMs(state) {
  return state.settings.turnSeconds * 1000;
}

function sanitizeSettings(raw = {}) {
  const pick = (value, options, fallback) => (options.includes(value) ? value : fallback);
  const known = HEAD_RUSH_CATEGORIES.map((c) => c.id);
  const categories = Array.isArray(raw.categories) ? raw.categories.filter((id) => known.includes(id)) : [];
  return {
    turnSeconds: pick(raw.turnSeconds, TURN_SECONDS_OPTIONS, DEFAULTS.turnSeconds),
    wordsPerTurn: pick(raw.wordsPerTurn, WORDS_PER_TURN_OPTIONS, DEFAULTS.wordsPerTurn),
    rounds: pick(raw.rounds, ROUND_OPTIONS, DEFAULTS.rounds),
    categories: categories.length ? categories : [...DEFAULTS.categories],
  };
}

/** Deal `count` cards from the chosen categories, without repeats until the pool runs dry. */
function dealDeck(state, seed) {
  const pool = wordIdsIn(state.settings.categories);
  const random = createRandom(seed);
  const deck = [];
  let used = state.usedWordIds;
  const count = Math.min(state.settings.wordsPerTurn, pool.length);
  while (deck.length < count) {
    const draw = drawWithoutRepeat(pool, used, random(), deck[deck.length - 1] ?? null);
    if (!draw.id) break;
    // After a reshuffle, don't deal a card that's already in this deck.
    if (deck.includes(draw.id)) {
      used = draw.usedIds;
      continue;
    }
    deck.push(draw.id);
    used = draw.usedIds;
  }
  return { deck, usedWordIds: used };
}

function readyTurn(state, teamIndex, seed) {
  const { deck, usedWordIds } = dealDeck(state, seed);
  return {
    ...state,
    phase: PHASES.READY,
    activeTeamIndex: teamIndex,
    deck,
    cardIndex: 0,
    results: [],
    usedWordIds,
    clock: { status: CLOCK.PAUSED, endsAt: null, remainingMs: turnMs(state) },
    turnEnd: null,
  };
}

function endTurn(state, how) {
  return {
    ...state,
    phase: PHASES.TURN_OVER,
    clock: { status: CLOCK.PAUSED, endsAt: null, remainingMs: 0 },
    turnEnd: how,
    lastEvent: makeEvent(state, { type: how === "time" ? "time-up" : "deck-done" }),
  };
}

function isRunning(state) {
  return state.phase === PHASES.PLAYING && state.clock.status === CLOCK.RUNNING;
}

export function remainingMs(state, now) {
  return state.clock.status === CLOCK.RUNNING ? Math.max(0, state.clock.endsAt - now) : state.clock.remainingMs;
}

/* ------------------------------------------------------------------ */
/* Reducer                                                              */
/* ------------------------------------------------------------------ */

export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_GAME: {
      if (state.phase !== PHASES.SETUP) return state;
      const teams = buildTeams(action.teams ?? []);
      if (teams.length < MIN_TEAMS) return state;
      const settings = sanitizeSettings(action.settings);
      const base = { ...state, teams, settings, round: 1, roundStarterIndex: 0, turnInRound: 0, lastEvent: makeEvent(state, { type: "game-start" }) };
      return readyTurn(base, 0, action.seed ?? 0);
    }

    case ACTIONS.START_TURN: {
      if (state.phase !== PHASES.READY || !state.deck.length) return state;
      return {
        ...state,
        phase: PHASES.PLAYING,
        clock: { status: CLOCK.RUNNING, endsAt: action.now + turnMs(state), remainingMs: turnMs(state) },
        lastEvent: makeEvent(state, { type: "turn-start" }),
      };
    }

    case ACTIONS.MARK: {
      if (!isRunning(state) || !["correct", "pass"].includes(action.result)) return state;
      if (action.now > state.clock.endsAt + TIME_GRACE_MS) return state;
      const id = state.deck[state.cardIndex];
      const next = {
        ...state,
        results: [...state.results, { id, result: action.result }],
        cardIndex: state.cardIndex + 1,
        lastEvent: makeEvent(state, { type: action.result, id }),
      };
      return next.cardIndex >= state.deck.length ? endTurn(next, "deck") : next;
    }

    case ACTIONS.PAUSE: {
      if (!isRunning(state)) return state;
      return { ...state, clock: { status: CLOCK.PAUSED, endsAt: null, remainingMs: Math.max(0, state.clock.endsAt - action.now) } };
    }

    case ACTIONS.RESUME: {
      if (state.phase !== PHASES.PLAYING || state.clock.status !== CLOCK.PAUSED) return state;
      return { ...state, clock: { status: CLOCK.RUNNING, endsAt: action.now + state.clock.remainingMs, remainingMs: state.clock.remainingMs } };
    }

    case ACTIONS.TIME_UP: {
      if (!isRunning(state) || action.now < state.clock.endsAt - TIME_GRACE_MS) return state;
      return endTurn(state, "time");
    }

    case ACTIONS.TOGGLE_RESULT: {
      // Fix a mis-swipe on the summary before the points are banked.
      if (state.phase !== PHASES.TURN_OVER || !state.results[action.index]) return state;
      return {
        ...state,
        results: state.results.map((r, i) => (i === action.index ? { ...r, result: r.result === "correct" ? "pass" : "correct" } : r)),
      };
    }

    case ACTIONS.NEXT_TURN: {
      if (state.phase !== PHASES.TURN_OVER) return state;
      const team = state.teams[state.activeTeamIndex];
      const banked = { ...state, teams: addScore(state.teams, team.id, selectTurnScore(state)) };
      const played = state.turnInRound + 1;
      if (played < state.teams.length) {
        return readyTurn({ ...banked, turnInRound: played }, nextTeamIndex(state.activeTeamIndex, state.teams.length), action.seed ?? 0);
      }
      if (state.round >= state.settings.rounds) {
        return { ...banked, phase: PHASES.FINISHED, lastEvent: makeEvent(state, { type: "game-over" }) };
      }
      const starter = nextTeamIndex(state.roundStarterIndex, state.teams.length);
      return readyTurn({ ...banked, round: state.round + 1, roundStarterIndex: starter, turnInRound: 0 }, starter, action.seed ?? 0);
    }

    case ACTIONS.END_GAME: {
      if (![PHASES.READY, PHASES.PLAYING, PHASES.TURN_OVER].includes(state.phase)) return state;
      // A finished turn's points still count; a turn in progress doesn't.
      const teams =
        state.phase === PHASES.TURN_OVER
          ? addScore(state.teams, state.teams[state.activeTeamIndex].id, selectTurnScore(state))
          : state.teams;
      return { ...state, teams, phase: PHASES.FINISHED, clock: { status: CLOCK.PAUSED, endsAt: null, remainingMs: 0 }, lastEvent: null };
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

/** On load: a turn that was running when the page closed comes back paused. */
export function migrateState(saved, { now } = {}) {
  if (!saved || typeof saved !== "object") return saved;
  const state = { ...createInitialState(), ...saved };
  if (state.clock?.status === CLOCK.RUNNING) {
    state.clock = { status: CLOCK.PAUSED, endsAt: null, remainingMs: Math.max(0, (state.clock.endsAt ?? 0) - (now ?? 0)) };
  }
  return state;
}

export function isValidState(state) {
  if (!state || typeof state !== "object") return false;
  if (!Object.values(PHASES).includes(state.phase)) return false;
  if (!Array.isArray(state.teams) || !Array.isArray(state.deck) || !Array.isArray(state.results)) return false;
  if ([PHASES.READY, PHASES.PLAYING, PHASES.TURN_OVER].includes(state.phase)) {
    if (state.teams.length < MIN_TEAMS || state.activeTeamIndex >= state.teams.length) return false;
    if (!state.deck.every((id) => getWord(id))) return false;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Selectors                                                            */
/* ------------------------------------------------------------------ */

export function selectActiveTeam(state) {
  return state.teams[state.activeTeamIndex] ?? null;
}

export function selectCurrentWord(state) {
  return getWord(state.deck[state.cardIndex]);
}

export function selectTurnScore(state) {
  return state.results.filter((r) => r.result === "correct").length;
}

/** The team after this one, or null when this turn ends the round. */
export function selectNextTeam(state) {
  if (state.turnInRound + 1 >= state.teams.length) return null;
  return state.teams[nextTeamIndex(state.activeTeamIndex, state.teams.length)];
}

export function selectIsLastTurn(state) {
  return state.turnInRound + 1 >= state.teams.length && state.round >= state.settings.rounds;
}
