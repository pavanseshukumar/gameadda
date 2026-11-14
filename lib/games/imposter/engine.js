/**
 * Imposter — pure game engine.
 *
 * Everyone secretly sees the same word except the imposter(s). Players take
 * turns giving a one-word clue, discuss, and vote one player out.
 *
 * Purity: anything random or time-based comes in on the action
 * (`seed: Math.random()`, `now: Date.now()`), never from inside the reducer.
 *
 * Round flow:
 *   reveal (pass the phone; each player views their card, then hides it)
 *     → discuss (a random player starts the clues; optional timer)
 *     → vote (the host taps who the group voted out)
 *         innocent voted out ─────────────▶ roundOver: imposters escape
 *         imposter voted out → guess ─────▶ roundOver: caught (imposter names the word or not)
 *
 * Scoring:
 *   imposter caught and misses the word   every crew member +CREW_WIN
 *   imposter caught but names the word    every imposter +STEAL_WIN
 *   imposter not caught                   every imposter +ESCAPE_WIN
 */

import { drawWithoutRepeat } from "../core/random";
import { createRandom, shuffle } from "../core/shuffle";
import { teamColor } from "../core/teams";
import { IMPOSTER_CATEGORY_IDS, wordsIn } from "./words";

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
/** A second imposter is allowed from this many players. */
export const TWO_IMPOSTERS_FROM = 6;
export const CREW_WIN = 2;
export const STEAL_WIN = 2;
export const ESCAPE_WIN = 3;
/** 0 = no timer. */
export const DISCUSS_OPTIONS = [0, 120, 180, 300];
export const DEFAULT_DISCUSS_SECONDS = 180;

/** Default name for the player in this slot (0-based). */
export function defaultPlayerName(index) {
  return `Player ${index + 1}`;
}

/** What a player's avatar shows: their number for "Player 3", otherwise their initial. */
export function playerMark(name) {
  return /^player\s+(\d+)$/i.exec(name.trim())?.[1] ?? name.trim().charAt(0).toUpperCase();
}

export const PHASES = Object.freeze({
  SETUP: "setup",
  REVEAL: "reveal",
  DISCUSS: "discuss",
  VOTE: "vote",
  GUESS: "guess",
  ROUND_OVER: "roundOver",
  FINISHED: "finished",
});

export const TIMER = Object.freeze({ READY: "ready", RUNNING: "running", PAUSED: "paused" });

export const ACTIONS = Object.freeze({
  START_GAME: "START_GAME",
  SHOW_CARD: "SHOW_CARD",
  HIDE_CARD: "HIDE_CARD",
  SKIP_WORD: "SKIP_WORD",
  START_TIMER: "START_TIMER",
  PAUSE_TIMER: "PAUSE_TIMER",
  GO_TO_VOTE: "GO_TO_VOTE",
  BACK_TO_DISCUSS: "BACK_TO_DISCUSS",
  VOTE: "VOTE",
  IMPOSTER_GUESS: "IMPOSTER_GUESS",
  NEXT_ROUND: "NEXT_ROUND",
  END_GAME: "END_GAME",
  NEW_GAME: "NEW_GAME",
});

export function createInitialState() {
  return {
    phase: PHASES.SETUP,
    players: [],
    settings: {
      imposterCount: 1,
      categories: [...IMPOSTER_CATEGORY_IDS],
      imposterHint: true,
      discussSeconds: DEFAULT_DISCUSS_SECONDS,
    },
    round: 0,
    word: null, // { id, text, category }
    usedWordIds: [],
    imposterIds: [],
    revealIndex: 0,
    cardShown: false,
    starterIndex: 0,
    timer: { status: TIMER.READY, startedAt: null, remainingMs: 0 },
    votedId: null,
    roundResult: null, // { outcome: "caught" | "stolen" | "escaped", votedId, points: { [playerId]: n } }
  };
}

/** Most imposters allowed for this many players. */
export function maxImposters(playerCount) {
  return playerCount >= TWO_IMPOSTERS_FROM ? 2 : 1;
}

export function buildPlayers(drafts) {
  return drafts.slice(0, MAX_PLAYERS).map((draft, index) => ({
    id: String(draft.id),
    name: draft.name?.trim() || defaultPlayerName(index),
    color: teamColor(index),
    score: 0,
  }));
}

/** Deal a fresh round: new word, new imposters, new first speaker. */
function dealRound(state, seed) {
  const random = createRandom(seed);
  const pool = wordsIn(state.settings.categories);
  const drawn = drawWithoutRepeat(
    pool.map((w) => w.id),
    state.usedWordIds,
    random(),
    state.word?.id ?? null,
  );
  const word = pool.find((w) => w.id === drawn.id) ?? null;
  const count = Math.min(state.settings.imposterCount, maxImposters(state.players.length));
  const imposterIds = shuffle(
    state.players.map((p) => p.id),
    random(),
  ).slice(0, count);

  return {
    ...state,
    phase: PHASES.REVEAL,
    round: state.round + 1,
    word,
    usedWordIds: drawn.usedIds,
    imposterIds,
    revealIndex: 0,
    cardShown: false,
    starterIndex: Math.floor(random() * state.players.length),
    timer: { status: TIMER.READY, startedAt: null, remainingMs: state.settings.discussSeconds * 1000 },
    votedId: null,
    roundResult: null,
  };
}

function award(players, ids, points) {
  return players.map((p) => (ids.includes(p.id) ? { ...p, score: p.score + points } : p));
}

