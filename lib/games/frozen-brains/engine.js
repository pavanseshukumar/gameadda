/**
 * Frozen Brains — pure game engine.
 *
 * Each round shows one sound-alike clue ("FRY DRY ICE"). The active team says it
 * aloud until it hears the answer ("Fried Rice") and types it in. Wrong guesses
 * don't end the try; the clock does. The clock starts as soon as the card is up.
 *
 * Scoring for the team that gets it:
 *   max(MIN_BASE, BASE_POINTS − hint × HINT_COST)  +  seconds left
 * A steal (the one pass per round, after a pass or time up) earns STEAL_FACTOR of that.
 *
 * Purity: anything random or time-based comes in on the action
 * (`seed: Math.random()`, `now: Date.now()`), never from inside the reducer.
 *
 *   playing ──GUESS (right)──▶ roundOver  solved
 *      │ ├──PASS / TIME_UP──▶ next team STEALS (half time, clock running) ──miss──▶ roundOver
 *      │ └──REVEAL──────────▶ roundOver  revealed
 *   PAUSE / RESUME hold the clock (e.g. while the tab is hidden).
 */

import { addScore, buildTeams, isSolo, nextTeamIndex } from "../core/teams";
import { drawWithoutRepeat } from "../core/random";
import { titleKey } from "../core/movieTitles";
import { CATEGORY_IDS, DIFFICULTY_IDS, PUZZLES, puzzlesFor } from "./puzzles";

export const BASE_POINTS = 50;
export const HINT_COST = 20;
export const MIN_BASE = 10;
export const STEAL_FACTOR = 0.5;
export const TURN_SECONDS_OPTIONS = [20, 30, 45, 60];
export const DEFAULT_TURN_SECONDS = 30;
export const DIFFICULTY_OPTIONS = ["mixed", ...DIFFICULTY_IDS];
/** A guess at 0.1s left shouldn't lose to a slightly early clock. */
const TIME_GRACE_MS = 300;

export const PHASES = Object.freeze({ SETUP: "setup", PLAYING: "playing", ROUND_OVER: "roundOver", FINISHED: "finished" });
export const CLOCK = Object.freeze({ RUNNING: "running", PAUSED: "paused" });

export const ACTIONS = Object.freeze({
  START_GAME: "START_GAME",
  GUESS: "GUESS",
  USE_HINT: "USE_HINT",
  PASS: "PASS",
  TIME_UP: "TIME_UP",
  PAUSE: "PAUSE",
  RESUME: "RESUME",
  REVEAL: "REVEAL",
  NEXT_ROUND: "NEXT_ROUND",
  END_GAME: "END_GAME",
  NEW_GAME: "NEW_GAME",
});

export function defaultSettings() {
  return { categories: [...CATEGORY_IDS], difficulty: "mixed", turnSeconds: DEFAULT_TURN_SECONDS };
}

