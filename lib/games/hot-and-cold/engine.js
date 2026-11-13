/**
 * Hot & Cold (movies) — pure game engine.
 *
 * Each round hides a secret Telugu movie. Teams take turns guessing any Telugu
 * movie; every guess gets a temperature (see `temperature.js`) and clue chips
 * showing what it shares with the secret. All guesses stay on one shared board,
 * so teams build on each other's guesses, and whoever names the secret takes the pot.
 *
 * Pot: POT_START − GUESS_COST per guess so far − HINT_COST per hint (never below MIN_POT).
 *
 * Turns: a guess (or running out of time) passes the turn to the next team.
 * After a guess the next team's clock starts straight away; after a timeout
 * the next team gets a "ready" card first, so an empty room doesn't spin forever.
 *
 * The secret and guessed movies arrive on the action (the pool is a network
 * resource), as does anything time-based (`now: Date.now()`).
 */

import { addScore, buildTeams, nextTeamIndex } from "../core/teams";
import { compareMovies } from "./temperature";

export const POT_START = 100;
export const GUESS_COST = 4;
export const HINT_COST = 10;
export const MIN_POT = 20;
export const TURN_SECONDS_OPTIONS = [20, 30, 45];
export const DEFAULT_TURN_SECONDS = 30;
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
  GUESS: "GUESS",
  USE_HINT: "USE_HINT",
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
    /** Output of `prepareSecret()`. */
    secret: null,
    usedSecretIds: [],
    /** `[{ teamId, movie: { id, title, year? }, result }]`, oldest first. */
    guesses: [],
    hintsUsed: 0,
    turn: { status: TURN.READY, endsAt: null, remainingMs: DEFAULT_TURN_SECONDS * 1000 },
    /** `{ outcome: "solved"|"revealed", winnerTeamId, points, guessCount }` */
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

function isValidSecret(secret) {
  return (
    !!secret &&
    typeof secret.id === "string" &&
    typeof secret.title === "string" &&
    Array.isArray(secret.cast) &&
    Array.isArray(secret.directors) &&
    Array.isArray(secret.composers) &&
    Array.isArray(secret.genres) &&
    Array.isArray(secret.hints)
  );
}

function isValidGuessMovie(movie) {
  return !!movie && typeof movie.id === "string" && typeof movie.title === "string" && Array.isArray(movie.c);
}

function isRunning(state) {
  return state.phase === PHASES.PLAYING && state.turn.status === TURN.RUNNING;
}

function turnMs(state) {
  return state.settings.turnSeconds * 1000;
}

function readyTurn(state) {
  return { status: TURN.READY, endsAt: null, remainingMs: turnMs(state) };
}

function runningTurn(state, now) {
  return { status: TURN.RUNNING, endsAt: now + turnMs(state), remainingMs: turnMs(state) };
}

/** What naming the secret is worth right now. */
export function currentPot(state) {
  return Math.max(MIN_POT, POT_START - GUESS_COST * state.guesses.length - HINT_COST * state.hintsUsed);
}

export function remainingMs(state, now) {
  return state.turn.status === TURN.RUNNING ? Math.max(0, state.turn.endsAt - now) : state.turn.remainingMs;
}

function dealSecret(state, { secret, recycled, starterIndex, round }) {
  return {
    ...state,
    phase: PHASES.PLAYING,
    round,
    roundStarterIndex: starterIndex,
    activeTeamIndex: starterIndex,
    secret,
    usedSecretIds: recycled ? [secret.id] : [...state.usedSecretIds.filter((id) => id !== secret.id), secret.id],
    guesses: [],
    hintsUsed: 0,
    turn: readyTurn(state),
    roundResult: null,
    lastEvent: makeEvent(state, { type: recycled ? "movies-recycled" : "round-start" }),
  };
}

/* ------------------------------------------------------------------ */
/* Reducer                                                              */
/* ------------------------------------------------------------------ */

