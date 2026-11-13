/**
 * Tune In — pure game engine.
 *
 * The active team hears a 30-second iTunes preview of a Telugu film song. They
 * can play and pause it as they like while their turn clock runs, and type
 * guesses for the MOVIE the song is from. The less of the clip they've heard
 * when they name it, the more it's worth. Wrong guesses cost nothing but time.
 *
 * Points for the team that names it:
 *   max(MIN_POINTS, pointsForHeard(heardSeconds) − (clue ? CLUE_COST : 0))
 * A steal (the one pass per round) gets half the time and half the points.
 *
 * The song (already holding its preview URL) arrives on the action, since the
 * iTunes lookup is a network call. Anything time-based comes in on the action
 * too (`now: Date.now()`), never from inside the reducer.
 *
 * Turn flow inside a round:
 *   ready ──START_TURN──▶ running ──(time up)──▶ next team STEALS: ready, half time
 *                            │  ▲                  (steal runs out too → round over)
 *                       PAUSE│  │START_TURN
 *                            ▼  │
 *                           paused
 */

import { addScore, buildTeams, isSolo, nextTeamIndex } from "../core/teams";
import { isGuessCorrect } from "../core/movieTitles";

/** Points by how far into the clip the room has heard: `[upToSeconds, points]`. */
export const LISTEN_TIERS = Object.freeze([
  [5, 100],
  [10, 75],
  [20, 50],
  [Infinity, 25],
]);
export const CLIP_SECONDS = 30;
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
  HEARD: "HEARD",
  USE_CLUE: "USE_CLUE",
  GUESS: "GUESS",
  TIME_UP: "TIME_UP",
  SKIP_SONG: "SKIP_SONG",
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
    /** `{ id, title (movie), year?, composer?, songTitle, preview, artwork?, artist?, trackUrl? }` */
    song: null,
    usedSongIds: [],
    /** Furthest point of the clip heard this round, in whole seconds. */
    heardSeconds: 0,
    clueShown: false,
    /** Wrong guesses this round, newest last: `[{ teamId, text }]`. */
    guesses: [],
    /** True once the round has passed to the next team for its single steal. */
    steal: false,
    turn: { status: TURN.READY, endsAt: null, remainingMs: DEFAULT_TURN_SECONDS * 1000 },
    /** `{ outcome: "solved"|"unsolved"|"revealed", winnerTeamId, heardSeconds, tierPoints, cluePenalty, steal, points }` */
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

/** A song is playable once it has a movie to guess and an https preview clip. */
export function isPlayableSong(song) {
  return (
    !!song &&
    typeof song.id === "string" &&
    typeof song.title === "string" &&
    typeof song.preview === "string" &&
    song.preview.startsWith("https://")
  );
}

function pickSongFields({ id, title, year, composer, songTitle, preview, artwork, artist, trackUrl }) {
  const song = { id, title, songTitle: String(songTitle ?? ""), preview };
  if (typeof year === "number") song.year = year;
  if (typeof composer === "string" && composer) song.composer = composer;
  if (typeof artwork === "string" && artwork.startsWith("https://")) song.artwork = artwork;
  if (typeof artist === "string" && artist) song.artist = artist;
  if (typeof trackUrl === "string" && trackUrl.startsWith("https://")) song.trackUrl = trackUrl;
  return song;
}

/** Points for naming the movie having heard `seconds` of the clip (before clue and steal). */
export function pointsForHeard(seconds) {
  return LISTEN_TIERS.find(([upTo]) => seconds <= upTo)[1];
}

