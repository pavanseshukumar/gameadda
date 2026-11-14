/**
 * Pure game rules. Each transition takes a session and returns a new one;
 * time (`now`) and randomness (`rng`) are passed in so the engine is
 * deterministic under test and contains no UI or storage concerns.
 */
import { STANDARD_CATEGORY_IDS } from "../data/categories.js";
import { buildWordPool, drawWord } from "../word-bank/index.js";
import { getTurnPoints, leadingTeamIds, SCORING_RULES } from "../scoring/index.js";
import { pickRandom, uid } from "../utils/index.js";
import { finishIndex, generateBoard } from "./board.js";
import { CHALLENGES } from "../data/challenges.js";
import {
  assignChallenge,
  availableChallenges,
  DEFAULT_CHALLENGE_SETTINGS,
  normalizeChallengeSettings,
} from "./challenges.js";
import { createTimer, elapsed, pauseTimer, startTimer } from "./timer.js";

/** @typedef {import('../types.js').GameSession} GameSession */
/** @typedef {import('../types.js').GameSettings} GameSettings */
/** @typedef {import('../types.js').Team} Team */
/** @typedef {import('../types.js').CategoryId} CategoryId */
/** @typedef {{ now?: number, rng?: () => number }} Deps */

/** Chance that a Quick Play turn becomes All Play (when enabled). */
const QUICK_ALL_PLAY_CHANCE = 0.2;

/** @type {GameSettings} */
export const DEFAULT_SETTINGS = {
  mode: "quick",
  timerSeconds: 60,
  difficulty: "mixed",
  categories: [...STANDARD_CATEGORY_IDS, "all-play"],
  rounds: 5,
  boardLength: 30,
  keepTurnOnSuccess: false,
  difficultyBonus: false,
  maxSkipsPerTurn: 1,
  includeCustomWords: true,
  ...DEFAULT_CHALLENGE_SETTINGS,
};

export const TIMER_OPTIONS = [30, 60, 90, 120];
export const ROUND_LIMITS = { min: 1, max: 20 };
export const TEAM_LIMITS = { min: 2, max: 4 };

function emptyStats() {
  return { turns: 0, correct: 0, steals: 0, skips: 0, timeUsedMs: 0, fastestMs: null };
}

/**
 * @param {{ settings: GameSettings, teams: { name: string, color: string, players: { name: string }[] }[] }} config
 * @param {{ customWords?: import('../types.js').Word[] } & Deps} [deps]
 * @returns {GameSession}
 */
export function createSession(config, { customWords = [], now = Date.now(), rng = Math.random } = {}) {
  const settings = {
    ...DEFAULT_SETTINGS,
    ...config.settings,
    ...normalizeChallengeSettings(config.settings),
  };
  const teams = config.teams.map((t, i) => ({
    id: uid("team"),
    name: t.name.trim() || `Team ${i + 1}`,
    color: t.color,
    players: t.players
      .map((p) => p.name.trim())
      .filter(Boolean)
      .map((name) => ({ id: uid("player"), name })),
    score: 0,
    position: 0,
    drawerIndex: 0,
    stats: emptyStats(),
  }));

  return {
    id: uid("game"),
    createdAt: now,
    updatedAt: now,
    mode: settings.mode,
    settings,
    teams,
    board: settings.mode === "classic" ? generateBoard(settings.boardLength, settings.categories, rng) : null,
    phase: "lobby",
    activeTeamIndex: 0,
    round: 1,
    turnNumber: 0,
    currentTurn: null,
    history: [],
    usedWordIds: [],
    customWords: settings.includeCustomWords ? customWords : [],
    winnerTeamIds: [],
    endedEarly: false,
    finishedAt: null,
  };
}

// ── Selectors ─────────────────────────────────────────────────────────────

/** @param {GameSession} s */
export function activeTeam(s) {
  return s.teams[s.activeTeamIndex];
}

export function teamById(s, id) {
  return s.teams.find((t) => t.id === id) ?? null;
}

