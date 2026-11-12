"use client";

import { FinalResults } from "@/components/game/FinalResults";
import { ACTIONS } from "@/lib/games/guess-the-song/engine";

export function FinalResultsScreen({ state, dispatch }) {
  return <FinalResults teams={state.teams} rounds={state.round} onPlayAgain={() => dispatch({ type: ACTIONS.NEW_GAME })} />;
}
