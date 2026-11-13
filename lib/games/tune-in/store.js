import { createPersistentStore } from "../core/createPersistentStore";
import { createInitialState, isValidState, migrateState, reducer } from "./engine";

export const tuneInStore = createPersistentStore({
  key: "gameadda:tune-in",
  version: 1,
  reducer,
  createInitialState,
  migrate: migrateState,
  validate: isValidState,
  serialize: (state) => ({ ...state, lastEvent: null }),
});
