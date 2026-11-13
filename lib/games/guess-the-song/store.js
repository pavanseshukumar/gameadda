import { createPersistentStore } from "../core/createPersistentStore";
import { createInitialState, isValidState, migrateState, reducer } from "./engine";

export const guessTheSongStore = createPersistentStore({
  key: "gameadda:guess-the-telugu-song",
  // v2: each team plays its own song with lives (older saves used shared turns).
  version: 2,
  reducer,
  createInitialState,
  migrate: migrateState,
  validate: isValidState,
  // Transient feedback shouldn't replay after a refresh.
  serialize: (state) => ({ ...state, lastEvent: null }),
});
