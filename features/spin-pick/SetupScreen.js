"use client";

import { useState } from "react";
import { TeamSetup } from "@/components/game/TeamSetup";
import { Segmented } from "@/components/ui/Controls";
import { DEFAULT_SPOKES, POT, ROUND_OPTIONS, SPOKE_OPTIONS, colorsFor } from "@/lib/games/spin-pick/engine";
import { SpinnerArt } from "./SpinnerArt";

const rulesFor = (solo) => [
  { title: "Call a colour", body: solo ? "Every spoke of the spinner is a colour. Tap the one you think it’ll stop on." : "Everyone calls one of the six colours, taking turns. The first caller rotates every round." },
  { title: "Flick it", body: "Spin it either way with a flick of your finger (or tap Spin). It can teeter, slip and rock back, so don’t celebrate early!" },
  solo
    ? { title: "Score", body: `It stops on your colour? +${POT}. See how many you can land.` }
    : { title: "Split the pot", body: `Everyone on the landing colour shares ${POT} points. Call a colour nobody else picked to keep it all.` },
];

export function SetupScreen({ initialTeams, initialSettings, onStart }) {
  const [rounds, setRounds] = useState(initialSettings.rounds);
  const [spokes, setSpokes] = useState(initialSettings.spokes ?? DEFAULT_SPOKES);

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
      onStart={(drafts) => onStart(drafts, { rounds, spokes })}
    >
      <section className="card flex flex-col gap-5 rounded-[1.75rem] p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3">
            {/* Live preview of the spinner you'll get. */}
            <div className="size-16 shrink-0" aria-hidden="true">
              <SpinnerArt key={spokes} colors={colorsFor(spokes)} idPrefix="sp-preview" />
            </div>
            <div>
              <h2 id="spokes-heading" className="font-display text-xl font-bold tracking-tight">
                Spokes
              </h2>
              <p className="text-sm text-muted">{spokes === 3 ? "The classic. Fewer spokes, better odds." : `${spokes} colours to choose from.`}</p>
            </div>
          </div>
          <Segmented
            labelledBy="spokes-heading"
            value={spokes}
            onChange={setSpokes}
            options={SPOKE_OPTIONS.map((n) => ({ value: n, label: `${n}` }))}
            className="w-full sm:w-auto sm:min-w-64"
          />
        </div>
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
