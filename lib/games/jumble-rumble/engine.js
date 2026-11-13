/**
 * Jumble Rumble — pure game engine.
 *
 * A Telugu movie title is broken into shuffled letter tiles. The active team
 * arranges them into the answer slots before their timer runs out.
 *
 * Purity: anything random or time-based comes in on the action
 * (`seed: Math.random()`, `now: Date.now()`), never from inside the reducer.
 *
 * Scoring for the team that solves it:
 *   max(MIN_BASE, BASE_POINTS − hints × HINT_COST)  +  seconds left (speed bonus)
 *
 * A steal (the one pass per round) earns STEAL_FACTOR of that total, rounded.
 *
 * Turn flow inside a round:
 *   ready ──START_TURN──▶ running ──(wrong / time up)──▶ next team STEALS: ready, half time
 *                            │  ▲                          (steal misses too → round over)
 *                       PAUSE│  │START_TURN
 *                            ▼  │
 *                           paused
 */

import { addScore, buildTeams, isSolo, nextTeamIndex } from "../core/teams";
import { drawWithoutRepeat } from "../core/random";
import { shuffle, shuffleChanged } from "../core/shuffle";
import { MOVIES, answerWords, getMovieById, isPlayable } from "./movies";

export const BASE_POINTS = 100;
export const HINT_COST = 20;
export const MIN_BASE = 20;
/** Most hints a round allows (keeps the base from dropping below MIN_BASE). */
export const MAX_HINTS = (BASE_POINTS - MIN_BASE) / HINT_COST;
/** A steal gets this share of the timer and of the points. */
export const STEAL_FACTOR = 0.5;
export const TURN_SECONDS_OPTIONS = [30, 45, 60, 90];
export const DEFAULT_TURN_SECONDS = 45;
/** Grace period so a click at 0.1s left isn't rejected by a slightly late clock. */
const TIME_GRACE_MS = 300;

export const PHASES = Object.freeze({
  SETUP: "setup",
  PLAYING: "playing",
  ROUND_OVER: "roundOver",
  FINISHED: "finished",
});

export const TURN = Object.freeze({ READY: "ready", RUNNING: "running", PAUSED: "paused" });

export const ACTIONS = Object.freeze({
  START_GAME: "START_GAME",
  START_TURN: "START_TURN",
  PAUSE: "PAUSE",
  PLACE_TILE: "PLACE_TILE",
  PLACE_LETTER: "PLACE_LETTER",
  REMOVE_SLOT: "REMOVE_SLOT",
  BACKSPACE: "BACKSPACE",
  CLEAR: "CLEAR",
  SHUFFLE: "SHUFFLE",
  USE_CLUE: "USE_CLUE",
  REVEAL_LETTER: "REVEAL_LETTER",
  SUBMIT: "SUBMIT",
  TIME_UP: "TIME_UP",
  GIVE_UP: "GIVE_UP",
  NEXT_ROUND: "NEXT_ROUND",
  END_GAME: "END_GAME",
  NEW_GAME: "NEW_GAME",
});

