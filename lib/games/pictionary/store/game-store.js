"use client";

/**
 * A tiny external store for the active game. Every route reads the same
 * snapshot through useSyncExternalStore, which also gives a clean
 * server/hydration snapshot (`ready: false`) before localStorage is read.
 */
import { useSyncExternalStore } from "react";
import * as engine from "../game-engine/engine.js";
import { loadSession, saveSession } from "../storage/index.js";

/** @typedef {import('../types.js').GameSession} GameSession */
/** @typedef {{ ready: boolean, session: GameSession | null, restoreProblem: null | 'corrupted' | 'outdated' }} GameState */

/** @type {GameState} */
const SERVER_STATE = { ready: false, session: null, restoreProblem: null };

/** @type {GameState | null} */
let state = null;
const listeners = new Set();
/** Session just before the last result was marked, for undo. Memory only. */
let undoBase = null;

function ensureLoaded() {
  if (state) return state;
  const { session, problem } = loadSession();
  state = { ready: true, session, restoreProblem: problem };
  return state;
}

function setSession(session) {
  ensureLoaded();
  state = { ...state, session, restoreProblem: null };
  saveSession(session);
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** @returns {GameState} */
export function useGame() {
  return useSyncExternalStore(subscribe, ensureLoaded, () => SERVER_STATE);
}

/** Whether the result on screen can still be taken back (before any roll). */
export function canUndoResult(session) {
  return Boolean(undoBase && session && engine.undoResolve(undoBase, session) !== session);
}

/** Apply an engine transition to the current session. */
function apply(transition, ...args) {
  const current = ensureLoaded().session;
  if (!current) return;
  const next = transition(current, ...args);
  if (next !== current) setSession(next);
}

export const gameActions = {
  /** Create a new session in the lobby, replacing any saved game. */
  create(config, customWords) {
    setSession(engine.createSession(config, { customWords }));
  },
  begin: () => apply(engine.beginGame),
  selectChallenge: (id) => apply(engine.selectChallenge, id),
  openReveal: () => apply(engine.openReveal),
  startDrawing: () => apply(engine.startDrawing),
  pause: () => apply(engine.pauseTurn),
  resume: () => apply(engine.resumeTurn),
  skipWord: () => apply(engine.skipWord),
  resolve(success, scoringTeamId = null) {
    undoBase = ensureLoaded().session;
    apply(engine.resolveTurn, { success, scoringTeamId });
  },
  /** Reopen the drawing round after a mis-tapped Got it / Give up. */
  undoResult() {
    apply((s) => engine.undoResolve(undoBase, s));
    undoBase = null;
  },
  roll: (value) => apply(engine.applyRoll, value),
  nextTurn: () => apply(engine.nextTurn),
  endEarly: () => apply(engine.endGameEarly),
  rematch: () => apply(engine.rematch),
  dismissRestoreProblem() {
    ensureLoaded();
    state = { ...state, restoreProblem: null };
    listeners.forEach((l) => l());
  },
  clear: () => setSession(null),
};