function finishRound(state, outcome) {
  const imposters = state.imposterIds;
  const crew = state.players.map((p) => p.id).filter((id) => !imposters.includes(id));
  const [ids, points] = outcome === "caught" ? [crew, CREW_WIN] : outcome === "stolen" ? [imposters, STEAL_WIN] : [imposters, ESCAPE_WIN];
  return {
    ...state,
    phase: PHASES.ROUND_OVER,
    timer: { ...state.timer, status: TIMER.READY, startedAt: null },
    players: award(state.players, ids, points),
    roundResult: { outcome, votedId: state.votedId, points: Object.fromEntries(ids.map((id) => [id, points])) },
  };
}

/** Discussion time left, in ms. */
export function remainingMs(state, now) {
  const { timer } = state;
  if (timer.status !== TIMER.RUNNING) return timer.remainingMs;
  return Math.max(0, timer.remainingMs - (now - timer.startedAt));
}

export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_GAME: {
      const players = buildPlayers(action.players ?? []);
      if (players.length < MIN_PLAYERS) return state;
      const categories = (action.settings?.categories ?? []).filter((id) => IMPOSTER_CATEGORY_IDS.includes(id));
      const settings = {
        ...state.settings,
        ...action.settings,
        categories: categories.length ? categories : [...IMPOSTER_CATEGORY_IDS],
        imposterCount: Math.max(1, Math.min(action.settings?.imposterCount ?? 1, maxImposters(players.length))),
      };
      return dealRound({ ...createInitialState(), players, settings, usedWordIds: state.usedWordIds }, action.seed);
    }

    case ACTIONS.SHOW_CARD:
      return state.phase === PHASES.REVEAL && !state.cardShown ? { ...state, cardShown: true } : state;

    case ACTIONS.HIDE_CARD: {
      if (state.phase !== PHASES.REVEAL || !state.cardShown) return state;
      const next = state.revealIndex + 1;
      if (next < state.players.length) return { ...state, revealIndex: next, cardShown: false };
      return { ...state, phase: PHASES.DISCUSS, cardShown: false };
    }

    // Someone recognised a problem with the word (e.g. nobody knows it): redeal before discussion starts.
    case ACTIONS.SKIP_WORD:
      if (state.phase !== PHASES.REVEAL && state.phase !== PHASES.DISCUSS) return state;
      return dealRound({ ...state, round: state.round - 1 }, action.seed);

    case ACTIONS.START_TIMER:
      if (state.phase !== PHASES.DISCUSS || state.timer.status === TIMER.RUNNING || !state.settings.discussSeconds) return state;
      return { ...state, timer: { ...state.timer, status: TIMER.RUNNING, startedAt: action.now } };

    case ACTIONS.PAUSE_TIMER:
      if (state.timer.status !== TIMER.RUNNING) return state;
      return { ...state, timer: { status: TIMER.PAUSED, startedAt: null, remainingMs: remainingMs(state, action.now) } };

    case ACTIONS.GO_TO_VOTE:
      if (state.phase !== PHASES.DISCUSS) return state;
      return {
        ...state,
        phase: PHASES.VOTE,
        timer:
          state.timer.status === TIMER.RUNNING
            ? { status: TIMER.PAUSED, startedAt: null, remainingMs: remainingMs(state, action.now ?? state.timer.startedAt) }
            : state.timer,
      };

    case ACTIONS.BACK_TO_DISCUSS:
      return state.phase === PHASES.VOTE ? { ...state, phase: PHASES.DISCUSS } : state;

    case ACTIONS.VOTE: {
      if (state.phase !== PHASES.VOTE || !state.players.some((p) => p.id === action.playerId)) return state;
      const voted = { ...state, votedId: action.playerId };
      return state.imposterIds.includes(action.playerId) ? { ...voted, phase: PHASES.GUESS } : finishRound(voted, "escaped");
    }

    case ACTIONS.IMPOSTER_GUESS:
      if (state.phase !== PHASES.GUESS) return state;
      return finishRound(state, action.correct ? "stolen" : "caught");

    case ACTIONS.NEXT_ROUND:
      return state.phase === PHASES.ROUND_OVER ? dealRound(state, action.seed) : state;

    case ACTIONS.END_GAME:
      return state.phase === PHASES.SETUP || state.phase === PHASES.FINISHED ? state : { ...state, phase: PHASES.FINISHED };

    case ACTIONS.NEW_GAME:
      // Keep the players, settings and word history for the next game.
      return { ...createInitialState(), players: state.players.map((p) => ({ ...p, score: 0 })), settings: state.settings, usedWordIds: state.usedWordIds };

    default:
      return state;
  }
}

/* ── Selectors ───────────────────────────────────────────────────────── */

export function selectPlayer(state, id) {
  return state.players.find((p) => p.id === id) ?? null;
}

export function isImposter(state, id) {
  return state.imposterIds.includes(id);
}

/** Speaking order for the clue round, starting from the random first speaker. */
export function selectSpeakingOrder(state) {
  const n = state.players.length;
  return Array.from({ length: n }, (_, i) => state.players[(state.starterIndex + i) % n]);
}

/* ── Persistence ─────────────────────────────────────────────────────── */

/** A saved game resumes with the discussion timer paused. */
export function migrateState(state, { now }) {
  if (state?.timer?.status !== TIMER.RUNNING) return state;
  return { ...state, timer: { status: TIMER.PAUSED, startedAt: null, remainingMs: remainingMs(state, now) } };
}

export function isValidState(state) {
  return (
    !!state &&
    Object.values(PHASES).includes(state.phase) &&
    Array.isArray(state.players) &&
    Array.isArray(state.imposterIds) &&
    Array.isArray(state.usedWordIds) &&
    typeof state.settings === "object" &&
    (state.phase === PHASES.SETUP || state.phase === PHASES.FINISHED || (state.word && state.players.length >= MIN_PLAYERS))
  );
}
