"use client";

import { useState } from "react";
import { TeamSetup } from "@/components/game/TeamSetup";
import { Segmented, Toggle } from "@/components/ui/Controls";
import { DEFAULT_HAND, HAND_OPTIONS, MAX_PLAYERS, defaultPlayerName, playerColor } from "@/lib/games/hi-lo/engine";
import { PlayingCard } from "./PlayingCard";

const rulesFor = (solo) => [
  { title: "Get your cards", body: "Everyone is dealt the same number of cards. On your turn your hand is face up, just for you." },
  { title: "Play one, call it", body: "Tap a card to put it on top, then call: is the next card off the deck higher or lower? Aces are low; the same rank never wins." },
  {
    title: "Keep it going",
    body: `Right, and you win that card and it becomes the new top card: call again! Miss, and the run is over; play your next card. ${solo ? "Your best is saved for each hand size." : "Most cards won wins."}`,
  },
];

const PLAYER_WORDS = { one: "player", many: "players", title: "Players", full: "Eight players max. Pull up a chair!" };

export function SetupScreen({ initialTeams, initialSettings, onStart }) {
  const [handSize, setHandSize] = useState(HAND_OPTIONS.includes(initialSettings.handSize) ? initialSettings.handSize : DEFAULT_HAND);
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
      intro="Play a card, call higher or lower, and win every card you get right. Keep the run going until you miss."
      rules={rulesFor}
      initialTeams={initialTeams}
      words={PLAYER_WORDS}
      max={MAX_PLAYERS}
      nameFor={defaultPlayerName}
      colorFor={playerColor}
      soloNote="Just you and the deck. Win as many cards as you can."
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
          <Toggle checked={showOdds} onChange={setShowOdds} label="Odds helper" description="Show how many cards left in the deck are higher or lower than yours." />
        </div>
      </section>
    </TeamSetup>
  );
}
