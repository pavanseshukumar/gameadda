"use client";

import { useGameStore } from "@/lib/games/core/useGameStore";
import { spinPickStore } from "@/lib/games/spin-pick/store";
import { ACTIONS, PHASES } from "@/lib/games/spin-pick/engine";
import { FinalResults } from "@/components/game/FinalResults";
import { SetupScreen } from "./SetupScreen";
import { PlayScreen } from "./PlayScreen";

/** Top-level client component: restores the saved session and routes by phase. */
export function SpinPickGame() {
  const [state, dispatch] = useGameStore(spinPickStore);

  if (!state) {
    return (
      <div className="stage grid min-h-dvh place-items-center" aria-busy="true">
        <span className="sr-only">Loading game…</span>
        <span className="size-10 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      </div>
    );
  }

  if (state.phase === PHASES.SETUP) {
    return (
      <SetupScreen
        initialTeams={state.teams}
        initialRounds={state.settings.rounds}
        onStart={(teams, settings) => dispatch({ type: ACTIONS.START_GAME, teams, settings })}
      />
    );
  }
  if (state.phase === PHASES.FINISHED) {
    return <FinalResults teams={state.teams} rounds={Math.max(1, state.round)} onPlayAgain={() => dispatch({ type: ACTIONS.NEW_GAME })} />;
  }
  // Picking → spinning → result all happen on one screen, so the spinner never remounts.
  return <PlayScreen state={state} dispatch={dispatch} />;
}
