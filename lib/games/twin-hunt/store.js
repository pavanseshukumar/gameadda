import { createPersistentStore } from "../core/createPersistentStore";
import { createInitialState, elapsedMs, isValidState, migrateState, reducer } from "./engine";

export const twinHuntStore = createPersistentStore({
  key: "gameadda:twin-hunt",
  version: 1,
  reducer,
  createInitialState,
  migrate: migrateState,
  validate: isValidState,
  // Bank the clock on every save, so a reload comes back paused at the right time.
  serialize: (state) => ({
    ...state,
    lastEvent: null,
    clock: state.clock.since ? { elapsedMs: elapsedMs(state, Date.now()), since: 0 } : state.clock,
  }),
});
