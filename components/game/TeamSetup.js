"use client";

import { useState } from "react";
import { MAX_TEAMS, MIN_TEAMS, defaultTeamName, teamColor } from "@/lib/games/core/teams";
import { ArrowRightIcon, PlusIcon, XIcon } from "@/components/ui/icons";
import { Segmented, Stepper } from "@/components/ui/Controls";
import { GameShell } from "./GameShell";
import { TeamBadge } from "./TeamBadge";

const SOLO_NAME = "You";

/** Words for the group mode. Defaults are the team games'; Hi-Lo passes "player" ones. */
const TEAM_WORDS = { one: "team", many: "teams", title: "Teams", full: "Six teams max. That’s a full house." };

function initialDrafts(teams, nameFor) {
  if (teams?.length >= MIN_TEAMS) return teams.map((team, i) => ({ id: i + 1, name: team.name }));
  return Array.from({ length: MIN_TEAMS }, (_, i) => ({ id: i + 1, name: nameFor(i) }));
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
 *   rules: { title: string, body: string }[] | ((solo: boolean) => { title: string, body: string }[]),
 *   initialTeams?: { name: string }[],
 *   onStart: (drafts: { id: number, name: string }[]) => void,
 *   children?: React.ReactNode | ((solo: boolean) => React.ReactNode),   settings; a function gets the Solo / Teams choice
 *   startDisabled?: boolean,   e.g. while an async start is in flight
 *   startLabel?: string,
 *   allowSolo?: boolean,       false for games that need a team (e.g. Head Rush: someone has to give clues)
 *   words?: { one, many, title, full },   group wording; Hi-Lo uses players instead of teams
 *   max?: number,              most teams/players (default MAX_TEAMS)
 *   nameFor?: (i) => string,   default name for slot i
 *   colorFor?: (i) => string,  colour for slot i
 *   soloNote?: string,         the line under "Player" in solo
 * }} props
 */
