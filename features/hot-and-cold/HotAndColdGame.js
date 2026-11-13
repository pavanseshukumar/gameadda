"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/games/core/useGameStore";
import { hotAndColdStore } from "@/lib/games/hot-and-cold/store";
import { ACTIONS, PHASES } from "@/lib/games/hot-and-cold/engine";
import { drawSecret, loadHotColdPool } from "@/lib/games/hot-and-cold/pool";
import { FinalResults } from "@/components/game/FinalResults";
import { SetupScreen } from "./SetupScreen";
import { PlayScreen } from "./PlayScreen";
import { RoundCompleteScreen } from "./RoundCompleteScreen";

const NO_MOVIES = "Couldn’t load the movie list from Wikidata. Check the connection and try again.";

/** The movie pool once loaded (`null` while loading). Starts the request on mount. */
function useHotColdPool() {
  const [pool, setPool] = useState(null);
  useEffect(() => {
    let alive = true;
    loadHotColdPool().then((result) => alive && setPool(result));
    return () => {
      alive = false;
    };
  }, []);
  return pool;
}

/** Top-level client component: restores the saved session and routes by phase. */
export function HotAndColdGame() {
  const [state, dispatch] = useGameStore(hotAndColdStore);
  const pool = useHotColdPool();
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

  /** Pick a secret, then dispatch `type` with it. */
  const deal = async (type, extra = {}) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const drawn = await drawSecret({ usedSecretIds: state.usedSecretIds, avoidId: state.secret?.id ?? null });
      if (drawn) dispatch({ type, ...extra, secret: drawn.secret, recycled: drawn.recycled });
      else setError(NO_MOVIES);
    } finally {
      setBusy(false);
    }
  };

  switch (state.phase) {
    case PHASES.PLAYING:
      return <PlayScreen state={state} dispatch={dispatch} pool={pool} />;
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
          initialSeconds={state.settings.turnSeconds}
          pool={pool}
          starting={busy}
          error={error ?? (pool?.source === "unavailable" ? NO_MOVIES : null)}
          onStart={(teams, settings) => deal(ACTIONS.START_GAME, { teams, settings })}
        />
      );
  }
}
