"use client";

import { useState } from "react";
import { MAX_TEAMS, MIN_TEAMS, defaultTeamName, teamColor } from "@/lib/games/core/teams";
import { ArrowRightIcon, PlusIcon, XIcon } from "@/components/ui/icons";
import { GameShell } from "./GameShell";

const SOLO_NAME = "You";

function initialDrafts(teams) {
  if (teams?.length >= MIN_TEAMS) return teams.map((team, i) => ({ id: i + 1, name: team.name }));
  return Array.from({ length: MIN_TEAMS }, (_, i) => ({ id: i + 1, name: defaultTeamName(i) }));
}

/**
 * Shared setup screen: hero, a Solo / Teams switch, 2–6 editable teams (or one
 * player name in solo), rules and an optional game-specific settings section (`children`).
 * In solo, `onStart` gets a single draft.
 *
 * @param {{
 *   eyebrow: string,
 *   title: React.ReactNode,
 *   intro: string,
 *   rules: { title: string, body: string }[],
 *   initialTeams?: { name: string }[],
 *   onStart: (drafts: { id: number, name: string }[]) => void,
 *   children?: React.ReactNode,
 *   startDisabled?: boolean,   e.g. while an async start is in flight
 *   startLabel?: string,
 * }} props
 */
export function TeamSetup({ eyebrow, title, intro, rules, initialTeams, onStart, children, startDisabled = false, startLabel }) {
  const [drafts, setDrafts] = useState(() => initialDrafts(initialTeams));
  const [solo, setSolo] = useState(initialTeams?.length === 1);
  const [soloName, setSoloName] = useState(initialTeams?.length === 1 ? initialTeams[0].name : SOLO_NAME);

  const addTeam = () =>
    setDrafts((current) => {
      if (current.length >= MAX_TEAMS) return current;
      const id = Math.max(0, ...current.map((d) => d.id)) + 1;
      return [...current, { id, name: defaultTeamName(current.length) }];
    });

  const removeTeam = (id) => setDrafts((current) => (current.length <= MIN_TEAMS ? current : current.filter((d) => d.id !== id)));

  const rename = (id, name) => setDrafts((current) => current.map((d) => (d.id === id ? { ...d, name } : d)));

  return (
    <GameShell teamColor={teamColor(0)}>
      <section className="anim-rise pt-6 sm:pt-12">
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          <span className="size-1.5 rounded-full bg-accent-2" />
          {eyebrow}
        </p>
        <h1 className="mt-5 font-display text-[clamp(2.4rem,9vw,4.75rem)] font-extrabold leading-[0.95] tracking-[-0.035em]">
          {title}
        </h1>
        <p className="mt-4 max-w-md text-base text-muted sm:text-lg">{intro}</p>
      </section>

      <form
        className="mt-10 flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          onStart(solo ? [{ id: 1, name: soloName.trim() || SOLO_NAME }] : drafts);
        }}
      >
        <section className="card rounded-[1.75rem] p-4 sm:p-6" aria-labelledby="teams-heading">
          <div role="radiogroup" aria-label="Who's playing" className="mb-5 grid grid-cols-2 gap-1 rounded-full border border-line bg-surface p-1">
            {[
              [true, "Solo"],
              [false, "Teams"],
            ].map(([value, label]) => (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={solo === value}
                onClick={() => setSolo(value)}
                className={`btn h-11 text-base ${solo === value ? "btn-primary" : "btn-ghost"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {solo ? (
            <>
              <h2 id="teams-heading" className="px-1 font-display text-xl font-bold tracking-tight">
                Player
              </h2>
              <p className="px-1 text-sm text-muted">Just you against the clock. No steals, no passing the turn.</p>
              <div
                className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-surface-strong p-2 pl-3 transition focus-within:border-[color:var(--c)]"
                style={{ "--c": teamColor(0) }}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl font-display text-sm font-bold text-white" style={{ background: teamColor(0) }}>
                  1
                </span>
                <label className="sr-only" htmlFor="solo-name">
                  Your name
                </label>
                <input
                  id="solo-name"
                  value={soloName}
                  maxLength={24}
                  autoComplete="off"
                  placeholder={SOLO_NAME}
                  onChange={(event) => setSoloName(event.target.value)}
                  className="h-11 min-w-0 flex-1 bg-transparent text-lg font-medium outline-none placeholder:text-subtle"
                />
              </div>
            </>
          ) : (
            <>
            <div className="flex items-center justify-between gap-4 px-1">
              <h2 id="teams-heading" className="font-display text-xl font-bold tracking-tight">
                Teams
              </h2>
              <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1" role="group" aria-label="Number of teams">
                <button
                  type="button"
                  className="btn btn-ghost size-9 p-0"
                  onClick={() => removeTeam(drafts[drafts.length - 1].id)}
                  disabled={drafts.length <= MIN_TEAMS}
                  aria-label="Remove last team"
                >
                  <span className="text-lg leading-none">−</span>
                </button>
                <span className="w-7 text-center font-display text-lg font-bold tabular-nums" aria-live="polite">
                  {drafts.length}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost size-9 p-0"
                  onClick={addTeam}
                  disabled={drafts.length >= MAX_TEAMS}
                  aria-label="Add a team"
                >
                  <PlusIcon size={18} />
                </button>
              </div>
            </div>

            <ul className="mt-5 flex flex-col gap-2.5">
              {drafts.map((draft, index) => {
                const color = teamColor(index);
                return (
                  <li
                    key={draft.id}
                    className="anim-rise group flex items-center gap-3 rounded-2xl border border-line bg-surface-strong p-2 pl-3 transition focus-within:border-[color:var(--c)]"
                    style={{ "--c": color }}
                  >
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-xl font-display text-sm font-bold text-white"
                      style={{ background: color }}
                    >
                      {index + 1}
                    </span>
                    <label className="sr-only" htmlFor={`team-${draft.id}`}>
                      Team {index + 1} name
                    </label>
                    <input
                      id={`team-${draft.id}`}
                      value={draft.name}
                      maxLength={24}
                      autoComplete="off"
                      placeholder={defaultTeamName(index)}
                      onChange={(event) => rename(draft.id, event.target.value)}
                      className="h-11 min-w-0 flex-1 bg-transparent text-lg font-medium outline-none placeholder:text-subtle"
                    />
                    <button
                      type="button"
                      className="btn btn-ghost size-10 shrink-0 p-0"
                      onClick={() => removeTeam(draft.id)}
                      disabled={drafts.length <= MIN_TEAMS}
                      aria-label={`Remove ${draft.name || defaultTeamName(index)}`}
                    >
                      <XIcon size={18} />
                    </button>
                  </li>
                );
              })}
            </ul>

            {drafts.length < MAX_TEAMS ? (
              <button
                type="button"
                onClick={addTeam}
                className="mt-2.5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong text-muted transition hover:border-accent hover:text-foreground"
              >
                <PlusIcon size={18} /> Add team
              </button>
            ) : (
              <p className="mt-3 text-center text-sm text-subtle">Six teams max. That’s a full house.</p>
            )}
            </>
          )}
        </section>

        {children}

        <ol className="grid gap-3 sm:grid-cols-3">
          {rules.map((rule, i) => (
            <li key={rule.title} className="rounded-2xl border border-line bg-surface p-4">
              <span className="font-display text-sm font-bold text-accent">0{i + 1}</span>
              <p className="mt-1 font-semibold">{rule.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{rule.body}</p>
            </li>
          ))}
        </ol>

        <div className="sticky bottom-4 z-10 mt-2">
          <button type="submit" className="btn btn-primary h-16 w-full text-lg" disabled={startDisabled}>
            {startLabel ?? "Start game"} <ArrowRightIcon size={20} />
          </button>
        </div>
      </form>
    </GameShell>
  );
}
