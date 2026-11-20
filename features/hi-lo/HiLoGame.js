"use client";

import { useGameStore } from "@/lib/games/core/useGameStore";
import { hiLoStore } from "@/lib/games/hi-lo/store";
import { ACTIONS, PHASES } from "@/lib/games/hi-lo/engine";
import { SetupScreen } from "./SetupScreen";
import { PlayScreen } from "./PlayScreen";
import { FinishedScreen } from "./FinishedScreen";

/** Top-level client component: restores the saved session and routes by phase. */
export function HiLoGame() {
  const [state, dispatch] = useGameStore(hiLoStore);

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
        initialSettings={state.settings}
        onStart={(players, settings) => dispatch({ type: ACTIONS.START_GAME, players, settings, seed: Math.random() })}
      />
    );
  }
  if (state.phase === PHASES.FINISHED) return <FinishedScreen state={state} dispatch={dispatch} />;
  return <PlayScreen state={state} dispatch={dispatch} />;
}
