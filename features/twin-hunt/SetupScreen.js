"use client";

import { useState } from "react";
import { TeamSetup } from "@/components/game/TeamSetup";
import { Segmented } from "@/components/ui/Controls";
import { BOARD_OPTIONS, PAIR_POINTS, STREAK_BONUS } from "@/lib/games/twin-hunt/engine";
import { DECK_LABELS, DECK_OPTIONS } from "@/lib/games/twin-hunt/decks";

const rulesFor = (solo) => [
  { title: "Flip two", body: "Tap any two cards. Twins have the same picture on the same colour." },
  solo
    ? { title: "Clear the board", body: "Twins stay face up. Others flip back, so remember where they were." }
    : { title: "Match and go again", body: `Twins are yours: ${PAIR_POINTS} points and another go. Each extra pair in the same turn is +${STREAK_BONUS}.` },
  solo
    ? { title: "Beat your best", body: "Every two flips is a move. Your fewest moves are saved for each board size." }
    : { title: "Miss and pass", body: "No match? Both cards flip back and the next team goes. Everyone was watching…" },
];

export function SetupScreen({ initialTeams, initialSettings, onStart }) {
  const [settings, setSettings] = useState(initialSettings);
  const set = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  return (
    <TeamSetup
      eyebrow="Memory game · find the pairs"
      title={
        <>
          Twin
          <br />
          <span className="text-accent-2">Hunt</span>
        </>
      }
      intro="Every card has a twin with the same picture and the same colour. Flip two at a time and find them all."
      rules={rulesFor}
      initialTeams={initialTeams}
      onStart={(drafts) => onStart(drafts, settings)}
    >
      <section className="card flex flex-col gap-6 rounded-[1.75rem] p-4 sm:p-6">
        <div>
          <h2 id="board-heading" className="px-1 font-display text-xl font-bold tracking-tight">
            Board size
          </h2>
          <p className="mb-3 px-1 text-sm text-muted">More pairs, more to remember.</p>
          <Segmented
            labelledBy="board-heading"
            value={settings.pairs}
            onChange={(value) => set("pairs", value)}
            options={BOARD_OPTIONS.map((pairs) => ({ value: pairs, label: `${pairs} pairs`, hint: `${pairs * 2} cards` }))}
          />
        </div>

        <div>
          <h2 id="deck-heading" className="px-1 font-display text-xl font-bold tracking-tight">
            Pictures
          </h2>
          <p className="mb-3 px-1 text-sm text-muted">What’s on the cards.</p>
          <Segmented
            labelledBy="deck-heading"
            value={settings.deck}
            onChange={(value) => set("deck", value)}
            options={DECK_OPTIONS.map((id) => ({ value: id, label: DECK_LABELS[id] }))}
          />
        </div>
      </section>
    </TeamSetup>
  );
}
