"use client";

import Link from "next/link";
import { Scoreboard } from "./Scoreboard";
import { Confetti } from "./Confetti";
import { GameShell } from "./GameShell";
import { RefreshIcon, TrophyIcon } from "@/components/ui/icons";
import { leadingTeams } from "@/lib/games/core/teams";

/**
 * Shared end-of-game screen: champion (or tie), final standings, play again.
 *
 * @param {{ teams: { id: string, name: string, color: string, score: number }[], rounds: number, onPlayAgain: () => void }} props
 */
export function FinalResults({ teams, rounds, onPlayAgain }) {
  const leaders = leadingTeams(teams);
  const champion = leaders.length === 1 ? leaders[0] : null;
  const headline = champion
    ? `${champion.name} wins!`
    : leaders.length > 1
      ? `It’s a tie between ${leaders.map((t) => t.name).join(" & ")}`
      : "No points this time";

  return (
    <GameShell teamColor={champion?.color ?? "#a78bfa"}>
      {leaders.length ? <Confetti count={60} /> : null}

      <section className="relative pt-8 text-center sm:pt-14">
        <div
          className="anim-pop mx-auto grid size-24 place-items-center rounded-[2rem] text-white"
          style={{ background: champion?.color ?? "var(--accent)", boxShadow: `0 30px 70px -20px ${champion?.color ?? "var(--accent)"}` }}
        >
          <TrophyIcon size={44} />
        </div>
        <p className="anim-rise mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          Final results · {rounds} {rounds === 1 ? "round" : "rounds"}
        </p>
        <h1 className="anim-rise mt-3 font-display text-[clamp(2.2rem,7vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
          {headline}
        </h1>
      </section>

      <section className="relative mt-10">
        <Scoreboard variant="ranked" teams={teams} />
      </section>

      <div className="relative mt-8 flex flex-col gap-3 sm:flex-row-reverse">
        <button type="button" autoFocus className="btn btn-primary h-14 text-base sm:h-16 sm:flex-1 sm:text-lg" onClick={onPlayAgain}>
          <RefreshIcon size={20} /> Play again
        </button>
        <Link href="/" className="btn btn-secondary h-14 px-8 text-base sm:h-16">
          All games
        </Link>
      </div>
    </GameShell>
  );
}
