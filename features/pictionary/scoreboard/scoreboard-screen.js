"use client";

import { ArrowRight, Trophy } from "lucide-react";
import { teamStyle } from "@/lib/games/pictionary/data/team-colors";
import { drawerFor, isGameOver, nextTeamIndex, totalQuickTurns } from "@/lib/games/pictionary/game-engine/engine";
import { rankTeams } from "@/lib/games/pictionary/scoring";
import { gameActions } from "@/lib/games/pictionary/store/game-store";
import { cn } from "@/lib/games/pictionary/utils";
import { Button } from "@/features/pictionary/shared/button";
import { Standings, TeamToken } from "@/features/pictionary/game/team-bits";
import { TurnResult } from "@/features/pictionary/game/turn-result";

export function ScoreboardScreen({ session }) {
  const over = isGameOver(session);
  const ranked = rankTeams(session);
  const next = session.teams[nextTeamIndex(session)];
  const played = session.history.length;
  const total = totalQuickTurns(session);
  const roundsLeft = session.settings.rounds - session.round;
  const lastRoundFinalTurn = session.round === session.settings.rounds;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <TurnResult session={session} />

      <section className="card-ink p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight">Scoreboard</h2>
            <p className="text-sm text-ink-soft">
              {over
                ? "That’s the last turn!"
                : lastRoundFinalTurn
                  ? "Final round"
                  : `${roundsLeft} round${roundsLeft === 1 ? "" : "s"} after this one`}
            </p>
          </div>
          <p className="text-right font-display font-bold tabular-nums">
            {played}
            <span className="text-ink-muted">/{total}</span>
            <span className="block text-xs font-semibold text-ink-muted">turns played</span>
          </p>
        </div>
        <RoundTrack session={session} />
        <div className="mt-5">
          <Standings
            teams={ranked}
            activeId={over ? null : next.id}
            metric={(t) => t.score}
            metricLabel={undefined}
            highlightId={session.currentTurn?.scoringTeamId}
          />
        </div>
      </section>

      <div className="mt-auto flex flex-col gap-3" style={teamStyle(next.color)}>
        {over ? (
          <Button size="xl" variant="sun" block onClick={() => gameActions.nextTurn()}>
            <Trophy className="size-6" />
            See final results
          </Button>
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-2xl bg-[var(--team-soft)] px-4 py-3">
              <TeamToken color={next.color} size={36} />
              <p className="min-w-0 flex-1 leading-tight">
                <span className="block text-xs font-bold tracking-wider text-[var(--team-deep)] uppercase">Up next</span>
                <span className="block truncate font-display text-xl font-extrabold">
                  {next.players.length ? (
                    <>
                      {drawerFor(next)} <span className="font-semibold text-ink-soft">for {next.name}</span>
                    </>
                  ) : (
                    next.name
                  )}
                </span>
              </p>
            </div>
            <Button size="xl" variant="team" block onClick={() => gameActions.nextTurn()}>
              Next turn
              <ArrowRight className="size-6" strokeWidth={3} />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/** One dot per turn, coloured by team; filled once played. */
function RoundTrack({ session }) {
  const { teams, settings, history } = session;
  return (
    <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2" aria-hidden>
      {Array.from({ length: settings.rounds }, (_, r) => (
        <div key={r} className="flex gap-1">
          {teams.map((team, i) => {
            const turnIndex = r * teams.length + i;
            const turn = history[turnIndex];
            return (
              <span
                key={team.id}
                style={teamStyle(team.color)}
                className={cn(
                  "size-3 rounded-full border-2 border-[var(--team)]",
                  turn && (turn.result === "correct" ? "bg-[var(--team)]" : "bg-[var(--team-soft)]"),
                )}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
