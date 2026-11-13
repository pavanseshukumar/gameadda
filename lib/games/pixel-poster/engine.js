/**
 * Poster Puzzle — pure game engine.
 *
 * A Telugu movie poster starts hidden (cut into shuffled tiles and blurred)
 * and is revealed in STAGE_COUNT steps as the active team's clock runs. The team types guesses; the sooner
 * they name the movie, the more it's worth. Wrong guesses cost nothing but time.
 *
 * Points for the team that names it:
 *   max(MIN_POINTS, STAGE_POINTS[stage] − (clue ? CLUE_COST : 0))
 * A steal (the one pass per round) is played on the sharpest stage for half of that.
 *
 * The movie (already holding its poster URL) arrives on the action, since the
 * pool and poster lookups are network calls. Anything random or time-based comes
 * in on the action too (`now: Date.now()`), never from inside the reducer.
 *
 * Turn flow inside a round:
 *   ready ──START_TURN──▶ running ──(time up)──▶ next team STEALS: ready, half time, sharpest stage
 *                            │  ▲                  (steal runs out too → round over)
 *                       PAUSE│  │START_TURN
 *                            ▼  │
 *                           paused
 */

import { addScore, buildTeams, isSolo, nextTeamIndex } from "../core/teams";
import { isGuessCorrect } from "../core/movieTitles";

/** Points for naming it at each reveal stage, most hidden first. */
export const STAGE_POINTS = [100, 50];
export const STAGE_COUNT = STAGE_POINTS.length;
export const LAST_STAGE = STAGE_COUNT - 1;
export const CLUE_COST = 15;
export const MIN_POINTS = 5;
/** A steal gets this share of the timer and of the points. */
export const STEAL_FACTOR = 0.5;
export const TURN_SECONDS_OPTIONS = [30, 45, 60];
export const DEFAULT_TURN_SECONDS = 45;
/** Wrong guesses remembered per round (shown so teams don't repeat them). */
const MAX_GUESSES_KEPT = 12;
/** Grace period so a guess at 0.1s left isn't rejected by a slightly late clock. */
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
    /** `{ id, title, year?, lead?, aliases?, article, poster }` */
    movie: null,
    usedMovieIds: [],
    clueShown: false,
    /** Wrong guesses this round, newest last: `[{ teamId, text }]`. */
    guesses: [],
    /** True once the round has passed to the next team for its single steal. */
    steal: false,
    turn: { status: TURN.READY, endsAt: null, remainingMs: DEFAULT_TURN_SECONDS * 1000 },
    /** `{ outcome: "solved"|"unsolved"|"revealed", winnerTeamId, stage, stagePoints, cluePenalty, steal, points }` */
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

/** A movie is playable once it has a title and a poster URL on Wikimedia. */
export function isPlayableMovie(movie) {
  return (
    !!movie &&
    typeof movie.id === "string" &&
    typeof movie.title === "string" &&
    typeof movie.poster === "string" &&
    movie.poster.startsWith("https://upload.wikimedia.org/")
  );
}

