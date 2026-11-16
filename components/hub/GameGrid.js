"use client";

import { useState } from "react";
import { GAME_MODES } from "@/lib/games/registry";

/**
 * The hub's game grid with an All / Solo filter. Cards are rendered by the
 * (server) page and passed in, so this only decides which ones show.
 *
 * The filter is deliberately quiet: a row of small chips sized to their text, with
 * only the chosen one raised, so it doesn't compete with the heading or the cards.
 *
 * @param {{ items: { slug: string, modes: string[], card: React.ReactNode }[] }} props
 */
export function GameGrid({ items }) {
  const [mode, setMode] = useState("all");
  const count = (value) => (value === "all" ? items.length : items.filter((item) => item.modes.includes(value)).length);
  const shown = mode === "all" ? items : items.filter((item) => item.modes.includes(mode));

  return (
    <>
      <div role="radiogroup" aria-label="Show games for" className="mt-4 flex flex-wrap items-center gap-1 sm:mt-6">
        {GAME_MODES.map((option) => {
          const selected = option.value === mode;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setMode(option.value)}
              className={`hub-filter inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-[color,background-color,transform] duration-150 active:scale-95 ${
                selected ? "clay clay-sm bg-panel text-accent" : "text-muted hover:text-foreground"
              }`}
            >
              {option.label}
              <span className={`text-xs tabular-nums ${selected ? "text-accent/70" : "text-subtle"}`}>{count(option.value)}</span>
            </button>
          );
        })}
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-3.5 sm:mt-5 sm:gap-5 md:grid-cols-3" aria-live="polite">
        {shown.map((item) => (
          <li key={item.slug} className="anim-rise min-w-0">
            {item.card}
          </li>
        ))}
      </ul>
    </>
  );
}
