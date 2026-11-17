/**
 * Twin Hunt — pure game engine (a memory / pairs game).
 *
 * The board is a grid of face-down cards, two of each face. Twins share an emoji
 * and a background colour. On a turn the active team flips two cards:
 *   - twins  → they stay face up, the team scores and flips again
 *   - no match → both stay up for a moment (the UI sends HIDE_MISS), then turn
 *                face down and the turn passes to the next team
 * The game ends when every pair is found.
 *
 * Scoring: PAIR_POINTS a pair, plus STREAK_BONUS for every extra pair found in
 * the same turn. Solo also tracks moves (two flips = one move) and time, with a
 * best per board size.
 *
 * Purity: anything random or time-based comes in on the action
 * (`seed: Math.random()`, `now: Date.now()`), never from inside the reducer.
 *
 *   playing ──FLIP──▶ one up ──FLIP──▶ twins:    stays playing (same team)
 *                                    └▶ no match: `miss` held ──HIDE_MISS──▶ next team
 *           last pair found ──▶ finished
 */

import { addScore, buildTeams, nextTeamIndex } from "../core/teams";
import { createRandom, shuffle } from "../core/shuffle";
import { DECK_OPTIONS, facesFor, pairColors } from "./decks";

export const PAIR_POINTS = 10;
export const STREAK_BONUS = 5;
export const BOARD_OPTIONS = [8, 12, 18];
export const DEFAULT_PAIRS = 8;

export const PHASES = Object.freeze({ SETUP: "setup", PLAYING: "playing", FINISHED: "finished" });

export const ACTIONS = Object.freeze({
  START_GAME: "START_GAME",
  FLIP: "FLIP",
  HIDE_MISS: "HIDE_MISS",
  PAUSE: "PAUSE",
  RESUME: "RESUME",
  END_GAME: "END_GAME",
  REMATCH: "REMATCH",
  NEW_GAME: "NEW_GAME",
});

export function defaultSettings() {
  return { pairs: DEFAULT_PAIRS, deck: "mixed" };
}

export function createInitialState() {
  return {
    phase: PHASES.SETUP,
    teams: [],
    settings: defaultSettings(),
    /** `[{ pairId, emoji, name, color, matchedBy: teamId | null }]`, in board order. */
    cards: [],
    /** Indices of face-up, unmatched cards this turn (0–2). */
    flipped: [],
    /** True while two non-twins are showing, before they turn back. */
    miss: false,
    activeTeamIndex: 0,
    /** Pairs found so far this turn (for the streak bonus). */
    streak: 0,
    moves: 0,
    /** Playing time: `elapsedMs` banked, plus `now − since` while running (since = 0 when paused). */
    clock: { elapsedMs: 0, since: 0 },
    /** Solo bests per board size: `{ [pairs]: { moves, ms } }`. Kept across games. */
    bests: {},
    /** Set when the board is cleared: `{ moves, ms, cleared, newBest }`. */
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
    pairs: BOARD_OPTIONS.includes(raw?.pairs) ? raw.pairs : base.pairs,
    deck: DECK_OPTIONS.includes(raw?.deck) ? raw.deck : base.deck,
  };
}

/** Shuffle a fresh board: pick the faces, give each pair its colour, deal two of each. */
export function dealBoard(settings, seed) {
  const random = createRandom(seed);
  const faces = shuffle(facesFor(settings.deck), random()).slice(0, settings.pairs);
  const colors = shuffle(pairColors(faces.length, random()), random());
  const pairs = faces.map((face, pairId) => ({ pairId, ...face, color: colors[pairId], matchedBy: null }));
  return shuffle([...pairs, ...pairs.map((p) => ({ ...p }))], random());
}

function startBoard(state, { seed, now }) {
  return {
    ...state,
    phase: PHASES.PLAYING,
    teams: state.teams.map((team) => ({ ...team, score: 0 })),
    cards: dealBoard(state.settings, seed),
    flipped: [],
    miss: false,
    activeTeamIndex: 0,
    streak: 0,
    moves: 0,
    clock: { elapsedMs: 0, since: now },
    result: null,
    lastEvent: makeEvent(state, { type: "start" }),
  };
}

export function elapsedMs(state, now) {
  const { elapsedMs: banked, since } = state.clock;
  return banked + (since ? Math.max(0, now - since) : 0);
}

function stopClock(state, now) {
  return { elapsedMs: elapsedMs(state, now), since: 0 };
}

export function isPaused(state) {
  return state.phase === PHASES.PLAYING && !state.clock.since;
}

export function pairsFound(state) {
  return state.cards.filter((c) => c.matchedBy).length / 2;
}

