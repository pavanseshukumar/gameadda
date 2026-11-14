"use client";

import { FinalResults } from "@/components/game/FinalResults";
import { useGameStore } from "@/lib/games/core/useGameStore";
import { ACTIONS, PHASES } from "@/lib/games/imposter/engine";
import { imposterStore } from "@/lib/games/imposter/store";
import { DiscussScreen } from "./DiscussScreen";
import { RevealScreen } from "./RevealScreen";
import { RoundOverScreen } from "./RoundOverScreen";
import { SetupScreen } from "./SetupScreen";
import { VoteScreen } from "./VoteScreen";

/** Top-level client component: restores the saved session and routes by phase. */
export function ImposterGame() {
  const [state, dispatch] = useGameStore(imposterStore);

  if (!state) {
    return (
      <div className="stage grid min-h-dvh place-items-center" aria-busy="true">
        <span className="sr-only">Loading game…</span>
        <span className="size-10 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      </div>
    );
  }

  const endGame = () => dispatch({ type: ACTIONS.END_GAME });

  switch (state.phase) {
    case PHASES.REVEAL:
      return <RevealScreen state={state} dispatch={dispatch} onEnd={endGame} />;
    case PHASES.DISCUSS:
      return <DiscussScreen state={state} dispatch={dispatch} onEnd={endGame} />;
    case PHASES.VOTE:
    case PHASES.GUESS:
      return <VoteScreen state={state} dispatch={dispatch} onEnd={endGame} />;
    case PHASES.ROUND_OVER:
      return <RoundOverScreen state={state} dispatch={dispatch} />;
    case PHASES.FINISHED:
      return <FinalResults teams={state.players} rounds={state.round} onPlayAgain={() => dispatch({ type: ACTIONS.NEW_GAME })} />;
    default:
      return (
        <SetupScreen
          initialPlayers={state.players}
          initialSettings={state.settings}
          onStart={(players, settings) => dispatch({ type: ACTIONS.START_GAME, players, settings, seed: Math.random() })}
        />
      );
  }
}