export function createInitialState() {
  return {
    phase: PHASES.SETUP,
    teams: [],
    settings: defaultSettings(),
    round: 0,
    roundStarterIndex: 0,
    activeTeamIndex: 0,
    /** The puzzle on the card (copied in, so saves survive edits to the list). */
    puzzle: null,
    usedPuzzleIds: [],
    hintUsed: false,
    /** Wrong guesses this round, oldest first: `[{ teamId, text }]`. */
    wrongGuesses: [],
    /** True once the round has passed to the next team for its single steal. */
    steal: false,
    clock: { status: CLOCK.RUNNING, endsAt: 0, remainingMs: DEFAULT_TURN_SECONDS * 1000 },
    /** `{ outcome: "solved"|"unsolved"|"revealed", winnerTeamId, base, hintPenalty, speedBonus, steal, points }` */
    roundResult: null,
    lastEvent: null,
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function makeEvent(state, event) {
  return { seq: (state.lastEvent?.seq ?? 0) + 1, ...event };
}

function sanitizeSettings(raw) {
  const base = defaultSettings();
  const categories = Array.isArray(raw?.categories) ? raw.categories.filter((id) => CATEGORY_IDS.includes(id)) : [];
  return {
    categories: categories.length ? categories : base.categories,
    difficulty: DIFFICULTY_OPTIONS.includes(raw?.difficulty) ? raw.difficulty : base.difficulty,
    turnSeconds: TURN_SECONDS_OPTIONS.includes(raw?.turnSeconds) ? raw.turnSeconds : base.turnSeconds,
  };
}

function poolFor(settings) {
  const difficulties = settings.difficulty === "mixed" ? DIFFICULTY_IDS : [settings.difficulty];
  const pool = puzzlesFor(settings.categories, difficulties);
  return pool.length ? pool : PUZZLES;
}

/** Seconds for a try: the full timer, or half of it (rounded up) for a steal. */
export function turnSecondsFor(state, steal = state.steal) {
  return steal ? Math.ceil(state.settings.turnSeconds * STEAL_FACTOR) : state.settings.turnSeconds;
}

function runningClock(state, now, steal = state.steal) {
  const ms = turnSecondsFor(state, steal) * 1000;
  return { status: CLOCK.RUNNING, endsAt: now + ms, remainingMs: ms };
}

function isLive(state) {
  return state.phase === PHASES.PLAYING && state.clock.status === CLOCK.RUNNING;
}

export function potentialBase(hintUsed) {
  return Math.max(MIN_BASE, BASE_POINTS - (hintUsed ? HINT_COST : 0));
}

/** Words of the answer, for the hint: "2 words · starts with F". */
export function hintFor(puzzle) {
  const words = puzzle.answer.split(/\s+/).filter(Boolean);
  const letters = titleKey(puzzle.answer).length;
  return words.length === 1
    ? `1 word · ${letters} letters · starts with ${puzzle.answer[0].toUpperCase()}`
    : `${words.length} words · starts with ${puzzle.answer[0].toUpperCase()}`;
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

/**
 * Is the typed guess the answer? Spaces, capitals and punctuation don't matter, and
 * answers of 6+ letters forgive one typo. Other spellings must be listed as aliases.
 * Clues sound like their answers by design, so a guess that's at least as close to
 * the clue as to the answer ("ice scream" for "Ice Cream") never counts.
 */
export function isAnswer(puzzle, guess) {
  const typed = titleKey(guess);
  if (!typed) return false;
  const clue = titleKey(puzzle.clue);
  return [puzzle.answer, ...(puzzle.aliases ?? [])].some((answer) => {
    const key = titleKey(answer);
    if (typed === key) return true;
    const distance = editDistance(typed, key);
    return key.length >= 6 && distance <= 1 && distance < editDistance(typed, clue);
  });
}

function startRound(state, { round, starterIndex, seed, now }) {
  const pool = poolFor(state.settings);
  const draw = drawWithoutRepeat(pool.map((p) => p.id), state.usedPuzzleIds, seed, state.puzzle?.id ?? null);
  const { id, clue, answer, aliases, category, difficulty } = pool.find((p) => p.id === draw.id);
  const next = {
    ...state,
    phase: PHASES.PLAYING,
    round,
    roundStarterIndex: starterIndex,
    activeTeamIndex: starterIndex,
    puzzle: { id, clue, answer, aliases, category, difficulty },
    usedPuzzleIds: draw.usedIds,
    hintUsed: false,
    wrongGuesses: [],
    steal: false,
    roundResult: null,
    lastEvent: makeEvent(state, { type: draw.recycled ? "puzzles-recycled" : "round-start" }),
  };
  return { ...next, clock: runningClock(next, now, false) };
}

/**
 * The active team's try is over (pass or time up). First try → the next team
 * steals with half the time, clock running. A steal, or solo → round over.
 */
function endTry(state, reason, now) {
  const team = state.teams[state.activeTeamIndex];
  if (state.steal || isSolo(state.teams)) {
    return {
      ...state,
      phase: PHASES.ROUND_OVER,
      roundResult: { outcome: "unsolved", winnerTeamId: null, base: 0, hintPenalty: 0, speedBonus: 0, steal: false, points: 0 },
      lastEvent: makeEvent(state, { type: reason, teamId: team.id }),
    };
  }
  const nextIndex = nextTeamIndex(state.activeTeamIndex, state.teams.length);
  const next = { ...state, steal: true, activeTeamIndex: nextIndex };
  return {
    ...next,
    clock: runningClock(next, now, true),
    lastEvent: makeEvent(state, { type: reason, teamId: team.id, nextTeamId: state.teams[nextIndex].id, steal: true }),
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
      return startRound(
        { ...state, teams, settings: sanitizeSettings(action.settings) },
        { round: 1, starterIndex: 0, seed: action.seed ?? 0, now: action.now ?? 0 },
      );
    }

    case ACTIONS.GUESS: {
      if (!isLive(state)) return state;
      const text = String(action.guess ?? "").trim();
      if (!text) return state;
      const team = state.teams[state.activeTeamIndex];

      if (!isAnswer(state.puzzle, text)) {
        return {
          ...state,
          wrongGuesses: [...state.wrongGuesses, { teamId: team.id, text }],
          lastEvent: makeEvent(state, { type: "wrong", teamId: team.id, guess: text }),
        };
      }

      const base = potentialBase(state.hintUsed);
      const speedBonus = Math.max(0, Math.min(turnSecondsFor(state), Math.ceil((state.clock.endsAt - action.now) / 1000)));
      const points = state.steal ? Math.round((base + speedBonus) * STEAL_FACTOR) : base + speedBonus;
      return {
        ...state,
        teams: addScore(state.teams, team.id, points),
        phase: PHASES.ROUND_OVER,
        roundResult: { outcome: "solved", winnerTeamId: team.id, base, hintPenalty: BASE_POINTS - base, speedBonus, steal: state.steal, points },
        lastEvent: makeEvent(state, { type: "solved", teamId: team.id, points }),
      };
    }

    case ACTIONS.USE_HINT: {
      if (!isLive(state) || state.hintUsed) return state;
      return { ...state, hintUsed: true, lastEvent: makeEvent(state, { type: "hint" }) };
    }

    case ACTIONS.PASS: {
      if (!isLive(state)) return state;
      return endTry(state, "passed", action.now ?? 0);
    }

    case ACTIONS.TIME_UP: {
      if (!isLive(state) || action.now < state.clock.endsAt - TIME_GRACE_MS) return state;
      return endTry(state, "timeout", action.now);
    }

    case ACTIONS.PAUSE: {
      if (!isLive(state)) return state;
      return { ...state, clock: { status: CLOCK.PAUSED, endsAt: 0, remainingMs: Math.max(0, state.clock.endsAt - action.now) } };
    }

    case ACTIONS.RESUME: {
      if (state.phase !== PHASES.PLAYING || state.clock.status !== CLOCK.PAUSED) return state;
      return { ...state, clock: { status: CLOCK.RUNNING, endsAt: action.now + state.clock.remainingMs, remainingMs: state.clock.remainingMs } };
    }

    case ACTIONS.REVEAL: {
      if (state.phase !== PHASES.PLAYING) return state;
      return {
        ...state,
        phase: PHASES.ROUND_OVER,
        roundResult: { outcome: "revealed", winnerTeamId: null, base: 0, hintPenalty: 0, speedBonus: 0, steal: false, points: 0 },
        lastEvent: makeEvent(state, { type: "revealed" }),
      };
    }

    case ACTIONS.NEXT_ROUND: {
      if (state.phase !== PHASES.ROUND_OVER) return state;
      return startRound(state, {
        round: state.round + 1,
        starterIndex: nextTeamIndex(state.roundStarterIndex, state.teams.length),
        seed: action.seed ?? 0,
        now: action.now ?? 0,
      });
    }

    case ACTIONS.END_GAME: {
      if (state.phase !== PHASES.PLAYING && state.phase !== PHASES.ROUND_OVER) return state;
      return { ...state, phase: PHASES.FINISHED, lastEvent: null };
    }

    case ACTIONS.NEW_GAME: {
      return {
        ...createInitialState(),
        teams: state.teams.map((team) => ({ ...team, score: 0 })),
        settings: state.settings,
        usedPuzzleIds: state.usedPuzzleIds,
      };
    }

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* Persistence                                                          */
/* ------------------------------------------------------------------ */

/** On load: a clock that was running when the page closed comes back paused. */
export function migrateState(saved, { now } = {}) {
  if (!saved || typeof saved !== "object") return saved;
  const state = { ...createInitialState(), ...saved, settings: sanitizeSettings(saved.settings) };
  if (state.phase === PHASES.PLAYING && state.clock?.status === CLOCK.RUNNING) {
    state.clock = { status: CLOCK.PAUSED, endsAt: 0, remainingMs: Math.max(0, (state.clock.endsAt ?? 0) - (now ?? 0)) };
  }
  return state;
}

export function isValidState(state) {
  if (!state || typeof state !== "object") return false;
  if (!Object.values(PHASES).includes(state.phase)) return false;
  if (!Array.isArray(state.teams) || !Array.isArray(state.wrongGuesses)) return false;
  if (state.phase === PHASES.PLAYING || state.phase === PHASES.ROUND_OVER) {
    const p = state.puzzle;
    if (!p || typeof p.clue !== "string" || typeof p.answer !== "string") return false;
    if (state.teams.length < 1 || state.activeTeamIndex >= state.teams.length) return false;
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

export function remainingMs(state, now) {
  return state.clock.status === CLOCK.RUNNING ? Math.max(0, state.clock.endsAt - now) : state.clock.remainingMs;
}
