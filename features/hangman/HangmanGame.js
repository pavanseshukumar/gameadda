"use client";

import { useGameStore } from "@/lib/games/core/useGameStore";
import { hangmanStore } from "@/lib/games/hangman/store";
import { ACTIONS, PHASES } from "@/lib/games/hangman/engine";
import { FinalResults } from "@/components/game/FinalResults";
import { SetupScreen } from "./SetupScreen";
import { PlayScreen } from "./PlayScreen";
import { RoundCompleteScreen } from "./RoundCompleteScreen";

/** Top-level client component: restores the saved session and routes by phase. */
export function HangmanGame() {
  const [state, dispatch] = useGameStore(hangmanStore);

  if (!state) {
    return (
      <div className="stage grid min-h-dvh place-items-center" aria-busy="true">
        <span className="sr-only">Loading game…</span>
        <span className="size-10 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      </div>
    );
  }

  switch (state.phase) {
    case PHASES.READY:
    case PHASES.PLAYING:
      return <PlayScreen state={state} dispatch={dispatch} />;
    case PHASES.WORD_OVER:
      return <RoundCompleteScreen state={state} dispatch={dispatch} />;
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
