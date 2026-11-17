/**
 * Release Ladder — pure game engine.
 *
 * Each round, the active team gets a handful of Telugu movies in a shuffled order
 * and drags them into release order (oldest at the top). Locking in (or the clock
 * running out) reveals the years.
 *
 * Scoring: SLOT_POINTS for every movie in its right spot, plus PERFECT_BONUS when
 * the whole ladder is right. Rounds rotate through the teams.
 *
 * Movies come in on the action (`movies`, the shared Wikidata + built-in pool),
 * along with `seed: Math.random()` and `now: Date.now()`, so the reducer stays pure.
 *
 *   ready ──START_TURN──▶ playing ──MOVE…── LOCK_IN / TIME_UP ──▶ reveal ──NEXT_ROUND──▶ ready
 *   PAUSE / RESUME hold the clock (e.g. while the tab is hidden).
 */

import { addScore, buildTeams, nextTeamIndex } from "../core/teams";
import { shuffle, shuffleChanged } from "../core/shuffle";
import { MOVIES } from "../jumble-rumble/movies";

export const SLOT_POINTS = 10;
export const PERFECT_BONUS = 20;
export const SIZE_OPTIONS = [4, 5, 6];
export const DEFAULT_SIZE = 5;
/** 0 = no timer. */
export const TURN_SECONDS_OPTIONS = [30, 60, 90, 0];
export const DEFAULT_TURN_SECONDS = 60;
/** Fewest years between any two movies on a ladder. */
export const SPREAD_OPTIONS = { easy: 5, medium: 2, hard: 1 };
export const DEFAULT_SPREAD = "medium";
/** Movies kept out of new ladders until this many have been played. */
const RECENT_LIMIT = 60;
const TIME_GRACE_MS = 300;

export const PHASES = Object.freeze({ SETUP: "setup", READY: "ready", PLAYING: "playing", REVEAL: "reveal", FINISHED: "finished" });
export const CLOCK = Object.freeze({ RUNNING: "running", PAUSED: "paused" });

export const ACTIONS = Object.freeze({
  START_GAME: "START_GAME",
  START_TURN: "START_TURN",
  MOVE: "MOVE",
  LOCK_IN: "LOCK_IN",
  TIME_UP: "TIME_UP",
  PAUSE: "PAUSE",
  RESUME: "RESUME",
  NEXT_ROUND: "NEXT_ROUND",
  END_GAME: "END_GAME",
  NEW_GAME: "NEW_GAME",
});

export function defaultSettings() {
  return { size: DEFAULT_SIZE, turnSeconds: DEFAULT_TURN_SECONDS, spread: DEFAULT_SPREAD };
}

