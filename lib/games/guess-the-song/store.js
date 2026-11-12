import { createPersistentStore } from "../core/createPersistentStore";
import { createInitialState, isValidState, migrateState, reducer } from "./engine";

export const guessTheSongStore = createPersistentStore({
  key: "gameadda:guess-the-telugu-song",
  version: 1,
  reducer,
  createInitialState,
  migrate: migrateState,
  validate: isValidState,
  // Transient feedback shouldn't replay after a refresh.
  serialize: (state) => ({ ...state, lastEvent: null }),
});
