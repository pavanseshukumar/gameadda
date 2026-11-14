"use client";

import { ArrowRight, Ban, Clock, Gauge, Hash, Map, SkipForward, Sparkles } from "lucide-react";
import { teamStyle } from "@/lib/games/pictionary/data/team-colors";
import { CATEGORIES } from "@/lib/games/pictionary/data/categories";
import { gameActions } from "@/lib/games/pictionary/store/game-store";
import { drawerFor } from "@/lib/games/pictionary/game-engine/engine";
import { Button } from "@/features/pictionary/shared/button";
import { CategoryBadge } from "@/features/pictionary/shared/category-badge";
import { TeamToken } from "./team-bits";

const DIFFICULTY_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard", mixed: "Mixed" };

export function LobbyScreen({ session }) {
  const { settings, teams } = session;

  const rules = [
    { icon: Clock, label: `${settings.timerSeconds} seconds to draw` },
    { icon: Gauge, label: `${DIFFICULTY_LABEL[settings.difficulty]} words` },
    settings.mode === "quick"
      ? { icon: Hash, label: `${settings.rounds} round${settings.rounds === 1 ? "" : "s"} · ${settings.rounds * teams.length} turns` }
      : { icon: Map, label: `${settings.boardLength}-space board · roll after every correct guess` },
    {
      icon: SkipForward,
      label: settings.maxSkipsPerTurn ? `${settings.maxSkipsPerTurn} word skip${settings.maxSkipsPerTurn > 1 ? "s" : ""} per turn` : "No word skips",
    },
    settings.challengeMode === "random" && {
      icon: Sparkles,
      label: `Surprise drawing challenges (${settings.challengePool.length} in the mix)`,
    },
    settings.challengeMode === "host" && { icon: Sparkles, label: "Host picks a drawing challenge each turn" },
  ].filter(Boolean);

  return (
    <div className="flex flex-1 flex-col gap-8 animate-rise">
      <div className="text-center">
        <p className="font-display text-sm font-bold tracking-[0.14em] text-coral uppercase">The lobby</p>
        <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Everyone ready?</h1>
        <p className="mt-2 text-ink-soft">Grab paper and pens for each team, then pick a comfy spot.</p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {teams.map((team, i) => (
          <li
            key={team.id}
            className="card-ink flex items-start gap-4 p-4 animate-pop-in"
            style={{ ...teamStyle(team.color), animationDelay: `${i * 70}ms` }}
          >
            <TeamToken color={team.color} size={44} className="text-lg">
              {i + 1}
            </TeamToken>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-xl font-extrabold">{team.name}</p>
              {team.players.length ? (
                <p className="mt-0.5 text-sm text-ink-soft">{team.players.map((p) => p.name).join(" · ")}</p>
              ) : (
                <p className="mt-0.5 text-sm text-ink-muted italic">Pass the pen around as you like</p>
              )}
              {i === 0 && (
                <p className="mt-2 inline-flex rounded-full bg-[var(--team-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--team-deep)]">
                  First up{team.players.length > 0 && ` · ${drawerFor(team)} draws`}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <section className="rounded-[1.75rem] bg-ink p-5 text-cream sm:p-6">
        <h2 className="font-display text-xl font-extrabold">Tonight’s rules</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {rules.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-cream/10 text-sun">
                <Icon className="size-5" />
              </span>
              <span className="text-sm font-medium">{label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          {settings.categories.filter((c) => CATEGORIES[c]).map((c) => (
            <CategoryBadge key={c} category={c} size="sm" />
          ))}
        </div>
        <p className="mt-5 flex items-start gap-2 rounded-2xl bg-cream/10 p-3 text-sm">
          <Ban className="mt-0.5 size-4 shrink-0 text-coral" />
          While drawing: no talking, no letters or numbers, no gestures. Just pictures.
        </p>
      </section>

      <div className="mt-auto pt-2">
        <Button size="xl" variant="sun" block onClick={() => gameActions.begin()}>
          Let’s draw
          <ArrowRight className="size-6" strokeWidth={3} />
        </Button>
      </div>
    </div>
  );
}
