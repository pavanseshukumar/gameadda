"use client";

import { useState } from "react";
import { GameShell } from "@/components/game/GameShell";
import { TeamBadge } from "@/components/game/TeamBadge";
import { MultiSelect, Segmented, Stepper, Toggle } from "@/components/ui/Controls";
import { ArrowRightIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon, ShuffleIcon, XIcon } from "@/components/ui/icons";
import { shuffleChanged } from "@/lib/games/core/shuffle";
import { teamColor } from "@/lib/games/core/teams";
import {
  CREW_WIN,
  defaultPlayerName,
  DISCUSS_OPTIONS,
  ESCAPE_WIN,
  MAX_PLAYERS,
  MIN_PLAYERS,
  STEAL_WIN,
  TWO_IMPOSTERS_FROM,
  maxImposters,
} from "@/lib/games/imposter/engine";
import { IMPOSTER_CATEGORIES, IMPOSTER_WORDS } from "@/lib/games/imposter/words";

const RULES = [
  { title: "Secret word", body: "Pass the phone round. Everyone sees the same secret word, except the imposter, who only knows they're the imposter." },
  { title: "One-word clues", body: "Going round, each player says one word about the secret. Too obvious helps the imposter; too vague looks suspicious." },
  {
    title: "Vote them out",
    body: `Catch the imposter and they get one guess at the word. Crew +${CREW_WIN} each if they miss, imposter +${STEAL_WIN} if they get it, +${ESCAPE_WIN} if they're never caught.`,
  },
];

function initialDrafts(players) {
  if (players?.length >= MIN_PLAYERS) return players.map((p, i) => ({ id: i + 1, name: p.name }));
  return Array.from({ length: 4 }, (_, i) => ({ id: i + 1, name: defaultPlayerName(i) }));
}

/**
 * @param {{ initialPlayers: { name: string }[], initialSettings: object, onStart: (drafts: object[], settings: object) => void }} props
 */
