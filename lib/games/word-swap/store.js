import { createPersistentStore } from "../core/createPersistentStore";
import { createInitialState, isValidState, migrateState, reducer } from "./engine";

export const wordSwapStore = createPersistentStore({
  key: "gameadda:word-swap",
  version: 1,
  reducer,
  createInitialState,
  migrate: migrateState,
  validate: isValidState,
});
