/**
 * Emoji Talkies — pure game engine.
 *
 * The active team sees a Telugu movie spelled out in emoji and types guesses
 * against the clock. Naming it straight away is worth START_POINTS; the value
 * slides down to END_POINTS as the turn runs, so a quick read pays. Wrong guesses
 * cost nothing but time. A clue (year and lead) costs CLUE_COST.
 *
 *   points = max(MIN_POINTS, worth(elapsed) − (clue ? CLUE_COST : 0)), × STEAL_FACTOR on a steal
 *
 * The puzzle list is bundled (lib/games/emoji-talkies/movies.js), so the engine
 * draws movies itself; the randomness and the time still come in on the action
 * (`random: Math.random()`, `now: Date.now()`), never from inside the reducer.
 *
 * Turn flow inside a round:
 *   ready ──START_TURN──▶ running ──(time up)──▶ next team STEALS: ready, half time
 *                            │  ▲                  (steal runs out too → round over)
 *                       PAUSE│  │START_TURN
 *                            ▼  │
 *                           paused
 */

import { addScore, buildTeams, isSolo, nextTeamIndex } from "../core/teams";
import { acceptedTitles, isGuessCorrect, titleKey } from "../core/movieTitles";
import { drawWithoutRepeat } from "../core/random";
import { EMOJI_MOVIES } from "./movies";

export const START_POINTS = 100;
export const END_POINTS = 40;
/** Worth drops in steps of this many points, so the number doesn't flicker every tick. */
const POINT_STEP = 5;
export const CLUE_COST = 20;
export const MIN_POINTS = 10;
/** A steal gets this share of the timer and of the points. */
export const STEAL_FACTOR = 0.5;
export const TURN_SECONDS_OPTIONS = [30, 45, 60];
export const DEFAULT_TURN_SECONDS = 45;
const MAX_GUESSES_KEPT = 12;
/** Grace period so a guess at 0.1s left isn't rejected by a slightly late clock. */
const TIME_GRACE_MS = 300;

const MOVIE_IDS = EMOJI_MOVIES.map((movie) => movie.id);
const MOVIES_BY_ID = new Map(EMOJI_MOVIES.map((movie) => [movie.id, movie]));
export const MOVIE_COUNT = EMOJI_MOVIES.length;

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
  USE_CLUE: "USE_CLUE",
  GUESS: "GUESS",
  TIME_UP: "TIME_UP",
  SKIP_MOVIE: "SKIP_MOVIE",
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
    /** Id of the movie in play (look it up with `selectMovie`). */
    movieId: null,
    usedMovieIds: [],
    clueShown: false,
    /** Wrong guesses this round, newest last: `[{ teamId, text }]`. */
    guesses: [],
    /** True once the round has passed to the next team for its single steal. */
    steal: false,
    turn: { status: TURN.READY, endsAt: null, remainingMs: DEFAULT_TURN_SECONDS * 1000 },
    /** `{ outcome: "solved"|"unsolved"|"revealed", winnerTeamId, worth, cluePenalty, steal, points, seconds }` */
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

/** Seconds for a turn: the full timer, or half of it (rounded up) for a steal. */
export function turnSecondsFor(state, steal = state.steal) {
  return steal ? Math.ceil(state.settings.turnSeconds * STEAL_FACTOR) : state.settings.turnSeconds;
}

function freshTurn(state, steal = state.steal) {
  return { status: TURN.READY, endsAt: null, remainingMs: turnSecondsFor(state, steal) * 1000 };
}

function isRunning(state) {
  return state.phase === PHASES.PLAYING && state.turn.status === TURN.RUNNING;
}

/** Remaining turn time in ms at `now`. */
export function remainingMs(state, now) {
  return state.turn.status === TURN.RUNNING ? Math.max(0, state.turn.endsAt - now) : state.turn.remainingMs;
}

