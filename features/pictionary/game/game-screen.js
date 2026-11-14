"use client";

import { useGame } from "@/lib/games/pictionary/store/game-store";
import { PageShell } from "@/features/pictionary/shared/page-shell";
import { ButtonLink } from "@/features/pictionary/shared/button";
import { LogoMark } from "@/features/pictionary/shared/logo";
import { BoardScreen } from "@/features/pictionary/board/board-screen";
import { ScoreboardScreen } from "@/features/pictionary/scoreboard/scoreboard-screen";
import { ResultsScreen } from "@/features/pictionary/results/results-screen";
import { GameTopBar } from "./game-top-bar";
import { LobbyScreen } from "./lobby-screen";
import { HandoffScreen } from "./handoff-screen";
import { RevealScreen } from "./reveal-screen";
import { DrawingScreen } from "./drawing-screen";

const SCREENS = {
  lobby: LobbyScreen,
  handoff: HandoffScreen,
  reveal: RevealScreen,
  drawing: DrawingScreen,
  roll: BoardScreen,
  board: BoardScreen,
  scoreboard: ScoreboardScreen,
  finished: ResultsScreen,
};

/** Renders whichever screen the saved session's phase calls for. */
export function GameScreen() {
  const { ready, session } = useGame();

  if (!ready) return <PageShell className="items-center justify-center" />;
  if (!session) return <NoGame />;

  const Screen = SCREENS[session.phase];
  // Keyed by screen + turn so each screen mounts fresh and plays its entrance.
  // Roll and board share a key so the token animation survives the roll.
  const screen = (
    <Screen
      key={`${session.phase === "roll" ? "board" : session.phase}-${session.currentTurn?.id ?? "none"}`}
      session={session}
    />
  );

  // The reveal and drawing screens own the whole viewport.
  if (session.phase === "reveal" || session.phase === "drawing") {
    return <main className="flex min-h-dvh flex-1 flex-col">{screen}</main>;
  }

  return (
    <PageShell wide={session.phase === "roll" || session.phase === "board"} className="gap-4">
      <GameTopBar session={session} />
      {screen}
    </PageShell>
  );
}

function NoGame() {
  return (
    <PageShell className="items-center justify-center text-center">
      <LogoMark className="size-16" />
      <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight">No game on the table</h1>
      <p className="mt-2 max-w-sm text-ink-soft">There’s no saved game on this device. Set one up — it takes a minute.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/games/pictionary/setup" size="lg" variant="sun">
          Set up a game
        </ButtonLink>
        <ButtonLink href="/games/pictionary" size="lg" variant="paper">
          Home
        </ButtonLink>
      </div>
    </PageShell>
  );
}