/** Seconds of clip left before the prize drops to the next tier (null on the last tier). */
export function secondsToNextTier(seconds) {
  const tier = LISTEN_TIERS.find(([upTo]) => seconds <= upTo);
  return Number.isFinite(tier[0]) ? Math.max(0, tier[0] - seconds) : null;
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

/** What naming the movie right now is worth to the active team. */
export function pointsNow(state) {
  const base = Math.max(MIN_POINTS, pointsForHeard(state.heardSeconds) - (state.clueShown ? CLUE_COST : 0));
  return state.steal ? Math.max(MIN_POINTS, Math.round(base * STEAL_FACTOR)) : base;
}

function nextUsedIds(state, songId, recycled) {
  return recycled ? [songId] : [...state.usedSongIds.filter((id) => id !== songId), songId];
}

function dealSong(state, { song, recycled, starterIndex, round, eventType }) {
  const dealt = pickSongFields(song);
  return {
    ...state,
    phase: PHASES.PLAYING,
    round,
    roundStarterIndex: starterIndex,
    activeTeamIndex: starterIndex,
    song: dealt,
    usedSongIds: nextUsedIds(state, dealt.id, recycled),
    heardSeconds: 0,
    clueShown: false,
    guesses: [],
    steal: false,
    turn: freshTurn(state, false),
    roundResult: null,
    lastEvent: makeEvent(state, { type: recycled ? "songs-recycled" : eventType }),
  };
}

function endRound(state, result, event) {
  return {
    ...state,
    phase: PHASES.ROUND_OVER,
    turn: freshTurn(state, false),
    roundResult: { heardSeconds: state.heardSeconds, ...result },
    lastEvent: makeEvent(state, event),
  };
}

const NO_WINNER = { winnerTeamId: null, tierPoints: 0, cluePenalty: 0, steal: false, points: 0 };

/* ------------------------------------------------------------------ */
/* Reducer                                                              */
/* ------------------------------------------------------------------ */

export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_GAME: {
      // Starting is async (it waits for a clip), so ignore a late double-start.
      if (state.phase !== PHASES.SETUP || !isPlayableSong(action.song)) return state;
      const teams = buildTeams(action.teams ?? []);
      if (teams.length < 1) return state;
      const turnSeconds = TURN_SECONDS_OPTIONS.includes(action.settings?.turnSeconds)
        ? action.settings.turnSeconds
        : DEFAULT_TURN_SECONDS;
      return dealSong(
        { ...state, teams, settings: { turnSeconds } },
        { song: action.song, recycled: !!action.recycled, starterIndex: 0, round: 1, eventType: "round-start" },
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

    case ACTIONS.HEARD: {
      // The clip only ever counts further along; replaying the start doesn't lower it.
      const seconds = Math.min(CLIP_SECONDS, Math.floor(Number(action.seconds) || 0));
      if (!isRunning(state) || seconds <= state.heardSeconds) return state;
      return { ...state, heardSeconds: seconds };
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

      if (!isGuessCorrect(state.song, text)) {
        const guesses = [...state.guesses, { teamId: team.id, text }].slice(-MAX_GUESSES_KEPT);
        return { ...state, guesses, lastEvent: makeEvent(state, { type: "wrong", teamId: team.id, guess: text }) };
      }

      const points = pointsNow(state);
      return endRound(
        { ...state, teams: addScore(state.teams, team.id, points) },
        {
          outcome: "solved",
          winnerTeamId: team.id,
          tierPoints: pointsForHeard(state.heardSeconds),
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

    case ACTIONS.SKIP_SONG: {
      // The host swaps the song (the clip won't play, or it's a dud) before the turn starts.
      if (state.phase !== PHASES.PLAYING || state.turn.status === TURN.RUNNING) return state;
      if (!isPlayableSong(action.song) || action.song.id === state.song?.id) return state;
      return dealSong(state, {
        song: action.song,
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
      if (state.phase !== PHASES.ROUND_OVER || !isPlayableSong(action.song)) return state;
      return dealSong(state, {
        song: action.song,
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
        usedSongIds: state.usedSongIds,
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
  if (!Array.isArray(state.teams) || !Array.isArray(state.guesses) || !Array.isArray(state.usedSongIds)) return false;
  if (state.phase === PHASES.PLAYING || state.phase === PHASES.ROUND_OVER) {
    if (!isPlayableSong(state.song) || state.teams.length < 1 || state.activeTeamIndex >= state.teams.length) return false;
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

/** "2 words" style hint from the movie title. */
export function selectWordCount(state) {
  return state.song ? state.song.title.split(/\s+/).filter(Boolean).length : 0;
}
