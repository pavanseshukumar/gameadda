"use client";

/** Device preferences and the host's custom words, shared across routes. */
import { useSyncExternalStore } from "react";
import { DEFAULT_PREFS, loadCustomWords, loadPrefs, saveCustomWords, savePrefs } from "../storage/index.js";
import { createCustomWord } from "../word-bank/index.js";

const SERVER_STATE = { ready: false, prefs: DEFAULT_PREFS, customWords: [] };

let state = null;
const listeners = new Set();

function ensureLoaded() {
  if (!state) state = { ready: true, prefs: loadPrefs(), customWords: loadCustomWords() };
  return state;
}

function update(patch) {
  state = { ...ensureLoaded(), ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePrefs() {
  return useSyncExternalStore(subscribe, ensureLoaded, () => SERVER_STATE);
}

/** Non-hook read for event handlers (e.g. sound effects). */
export function getPrefs() {
  return ensureLoaded().prefs;
}

export const prefsActions = {
  setPref(key, value) {
    const prefs = { ...ensureLoaded().prefs, [key]: value };
    savePrefs(prefs);
    update({ prefs });
  },
  /** @returns {string | null} error message, or null on success */
  addCustomWord(input) {
    const { customWords } = ensureLoaded();
    const { word, error } = createCustomWord(input, customWords);
    if (error) return error;
    const next = [word, ...customWords];
    saveCustomWords(next);
    update({ customWords: next });
    return null;
  },
  removeCustomWord(id) {
    const next = ensureLoaded().customWords.filter((w) => w.id !== id);
    saveCustomWords(next);
    update({ customWords: next });
  },
  clearCustomWords() {
    saveCustomWords([]);
    update({ customWords: [] });
  },
};
