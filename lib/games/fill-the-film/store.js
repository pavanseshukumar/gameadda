import { createPersistentStore } from "../core/createPersistentStore";
import { createInitialState, isValidState, migrateState, reducer } from "./engine";

export const fillTheFilmStore = createPersistentStore({
  key: "gameadda:fill-the-film",
  // v4: timer starts on its own (v3: timer + wrong guesses; v2: ordered lists, give-up, reveal).
  version: 4,
  reducer,
  createInitialState,
  migrate: migrateState,
  validate: isValidState,
});
