"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { TEAM_COLOR_IDS, getTeamColor, teamStyle } from "@/lib/games/pictionary/data/team-colors";
import { cn, uid } from "@/lib/games/pictionary/utils";

const MAX_PLAYERS = 8;

export function TeamEditor({ team, index, onChange }) {
  const [playerName, setPlayerName] = useState("");
  const color = getTeamColor(team.color);
  const full = team.players.length >= MAX_PLAYERS;

  const addPlayer = (e) => {
    e.preventDefault();
    const name = playerName.trim();
    if (!name || full) return;
    onChange({ players: [...team.players, { key: uid("p"), name: name.slice(0, 24) }] });
    setPlayerName("");
  };

  return (
    <div className="card-ink overflow-hidden" style={teamStyle(team.color)}>
      <div className="flex items-center gap-3 bg-[var(--team)] px-4 py-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-paper font-display text-lg font-extrabold text-[var(--team-deep)]">
          {index + 1}
        </span>
        <label className="sr-only" htmlFor={`team-name-${team.key}`}>
          Team {index + 1} name
        </label>
        <input
          id={`team-name-${team.key}`}
          value={team.name}
          maxLength={22}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={`Team ${index + 1}`}
          className="min-w-0 flex-1 rounded-xl bg-white/20 px-3 py-2 font-display text-xl font-extrabold text-[var(--team-fg)] placeholder:text-[var(--team-fg)]/60 focus:bg-white/30 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div role="radiogroup" aria-label={`${team.name} colour`} className="flex flex-wrap gap-2">
          {TEAM_COLOR_IDS.map((id) => {
            const c = getTeamColor(id);
            const selected = id === team.color;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={c.label}
                onClick={() => onChange({ color: id })}
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-full border-2 border-ink transition active:scale-90",
                  selected ? "scale-110 ring-3 ring-ink/15" : "opacity-80 hover:opacity-100",
                )}
                style={{ background: c.hex }}
              >
                {selected && <Check className="size-5" style={{ color: c.fg }} strokeWidth={4} />}
              </button>
            );
          })}
        </div>

        <div>
          {team.players.length > 0 && (
            <ul className="mb-3 flex flex-wrap gap-2">
              {team.players.map((p) => (
                <li
                  key={p.key}
                  className="inline-flex items-center gap-1 rounded-full py-1 pr-1 pl-3 font-semibold animate-pop-in"
                  style={{ background: color.soft, color: color.deep }}
                >
                  {p.name}
                  <button
                    type="button"
                    aria-label={`Remove ${p.name}`}
                    onClick={() => onChange({ players: team.players.filter((x) => x.key !== p.key) })}
                    className="inline-flex size-7 items-center justify-center rounded-full hover:bg-black/10"
                  >
                    <X className="size-4" strokeWidth={3} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={addPlayer} className="flex gap-2">
            <label className="sr-only" htmlFor={`player-${team.key}`}>
              Add player to {team.name}
            </label>
            <input
              id={`player-${team.key}`}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              disabled={full}
              placeholder={full ? "Team is full" : "Add a player"}
              enterKeyHint="done"
              autoComplete="off"
              className="min-h-12 min-w-0 flex-1 rounded-2xl border-2 border-line bg-cream px-4 font-medium focus:border-ink focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Add player"
              disabled={!playerName.trim() || full}
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 border-ink bg-[var(--team)] text-[var(--team-fg)] transition active:scale-95 disabled:opacity-35"
            >
              <Plus className="size-5" strokeWidth={3} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
