"use client";

import { useGameStore } from "@/lib/games/core/useGameStore";
import { twinHuntStore } from "@/lib/games/twin-hunt/store";
import { ACTIONS, PHASES } from "@/lib/games/twin-hunt/engine";
import { SetupScreen } from "./SetupScreen";
import { PlayScreen } from "./PlayScreen";
import { FinishedScreen } from "./FinishedScreen";

/** Top-level client component: restores the saved session and routes by phase. */
export function TwinHuntGame() {
  const [state, dispatch] = useGameStore(twinHuntStore);

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
      return <FinishedScreen state={state} dispatch={dispatch} />;
    default:
      return (
        <SetupScreen
          initialTeams={state.teams}
          initialSettings={state.settings}
          onStart={(teams, settings) => dispatch({ type: ACTIONS.START_GAME, teams, settings, seed: Math.random(), now: Date.now() })}
        />
      );
  }
}