export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_GAME: {
      if (state.phase !== PHASES.SETUP || !isValidSecret(action.secret)) return state;
      const teams = buildTeams(action.teams ?? []);
      if (teams.length < 1) return state;
      const turnSeconds = TURN_SECONDS_OPTIONS.includes(action.settings?.turnSeconds)
        ? action.settings.turnSeconds
        : DEFAULT_TURN_SECONDS;
      return dealSecret(
        { ...state, teams, settings: { turnSeconds } },
        { secret: action.secret, recycled: !!action.recycled, starterIndex: 0, round: 1 },
      );
    }

    case ACTIONS.START_TURN: {
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

    case ACTIONS.GUESS: {
      if (!isRunning(state) || !isValidGuessMovie(action.movie)) return state;
      if (action.now > state.turn.endsAt + TIME_GRACE_MS) return state;
      const team = state.teams[state.activeTeamIndex];
      const movie = action.movie;

      // Already on the board: say so, and let the team pick again on the same clock.
      const earlier = state.guesses.find((g) => g.movie.id === movie.id);
      if (earlier) {
        return { ...state, lastEvent: makeEvent(state, { type: "repeat", title: movie.title, teamId: earlier.teamId }) };
      }

      const result = compareMovies(state.secret, movie);
      const entry = { teamId: team.id, movie: { id: movie.id, title: movie.title, ...(movie.year ? { year: movie.year } : {}) }, result };

      if (result.exact) {
        const points = currentPot(state);
        return {
          ...state,
          teams: addScore(state.teams, team.id, points),
          guesses: [...state.guesses, entry],
          phase: PHASES.ROUND_OVER,
          turn: readyTurn(state),
          roundResult: { outcome: "solved", winnerTeamId: team.id, points, guessCount: state.guesses.length + 1 },
          lastEvent: makeEvent(state, { type: "solved", teamId: team.id, points }),
        };
      }

      const nextIndex = nextTeamIndex(state.activeTeamIndex, state.teams.length);
      return {
        ...state,
        guesses: [...state.guesses, entry],
        activeTeamIndex: nextIndex,
        turn: runningTurn(state, action.now),
        lastEvent: makeEvent(state, { type: "guess", teamId: team.id, title: movie.title, score: result.score, movieId: movie.id }),
      };
    }

    case ACTIONS.USE_HINT: {
      if (!isRunning(state) || state.hintsUsed >= state.secret.hints.length) return state;
      const hint = state.secret.hints[state.hintsUsed];
      return { ...state, hintsUsed: state.hintsUsed + 1, lastEvent: makeEvent(state, { type: "hint", kind: hint.kind }) };
    }

    case ACTIONS.TIME_UP: {
      if (!isRunning(state) || action.now < state.turn.endsAt - TIME_GRACE_MS) return state;
      const team = state.teams[state.activeTeamIndex];
      const nextIndex = nextTeamIndex(state.activeTeamIndex, state.teams.length);
      return {
        ...state,
        activeTeamIndex: nextIndex,
        turn: readyTurn(state),
        lastEvent: makeEvent(state, { type: "timeout", teamId: team.id, nextTeamId: state.teams[nextIndex].id }),
      };
    }

    case ACTIONS.GIVE_UP: {
      if (state.phase !== PHASES.PLAYING) return state;
      return {
        ...state,
        phase: PHASES.ROUND_OVER,
        turn: readyTurn(state),
        roundResult: { outcome: "revealed", winnerTeamId: null, points: 0, guessCount: state.guesses.length },
        lastEvent: makeEvent(state, { type: "revealed" }),
      };
    }

    case ACTIONS.NEXT_ROUND: {
      if (state.phase !== PHASES.ROUND_OVER || !isValidSecret(action.secret)) return state;
      return dealSecret(state, {
        secret: action.secret,
        recycled: !!action.recycled,
        starterIndex: nextTeamIndex(state.roundStarterIndex, state.teams.length),
        round: state.round + 1,
      });
    }

    case ACTIONS.END_GAME: {
      if (state.phase !== PHASES.PLAYING && state.phase !== PHASES.ROUND_OVER) return state;
      return { ...state, phase: PHASES.FINISHED, turn: readyTurn(state), lastEvent: null };
    }

    case ACTIONS.NEW_GAME: {
      return {
        ...createInitialState(),
        teams: state.teams.map((team) => ({ ...team, score: 0 })),
        settings: state.settings,
        usedSecretIds: state.usedSecretIds,
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
  if (state.turn?.status === TURN.RUNNING) {
    state.turn = { status: TURN.PAUSED, endsAt: null, remainingMs: Math.max(0, (state.turn.endsAt ?? 0) - (now ?? 0)) };
  }
  return state;
}

export function isValidState(state) {
  if (!state || typeof state !== "object") return false;
  if (!Object.values(PHASES).includes(state.phase)) return false;
  if (!Array.isArray(state.teams) || !Array.isArray(state.guesses) || !Array.isArray(state.usedSecretIds)) return false;
  if (state.phase === PHASES.PLAYING || state.phase === PHASES.ROUND_OVER) {
    if (!isValidSecret(state.secret) || state.teams.length < 1 || state.activeTeamIndex >= state.teams.length) return false;
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

/** Guesses hottest first (ties: most recent first). */
export function selectRankedGuesses(state) {
  return state.guesses
    .map((guess, index) => ({ ...guess, index }))
    .sort((a, b) => b.result.score - a.result.score || b.index - a.index);
}

export function selectHints(state) {
  return state.secret ? state.secret.hints.slice(0, state.hintsUsed) : [];
}

export function selectCanHint(state) {
  return !!state.secret && state.hintsUsed < state.secret.hints.length;
}