export function SetupScreen({ initialPlayers, initialSettings, onStart }) {
  const [drafts, setDrafts] = useState(() => initialDrafts(initialPlayers));
  const [settings, setSettings] = useState(initialSettings);
  const set = (key, value) => setSettings((s) => ({ ...s, [key]: value }));
  const canHaveTwo = maxImposters(drafts.length) === 2;
  const imposterCount = canHaveTwo ? settings.imposterCount : 1;
  const noCategory = settings.categories.length === 0;

  const addPlayer = () =>
    setDrafts((current) => {
      if (current.length >= MAX_PLAYERS) return current;
      const id = Math.max(0, ...current.map((d) => d.id)) + 1;
      return [...current, { id, name: defaultPlayerName(current.length) }];
    });
  const removePlayer = (id) => setDrafts((current) => (current.length <= MIN_PLAYERS ? current : current.filter((d) => d.id !== id)));
  const rename = (id, name) => setDrafts((current) => current.map((d) => (d.id === id ? { ...d, name } : d)));
  const setCount = (count) => (count > drafts.length ? addPlayer() : removePlayer(drafts[drafts.length - 1].id));

  // Reordering: the phone is passed round in list order.
  const [moveNote, setMoveNote] = useState("");
  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= drafts.length) return;
    const next = [...drafts];
    [next[index], next[target]] = [next[target], next[index]];
    setDrafts(next);
    setMoveNote(`${drafts[index].name || `Player ${index + 1}`} moved to position ${target + 1}`);
  };
  const shuffleOrder = () => {
    // shuffleChanged never hands back the same order, so the button always visibly does something.
    setDrafts((current) => shuffleChanged(current, Math.random()));
    setMoveNote("Player order shuffled");
  };

  return (
    <GameShell teamColor={teamColor(0)}>
      <section className="anim-rise pt-4 sm:pt-10">
        <p className="font-display text-sm font-bold uppercase tracking-[0.14em] text-accent-2">
          Social deduction · {IMPOSTER_WORDS.length} words
        </p>
        <h1 className="mt-2 font-display text-[clamp(2.6rem,10vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">
          Imp<span className="text-accent-2">o</span>ster
        </h1>
        <p className="mt-4 max-w-md text-base text-muted sm:text-lg">
          Everyone knows the secret word except one of you. Give clues, trust no one, and vote out the faker.
        </p>
      </section>

      <form
        className="mt-8 flex flex-col gap-6 sm:mt-10"
        onSubmit={(event) => {
          event.preventDefault();
          if (!noCategory) onStart(drafts, { ...settings, imposterCount });
        }}
      >
        <section className="card rounded-[1.75rem] p-4 sm:p-6" aria-labelledby="players-heading">
          <div className="flex items-center justify-between gap-4 px-1">
            <h2 id="players-heading" className="font-display text-xl font-bold tracking-tight">
              Players
            </h2>
            <Stepper value={drafts.length} min={MIN_PLAYERS} max={MAX_PLAYERS} onChange={setCount} label="Number of players" unit="players" />
          </div>
          <div className="mt-1 flex items-center justify-between gap-3 px-1">
            <p className="text-sm text-muted">The phone goes round in this order. Use the arrows to rearrange.</p>
            <button type="button" className="btn btn-secondary h-10 shrink-0 px-3 text-sm" onClick={shuffleOrder}>
              <ShuffleIcon size={16} /> Shuffle
            </button>
          </div>
          <p className="sr-only" aria-live="polite">
            {moveNote}
          </p>

          <ul className="mt-4 grid grid-cols-1 gap-2.5">
            {drafts.map((draft, index) => (
              <li key={draft.id} className="field anim-rise flex items-center gap-2 p-1.5 pl-2.5" style={{ "--team": teamColor(index) }}>
                <TeamBadge color={teamColor(index)}>{index + 1}</TeamBadge>
                <label className="sr-only" htmlFor={`player-${draft.id}`}>
                  Player {index + 1} name
                </label>
                <input
                  id={`player-${draft.id}`}
                  value={draft.name}
                  maxLength={20}
                  autoComplete="off"
                  placeholder={defaultPlayerName(index)}
                  onChange={(event) => rename(draft.id, event.target.value)}
                  className="h-10 min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-subtle"
                />
                <div className="flex shrink-0 items-center">
                  <button
                    type="button"
                    className="btn btn-ghost size-9 p-0"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${draft.name || `player ${index + 1}`} up`}
                  >
                    <ChevronUpIcon size={18} strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost size-9 p-0"
                    onClick={() => move(index, 1)}
                    disabled={index === drafts.length - 1}
                    aria-label={`Move ${draft.name || `player ${index + 1}`} down`}
                  >
                    <ChevronDownIcon size={18} strokeWidth={2.5} />
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost size-9 shrink-0 p-0"
                  onClick={() => removePlayer(draft.id)}
                  disabled={drafts.length <= MIN_PLAYERS}
                  aria-label={`Remove ${draft.name || `player ${index + 1}`}`}
                >
                  <XIcon size={18} />
                </button>
              </li>
            ))}
          </ul>

          {drafts.length < MAX_PLAYERS ? (
            <button
              type="button"
              onClick={addPlayer}
              className="mt-2.5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong font-display font-bold text-muted transition hover:border-edge hover:text-foreground"
            >
              <PlusIcon size={18} strokeWidth={3} /> Add player
            </button>
          ) : (
            <p className="mt-3 text-center text-sm text-subtle">Twelve players max.</p>
          )}
        </section>

        <section className="card flex flex-col gap-6 rounded-[1.75rem] p-4 sm:p-6">
          <div>
            <h2 id="imposters-heading" className="px-1 font-display text-xl font-bold tracking-tight">
              Imposters
            </h2>
            <p className="mb-3 px-1 text-sm text-muted">
              {canHaveTwo ? "Two imposters don't know about each other." : `Two imposters need at least ${TWO_IMPOSTERS_FROM} players.`}
            </p>
            <Segmented
              labelledBy="imposters-heading"
              value={imposterCount}
              onChange={(value) => set("imposterCount", value)}
              options={[
                { value: 1, label: "1 imposter" },
                { value: 2, label: "2 imposters", disabled: !canHaveTwo },
              ]}
            />
          </div>

          <div>
            <h2 id="timer-heading" className="px-1 font-display text-xl font-bold tracking-tight">
              Discussion timer
            </h2>
            <p className="mb-3 px-1 text-sm text-muted">Time for clues and arguing before the vote.</p>
            <Segmented
              labelledBy="timer-heading"
              value={settings.discussSeconds}
              onChange={(value) => set("discussSeconds", value)}
              options={DISCUSS_OPTIONS.map((seconds) => ({ value: seconds, label: seconds ? `${seconds / 60} min` : "Off" }))}
            />
          </div>

          <div>
            <h2 className="px-1 font-display text-xl font-bold tracking-tight">Word categories</h2>
            <p className="mb-3 px-1 text-sm text-muted">The secret word comes from one of these.</p>
            <MultiSelect
              label="Word categories"
              values={settings.categories}
              onChange={(values) => set("categories", values)}
              options={IMPOSTER_CATEGORIES.map((c) => ({ value: c.id, label: c.label, color: c.color }))}
              className="grid-cols-2 sm:grid-cols-3"
            />
            {noCategory ? (
              <p role="alert" className="mt-2 px-1 text-sm font-semibold text-miss">
                Pick at least one category.
              </p>
            ) : null}
          </div>

          <div className="border-t-2 border-dashed border-line pt-5">
            <Toggle
              checked={settings.imposterHint}
              onChange={(value) => set("imposterHint", value)}
              label="Tell the imposter the category"
              description="Easier to bluff. Turn off for hard mode."
            />
          </div>
        </section>

        <ol className="grid gap-3 sm:grid-cols-3">
          {RULES.map((rule, i) => (
            <li key={rule.title} className="card rounded-2xl p-4">
              <span className="inline-grid size-7 place-items-center rounded-full bg-[var(--select-bg)] font-display text-sm font-bold text-[var(--select-fg)]">
                {i + 1}
              </span>
              <p className="mt-2 font-display font-bold">{rule.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{rule.body}</p>
            </li>
          ))}
        </ol>

        <div className="sticky bottom-4 z-10 mt-2">
          <button type="submit" className="btn btn-primary h-16 w-full text-lg" disabled={noCategory}>
            Deal the cards <ArrowRightIcon size={20} />
          </button>
        </div>
      </form>
    </GameShell>
  );
}