function pickMovieFields({ id, title, year, lead, aliases, article, poster }) {
  const movie = { id, title, article: String(article ?? ""), poster };
  if (typeof year === "number") movie.year = year;
  if (typeof lead === "string" && lead) movie.lead = lead;
  if (Array.isArray(aliases) && aliases.length) movie.aliases = aliases.filter((a) => typeof a === "string");
  return movie;
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

/**
 * How sharp the poster is at `now`: the first try walks through every stage
 * across its timer; a steal is always played on the sharpest one.
 */
export function stageAt(state, now) {
  if (state.steal) return LAST_STAGE;
  const totalMs = turnSecondsFor(state, false) * 1000;
  const elapsed = totalMs - remainingMs(state, now);
  return Math.min(LAST_STAGE, Math.max(0, Math.floor((elapsed / totalMs) * STAGE_COUNT)));
}

/** Ms until the poster sharpens again (null on the last stage). */
export function msToNextStage(state, now) {
  const stage = stageAt(state, now);
  if (stage >= LAST_STAGE) return null;
  const totalMs = turnSecondsFor(state, false) * 1000;
  const nextAtElapsed = ((stage + 1) / STAGE_COUNT) * totalMs;
  return Math.max(0, nextAtElapsed - (totalMs - remainingMs(state, now)));
}

/** What naming the movie right now is worth to the active team. */
export function pointsAt(state, stage) {
  const base = Math.max(MIN_POINTS, STAGE_POINTS[stage] - (state.clueShown ? CLUE_COST : 0));
  return state.steal ? Math.max(MIN_POINTS, Math.round(base * STEAL_FACTOR)) : base;
}

function nextUsedIds(state, movieId, recycled) {
  return recycled ? [movieId] : [...state.usedMovieIds.filter((id) => id !== movieId), movieId];
}

function dealMovie(state, { movie, recycled, starterIndex, round, eventType }) {
  const dealt = pickMovieFields(movie);
  return {
    ...state,
    phase: PHASES.PLAYING,
    round,
    roundStarterIndex: starterIndex,
    activeTeamIndex: starterIndex,
    movie: dealt,
    usedMovieIds: nextUsedIds(state, dealt.id, recycled),
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

const NO_WINNER = { winnerTeamId: null, stage: LAST_STAGE, stagePoints: 0, cluePenalty: 0, steal: false, points: 0 };

/* ------------------------------------------------------------------ */
/* Reducer                                                              */
/* ------------------------------------------------------------------ */

export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_GAME: {
      // Starting is async (it waits for a poster), so ignore a late double-start.
      if (state.phase !== PHASES.SETUP || !isPlayableMovie(action.movie)) return state;
      const teams = buildTeams(action.teams ?? []);
      if (teams.length < 1) return state;
      const turnSeconds = TURN_SECONDS_OPTIONS.includes(action.settings?.turnSeconds)
        ? action.settings.turnSeconds
        : DEFAULT_TURN_SECONDS;
      return dealMovie(
        { ...state, teams, settings: { turnSeconds } },
        { movie: action.movie, recycled: !!action.recycled, starterIndex: 0, round: 1, eventType: "round-start" },
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

      if (!isGuessCorrect(state.movie, text)) {
        const guesses = [...state.guesses, { teamId: team.id, text }].slice(-MAX_GUESSES_KEPT);
        return { ...state, guesses, lastEvent: makeEvent(state, { type: "wrong", teamId: team.id, guess: text }) };
      }

      const stage = stageAt(state, action.now);
      const points = pointsAt(state, stage);
      return endRound(
        { ...state, teams: addScore(state.teams, team.id, points) },
        {
          outcome: "solved",
          winnerTeamId: team.id,
          stage,
          stagePoints: STAGE_POINTS[stage],
          cluePenalty: state.clueShown ? CLUE_COST : 0,
          steal: state.steal,
          points,
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
      // The host swaps the poster (it didn't load, or it's a dud) before anyone has seen it sharpen.
      if (state.phase !== PHASES.PLAYING || state.turn.status === TURN.RUNNING) return state;
      if (!isPlayableMovie(action.movie) || action.movie.id === state.movie?.id) return state;
      return dealMovie(state, {
        movie: action.movie,
        recycled: !!action.recycled,
        starterIndex: state.roundStarterIndex,
        round: state.round,
        eventType: "skipped",
      });
    }

    case ACTIONS.GIVE_UP: {
      if (state.phase !== PHASES.PLAYING) return state;
      return endRound(state, { outcome: "revealed", ...NO_WINNER }, { type: "revealed" });
    }

    case ACTIONS.NEXT_ROUND: {
      if (state.phase !== PHASES.ROUND_OVER || !isPlayableMovie(action.movie)) return state;
      return dealMovie(state, {
        movie: action.movie,
        recycled: !!action.recycled,
        starterIndex: nextTeamIndex(state.roundStarterIndex, state.teams.length),
        round: state.round + 1,
        eventType: "round-start",
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
  delete state.effect; // from saves made while effects were selectable
  // Older saves may be on a stage that no longer exists.
  if (state.roundResult) state.roundResult = { ...state.roundResult, stage: Math.min(state.roundResult.stage ?? 0, LAST_STAGE) };
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
    if (!isPlayableMovie(state.movie) || state.teams.length < 1 || state.activeTeamIndex >= state.teams.length) return false;
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

/** "2 words" style hint from the title. */
export function selectWordCount(state) {
  return state.movie ? state.movie.title.split(/\s+/).filter(Boolean).length : 0;
}
