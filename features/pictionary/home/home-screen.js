"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, BookOpen, ChevronLeft, Play, Plus, Settings, Trophy, X } from "lucide-react";
import { getTeamColor } from "@/lib/games/pictionary/data/team-colors";
import { activeTeam } from "@/lib/games/pictionary/game-engine/engine";
import { gameActions, useGame } from "@/lib/games/pictionary/store/game-store";
import { Button, ButtonLink } from "@/features/pictionary/shared/button";
import { ConfirmDialog } from "@/features/pictionary/shared/confirm-dialog";
import { Logo } from "@/features/pictionary/shared/logo";
import { PageShell } from "@/features/pictionary/shared/page-shell";
import { HeroDoodles } from "./hero-doodles";

export function HomeScreen() {
  const router = useRouter();
  const { ready, session, restoreProblem } = useGame();
  const [confirmNew, setConfirmNew] = useState(false);
  const inProgress = session && session.phase !== "finished";

  const onNewGame = () => (inProgress ? setConfirmNew(true) : router.push("/games/pictionary/setup"));

  return (
    <PageShell wide className="justify-center">
      <div className="grid items-center gap-10 py-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <section className="animate-rise">
          <Link
            href="/"
            className="-ml-2 mb-6 flex min-h-11 w-fit items-center gap-1 rounded-full px-2 font-semibold text-ink-soft transition hover:text-ink"
          >
            <ChevronLeft className="size-5" />
            All games
          </Link>
          <Logo size="lg" />
          <h1 className="mt-8 max-w-xl font-display text-[2.6rem] leading-[1.02] font-extrabold tracking-tight text-balance sm:text-6xl">
            Grab a pen. <span className="hand-underline">Draw badly.</span> Win anyway.
          </h1>
          <p className="mt-4 max-w-md text-lg text-ink-soft text-pretty">
            The board, dice, word cards, timer and scorekeeper for your drawing game night — on one shared phone. Paper
            and pens not included.
          </p>

          {restoreProblem && (
            <div
              role="status"
              className="mt-6 flex items-start gap-3 rounded-2xl border-2 border-sun bg-sun-soft p-4 text-sm"
            >
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#a86f00]" />
              <p className="flex-1">
                {restoreProblem === "outdated"
                  ? "Your last saved game was from an older version and couldn’t be restored."
                  : "Your last saved game was damaged and couldn’t be restored."}{" "}
                Start a fresh one below.
              </p>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={gameActions.dismissRestoreProblem}
                className="-m-1 rounded-full p-1 hover:bg-sun/30"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          <div className="mt-8 flex max-w-md flex-col gap-4">
            {ready && session && <SavedGameCard session={session} />}
            <Button size="xl" variant={inProgress ? "paper" : "ink"} block onClick={onNewGame}>
              <Plus className="size-6" strokeWidth={3} />
              New game
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <ButtonLink href="/games/pictionary/how-to-play" variant="paper" size="lg" className="whitespace-nowrap px-4">
                <BookOpen className="size-5" />
                How to play
              </ButtonLink>
              <ButtonLink href="/games/pictionary/settings" variant="paper" size="lg" className="whitespace-nowrap px-4">
                <Settings className="size-5" />
                Settings
              </ButtonLink>
            </div>
          </div>
        </section>

        <HeroDoodles />
      </div>

      <ConfirmDialog
        open={confirmNew}
        title="Start a new game?"
        body="Your game in progress stays saved until you start the new one. Starting it will replace the old game."
        confirmLabel="Set up new game"
        tone="ink"
        onCancel={() => setConfirmNew(false)}
        onConfirm={() => {
          setConfirmNew(false);
          router.push("/games/pictionary/setup");
        }}
      />
    </PageShell>
  );
}

function SavedGameCard({ session }) {
  const finished = session.phase === "finished";
  const team = activeTeam(session);
  const status = finished
    ? "Game over — see who won"
    : session.phase === "lobby"
      ? "Ready in the lobby"
      : session.mode === "quick"
        ? `Round ${session.round} of ${session.settings.rounds} · ${team.name} up`
        : `Turn ${session.turnNumber} · ${team.name} up`;

  return (
    <div className="card-ink flex items-center gap-4 p-4 animate-pop-in">
      <div className="flex -space-x-2" aria-hidden>
        {session.teams.map((t) => (
          <span
            key={t.id}
            className="size-8 rounded-full border-2 border-paper ring-2 ring-ink"
            style={{ background: getTeamColor(t.color).hex }}
          />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold tracking-wider text-ink-muted uppercase">
          Saved · {session.mode === "classic" ? "Classic Board" : "Quick Play"}
        </p>
        <p className="truncate font-semibold">{status}</p>
      </div>
      <ButtonLink href="/games/pictionary/play" variant={finished ? "paper" : "success"} size="sm" className="shrink-0">
        {finished ? <Trophy className="size-4" /> : <Play className="size-4" fill="currentColor" />}
        {finished ? "Results" : "Continue"}
      </ButtonLink>
    </div>
  );
}