/** What the clue-free answer is worth with `left` ms on the clock: START_POINTS sliding to END_POINTS. */
export function worthAt(state, left) {
  const totalMs = turnSecondsFor(state) * 1000;
  const elapsed = Math.min(1, Math.max(0, (totalMs - left) / totalMs));
  const raw = START_POINTS - (START_POINTS - END_POINTS) * elapsed;
  return Math.max(END_POINTS, Math.ceil(raw / POINT_STEP) * POINT_STEP);
}

/** What naming the movie right now is worth to the active team. */
export function pointsAt(state, left) {
  const base = Math.max(MIN_POINTS, worthAt(state, left) - (state.clueShown ? CLUE_COST : 0));
  return state.steal ? Math.max(MIN_POINTS, Math.round((base * STEAL_FACTOR) / POINT_STEP) * POINT_STEP) : base;
}

/**
 * True when a typed guess names the movie. An exact match (ignoring case and
 * punctuation) always counts first: the shared phonetic check squeezes "RRR" to "r".
 */
export function isAnswer(movie, guess) {
  const plain = titleKey(guess);
  if (movie && plain.length >= 2 && acceptedTitles(movie).some((title) => titleKey(title) === plain)) return true;
  return isGuessCorrect(movie, guess);
}

/** Pick an unplayed movie. `random` in [0, 1) comes from the action. */
function drawMovie(state, random, avoidId = null) {
  const draw = drawWithoutRepeat(MOVIE_IDS, state.usedMovieIds, random, avoidId);
  return { movieId: draw.id, usedMovieIds: draw.usedIds, recycled: draw.recycled };
}

function dealMovie(state, { random, starterIndex, round, eventType, avoidId = null }) {
  const { movieId, usedMovieIds, recycled } = drawMovie(state, random, avoidId);
  return {
    ...state,
    phase: PHASES.PLAYING,
    round,
    roundStarterIndex: starterIndex,
    activeTeamIndex: starterIndex,
    movieId,
    usedMovieIds,
    clueShown: false,
    guesses: [],
    steal: false,
    turn: freshTurn(state, false),
    roundResult: null,
    lastEvent: makeEvent(state, { type: recycled ? "movies-recycled" : eventType }),
  };
}

function endRound(state, result, event) {
  return {
    ...state,
    phase: PHASES.ROUND_OVER,
    turn: freshTurn(state, false),
    roundResult: result,
    lastEvent: makeEvent(state, event),
  };
}

const NO_WINNER = { winnerTeamId: null, worth: 0, cluePenalty: 0, steal: false, points: 0, seconds: null };

