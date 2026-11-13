import { createPersistentStore } from "../core/createPersistentStore";
import { createInitialState, isValidState, migrateState, reducer } from "./engine";

export const hotAndColdStore = createPersistentStore({
  key: "gameadda:hot-and-cold",
  version: 1,
  reducer,
  createInitialState,
  migrate: migrateState,
  validate: isValidState,
  serialize: (state) => ({ ...state, lastEvent: null }),
});
