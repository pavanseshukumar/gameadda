/**
 * localStorage persistence. Every read is defensive: storage may be missing
 * (private mode), full, or hold data from an older/corrupted build.
 */
import { CATEGORIES } from "../data/categories.js";
import { TEAM_COLORS } from "../data/team-colors.js";
import { sanitizeCustomWords } from "../word-bank/index.js";
import { normalizeChallengeSettings } from "../game-engine/challenges.js";
import { CHALLENGES } from "../data/challenges.js";

export const STORAGE_VERSION = 1;

const KEYS = {
  session: "pictionary-party:session",
  prefs: "pictionary-party:prefs",
  customWords: "pictionary-party:custom-words",
  setup: "pictionary-party:last-setup",
};

const PHASES = ["lobby", "handoff", "reveal", "drawing", "roll", "board", "scoreboard", "finished"];

function storage() {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function readJSON(key) {
  const store = storage();
  if (!store) return { value: null };
  try {
    const raw = store.getItem(key);
    if (raw == null) return { value: null };
    return { value: JSON.parse(raw) };
  } catch {
    return { value: null, corrupted: true };
  }
}

function writeJSON(key, value) {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key) {
  try {
    storage()?.removeItem(key);
  } catch {
    // ignore
  }
}

// ── Session ───────────────────────────────────────────────────────────────

function isTeam(t) {
  return (
    t &&
    typeof t.id === "string" &&
    typeof t.name === "string" &&
    TEAM_COLORS[t.color] &&
    Array.isArray(t.players) &&
    Number.isFinite(t.score) &&
    Number.isInteger(t.position) &&
    t.stats &&
    typeof t.stats === "object"
  );
}

function isTurn(turn) {
  return (
    turn &&
    typeof turn.teamId === "string" &&
    CATEGORIES[turn.category] &&
    turn.word &&
    typeof turn.word.text === "string" &&
    turn.timer &&
    Number.isFinite(turn.timer.durationMs) &&
    Number.isFinite(turn.timer.elapsedMs)
  );
}

/** Structural check that a parsed value is a playable session. */
export function isValidSession(s) {
  if (!s || typeof s !== "object") return false;
  if (s.mode !== "classic" && s.mode !== "quick") return false;
  if (!PHASES.includes(s.phase)) return false;
  if (!s.settings || !Array.isArray(s.settings.categories)) return false;
  if (!Array.isArray(s.teams) || s.teams.length < 2 || s.teams.length > 4 || !s.teams.every(isTeam)) return false;
  if (!Number.isInteger(s.activeTeamIndex) || !s.teams[s.activeTeamIndex]) return false;
  if (!Array.isArray(s.history) || !Array.isArray(s.usedWordIds)) return false;
  if (s.mode === "classic") {
    if (!Array.isArray(s.board) || s.board.length < 2) return false;
    if (s.teams.some((t) => t.position < 0 || t.position >= s.board.length)) return false;
  }
  const needsTurn = ["handoff", "reveal", "drawing", "roll"].includes(s.phase);
  if (needsTurn && !isTurn(s.currentTurn)) return false;
  // A challenge id, when present, must be one we know (null = host still choosing).
  const challenge = s.currentTurn?.challengeId;
  if (challenge != null && !CHALLENGES[challenge]) return false;
  return true;
}

/**
 * @returns {{ session: import('../types.js').GameSession | null, problem: null | 'corrupted' | 'outdated' }}
 */
export function loadSession() {
  const { value, corrupted } = readJSON(KEYS.session);
  if (corrupted) {
    remove(KEYS.session);
    return { session: null, problem: "corrupted" };
  }
  if (!value) return { session: null, problem: null };
  if (value.version !== STORAGE_VERSION) {
    remove(KEYS.session);
    return { session: null, problem: "outdated" };
  }
  if (!isValidSession(value.session)) {
    remove(KEYS.session);
    return { session: null, problem: "corrupted" };
  }
  const saved = value.session;
  return {
    session: {
      ...saved,
      // Games saved before drawing challenges existed play on as Normal Only.
      settings: { ...saved.settings, ...normalizeChallengeSettings(saved.settings) },
      customWords: sanitizeCustomWords(saved.customWords),
    },
    problem: null,
  };
}

export function saveSession(session) {
  if (!session) return remove(KEYS.session);
  writeJSON(KEYS.session, { version: STORAGE_VERSION, savedAt: Date.now(), session });
}

export function clearSession() {
  remove(KEYS.session);
}

// ── Preferences, custom words, last setup ─────────────────────────────────

export const DEFAULT_PREFS = { sound: true, vibration: true };

export function loadPrefs() {
  const { value } = readJSON(KEYS.prefs);
  if (!value || typeof value !== "object") return DEFAULT_PREFS;
  return {
    sound: typeof value.sound === "boolean" ? value.sound : DEFAULT_PREFS.sound,
    vibration: typeof value.vibration === "boolean" ? value.vibration : DEFAULT_PREFS.vibration,
  };
}

export function savePrefs(prefs) {
  writeJSON(KEYS.prefs, prefs);
}

export function loadCustomWords() {
  return sanitizeCustomWords(readJSON(KEYS.customWords).value);
}

export function saveCustomWords(words) {
  writeJSON(KEYS.customWords, words);
}

/** The last setup form, so "New game" starts from the previous teams. */
export function loadSetup() {
  const { value } = readJSON(KEYS.setup);
  if (!value || !Array.isArray(value.teams) || !value.settings) return null;
  return value;
}

export function saveSetup(setup) {
  writeJSON(KEYS.setup, setup);
}
