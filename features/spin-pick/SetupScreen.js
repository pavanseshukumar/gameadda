"use client";

import { useState } from "react";
import { TeamSetup } from "@/components/game/TeamSetup";
import { Segmented } from "@/components/ui/Controls";
import { POT, ROUND_OPTIONS } from "@/lib/games/spin-pick/engine";

const rulesFor = (solo) => [
  { title: "Call a colour", body: solo ? "Six colours on the spinner. Tap the one you think it’ll stop on." : "Everyone calls one of the six colours, taking turns. The first caller rotates every round." },
  { title: "Flick it", body: "Spin it with a flick of your finger (or tap Spin). Fidget with it while you wait, too." },
  solo
    ? { title: "Score", body: `It stops on your colour? +${POT}. See how many you can land.` }
    : { title: "Split the pot", body: `Everyone on the landing colour shares ${POT} points. Call a colour nobody else picked to keep it all.` },
];

export function SetupScreen({ initialTeams, initialRounds, onStart }) {
  const [rounds, setRounds] = useState(initialRounds);

  return (
    <TeamSetup
      eyebrow="Luck game · flick and pray"
      title={
        <>
          Spin
          <br />
          <span className="text-accent-2">Pick</span>
        </>
      }
      intro="Call a colour, flick the fidget spinner, and watch it tick… tick… tick… to a stop."
      rules={rulesFor}
      initialTeams={initialTeams}
      onStart={(drafts) => onStart(drafts, { rounds })}
    >
      <section className="card flex flex-col gap-5 rounded-[1.75rem] p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h2 id="rounds-heading" className="font-display text-xl font-bold tracking-tight">
              Rounds
            </h2>
            <p className="text-sm text-muted">One spin per round.</p>
          </div>
          <Segmented
            labelledBy="rounds-heading"
            value={rounds}
            onChange={setRounds}
            options={ROUND_OPTIONS.map((n) => ({ value: n, label: `${n}` }))}
            className="w-full sm:w-auto sm:min-w-64"
          />
        </div>
      </section>
    </TeamSetup>
  );
}