/** Name of whoever draws next for a team, or a friendly fallback. */
export function drawerFor(team) {
  if (!team.players.length) return `${team.name} artist`;
  return team.players[team.drawerIndex % team.players.length].name;
}

export function nextTeamIndex(s) {
  const last = s.currentTurn;
  const keep =
    s.mode === "classic" &&
    s.settings.keepTurnOnSuccess &&
    last?.result === "correct" &&
    last.scoringTeamId === last.teamId;
  return keep ? s.activeTeamIndex : (s.activeTeamIndex + 1) % s.teams.length;
}

/** @param {GameSession} s */
export function isGameOver(s) {
  if (s.mode === "classic") return s.winnerTeamIds.length > 0;
  return (
    s.currentTurn?.result != null &&
    s.round >= s.settings.rounds &&
    s.activeTeamIndex === s.teams.length - 1
  );
}

export function skipsLeft(s) {
  return Math.max(0, s.settings.maxSkipsPerTurn - (s.currentTurn?.skips ?? 0));
}

/** Total turns in a Quick Play game. */
export function totalQuickTurns(s) {
  return s.settings.rounds * s.teams.length;
}

// ── Transitions ───────────────────────────────────────────────────────────

function touch(s, now) {
  return { ...s, updatedAt: now };
}

/** @param {GameSession} s @returns {CategoryId} */
function chooseCategory(s, team, rng) {
  const standard = s.settings.categories.filter((c) => STANDARD_CATEGORY_IDS.includes(c));
  const allPlayOn = s.settings.categories.includes("all-play");

  if (s.mode === "classic") {
    const space = s.board[team.position];
    if (space?.category) return space.category;
    return pickRandom(standard.length ? standard : STANDARD_CATEGORY_IDS, rng);
  }
  if (allPlayOn && (!standard.length || rng() < QUICK_ALL_PLAY_CHANCE)) return "all-play";
  return pickRandom(standard, rng);
}

function pool(s) {
  return buildWordPool(s.customWords);
}

/**
 * The category guessers are told. When a category runs dry the word bank
 * borrows from another one; announcing the original would be a false clue.
 * All Play keeps its label because it describes who guesses, not the word.
 */
function announcedCategory(requested, word) {
  return requested === "all-play" ? requested : word.category;
}

/** Prepare the active team's turn: pick category, drawer and secret word. */
function startTurn(s, { now = Date.now(), rng = Math.random } = {}) {
  const team = activeTeam(s);
  const category = chooseCategory(s, team, rng);
  const { word, recycled } = drawWord({
    pool: pool(s),
    category,
    difficulty: s.settings.difficulty,
    usedIds: s.usedWordIds,
    rng,
  });
  const turnNumber = s.turnNumber + 1;

  return touch(
    {
      ...s,
      phase: "handoff",
      turnNumber,
      usedWordIds: [...s.usedWordIds, word.id],
      currentTurn: {
        id: uid("turn"),
        number: turnNumber,
        round: s.round,
        teamId: team.id,
        drawerName: drawerFor(team),
        // Fixed for the life of the turn (persisted, so a refresh never re-rolls it).
        challengeId: assignChallenge(s.settings, s.currentTurn?.challengeId, rng),
        requestedCategory: category,
        category: announcedCategory(category, word),
        isAllPlay: category === "all-play",
        word,
        recycledWord: recycled,
        timer: createTimer(s.settings.timerSeconds),
        skips: 0,
        result: null,
        scoringTeamId: null,
        points: 0,
        timeUsedMs: null,
        move: null,
      },
    },
    now,
  );
}

/** Lobby → first turn. */
export function beginGame(s, deps) {
  if (s.phase !== "lobby") return s;
  return startTurn(s, deps);
}

/**
 * Host Selects: set (or change) this turn's challenge. Only before the
 * drawer opens the word, so a turn can never switch challenges mid-draw.
 */