export function TeamSetup({
  eyebrow,
  title,
  intro,
  rules,
  initialTeams,
  onStart,
  children,
  startDisabled = false,
  startLabel,
  allowSolo = true,
  words = TEAM_WORDS,
  max = MAX_TEAMS,
  nameFor = defaultTeamName,
  colorFor = teamColor,
  soloNote = "Just you against the clock. No steals, no passing the turn.",
}) {
  const [drafts, setDrafts] = useState(() => initialDrafts(initialTeams, nameFor));
  const [soloChoice, setSolo] = useState(initialTeams?.length === 1);
  const solo = allowSolo && soloChoice;
  const [soloName, setSoloName] = useState(initialTeams?.length === 1 ? initialTeams[0].name : SOLO_NAME);

  const addTeam = () =>
    setDrafts((current) => {
      if (current.length >= max) return current;
      const id = Math.max(0, ...current.map((d) => d.id)) + 1;
      return [...current, { id, name: nameFor(current.length) }];
    });

  const removeTeam = (id) => setDrafts((current) => (current.length <= MIN_TEAMS ? current : current.filter((d) => d.id !== id)));

  const rename = (id, name) => setDrafts((current) => current.map((d) => (d.id === id ? { ...d, name } : d)));

  // The stepper adds or removes the last team, one at a time.
  const setTeamCount = (count) => (count > drafts.length ? addTeam() : removeTeam(drafts[drafts.length - 1].id));

  return (
    <GameShell teamColor={colorFor(0)}>
      <section className="anim-rise pt-2 sm:pt-10">
        <p className="font-display text-xs font-bold uppercase tracking-[0.14em] text-accent-2 sm:text-sm">{eyebrow}</p>
        <h1 className="mt-1 font-display text-[clamp(2.1rem,10vw,4.75rem)] font-extrabold leading-[0.95] tracking-[-0.03em] sm:mt-2">
          {title}
        </h1>
        <p className="mt-2 max-w-md text-[0.9375rem] leading-snug text-muted sm:mt-4 sm:text-lg">{intro}</p>
      </section>

      <form
        className="mt-5 flex flex-1 flex-col gap-4 sm:mt-10 sm:gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          onStart(solo ? [{ id: 1, name: soloName.trim() || SOLO_NAME }] : drafts);
        }}
      >
        <section className="card rounded-[1.75rem] p-3.5 sm:p-6" aria-labelledby="teams-heading">
          {allowSolo ? (
            <Segmented
              label="Who's playing"
              value={solo}
              onChange={setSolo}
              options={[
                { value: true, label: "Solo" },
                { value: false, label: words.title },
              ]}
              className="mb-4 sm:mb-5"
            />
          ) : null}

          {solo ? (
            <>
              <h2 id="teams-heading" className="px-1 font-display text-lg font-bold tracking-tight sm:text-xl">
                Player
              </h2>
              <p className="px-1 text-sm text-muted">{soloNote}</p>
              <div className="field mt-3 flex items-center gap-3 p-1.5 pl-2 sm:mt-4 sm:p-2 sm:pl-2.5">
                <TeamBadge color={colorFor(0)}>1</TeamBadge>
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
                  className="h-9 min-w-0 flex-1 bg-transparent text-base font-semibold sm:h-10 sm:text-lg outline-none placeholder:text-subtle"
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 px-1">
                <h2 id="teams-heading" className="font-display text-lg font-bold tracking-tight sm:text-xl">
                  {words.title}
                </h2>
                <Stepper value={drafts.length} min={MIN_TEAMS} max={max} onChange={setTeamCount} label={`Number of ${words.many}`} unit={words.many} />
              </div>

              <ul className="mt-3 flex flex-col gap-2 sm:mt-4 sm:gap-2.5">
                {drafts.map((draft, index) => (
                  <li key={draft.id} className="field anim-rise flex items-center gap-3 p-1.5 pl-2 sm:p-2 sm:pl-2.5" style={{ "--team": colorFor(index) }}>
                    <TeamBadge color={colorFor(index)}>{index + 1}</TeamBadge>
                    <label className="sr-only" htmlFor={`team-${draft.id}`}>
                      {`${words.one.charAt(0).toUpperCase()}${words.one.slice(1)} ${index + 1} name`}
                    </label>
                    <input
                      id={`team-${draft.id}`}
                      value={draft.name}
                      maxLength={24}
                      autoComplete="off"
                      placeholder={nameFor(index)}
                      onChange={(event) => rename(draft.id, event.target.value)}
                      className="h-9 min-w-0 flex-1 bg-transparent text-base font-semibold sm:h-10 sm:text-lg outline-none placeholder:text-subtle"
                    />
                    <button
                      type="button"
                      className="btn btn-ghost size-10 shrink-0 p-0"
                      onClick={() => removeTeam(draft.id)}
                      disabled={drafts.length <= MIN_TEAMS}
                      aria-label={`Remove ${draft.name || nameFor(index)}`}
                    >
                      <XIcon size={18} />
                    </button>
                  </li>
                ))}
              </ul>

              {drafts.length < max ? (
                <button
                  type="button"
                  onClick={addTeam}
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong font-display font-bold text-muted transition hover:border-accent hover:text-foreground sm:mt-2.5 sm:h-14"
                >
                  <PlusIcon size={18} strokeWidth={3} /> Add {words.one}
                </button>
              ) : (
                <p className="mt-3 text-center text-sm text-subtle">{words.full}</p>
              )}
            </>
          )}
        </section>

        {typeof children === "function" ? children(solo) : children}

        {/* Phones: one compact card of numbered rules. Wider screens: three cards side by side. */}
        <section aria-labelledby="rules-heading" className="rules card rounded-[1.75rem] p-3.5">
          <h2 id="rules-heading" className="px-1 pb-1 font-display text-lg font-bold tracking-tight sm:sr-only">
            How to play
          </h2>
          <ol className="flex flex-col divide-y divide-line sm:grid sm:grid-cols-3 sm:gap-3 sm:divide-y-0">
            {(typeof rules === "function" ? rules(solo) : rules).map((rule, i) => (
              <li key={rule.title} className="rule-item flex gap-3 px-1 py-2.5">
                <span className="clay-color clay-sm inline-grid size-7 shrink-0 place-items-center rounded-full bg-[var(--select-bg)] font-display text-sm font-bold text-[var(--select-fg)]" style={{ "--tint": "var(--select-bg)" }}>
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-display font-bold leading-tight sm:mt-2">{rule.title}</p>
                  <p className="mt-0.5 text-sm leading-snug text-muted sm:mt-1 sm:leading-relaxed">{rule.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="cta-bar mt-auto">
          <button type="submit" className="btn btn-primary h-14 w-full text-base sm:h-16 sm:text-lg" disabled={startDisabled}>
            {startLabel ?? "Start game"} <ArrowRightIcon size={20} />
          </button>
        </div>
      </form>
    </GameShell>
  );
}

