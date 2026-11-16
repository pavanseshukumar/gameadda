"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/games/core/useGameStore";
import { headRushStore } from "@/lib/games/head-rush/store";
import { ACTIONS, PHASES } from "@/lib/games/head-rush/engine";
import { FinalResults } from "@/components/game/FinalResults";
import { SetupScreen } from "./SetupScreen";
import { ReadyScreen } from "./ReadyScreen";
import { TurnStage } from "./TurnStage";
import { TurnOverScreen } from "./TurnOverScreen";
import { enterPlayMode, exitPlayMode } from "./landscape";

/** Top-level client component: restores the saved session and routes by phase. */
export function HeadRushGame() {
  const [state, dispatch] = useGameStore(headRushStore);
  // Start was tapped: the 3-2-1 runs (full screen, sideways) before the clock starts.
  const [counting, setCounting] = useState(false);
  const phase = state?.phase;
  const onStage = counting || phase === PHASES.PLAYING;

  // Leave full screen / unlock rotation whenever the sideways part is over.
  useEffect(() => {
    if (phase && !onStage) exitPlayMode();
  }, [phase, onStage]);

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
      return counting ? (
        <TurnStage
          state={state}
          dispatch={dispatch}
          counting
          onCountdownDone={() => {
            setCounting(false);
            dispatch({ type: ACTIONS.START_TURN, now: Date.now() });
          }}
        />
      ) : (
        <ReadyScreen
          state={state}
          dispatch={dispatch}
          onStart={() => {
            // Called straight from the tap: browsers only allow full screen from a user gesture.
            enterPlayMode();
            setCounting(true);
          }}
        />
      );
    case PHASES.PLAYING:
      return <TurnStage state={state} dispatch={dispatch} />;
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
