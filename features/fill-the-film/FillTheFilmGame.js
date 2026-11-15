"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/games/core/useGameStore";
import { fillTheFilmStore } from "@/lib/games/fill-the-film/store";
import { ACTIONS, PHASES } from "@/lib/games/fill-the-film/engine";
import { loadMoviePool } from "@/lib/games/jumble-rumble/moviePool";
import { FinalResults } from "@/components/game/FinalResults";
import { useMoviePool } from "@/features/jumble-rumble/useMoviePool";
import { SetupScreen } from "./SetupScreen";
import { PlayScreen } from "./PlayScreen";

/** Top-level client component: restores the saved session and routes by phase. */
export function FillTheFilmGame() {
  const [state, dispatch] = useGameStore(fillTheFilmStore);
  // Same Telugu movie pool as Jumble Rumble (built-in list + Wikidata), fetched on open.
  const pool = useMoviePool();
  const [starting, setStarting] = useState(false);

  if (!state) {
    return (
      <div className="stage grid min-h-dvh place-items-center" aria-busy="true">
        <span className="sr-only">Loading game…</span>
        <span className="size-10 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      </div>
    );
  }

  switch (state.phase) {
    case PHASES.PLAYING:
      return <PlayScreen state={state} dispatch={dispatch} />;
    case PHASES.FINISHED:
      return <FinalResults teams={state.teams} rounds={state.turns} onPlayAgain={() => dispatch({ type: ACTIONS.NEW_GAME })} />;
    default:
      return (
        <SetupScreen
          initialTeams={state.teams}
          initialSettings={state.settings}
          pool={pool}
          starting={starting}
          onStart={async (teams, settings) => {
            setStarting(true);
            const { movies } = await loadMoviePool();
            dispatch({ type: ACTIONS.START_GAME, teams, settings, movies, seed: Math.random() });
            setStarting(false);
          }}
        />
      );
  }
}
