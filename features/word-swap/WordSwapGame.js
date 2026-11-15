"use client";

import { useGameStore } from "@/lib/games/core/useGameStore";
import { wordSwapStore } from "@/lib/games/word-swap/store";
import { ACTIONS, PHASES } from "@/lib/games/word-swap/engine";
import { FinalResults } from "@/components/game/FinalResults";
import { SetupScreen } from "./SetupScreen";
import { SetWordScreen } from "./SetWordScreen";
import { GuessScreen } from "./GuessScreen";
import { TurnOverScreen } from "./TurnOverScreen";

/** Top-level client component: restores the saved session and routes by phase. */
export function WordSwapGame() {
  const [state, dispatch] = useGameStore(wordSwapStore);

  if (!state) {
    return (
      <div className="stage grid min-h-dvh place-items-center" aria-busy="true">
        <span className="sr-only">Loading game…</span>
        <span className="size-10 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      </div>
    );
  }

  switch (state.phase) {
    case PHASES.SETTING:
      // Keyed so the secret-word form starts empty for every new pairing.
      return <SetWordScreen key={`${state.round}-${state.activeTeamIndex}`} state={state} dispatch={dispatch} />;
    case PHASES.GUESSING:
      return <GuessScreen key={`${state.round}-${state.activeTeamIndex}`} state={state} dispatch={dispatch} />;
    case PHASES.TURN_OVER:
      return <TurnOverScreen state={state} dispatch={dispatch} />;
    case PHASES.FINISHED:
      return <FinalResults teams={state.teams} rounds={state.round} onPlayAgain={() => dispatch({ type: ACTIONS.NEW_GAME })} />;
    default:
      return (
        <SetupScreen
          initialTeams={state.teams}
          initialSettings={state.settings}
          onStart={(teams, settings) => dispatch({ type: ACTIONS.START_GAME, teams, settings, seed: Math.random() })}
        />
      );
  }
}