export function createInitialState() {
  return {
    phase: PHASES.SETUP,
    teams: [],
    settings: { turnSeconds: DEFAULT_TURN_SECONDS },
    round: 0,
    roundStarterIndex: 0,
    activeTeamIndex: 0,
    movieId: null,
    /** The movie being played (`{ id, title, year?, lead? }`), kept in state since pools come from the network. */
    movie: null,
    usedMovieIds: [],
    /** Scrambled tiles: `[{ id, char }]` in display order. */
    tiles: [],
    /** One entry per answer letter: the tile id placed there, or null. */
    slots: [],
    /** Slots filled by "reveal a letter" hints; fixed for the rest of the round. */
    locked: [],
    hintsUsed: 0,
    clueShown: false,
    /** Team ids that have used their try this round. */
    attempts: [],
    /** True once the round has passed to the next team for its single half-time, half-points steal. */
    steal: false,
    turn: { status: TURN.READY, endsAt: null, remainingMs: DEFAULT_TURN_SECONDS * 1000 },
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

function answerOf(state) {
  return state.movie ? answerWords(state.movie).join("") : "";
}

/** The pool a round draws from: the movies on the action, else the built-in list. */
function poolFrom(movies) {
  const pool = Array.isArray(movies) ? movies.filter(isPlayable) : [];
  return pool.length > 0 ? pool : MOVIES;
}

function pickMovieFields({ id, title, year, lead }) {
  const movie = { id, title };
  if (typeof year === "number") movie.year = year;
  if (typeof lead === "string" && lead) movie.lead = lead;
  return movie;
}

function tileChar(state, tileId) {
  return state.tiles.find((tile) => tile.id === tileId)?.char ?? "";
}

/** Seconds for a turn: the full timer, or half of it (rounded up) for a steal. */
export function turnSecondsFor(state, steal = state.steal) {
  return steal ? Math.ceil(state.settings.turnSeconds * STEAL_FACTOR) : state.settings.turnSeconds;
}

function freshTurn(state, steal = state.steal) {
  return { status: TURN.READY, endsAt: null, remainingMs: turnSecondsFor(state, steal) * 1000 };
}

/** Slots with only the hint-locked letters kept. */
function lockedOnly(slots, locked) {
  return slots.map((tileId, i) => (locked[i] ? tileId : null));
}

function isRunning(state) {
  return state.phase === PHASES.PLAYING && state.turn.status === TURN.RUNNING;
}

function startRound(state, { round, starterIndex, seed, movies }) {
  const pool = poolFrom(movies);
  const draw = drawWithoutRepeat(pool.map((m) => m.id), state.usedMovieIds, seed, state.movieId);
  const movie = pickMovieFields(pool.find((m) => m.id === draw.id));
  const letters = [...answerWords(movie).join("")];
  const ordered = letters.map((char, i) => ({ id: `t${i}`, char }));
  const tiles = shuffleChanged(ordered, (seed * 7919) % 1, (a, b) => a.every((t, i) => t.char === b[i].char));

  return {
    ...state,
    phase: PHASES.PLAYING,
    round,
    roundStarterIndex: starterIndex,
    activeTeamIndex: starterIndex,
    movieId: movie.id,
    movie,
    usedMovieIds: draw.usedIds,
    tiles,
    slots: letters.map(() => null),
    locked: letters.map(() => false),
    hintsUsed: 0,
    clueShown: false,
    attempts: [],
    steal: false,
    turn: freshTurn(state, false),
    roundResult: null,
    lastEvent: makeEvent(state, { type: draw.recycled ? "movies-recycled" : "round-start" }),
  };
}

/**
 * The active team's try is over (wrong answer or time up).
 * First try → the next team gets ONE steal (half time, half points).
 * Steal try, or any try in solo → the round ends unsolved. The turn never passes more than once.
 */
function endAttempt(state, reason, guess) {
  const team = state.teams[state.activeTeamIndex];
  const attempts = [...state.attempts, team.id];
  const base = { ...state, attempts, slots: lockedOnly(state.slots, state.locked) };

  if (state.steal || isSolo(state.teams)) {
    return {
      ...base,
      phase: PHASES.ROUND_OVER,
      turn: freshTurn(state, false),
      roundResult: { outcome: "unsolved", winnerTeamId: null, base: 0, hintPenalty: 0, speedBonus: 0, steal: false, points: 0 },
      lastEvent: makeEvent(state, { type: reason, teamId: team.id, guess }),
    };
  }

  const nextIndex = nextTeamIndex(state.activeTeamIndex, state.teams.length);
  return {
    ...base,
    steal: true,
    activeTeamIndex: nextIndex,
    turn: freshTurn(state, true),
    lastEvent: makeEvent(state, { type: reason, teamId: team.id, guess, nextTeamId: state.teams[nextIndex].id, steal: true }),
  };
}

export function potentialBase(hintsUsed) {
  return Math.max(MIN_BASE, BASE_POINTS - hintsUsed * HINT_COST);
}

/* ------------------------------------------------------------------ */
/* Reducer                                                              */
/* ------------------------------------------------------------------ */

export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_GAME: {
      // Starting is async (it waits for the movie pool), so ignore a late double-start.
      if (state.phase !== PHASES.SETUP) return state;
      const teams = buildTeams(action.teams ?? []);
      if (teams.length < 1) return state;
      const turnSeconds = TURN_SECONDS_OPTIONS.includes(action.settings?.turnSeconds)
        ? action.settings.turnSeconds
        : DEFAULT_TURN_SECONDS;
      return startRound(
        { ...state, teams, settings: { ...state.settings, turnSeconds } },
        { round: 1, starterIndex: 0, seed: action.seed ?? 0, movies: action.movies },
      );
    }

    case ACTIONS.START_TURN: {
      // Starts a ready turn or resumes a paused one.
      if (state.phase !== PHASES.PLAYING || state.turn.status === TURN.RUNNING) return state;
      return {
        ...state,
        turn: { status: TURN.RUNNING, endsAt: action.now + state.turn.remainingMs, remainingMs: state.turn.remainingMs },
      };
    }

    case ACTIONS.PAUSE: {
      if (!isRunning(state)) return state;
      return {
        ...state,
        turn: { status: TURN.PAUSED, endsAt: null, remainingMs: Math.max(0, state.turn.endsAt - action.now) },
      };
    }

    case ACTIONS.PLACE_TILE: {
      if (!isRunning(state) || state.slots.includes(action.tileId)) return state;
      if (!state.tiles.some((tile) => tile.id === action.tileId)) return state;
      const index = state.slots.indexOf(null);
      if (index === -1) return state;
      const slots = [...state.slots];
      slots[index] = action.tileId;
      return { ...state, slots };
    }

    case ACTIONS.PLACE_LETTER: {
      if (!isRunning(state)) return state;
      const char = String(action.letter ?? "").toUpperCase();
      const tile = state.tiles.find((t) => t.char === char && !state.slots.includes(t.id));
      return tile ? reducer(state, { type: ACTIONS.PLACE_TILE, tileId: tile.id }) : state;
    }

    case ACTIONS.REMOVE_SLOT: {
      if (!isRunning(state) || state.locked[action.index] || state.slots[action.index] == null) return state;
      const slots = [...state.slots];
      slots[action.index] = null;
      return { ...state, slots };
    }

    case ACTIONS.BACKSPACE: {
      if (!isRunning(state)) return state;
      for (let i = state.slots.length - 1; i >= 0; i -= 1) {
        if (state.slots[i] != null && !state.locked[i]) {
          return reducer(state, { type: ACTIONS.REMOVE_SLOT, index: i });
        }
      }
      return state;
    }

    case ACTIONS.CLEAR: {
      if (!isRunning(state)) return state;
      return { ...state, slots: lockedOnly(state.slots, state.locked) };
    }

    case ACTIONS.SHUFFLE: {
      if (!isRunning(state)) return state;
      return { ...state, tiles: shuffle(state.tiles, action.seed ?? 0) };
    }

    case ACTIONS.USE_CLUE: {
      if (!isRunning(state) || state.clueShown || state.hintsUsed >= MAX_HINTS) return state;
      return {
        ...state,
        clueShown: true,
        hintsUsed: state.hintsUsed + 1,
        lastEvent: makeEvent(state, { type: "hint", hint: "clue" }),
      };
    }

    case ACTIONS.REVEAL_LETTER: {
      if (!isRunning(state) || state.hintsUsed >= MAX_HINTS) return state;
      const answer = answerOf(state);
      // Always leave at least two letters for the teams to place themselves.
      if (state.locked.filter((l) => !l).length <= 2) return state;
      const index = state.locked.findIndex((l) => !l);
      const needed = answer[index];

      const slots = [...state.slots];
      slots[index] = null;
      // Prefer a matching tile that isn't placed; otherwise borrow one from an unlocked slot.
      let tile = state.tiles.find((t) => t.char === needed && !slots.includes(t.id));
      if (!tile) {
        const from = slots.findIndex((id, i) => id != null && !state.locked[i] && tileChar(state, id) === needed);
        tile = state.tiles.find((t) => t.id === slots[from]);
        slots[from] = null;
      }
      slots[index] = tile.id;
      const locked = [...state.locked];
      locked[index] = true;
      return {
        ...state,
        slots,
        locked,
        hintsUsed: state.hintsUsed + 1,
        lastEvent: makeEvent(state, { type: "hint", hint: "letter", index }),
      };
    }

    case ACTIONS.SUBMIT: {
      if (!isRunning(state) || state.slots.includes(null)) return state;
      const guess = state.slots.map((id) => tileChar(state, id)).join("");
      if (guess !== answerOf(state)) return endAttempt(state, "wrong", guess);

      const team = state.teams[state.activeTeamIndex];
      const base = potentialBase(state.hintsUsed);
      const hintPenalty = BASE_POINTS - base;
      const speedBonus = Math.max(
        0,
        Math.min(turnSecondsFor(state), Math.ceil((state.turn.endsAt - action.now) / 1000)),
      );
      // A steal earns half of everything (rounded); a first try earns it all.
      const points = state.steal ? Math.round((base + speedBonus) * STEAL_FACTOR) : base + speedBonus;
      return {
        ...state,
        teams: addScore(state.teams, team.id, points),
        phase: PHASES.ROUND_OVER,
        turn: freshTurn(state, false),
        roundResult: { outcome: "solved", winnerTeamId: team.id, base, hintPenalty, speedBonus, steal: state.steal, points },
        lastEvent: makeEvent(state, { type: "solved", teamId: team.id, points }),
      };
    }

    case ACTIONS.TIME_UP: {
      if (!isRunning(state) || action.now < state.turn.endsAt - TIME_GRACE_MS) return state;
      return endAttempt(state, "timeout");
    }

    case ACTIONS.GIVE_UP: {
      if (state.phase !== PHASES.PLAYING) return state;
      return {
        ...state,
        phase: PHASES.ROUND_OVER,
        turn: freshTurn(state, false),
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
        movies: action.movies,
      });
    }

    case ACTIONS.END_GAME: {
      if (state.phase !== PHASES.PLAYING && state.phase !== PHASES.ROUND_OVER) return state;
      return { ...state, phase: PHASES.FINISHED, turn: freshTurn(state, false), lastEvent: null };
    }

    case ACTIONS.NEW_GAME: {
      return {
        ...createInitialState(),
        teams: state.teams.map((team) => ({ ...team, score: 0 })),
        settings: state.settings,
        usedMovieIds: state.usedMovieIds,
      };
    }

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* Persistence                                                          */
/* ------------------------------------------------------------------ */

/** On load: a timer that was running when the page closed comes back paused. */
export function migrateState(saved, { now } = {}) {
  if (!saved || typeof saved !== "object") return saved;
  const state = { ...createInitialState(), ...saved };
  // Saves from before the steal rule: any earlier try this round means we're on the steal.
  if (typeof saved.steal !== "boolean") state.steal = (saved.attempts?.length ?? 0) > 0;
  // Saves from before online pools only stored the id of a built-in movie.
  if (!state.movie && state.movieId) state.movie = getMovieById(state.movieId);
  if (state.turn?.status === TURN.RUNNING) {
    const remainingMs = Math.max(0, (state.turn.endsAt ?? 0) - (now ?? 0));
    state.turn = { status: TURN.PAUSED, endsAt: null, remainingMs };
  }
  return state;
}

export function isValidState(state) {
  if (!state || typeof state !== "object") return false;
  if (!Object.values(PHASES).includes(state.phase)) return false;
  if (!Array.isArray(state.teams) || !Array.isArray(state.tiles) || !Array.isArray(state.slots)) return false;
  if (state.phase === PHASES.PLAYING || state.phase === PHASES.ROUND_OVER) {
    const movie = state.movie;
    if (!isPlayable(movie) || state.teams.length < 1 || state.activeTeamIndex >= state.teams.length) return false;
    if (state.slots.length !== answerWords(movie).join("").length) return false;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Selectors                                                            */
/* ------------------------------------------------------------------ */

export function selectMovie(state) {
  return state.movie;
}

export function selectActiveTeam(state) {
  return state.teams[state.activeTeamIndex] ?? null;
}

export function selectTeam(state, teamId) {
  return state.teams.find((team) => team.id === teamId) ?? null;
}

/** Word lengths of the answer, for grouping slots. */
export function selectWordLengths(state) {
  const movie = selectMovie(state);
  return movie ? answerWords(movie).map((word) => word.length) : [];
}

export function selectSlotChars(state) {
  return state.slots.map((id) => (id == null ? null : tileChar(state, id)));
}

export function selectCanRevealLetter(state) {
  return state.hintsUsed < MAX_HINTS && state.locked.filter((l) => !l).length > 2;
}

/** Remaining turn time in ms at `now`. */
export function remainingMs(state, now) {
  return state.turn.status === TURN.RUNNING ? Math.max(0, state.turn.endsAt - now) : state.turn.remainingMs;
}
