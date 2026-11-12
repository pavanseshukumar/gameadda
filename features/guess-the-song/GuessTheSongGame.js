"use client";

import { useGameStore } from "@/lib/games/core/useGameStore";
import { guessTheSongStore } from "@/lib/games/guess-the-song/store";
import { ACTIONS, PHASES } from "@/lib/games/guess-the-song/engine";
import { SetupScreen } from "./SetupScreen";
import { PlayScreen } from "./PlayScreen";
import { RoundCompleteScreen } from "./RoundCompleteScreen";
import { FinalResultsScreen } from "./FinalResultsScreen";

/** Top-level client component: restores the saved session and routes by game phase. */
export function GuessTheSongGame() {
  const [state, dispatch] = useGameStore(guessTheSongStore);

  if (!state) return <LoadingStage />;

  switch (state.phase) {
    case PHASES.PLAYING:
      return <PlayScreen state={state} dispatch={dispatch} />;
    case PHASES.ROUND_OVER:
      return <RoundCompleteScreen state={state} dispatch={dispatch} />;
    case PHASES.FINISHED:
      return <FinalResultsScreen state={state} dispatch={dispatch} />;
    default:
      return (
        <SetupScreen
          initialTeams={state.teams}
          onStart={(teams) => dispatch({ type: ACTIONS.START_GAME, teams, random: Math.random() })}
        />
      );
  }
}

function LoadingStage() {
  return (
    <div className="stage grid min-h-dvh place-items-center" aria-busy="true">
      <span className="sr-only">Loading game…</span>
      <span className="size-10 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
    </div>
  );
}
