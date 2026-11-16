import { createPersistentStore } from "../core/createPersistentStore";
import { createInitialState, isValidState, migrateState, reducer } from "./engine";

export const headRushStore = createPersistentStore({
  key: "gameadda:head-rush",
  version: 1,
  reducer,
  createInitialState,
  migrate: migrateState,
  validate: isValidState,
});