export function selectChallenge(s, challengeId, { now = Date.now() } = {}) {
  const turn = s.currentTurn;
  if (s.phase !== "handoff" || !turn || s.settings.challengeMode !== "host") return s;
  if (!CHALLENGES[challengeId] || !availableChallenges(s.settings).includes(challengeId)) return s;
  if (turn.challengeId === challengeId) return s;
  return touch({ ...s, currentTurn: { ...turn, challengeId } }, now);
}

/** Drawer has the device privately; show the reveal screen. */
export function openReveal(s, { now = Date.now() } = {}) {
  if (s.phase !== "handoff" && s.phase !== "reveal") return s;
  // Host Selects: the drawer can't see the word until a challenge is chosen.
  if (s.currentTurn?.challengeId === null) return s;
  return touch({ ...s, phase: "reveal" }, now);
}

/** Word hidden, timer starts (or resumes after a skip). */
export function startDrawing(s, { now = Date.now() } = {}) {
  if (s.phase !== "reveal" || !s.currentTurn) return s;
  return touch(
    { ...s, phase: "drawing", currentTurn: { ...s.currentTurn, timer: startTimer(s.currentTurn.timer, now) } },
    now,
  );
}

export function pauseTurn(s, { now = Date.now() } = {}) {
  if (s.phase !== "drawing") return s;
  return touch({ ...s, currentTurn: { ...s.currentTurn, timer: pauseTimer(s.currentTurn.timer, now) } }, now);
}

export function resumeTurn(s, { now = Date.now() } = {}) {
  if (s.phase !== "drawing") return s;
  return touch({ ...s, currentTurn: { ...s.currentTurn, timer: startTimer(s.currentTurn.timer, now) } }, now);
}

/**
 * Swap the secret word (same category). The clock is paused and keeps its
 * elapsed time, so skipping never buys extra drawing time.
 */
export function skipWord(s, { now = Date.now(), rng = Math.random } = {}) {
  const turn = s.currentTurn;
  if (!turn || (s.phase !== "reveal" && s.phase !== "drawing") || skipsLeft(s) <= 0) return s;
  const requested = turn.requestedCategory ?? turn.category;
  const { word, recycled } = drawWord({
    pool: pool(s),
    category: requested,
    difficulty: s.settings.difficulty,
    usedIds: s.usedWordIds,
    rng,
  });
  const teams = s.teams.map((t) =>
    t.id === turn.teamId ? { ...t, stats: { ...t.stats, skips: t.stats.skips + 1 } } : t,
  );
  return touch(
    {
      ...s,
      teams,
      phase: "reveal",
      usedWordIds: [...s.usedWordIds, word.id],
      currentTurn: {
        ...turn,
        category: announcedCategory(requested, word),
        word,
        recycledWord: recycled,
        skips: turn.skips + 1,
        timer: pauseTimer(turn.timer, now),
      },
    },
    now,
  );
}

/**
 * Host marks the turn. `scoringTeamId` defaults to the drawing team; on All
 * Play it is whichever team guessed first (or null if nobody did).
 * @param {GameSession} s
 * @param {{ success: boolean, scoringTeamId?: string | null }} result
 */
