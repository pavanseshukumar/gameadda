/**
 * A tiny, framework-agnostic store that runs a pure reducer and mirrors its
 * state into localStorage. Designed for `useSyncExternalStore`:
 *
 *  - `getServerSnapshot()` returns `null`, so server prerender and hydration
 *    render a neutral loading state (no hydration mismatch).
 *  - `getSnapshot()` lazily restores the saved session on the client.
 *
 * Every party game can create its own store with its own key and reducer.
 */
export function createPersistentStore({
  key,
  version,
  reducer,
  createInitialState,
  validate = () => true,
  migrate = (state) => state,
  serialize = (state) => state,
}) {
  let state;
  let loaded = false;
  const listeners = new Set();
  let storageListenerAttached = false;

  function readSaved() {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.version !== version) return null;
      // `now` lets games adjust time-based state on load (e.g. pause a running timer).
      const restored = migrate(parsed.state, { now: Date.now() });
      return validate(restored) ? restored : null;
    } catch {
      return null;
    }
  }

  function ensureLoaded() {
    if (loaded) return;
    loaded = true;
    state = readSaved() ?? createInitialState();
  }

  function persist() {
    try {
      window.localStorage.setItem(key, JSON.stringify({ version, state: serialize(state) }));
    } catch {
      // Storage may be full or unavailable (private mode). The game still works in memory.
    }
  }

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function onStorage(event) {
    // Keep multiple tabs of the same game in sync.
    if (event.key !== key) return;
    state = readSaved() ?? createInitialState();
    emit();
  }

  return {
    getSnapshot() {
      ensureLoaded();
      return state;
    },
    getServerSnapshot() {
      return null;
    },
    subscribe(listener) {
      listeners.add(listener);
      if (!storageListenerAttached && typeof window !== "undefined") {
        window.addEventListener("storage", onStorage);
        storageListenerAttached = true;
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && storageListenerAttached) {
          window.removeEventListener("storage", onStorage);
          storageListenerAttached = false;
        }
      };
    },
    dispatch(action) {
      ensureLoaded();
      const next = reducer(state, action);
      if (next === state) return;
      state = next;
      persist();
      emit();
    },
  };
}
