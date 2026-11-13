"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/games/core/useGameStore";
import { tuneInStore } from "@/lib/games/tune-in/store";
import { ACTIONS, PHASES } from "@/lib/games/tune-in/engine";
import { drawClipSong } from "@/lib/games/tune-in/pool";
import { SONGS } from "@/lib/games/guess-the-song/songs";
import { FinalResults } from "@/components/game/FinalResults";
import { SetupScreen } from "./SetupScreen";
import { PlayScreen } from "./PlayScreen";
import { RoundCompleteScreen } from "./RoundCompleteScreen";

const NO_CLIP = "Couldn’t fetch a song clip from iTunes. Check the connection and try again.";

/** Top-level client component: restores the saved session and routes by phase. */
export function TuneInGame() {
  const [state, dispatch] = useGameStore(tuneInStore);
  // Drawing a song means an iTunes lookup and a clip download, so it's async.
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

  /** Draw a song with a playable clip, then dispatch `type` with it. */
  const deal = async (type, extra = {}) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const drawn = await drawClipSong({ usedSongIds: state.usedSongIds, avoidId: state.song?.id ?? null });
      if (drawn) dispatch({ type, ...extra, song: drawn.song, recycled: drawn.recycled });
      else setError(NO_CLIP);
    } finally {
      setBusy(false);
    }
  };

  switch (state.phase) {
    case PHASES.PLAYING:
      return <PlayScreen state={state} dispatch={dispatch} skipping={busy} onSkip={() => deal(ACTIONS.SKIP_SONG)} />;
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
          songCount={SONGS.length}
          starting={busy}
          error={error}
          onStart={(teams, settings) => deal(ACTIONS.START_GAME, { teams, settings })}
        />
      );
  }
}
