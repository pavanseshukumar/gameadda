"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/games/core/useGameStore";
import { pixelPosterStore } from "@/lib/games/pixel-poster/store";
import { ACTIONS, PHASES } from "@/lib/games/pixel-poster/engine";
import { drawPosterMovie, loadPosterPool } from "@/lib/games/pixel-poster/pool";
import { FinalResults } from "@/components/game/FinalResults";
import { SetupScreen } from "./SetupScreen";
import { PlayScreen } from "./PlayScreen";
import { RoundCompleteScreen } from "./RoundCompleteScreen";

const NO_POSTER = "Couldn’t fetch a poster from Wikipedia. Check the connection and try again.";

/** The film pool once loaded (`null` while loading). Starts the request on mount. */
function usePosterPool() {
  const [pool, setPool] = useState(null);
  useEffect(() => {
    let alive = true;
    loadPosterPool().then((result) => alive && setPool(result));
    return () => {
      alive = false;
    };
  }, []);
  return pool;
}

/** Top-level client component: restores the saved session and routes by phase. */
export function PixelPosterGame() {
  const [state, dispatch] = useGameStore(pixelPosterStore);
  const pool = usePosterPool();
  // Drawing a movie means a poster lookup and an image download, so it's async.
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!state) {
    return (
      <div className="stage grid min-h-dvh place-items-center" aria-busy="true">
        <span className="sr-only">Loading game…</span>
        <span className="size-10 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      </div>
    );
  }

  /** Draw a movie with a poster, then dispatch `type` with it. */
  const deal = async (type, extra = {}) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const drawn = await drawPosterMovie({ usedMovieIds: state.usedMovieIds, avoidId: state.movie?.id ?? null });
      if (drawn) dispatch({ type, ...extra, movie: drawn.movie, recycled: drawn.recycled });
      else setError(NO_POSTER);
    } finally {
      setBusy(false);
    }
  };

  switch (state.phase) {
    case PHASES.PLAYING:
      return <PlayScreen state={state} dispatch={dispatch} skipping={busy} onSkip={() => deal(ACTIONS.SKIP_MOVIE)} />;
    case PHASES.ROUND_OVER:
      return (
        <RoundCompleteScreen
          state={state}
          dispatch={dispatch}
          loadingNext={busy}
          error={error}
          onNextRound={() => deal(ACTIONS.NEXT_ROUND)}
        />
      );
    case PHASES.FINISHED:
      return <FinalResults teams={state.teams} rounds={state.round} onPlayAgain={() => dispatch({ type: ACTIONS.NEW_GAME })} />;
    default:
      return (
        <SetupScreen
          initialTeams={state.teams}
          initialSeconds={state.settings.turnSeconds}          pool={pool}
          starting={busy}
          error={error ?? (pool?.source === "unavailable" ? "Couldn’t load the movie list. Press start to try again." : null)}
          onStart={(teams, settings) => deal(ACTIONS.START_GAME, { teams, settings })}
        />
      );
  }
}