export function createInitialState() {
  return {
    phase: PHASES.SETUP,
    teams: [],
    settings: defaultSettings(),
    round: 0,
    activeTeamIndex: 0,
    /** The team's current order, top (oldest) first: `[{ id, title, year, lead? }]`. */
    ladder: [],
    recentIds: [],
    clock: { status: CLOCK.PAUSED, endsAt: 0, remainingMs: 0 },
    /** `{ marks: boolean[], correct, perfect, points, timedOut }` once locked in. */
    result: null,
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
  return {
    size: SIZE_OPTIONS.includes(raw?.size) ? raw.size : base.size,
    turnSeconds: TURN_SECONDS_OPTIONS.includes(raw?.turnSeconds) ? raw.turnSeconds : base.turnSeconds,
    spread: Object.hasOwn(SPREAD_OPTIONS, raw?.spread) ? raw.spread : base.spread,
  };
}

/** Movies we can place: a title and a sensible release year. */
function datedPool(movies) {
  const list = Array.isArray(movies) && movies.length ? movies : MOVIES;
  return list.filter((m) => m?.id && m.title && Number.isInteger(m.year) && m.year >= 1930 && m.year <= 2100);
}

/**
 * Pick `size` movies at least `gap` years apart, preferring ones not played recently.
 * Returns null when the pool can't make a ladder that size.
 */
export function pickLadder(movies, { size, gap, recentIds = [], seed }) {
  const pool = datedPool(movies);
  const recent = new Set(recentIds);
  const order = shuffle(pool, seed);
  const tryPick = (candidates, minGap) => {
    const picked = [];
    for (const movie of candidates) {
      if (picked.every((p) => Math.abs(p.year - movie.year) >= minGap)) picked.push(movie);
      if (picked.length === size) return picked;
    }
    return null;
  };
  const picked =
    tryPick(order.filter((m) => !recent.has(m.id)), gap) ??
    tryPick(order, gap) ??
    // A tiny offline pool: relax the spread, but never allow a tie.
    tryPick(order, 1);
  if (!picked) return null;
  const fields = picked.map(({ id, title, year, lead }) => (lead ? { id, title, year, lead } : { id, title, year }));
  // Never deal a ladder that's already in order.
  return shuffleChanged(fields, (seed * 7.31) % 1, (a) => a.every((m, i) => i === 0 || a[i - 1].year < m.year));
}

/** The right order: oldest first. */
export function correctOrder(ladder) {
  return [...ladder].sort((a, b) => a.year - b.year);
}

export function turnMs(state) {
  return state.settings.turnSeconds * 1000;
}

export function isTimed(state) {
  return state.settings.turnSeconds > 0;
}

function dealRound(state, { round, teamIndex, seed, movies }) {
  const gap = SPREAD_OPTIONS[state.settings.spread];
  const ladder = pickLadder(movies, { size: state.settings.size, gap, recentIds: state.recentIds, seed }) ?? pickLadder(MOVIES, { size: state.settings.size, gap: 1, seed });
  return {
    ...state,
    phase: PHASES.READY,
    round,
    activeTeamIndex: teamIndex,
    ladder,
    recentIds: [...state.recentIds, ...ladder.map((m) => m.id)].slice(-RECENT_LIMIT),
    clock: { status: CLOCK.PAUSED, endsAt: 0, remainingMs: turnMs(state) },
    result: null,
    lastEvent: null,
  };
}

function lockIn(state, { timedOut }) {
  const right = correctOrder(state.ladder);
  const marks = state.ladder.map((m, i) => m.year === right[i].year);
  const correct = marks.filter(Boolean).length;
  const perfect = correct === marks.length;
  const points = correct * SLOT_POINTS + (perfect ? PERFECT_BONUS : 0);
  const team = state.teams[state.activeTeamIndex];
  return {
    ...state,
    phase: PHASES.REVEAL,
    teams: addScore(state.teams, team.id, points),
    clock: { ...state.clock, status: CLOCK.PAUSED, endsAt: 0 },
    result: { marks, correct, perfect, points, timedOut },
    lastEvent: makeEvent(state, { type: timedOut ? "timeout" : "locked", teamId: team.id }),
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
      return dealRound({ ...state, teams, settings: sanitizeSettings(action.settings) }, { round: 1, teamIndex: 0, seed: action.seed ?? 0, movies: action.movies });
    }

    case ACTIONS.START_TURN: {
      if (state.phase !== PHASES.READY) return state;
      const now = action.now ?? 0;
      return {
        ...state,
        phase: PHASES.PLAYING,
        clock: isTimed(state) ? { status: CLOCK.RUNNING, endsAt: now + turnMs(state), remainingMs: turnMs(state) } : { status: CLOCK.PAUSED, endsAt: 0, remainingMs: 0 },
      };
    }

    case ACTIONS.MOVE: {
      if (state.phase !== PHASES.PLAYING) return state;
      const { from, to } = action;
      const n = state.ladder.length;
      if (!Number.isInteger(from) || !Number.isInteger(to) || from === to || from < 0 || to < 0 || from >= n || to >= n) return state;
      const ladder = [...state.ladder];
      const [moved] = ladder.splice(from, 1);
      ladder.splice(to, 0, moved);
      return { ...state, ladder };
    }

    case ACTIONS.LOCK_IN: {
      if (state.phase !== PHASES.PLAYING) return state;
      return lockIn(state, { timedOut: false });
    }

    case ACTIONS.TIME_UP: {
      if (state.phase !== PHASES.PLAYING || state.clock.status !== CLOCK.RUNNING || (action.now ?? 0) < state.clock.endsAt - TIME_GRACE_MS) return state;
      return lockIn(state, { timedOut: true });
    }

    case ACTIONS.PAUSE: {
      if (state.phase !== PHASES.PLAYING || state.clock.status !== CLOCK.RUNNING) return state;
      return { ...state, clock: { status: CLOCK.PAUSED, endsAt: 0, remainingMs: Math.max(0, state.clock.endsAt - (action.now ?? 0)) } };
    }

    case ACTIONS.RESUME: {
      if (state.phase !== PHASES.PLAYING || !isTimed(state) || state.clock.status !== CLOCK.PAUSED) return state;
      return { ...state, clock: { status: CLOCK.RUNNING, endsAt: (action.now ?? 0) + state.clock.remainingMs, remainingMs: state.clock.remainingMs } };
    }

    case ACTIONS.NEXT_ROUND: {
      if (state.phase !== PHASES.REVEAL) return state;
      return dealRound(state, {
        round: state.round + 1,
        teamIndex: nextTeamIndex(state.activeTeamIndex, state.teams.length),
        seed: action.seed ?? 0,
        movies: action.movies,
      });
    }

    case ACTIONS.END_GAME: {
      if (![PHASES.READY, PHASES.PLAYING, PHASES.REVEAL].includes(state.phase)) return state;
      // A ladder that was never locked in doesn't count as a round.
      const rounds = state.phase === PHASES.REVEAL ? state.round : state.round - 1;
      return { ...state, phase: PHASES.FINISHED, round: Math.max(0, rounds), lastEvent: null };
    }

    case ACTIONS.NEW_GAME: {
      return {
        ...createInitialState(),
        teams: state.teams.map((team) => ({ ...team, score: 0 })),
        settings: state.settings,
        recentIds: state.recentIds,
      };
    }

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* Persistence                                                          */
/* ------------------------------------------------------------------ */

/** On load: a running clock comes back paused. */
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
  if (!Array.isArray(state.teams) || !Array.isArray(state.ladder)) return false;
  if ([PHASES.READY, PHASES.PLAYING, PHASES.REVEAL].includes(state.phase)) {
    if (state.ladder.length < 2 || !state.ladder.every((m) => m?.title && Number.isInteger(m.year))) return false;
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

export function remainingMs(state, now) {
  return state.clock.status === CLOCK.RUNNING ? Math.max(0, state.clock.endsAt - now) : state.clock.remainingMs;
}
