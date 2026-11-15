import { createPersistentStore } from "../core/createPersistentStore";
import { createInitialState, isValidState, migrateState, reducer } from "./engine";

export const hangmanStore = createPersistentStore({
  key: "gameadda:hangman",
  // v2: every team plays its own word (v1 shared one word between teams).
  version: 2,
  reducer,
  createInitialState,
  migrate: migrateState,
  validate: isValidState,
});
