"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribe a component to a store created with `createPersistentStore`.
 * Returns `[state, dispatch]`; `state` is `null` until the client has restored
 * the saved session (during prerender and hydration).
 */
export function useGameStore(store) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return [state, store.dispatch];
}