function randomOf(action) {
  return typeof action.random === "number" && action.random >= 0 && action.random < 1 ? action.random : 0;
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
      const turnSeconds = TURN_SECONDS_OPTIONS.includes(action.settings?.turnSeconds)
        ? action.settings.turnSeconds
        : DEFAULT_TURN_SECONDS;
      return dealMovie(
        { ...state, teams, settings: { turnSeconds } },
        { random: randomOf(action), starterIndex: 0, round: 1, eventType: "round-start" },
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

    case ACTIONS.USE_CLUE: {
      if (!isRunning(state) || state.clueShown) return state;
      return { ...state, clueShown: true, lastEvent: makeEvent(state, { type: "hint" }) };
    }

    case ACTIONS.GUESS: {
      if (!isRunning(state) || action.now > state.turn.endsAt + TIME_GRACE_MS) return state;
      const text = String(action.title ?? "").trim().slice(0, 80);
      if (!text) return state;
      const team = state.teams[state.activeTeamIndex];
      const movie = selectMovie(state);

      if (!isAnswer(movie, text)) {
        const guesses = [...state.guesses, { teamId: team.id, text }].slice(-MAX_GUESSES_KEPT);
        return { ...state, guesses, lastEvent: makeEvent(state, { type: "wrong", teamId: team.id, guess: text }) };
      }

      const left = remainingMs(state, action.now);
      const points = pointsAt(state, left);
      return endRound(
        { ...state, teams: addScore(state.teams, team.id, points) },
        {
          outcome: "solved",
          winnerTeamId: team.id,
          worth: worthAt(state, left),
          cluePenalty: state.clueShown ? CLUE_COST : 0,
          steal: state.steal,
          points,
          seconds: Math.max(1, Math.round((turnSecondsFor(state) * 1000 - left) / 1000)),
        },
        { type: "solved", teamId: team.id, points, guess: text },
      );
    }

    case ACTIONS.TIME_UP: {
      if (!isRunning(state) || action.now < state.turn.endsAt - TIME_GRACE_MS) return state;
      const team = state.teams[state.activeTeamIndex];
      // The steal ran out too (or there's nobody to steal in solo): nobody gets it.
      if (state.steal || isSolo(state.teams)) {
        return endRound(state, { outcome: "unsolved", ...NO_WINNER }, { type: "timeout", teamId: team.id });
      }
      const nextIndex = nextTeamIndex(state.activeTeamIndex, state.teams.length);
      return {
        ...state,
        steal: true,
        activeTeamIndex: nextIndex,
        turn: freshTurn(state, true),
        lastEvent: makeEvent(state, { type: "timeout", teamId: team.id, nextTeamId: state.teams[nextIndex].id, steal: true }),
      };
    }

    case ACTIONS.SKIP_MOVIE: {
      // Swap the puzzle before the turn starts (someone already knows it, or it's a dud).
      if (state.phase !== PHASES.PLAYING || state.turn.status !== TURN.READY || state.steal) return state;
      return dealMovie(state, {
        random: randomOf(action),
        starterIndex: state.roundStarterIndex,
        round: state.round,
        eventType: "skipped",
        avoidId: state.movieId,
      });
    }

    case ACTIONS.GIVE_UP: {
      if (state.phase !== PHASES.PLAYING) return state;
      return endRound(state, { outcome: "revealed", ...NO_WINNER }, { type: "revealed" });
    }

    case ACTIONS.NEXT_ROUND: {
      if (state.phase !== PHASES.ROUND_OVER) return state;
      return dealMovie(state, {
        random: randomOf(action),
        starterIndex: nextTeamIndex(state.roundStarterIndex, state.teams.length),
        round: state.round + 1,
        eventType: "round-start",
        avoidId: state.movieId,
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
  state.settings = { turnSeconds: saved.settings?.turnSeconds ?? DEFAULT_TURN_SECONDS };
  if (state.turn?.status === TURN.RUNNING) {
    const remainingMs = Math.max(0, (state.turn.endsAt ?? 0) - (now ?? 0));
    state.turn = { status: TURN.PAUSED, endsAt: null, remainingMs };
  }
  return state;
}

export function isValidState(state) {
  if (!state || typeof state !== "object") return false;
  if (!Object.values(PHASES).includes(state.phase)) return false;
  if (!Array.isArray(state.teams) || !Array.isArray(state.guesses) || !Array.isArray(state.usedMovieIds)) return false;
  if (state.phase === PHASES.PLAYING || state.phase === PHASES.ROUND_OVER) {
    // A movie removed from the list since the save can't be shown.
    if (!MOVIES_BY_ID.has(state.movieId) || state.teams.length < 1 || state.activeTeamIndex >= state.teams.length) return false;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Selectors                                                            */
/* ------------------------------------------------------------------ */

/** @returns {import("./movies").EmojiMovie | null} */
export function selectMovie(state) {
  return MOVIES_BY_ID.get(state.movieId) ?? null;
}

/** The clue as tiles: "🦁 ⛰️" → ["🦁", "⛰️"]. */
export function selectEmojiTiles(state) {
  return selectMovie(state)?.emoji.split(/\s+/).filter(Boolean) ?? [];
}

export function selectActiveTeam(state) {
  return state.teams[state.activeTeamIndex] ?? null;
}

export function selectTeam(state, teamId) {
  return state.teams.find((team) => team.id === teamId) ?? null;
}

/** Words in the title, ignoring a subtitle ("Pushpa: The Rise" → 1). */
export function selectWordCount(state) {
  const title = selectMovie(state)?.title.split(":")[0] ?? "";
  return title.split(/\s+/).filter(Boolean).length;
}