function finish(state, now, cleared) {
  const ms = elapsedMs(state, now);
  const solo = state.teams.length === 1;
  const key = String(state.settings.pairs);
  const prev = state.bests[key];
  const newBest = solo && cleared && (!prev || state.moves < prev.moves || (state.moves === prev.moves && ms < prev.ms));
  return {
    ...state,
    phase: PHASES.FINISHED,
    flipped: [],
    miss: false,
    clock: { elapsedMs: ms, since: 0 },
    bests: newBest ? { ...state.bests, [key]: { moves: state.moves, ms } } : state.bests,
    result: { moves: state.moves, ms, cleared, newBest, previousBest: prev ?? null },
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
      return startBoard({ ...state, teams, settings: sanitizeSettings(action.settings) }, { seed: action.seed ?? 0, now: action.now ?? 0 });
    }

    case ACTIONS.FLIP: {
      if (state.phase !== PHASES.PLAYING || state.miss) return state;
      const index = action.index;
      const card = state.cards[index];
      if (!card || card.matchedBy || state.flipped.includes(index)) return state;
      const now = action.now ?? 0;
      // Flipping a card also restarts a paused clock.
      const clock = state.clock.since ? state.clock : { ...state.clock, since: now };

      if (state.flipped.length === 0) {
        return { ...state, clock, flipped: [index], lastEvent: null };
      }

      const first = state.cards[state.flipped[0]];
      const moves = state.moves + 1;
      const team = state.teams[state.activeTeamIndex];

      if (first.pairId !== card.pairId) {
        return { ...state, clock, moves, flipped: [state.flipped[0], index], miss: true, lastEvent: makeEvent(state, { type: "miss", teamId: team.id }) };
      }

      const points = PAIR_POINTS + (state.streak > 0 ? STREAK_BONUS : 0);
      const cards = state.cards.map((c, i) => (i === index || i === state.flipped[0] ? { ...c, matchedBy: team.id } : c));
      const next = {
        ...state,
        clock,
        moves,
        cards,
        flipped: [],
        streak: state.streak + 1,
        teams: addScore(state.teams, team.id, points),
        lastEvent: makeEvent(state, { type: "match", teamId: team.id, points, streak: state.streak + 1, name: card.name, pair: [state.flipped[0], index] }),
      };
      return cards.every((c) => c.matchedBy) ? finish(next, now, true) : next;
    }

    case ACTIONS.HIDE_MISS: {
      if (state.phase !== PHASES.PLAYING || !state.miss) return state;
      const nextIndex = nextTeamIndex(state.activeTeamIndex, state.teams.length);
      return {
        ...state,
        flipped: [],
        miss: false,
        streak: 0,
        activeTeamIndex: nextIndex,
        lastEvent: state.teams.length > 1 ? makeEvent(state, { type: "turn", teamId: state.teams[nextIndex].id }) : null,
      };
    }

    case ACTIONS.PAUSE: {
      if (state.phase !== PHASES.PLAYING || !state.clock.since) return state;
      return { ...state, clock: stopClock(state, action.now ?? 0) };
    }

    case ACTIONS.RESUME: {
      if (!isPaused(state)) return state;
      return { ...state, clock: { ...state.clock, since: action.now ?? 0 } };
    }

    case ACTIONS.END_GAME: {
      if (state.phase !== PHASES.PLAYING) return state;
      return finish(state, action.now ?? 0, false);
    }

    case ACTIONS.REMATCH: {
      if (state.phase !== PHASES.FINISHED) return state;
      return startBoard(state, { seed: action.seed ?? 0, now: action.now ?? 0 });
    }

    case ACTIONS.NEW_GAME: {
      return {
        ...createInitialState(),
        teams: state.teams.map((team) => ({ ...team, score: 0 })),
        settings: state.settings,
        bests: state.bests,
      };
    }

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* Persistence                                                          */
/* ------------------------------------------------------------------ */

/**
 * On load: the game comes back paused (the store banks the clock on every save, so
 * the time while the page was closed doesn't count). The next flip restarts it.
 */
export function migrateState(saved) {
  if (!saved || typeof saved !== "object") return saved;
  const state = { ...createInitialState(), ...saved, settings: sanitizeSettings(saved.settings) };
  state.clock = { elapsedMs: Number(state.clock?.elapsedMs) || 0, since: 0 };
  return state;
}

export function isValidState(state) {
  if (!state || typeof state !== "object") return false;
  if (!Object.values(PHASES).includes(state.phase)) return false;
  if (!Array.isArray(state.teams) || !Array.isArray(state.cards) || !Array.isArray(state.flipped)) return false;
  if (state.phase === PHASES.PLAYING) {
    if (state.cards.length < 2 || state.teams.length < 1 || state.activeTeamIndex >= state.teams.length) return false;
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

/** "1:05" */
export function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
