"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/games/core/useGameStore";
import { releaseLadderStore } from "@/lib/games/release-ladder/store";
import { ACTIONS, PHASES } from "@/lib/games/release-ladder/engine";
import { loadMoviePool } from "@/lib/games/jumble-rumble/moviePool";
import { FinalResults } from "@/components/game/FinalResults";
import { useMoviePool } from "@/features/jumble-rumble/useMoviePool";
import { SetupScreen } from "./SetupScreen";
import { PlayScreen } from "./PlayScreen";
import { RevealScreen } from "./RevealScreen";

/**
 * Top-level client component: restores the saved session and routes by phase.
 * Movies (and their years) come from the shared Telugu movie pool: Wikidata plus
 * the built-in list, or the built-in list alone when offline.
 */
export function ReleaseLadderGame() {
  const [state, dispatch] = useGameStore(releaseLadderStore);
  const pool = useMoviePool();
  const [busy, setBusy] = useState(false);

  if (!state) {
    return (
      <div className="stage grid min-h-dvh place-items-center" aria-busy="true">
        <span className="sr-only">Loading game…</span>
        <span className="size-10 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      </div>
    );
  }

  // The pool request is shared, so this rarely waits.
  const withMovies = async (action) => {
    setBusy(true);
    const seed = Math.random();
    const { movies } = await loadMoviePool();
    dispatch({ ...action, seed, movies });
    setBusy(false);
  };

  switch (state.phase) {
    case PHASES.READY:
    case PHASES.PLAYING:
      return <PlayScreen state={state} dispatch={dispatch} />;
    case PHASES.REVEAL:
      return <RevealScreen state={state} dispatch={dispatch} nextLoading={busy} onNextRound={() => withMovies({ type: ACTIONS.NEXT_ROUND })} />;
    case PHASES.FINISHED:
      return <FinalResults teams={state.teams} rounds={state.round} onPlayAgain={() => dispatch({ type: ACTIONS.NEW_GAME })} />;
    default:
      return (
        <SetupScreen
          initialTeams={state.teams}
          initialSettings={state.settings}
          pool={pool}
          onStart={(teams, settings) => withMovies({ type: ACTIONS.START_GAME, teams, settings })}
        />
      );
  }
}
