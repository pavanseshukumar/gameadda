"use client";

import { useGameStore } from "@/lib/games/core/useGameStore";
import { jumbleRumbleStore } from "@/lib/games/jumble-rumble/store";
import { ACTIONS, PHASES } from "@/lib/games/jumble-rumble/engine";
import { loadMoviePool } from "@/lib/games/jumble-rumble/moviePool";
import { FinalResults } from "@/components/game/FinalResults";
import { SetupScreen } from "./SetupScreen";
import { PlayScreen } from "./PlayScreen";
import { RoundCompleteScreen } from "./RoundCompleteScreen";
import { useMoviePool } from "./useMoviePool";

/** Top-level client component: restores the saved session and routes by phase. */
export function JumbleRumbleGame() {
  const [state, dispatch] = useGameStore(jumbleRumbleStore);
  // Fetch Tollywood titles (Wikidata + built-in list) as soon as the page opens.
  const pool = useMoviePool();

  if (!state) {
    return (
      <div className="stage grid min-h-dvh place-items-center" aria-busy="true">
        <span className="sr-only">Loading game…</span>
        <span className="size-10 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      </div>
    );
  }

  // Each round draws a random movie from the pool; the request is shared, so this rarely waits.
  const nextRound = async () => {
    const seed = Math.random();
    const { movies } = await loadMoviePool();
    dispatch({ type: ACTIONS.NEXT_ROUND, seed, movies });
  };

  switch (state.phase) {
    case PHASES.PLAYING:
      return <PlayScreen state={state} dispatch={dispatch} />;
    case PHASES.ROUND_OVER:
      return <RoundCompleteScreen state={state} dispatch={dispatch} onNextRound={nextRound} />;
    case PHASES.FINISHED:
      return <FinalResults teams={state.teams} rounds={state.round} onPlayAgain={() => dispatch({ type: ACTIONS.NEW_GAME })} />;
    default:
      return (
        <SetupScreen
          initialTeams={state.teams}
          initialSeconds={state.settings.turnSeconds}
          pool={pool}
          onStart={async (teams, settings) => {
            const seed = Math.random();
            const { movies } = await loadMoviePool();
            dispatch({ type: ACTIONS.START_GAME, teams, settings, seed, movies });
          }}
        />
      );
  }
}
