import { createPersistentStore } from "../core/createPersistentStore";
import { createInitialState, isValidState, migrateState, reducer } from "./engine";

export const jumbleRumbleStore = createPersistentStore({
  key: "gameadda:jumble-rumble",
  version: 1,
  reducer,
  createInitialState,
  migrate: migrateState,
  validate: isValidState,
  serialize: (state) => ({ ...state, lastEvent: null }),
});