export function resolveTurn(s, { success, scoringTeamId }, { now = Date.now() } = {}) {
  const turn = s.currentTurn;
  if (s.phase !== "drawing" || !turn || turn.result) return s;

  const scorerId = success ? (scoringTeamId ?? turn.teamId) : null;
  const timer = pauseTimer(turn.timer, now);
  const timeUsedMs = elapsed(timer, now);
  const points = success ? getTurnPoints({ success, difficulty: turn.word.difficulty, settings: s.settings }) : 0;

  const teams = s.teams.map((t) => {
    let next = t;
    if (t.id === turn.teamId) {
      const correct = success && scorerId === t.id;
      next = {
        ...next,
        drawerIndex: next.drawerIndex + 1,
        stats: {
          ...next.stats,
          turns: next.stats.turns + 1,
          correct: next.stats.correct + (correct ? 1 : 0),
          timeUsedMs: next.stats.timeUsedMs + (correct ? timeUsedMs : 0),
          fastestMs: correct ? Math.min(next.stats.fastestMs ?? Infinity, timeUsedMs) : next.stats.fastestMs,
        },
      };
    }
    if (t.id === scorerId) {
      next = {
        ...next,
        score: next.score + points,
        stats: { ...next.stats, steals: next.stats.steals + (scorerId !== turn.teamId ? 1 : 0) },
      };
    }
    return next;
  });

  const resolved = {
    ...turn,
    timer,
    result: success ? "correct" : "incorrect",
    scoringTeamId: scorerId,
    points,
    timeUsedMs,
  };

  let phase;
  if (s.mode === "classic") phase = success && SCORING_RULES.rollOnSuccess ? "roll" : "board";
  else phase = "scoreboard";

  return touch({ ...s, teams, phase, currentTurn: resolved, history: [...s.history, resolved] }, now);
}

/** Classic: move the scoring team's token by `roll` spaces. */
export function applyRoll(s, roll, { now = Date.now() } = {}) {
  const turn = s.currentTurn;
  if (s.phase !== "roll" || !turn?.scoringTeamId) return s;
  const last = finishIndex(s.board);
  const team = teamById(s, turn.scoringTeamId);
  const from = team.position;
  const to = Math.min(last, from + roll);
  const move = { roll, from, to };

  const teams = s.teams.map((t) => (t.id === team.id ? { ...t, position: to } : t));
  const currentTurn = { ...turn, move };
  const history = s.history.map((h) => (h.id === turn.id ? currentTurn : h));

  return touch(
    {
      ...s,
      teams,
      phase: "board",
      currentTurn,
      history,
      winnerTeamIds: to === last ? [team.id] : s.winnerTeamIds,
    },
    now,
  );
}

/**
 * Take back a mis-tapped result. `before` is the session just before
 * resolveTurn; the clock stays paused where the turn was marked, so no
 * drawing time is lost or gained. Not allowed once the die has been rolled.
 */
export function undoResolve(before, after, { now = Date.now() } = {}) {
  const turn = after.currentTurn;
  if (!before || !turn?.result || turn.move || turn.id !== before.currentTurn?.id) return after;
  if (!["roll", "board", "scoreboard"].includes(after.phase)) return after;
  return touch({ ...before, currentTurn: { ...before.currentTurn, timer: turn.timer } }, now);
}

function finish(s, { now = Date.now(), endedEarly = false } = {}) {
  const winners = s.winnerTeamIds.length ? s.winnerTeamIds : leadingTeamIds(s);
  return touch({ ...s, phase: "finished", winnerTeamIds: winners, endedEarly, finishedAt: now }, now);
}

/** After the board/scoreboard: start the next turn or wrap up the game. */
export function nextTurn(s, deps = {}) {
  if (s.phase !== "board" && s.phase !== "scoreboard") return s;
  if (isGameOver(s)) return finish(s, deps);

  const index = nextTeamIndex(s);
  // Rotation only ever advances by one, so a lower index means we wrapped.
  const wrapped = index < s.activeTeamIndex;
  return startTurn({ ...s, activeTeamIndex: index, round: wrapped ? s.round + 1 : s.round }, deps);
}

/** Host ends the game before its natural finish. */
export function endGameEarly(s, deps = {}) {
  if (s.phase === "finished") return s;
  let next = s;
  // A turn interrupted mid-draw is discarded rather than counted.
  if (s.currentTurn && !s.currentTurn.result) next = { ...s, currentTurn: null };
  return finish(next, { ...deps, endedEarly: true });
}

/** A fresh lobby with the same teams and settings. */
export function rematch(s, deps = {}) {
  return createSession(
    {
      settings: s.settings,
      teams: s.teams.map((t) => ({ name: t.name, color: t.color, players: t.players })),
    },
    { customWords: s.customWords, ...deps },
  );
}
