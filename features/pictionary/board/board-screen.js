"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Trophy } from "lucide-react";
import { getCategory } from "@/lib/games/pictionary/data/categories";
import { teamStyle } from "@/lib/games/pictionary/data/team-colors";
import { drawerFor, nextTeamIndex, teamById } from "@/lib/games/pictionary/game-engine/engine";
import { finishIndex } from "@/lib/games/pictionary/game-engine/board";
import { gameActions } from "@/lib/games/pictionary/store/game-store";
import { sfx } from "@/lib/games/pictionary/utils/feedback";
import { Button } from "@/features/pictionary/shared/button";
import { CategoryBadge } from "@/features/pictionary/shared/category-badge";
import { Standings } from "@/features/pictionary/game/team-bits";
import { TurnResult } from "@/features/pictionary/game/turn-result";
import { BoardLegend, BoardView } from "./board-view";
import { DiceRoller } from "./dice-roller";
import { Die } from "./die";

const STEP_MS = 260;

/**
 * Shown positions trail the real ones one space at a time, so tokens visibly
 * hop along the track after a roll.
 */
function useSteppedPositions(teams, hold) {
  const [shown, setShown] = useState(() => Object.fromEntries(teams.map((t) => [t.id, t.position])));
  const lagging = teams.find((t) => shown[t.id] !== t.position);

  useEffect(() => {
    if (!lagging || hold) return;
    const id = setTimeout(() => {
      setShown((s) => ({ ...s, [lagging.id]: s[lagging.id] + Math.sign(lagging.position - s[lagging.id]) }));
      sfx.step();
    }, STEP_MS);
    return () => clearTimeout(id);
  }, [lagging, shown, hold]);

  return { shown, moving: Boolean(lagging) };
}

export function BoardScreen({ session }) {
  const turn = session.currentTurn;
  // ready → rolling (result saved, die tumbling, tokens held) → done
  const [dice, setDice] = useState(session.phase === "roll" ? "ready" : "done");
  const holding = dice === "rolling";
  const { shown, moving } = useSteppedPositions(session.teams, holding);
  const rolling = dice !== "done";
  const busy = holding || moving;
  const scorer = teamById(session, turn?.scoringTeamId);
  const winner = session.winnerTeamIds.length ? teamById(session, session.winnerTeamIds[0]) : null;
  const next = session.teams[nextTeamIndex(session)];
  const landing = !busy && turn?.move ? turn.move.to : null;
  const ranked = [...session.teams].sort((a, b) => b.position - a.position);
  const last = finishIndex(session.board);
  const boardRef = useRef(null);

  const onRoll = (value) => {
    setDice("rolling");
    gameActions.roll(value);
  };
  const onSettled = () => {
    setDice("done");
    // On phones the board sits below the dice; bring it into view to watch the move.
    boardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    if (winner && !busy) sfx.fanfare();
  }, [winner, busy]);

  return (
    <div className="grid flex-1 content-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_auto_1fr] lg:items-start">
      <div className="flex flex-col gap-4 lg:col-start-2">
        <TurnResult session={session} />
        {rolling && scorer && (
          <section className="card-ink p-5" style={teamStyle(scorer.color)}>
            <DiceRoller teamName={scorer.name} onRoll={onRoll} onSettled={onSettled} />
          </section>
        )}

        {!rolling && turn?.move && (!winner || busy) && (
          <MoveSummary session={session} move={turn.move} arrived={!moving} />
        )}

        {!rolling && winner && !busy && (
          <section
            className="card-ink flex flex-col items-center gap-3 p-6 text-center animate-pop-in"
            style={teamStyle(winner.color)}
          >
            <span className="inline-flex size-16 items-center justify-center rounded-full border-2 border-ink bg-sun">
              <Trophy className="size-8" />
            </span>
            <p className="font-display text-3xl font-extrabold tracking-tight">{winner.name} made it!</p>
            <p className="text-ink-soft">First to the finish line. Let’s see the final standings.</p>
            <Button size="lg" variant="sun" block onClick={() => gameActions.nextTurn()}>
              See results
              <ArrowRight className="size-5" strokeWidth={3} />
            </Button>
          </section>
        )}

        {!rolling && !winner && (
          <section className="card-ink flex flex-col gap-4 p-5" style={teamStyle(next.color)}>
            <div className="flex items-center gap-3">
              <span className="size-4 rounded-full border-2 border-ink bg-[var(--team)]" />
              <p className="min-w-0 flex-1 leading-tight">
                <span className="block text-xs font-bold tracking-wider text-ink-muted uppercase">Up next</span>
                <span className="block truncate font-display text-xl font-extrabold">{next.name}</span>
                {next.players.length > 0 && (
                  <span className="block text-sm text-ink-soft">{drawerFor(next)} draws</span>
                )}
              </p>
              <NextCategory session={session} team={next} />
            </div>
            <Button size="lg" variant="team" block disabled={busy} onClick={() => gameActions.nextTurn()}>
              {busy ? "Moving…" : "Next turn"}
              {!busy && <ArrowRight className="size-5" strokeWidth={3} />}
            </Button>
          </section>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:col-start-1 lg:row-span-3 lg:row-start-1">
        <div ref={boardRef} className="card-ink scroll-mt-4 p-2 sm:p-4">
          <BoardView
            board={session.board}
            teams={session.teams}
            positions={shown}
            activeTeamId={rolling ? scorer?.id : next?.id}
            landingIndex={landing}
          />
        </div>
        <BoardLegend board={session.board} />
      </div>

      <aside className="lg:col-start-2">
        <section>
          <h2 className="mb-2 font-display text-lg font-extrabold">Race to the finish</h2>
          <Standings
            teams={ranked}
            activeId={rolling ? scorer?.id : next?.id}
            metric={(t) => (shown[t.id] === last ? "🏁" : `${shown[t.id]}`)}
            metricLabel="space"
          />
        </section>
      </aside>
    </div>
  );
}

function MoveSummary({ move, session, arrived }) {
  const space = session.board[move.to];
  const steps = move.to - move.from;
  return (
    <p className="flex items-center justify-center gap-3 rounded-2xl bg-cream-deep px-4 py-3 font-semibold animate-pop-in">
      <Die value={move.roll} size={32} className="drop-shadow-[0_2px_0_var(--color-ink)]" />
      <span>
        {arrived ? "Landed on" : `Moving ${steps} space${steps === 1 ? "" : "s"} to`}{" "}
        <strong>{space.category ? getCategory(space.category).label : "the finish"}</strong>
      </span>
    </p>
  );
}

function NextCategory({ session, team }) {
  const space = session.board[team.position];
  if (!space?.category) return <span className="text-sm font-semibold text-ink-muted">Surprise category</span>;
  return <CategoryBadge category={space.category} size="sm" />;
}
