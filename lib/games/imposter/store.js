import { createPersistentStore } from "../core/createPersistentStore";
import { createInitialState, isValidState, migrateState, reducer } from "./engine";

export const imposterStore = createPersistentStore({
  key: "gameadda:imposter",
  version: 1,
  reducer,
  createInitialState,
  migrate: migrateState,
  validate: isValidState,
});
