"use client";

import { useState } from "react";
import { TeamSetup } from "@/components/game/TeamSetup";
import { Segmented, Toggle } from "@/components/ui/Controls";
import { HAND_OPTIONS } from "@/lib/games/hi-lo/engine";
import { PlayingCard } from "./PlayingCard";

const rulesFor = (solo) => [
  { title: "Higher or lower?", body: "A card is face up. Will the next one be higher or lower? Aces are high; the same rank doesn’t count." },
  { title: "Keep what you call", body: "Call it right and you keep that card. Either way it becomes the card to beat for your next call." },
  solo
    ? { title: "Beat your best", body: "Get through your hand keeping as many cards as you can. Your best is saved for each hand size." }
    : { title: "Most cards wins", body: "Everyone plays their own hand from the same deck, passing the phone. Remember what’s gone!" },
];

export function SetupScreen({ initialTeams, initialSettings, onStart }) {
  const [handSize, setHandSize] = useState(initialSettings.handSize);
  const [showOdds, setShowOdds] = useState(initialSettings.showOdds ?? false);

  return (
    <TeamSetup
      eyebrow="Card game · higher or lower"
      title={
        <span className="flex items-end gap-4">
          <span>
            Hi
            <span className="text-accent-2">-Lo</span>
          </span>
          <span className="mb-2 flex -space-x-5" aria-hidden="true">
            <span className="w-12 -rotate-6 sm:w-16"><PlayingCard card="7D" /></span>
            <span className="w-12 rotate-6 sm:w-16"><PlayingCard card="KS" /></span>
          </span>
        </span>
      }
      intro="Higher or lower? Call the next card right and it’s yours. Whoever keeps the most cards wins."
      rules={rulesFor}
      initialTeams={initialTeams}
      onStart={(drafts) => onStart(drafts, { handSize, showOdds })}
    >
      <section className="card flex flex-col gap-5 rounded-[1.75rem] p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h2 id="hand-heading" className="font-display text-xl font-bold tracking-tight">
              Cards each
            </h2>
            <p className="text-sm text-muted">How many cards every player is dealt.</p>
          </div>
          <Segmented
            labelledBy="hand-heading"
            value={handSize}
            onChange={setHandSize}
            options={HAND_OPTIONS.map((n) => ({ value: n, label: `${n}` }))}
            className="w-full sm:w-auto sm:min-w-64"
          />
        </div>
        <div className="px-1">
          <Toggle checked={showOdds} onChange={setShowOdds} label="Odds helper" description="Show how many unseen cards are higher or lower. Off for card-counting glory." />
        </div>
      </section>
    </TeamSetup>
  );
}
