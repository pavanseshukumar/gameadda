"use client";

import { Flag, Trophy } from "lucide-react";
import { getCategory } from "@/lib/games/pictionary/data/categories";
import { getTeamColor } from "@/lib/games/pictionary/data/team-colors";
import { BOARD_COLUMNS, spaceGridPosition } from "@/lib/games/pictionary/game-engine/board";
import { CategoryIcon } from "@/features/pictionary/shared/category-badge";
import { PALETTE } from "@/lib/games/pictionary/data/palette";

const TILE = 100;
const GAP = 14;
const ROW_GAP = 34;
const PAD = 18;
const TOKEN_R = 17;

function geometry(length) {
  const rows = Math.ceil(length / BOARD_COLUMNS);
  const width = PAD * 2 + BOARD_COLUMNS * TILE + (BOARD_COLUMNS - 1) * GAP;
  const height = PAD * 2 + rows * TILE + (rows - 1) * ROW_GAP;
  const center = (index) => {
    const { row, col } = spaceGridPosition(index);
    return {
      x: PAD + col * (TILE + GAP) + TILE / 2,
      y: PAD + (rows - 1 - row) * (TILE + ROW_GAP) + TILE / 2,
    };
  };
  return { width, height, center };
}

/** Offsets so up to four tokens share a tile without overlapping. */
function slotOffset(slot, count) {
  if (count === 1) return { dx: 0, dy: 4 };
  const spots = [
    { dx: -21, dy: -8 },
    { dx: 21, dy: -8 },
    { dx: -21, dy: 26 },
    { dx: 21, dy: 26 },
  ];
  return spots[slot];
}

/**
 * The winding board, drawn as one scalable SVG.
 * @param {{ board: any[], teams: any[], positions: Record<string, number>, activeTeamId?: string, landingIndex?: number | null }} props
 */
export function BoardView({ board, teams, positions, activeTeamId, landingIndex }) {
  const { width, height, center } = geometry(board.length);
  const track = board.map((s) => center(s.index));
  const trackPath = track.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");

  // Group tokens per space for stacking.
  const occupants = {};
  for (const t of teams) (occupants[positions[t.id]] ??= []).push(t.id);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full select-none"
      role="img"
      aria-label={`Game board with ${board.length} spaces. ${teams
        .map((t) => `${t.name} on space ${positions[t.id]}`)
        .join(", ")}.`}
    >
      <defs>
        <pattern id="checker" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill={PALETTE.paper} />
          <rect width="10" height="10" fill={PALETTE.ink} />
          <rect x="10" y="10" width="10" height="10" fill={PALETTE.ink} />
        </pattern>
      </defs>

      {/* Track */}
      <path d={trackPath} fill="none" stroke={PALETTE.ink} strokeWidth="44" strokeLinejoin="round" strokeLinecap="round" />
      <path d={trackPath} fill="none" stroke={PALETTE.creamDeep} strokeWidth="36" strokeLinejoin="round" strokeLinecap="round" />
      <path
        d={trackPath}
        fill="none"
        stroke={PALETTE.ink}
        strokeOpacity="0.25"
        strokeWidth="3"
        strokeDasharray="4 12"
        strokeLinecap="round"
      />

      {/* Spaces */}
      {board.map((space) => {
        const { x, y } = center(space.index);
        return (
          <Space key={space.index} space={space} x={x - TILE / 2} y={y - TILE / 2} landing={space.index === landingIndex} />
        );
      })}

      {/* Tokens */}
      {teams.map((team) => {
        const pos = positions[team.id];
        const here = occupants[pos];
        const { dx, dy } = slotOffset(here.indexOf(team.id), here.length);
        const { x, y } = center(pos);
        const color = getTeamColor(team.color);
        const active = team.id === activeTeamId;
        return (
          <g
            key={team.id}
            style={{
              transform: `translate(${x + dx}px, ${y + dy}px)`,
              transition: "transform 240ms cubic-bezier(.3,.7,.4,1)",
            }}
          >
            {/* Re-keyed per position so each step replays the hop. */}
            <g key={pos} className="board-token-hop">
              {active && (
                <circle r={TOKEN_R + 4} fill="none" stroke={color.hex} strokeWidth="5" className="board-token-pulse" />
              )}
              <ellipse cx="0" cy={TOKEN_R - 2} rx={TOKEN_R} ry="6" fill={PALETTE.ink} opacity="0.25" />
              <circle r={TOKEN_R} fill={color.hex} stroke={PALETTE.ink} strokeWidth="3.5" />
              <circle r={TOKEN_R - 8} cy="-3" fill="#fff" opacity="0.28" />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

function Space({ space, x, y, landing }) {
  if (space.type === "start" || space.type === "finish") {
    const finish = space.type === "finish";
    return (
      <g transform={`translate(${x} ${y})`}>
        <rect
          width={TILE}
          height={TILE}
          rx="24"
          fill={finish ? "url(#checker)" : PALETTE.paper}
          stroke={PALETTE.ink}
          strokeWidth="4"
        />
        {finish ? (
          <>
            <circle cx={TILE / 2} cy={TILE / 2 - 6} r="26" fill={PALETTE.sun} stroke={PALETTE.ink} strokeWidth="3.5" />
            <Trophy x={TILE / 2 - 14} y={TILE / 2 - 20} width="28" height="28" strokeWidth={2.5} color={PALETTE.ink} />
            <rect x="14" y={TILE - 30} width={TILE - 28} height="20" rx="10" fill={PALETTE.ink} />
            <text x={TILE / 2} y={TILE - 15.5} textAnchor="middle" className="font-display" fontSize="13" fontWeight="800" fill={PALETTE.sun}>
              FINISH
            </text>
          </>
        ) : (
          <>
            <Flag x={TILE / 2 - 15} y="16" width="30" height="30" strokeWidth={2.5} color={PALETTE.mint} />
            <text x={TILE / 2} y={TILE - 22} textAnchor="middle" className="font-display" fontSize="17" fontWeight="800" fill={PALETTE.ink}>
              START
            </text>
          </>
        )}
      </g>
    );
  }

  const c = getCategory(space.category);
  return (
    <g transform={`translate(${x} ${y})`}>
      {landing && (
        <rect x="-7" y="-7" width={TILE + 14} height={TILE + 14} rx="30" fill="none" stroke={PALETTE.sun} strokeWidth="6" className="board-landing" />
      )}
      <rect width={TILE} height={TILE} rx="24" fill={c.color} stroke={PALETTE.ink} strokeWidth="4" />
      <rect x="6" y="6" width={TILE - 12} height="26" rx="13" fill="#fff" opacity="0.18" />
      <CategoryIcon category={space.category} x={TILE / 2 - 16} y="14" width="32" height="32" strokeWidth={2.4} color={c.ink} />
      <text x={TILE / 2} y={TILE - 34} textAnchor="middle" className="font-display" fontSize="13" fontWeight="800" fill={c.ink} opacity="0.95">
        {space.type === "all-play" ? "ALL PLAY" : c.label.toUpperCase()}
      </text>
      <text x="12" y={TILE - 10} className="font-display" fontSize="12" fontWeight="700" fill={c.ink} opacity="0.6">
        {space.index}
      </text>
    </g>
  );
}

/** The categories present on a board, for the legend. */
export function BoardLegend({ board }) {
  const ids = [...new Set(board.filter((s) => s.category).map((s) => s.category))];
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-sm font-semibold text-ink-soft">
      {ids.map((id) => (
        <li key={id} className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-[4px] border-2 border-ink" style={{ background: getCategory(id).color }} />
          {getCategory(id).label}
        </li>
      ))}
    </ul>
  );
}
