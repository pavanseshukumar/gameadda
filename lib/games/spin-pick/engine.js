/**
 * Spin Pick — pure game engine.
 *
 * A fidget spinner with 3–6 spokes (arms), one colour per arm. Each round every player (or
 * team) calls a colour, then the round's spinner flicks it. Whoever called the
 * colour it stops on shares the pot:
 *
 *   points each = round(POT / number of players who called that colour)
 *
 * so a colour nobody else dared to call pays the most. The calling order (and
 * who spins) rotates every round, so nobody always gets the last, best-informed call.
 *
 * The landing colour is drawn when the spin starts (`random` on the action, from
 * Math.random() in the UI) and the spinner animates onto it. How hard you flick
 * changes how it feels, never what you win.
 *
 *   picking ──PICK × players──▶ ready ──SPIN──▶ spinning ──LAND──▶ result ──NEXT_ROUND──▶ picking
 *      ▲  └──UNDO_PICK            │                                  └──(last round)──▶ finished
 *      └──────UNDO_PICK───────────┘
 */

import { addScore, buildTeams, nextTeamIndex } from "../core/teams";

export const COLORS = Object.freeze([
  { id: "red", label: "Red", hex: "#ef4444", ink: "#fff" },
  { id: "orange", label: "Orange", hex: "#f97316", ink: "#fff" },
  { id: "yellow", label: "Yellow", hex: "#facc15", ink: "#3b2a00" },
  { id: "green", label: "Green", hex: "#22c55e", ink: "#06290f" },
  { id: "blue", label: "Blue", hex: "#3b82f6", ink: "#fff" },
  { id: "purple", label: "Purple", hex: "#a855f7", ink: "#fff" },
]);
export const COLOR_IDS = COLORS.map((c) => c.id);

export const SPOKE_OPTIONS = [3, 4, 5, 6];
export const DEFAULT_SPOKES = 3;
/** The colours on a spinner with n spokes, in order round it: always easy to tell apart. */
const PALETTES = {
  3: ["red", "yellow", "blue"],
  4: ["red", "yellow", "green", "blue"],
  5: ["red", "yellow", "green", "blue", "purple"],
  6: ["red", "orange", "yellow", "green", "blue", "purple"],
};

/** @returns {typeof COLORS} the colours in play for a spoke count */
export function colorsFor(spokes) {
  return (PALETTES[spokes] ?? PALETTES[6]).map((id) => COLORS.find((c) => c.id === id));
}

export function selectColors(state) {
  return colorsFor(state.settings.spokes);
}

function colorIdsOf(state) {
  return PALETTES[state.settings.spokes] ?? PALETTES[6];
}

/** Points shared by everyone who called the landing colour. */
export const POT = 60;
export const ROUND_OPTIONS = [5, 10, 15];
export const DEFAULT_ROUNDS = 10;

export const PHASES = Object.freeze({
  SETUP: "setup",
  PICKING: "picking",
  READY: "ready",
  SPINNING: "spinning",
  RESULT: "result",
  FINISHED: "finished",
});

export const ACTIONS = Object.freeze({
  START_GAME: "START_GAME",
  PICK: "PICK",
  UNDO_PICK: "UNDO_PICK",
  SPIN: "SPIN",
  LAND: "LAND",
  NEXT_ROUND: "NEXT_ROUND",
  END_GAME: "END_GAME",
  NEW_GAME: "NEW_GAME",
});

export function createInitialState() {
  return {
    phase: PHASES.SETUP,
    teams: [],
    settings: { rounds: DEFAULT_ROUNDS, spokes: DEFAULT_SPOKES },
    round: 0,
    /** Who calls first and spins this round (rotates). */
    starterIndex: 0,
    /** Calls so far this round, in order: `[{ teamId, colorId }]`. */
    picks: [],
    /** The colour the current spin will land on (set by SPIN). */
    target: null,
    /** `{ colorId, winners: string[], points }` */
    result: null,
    /** Landing colours so far, oldest first. */
    history: [],
    lastEvent: null,
  };
}

function makeEvent(state, event) {
  return { seq: (state.lastEvent?.seq ?? 0) + 1, ...event };
}

/** Players in calling order this round: the starter first. */
export function pickOrder(state) {
  const n = state.teams.length;
  return Array.from({ length: n }, (_, i) => state.teams[(state.starterIndex + i) % n]);
}

/** Whose call it is (null once everyone has called). */
export function selectPicker(state) {
  return pickOrder(state)[state.picks.length] ?? null;
}

export function selectSpinner(state) {
  return state.teams[state.starterIndex] ?? null;
}

/** `{ red: [team, …], … }`: who has called each colour this round. */
export function selectCallers(state) {
  const byColor = Object.fromEntries(colorIdsOf(state).map((id) => [id, []]));
  for (const pick of state.picks) {
    const team = state.teams.find((t) => t.id === pick.teamId);
    if (team && byColor[pick.colorId]) byColor[pick.colorId].push(team);
  }
  return byColor;
}

/** What a colour pays each caller if it lands, counting a would-be extra caller. */
export function payoutFor(callerCount) {
  return callerCount > 0 ? Math.round(POT / callerCount) : 0;
}

export function colorById(id) {
  return COLORS.find((c) => c.id === id) ?? null;
}

function startRound(state, round, starterIndex) {
  return { ...state, phase: PHASES.PICKING, round, starterIndex, picks: [], target: null, result: null };
}

export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_GAME: {
      if (state.phase !== PHASES.SETUP) return state;
      const teams = buildTeams(action.teams ?? []);
      if (teams.length < 1) return state;
      const rounds = ROUND_OPTIONS.includes(action.settings?.rounds) ? action.settings.rounds : DEFAULT_ROUNDS;
      const spokes = SPOKE_OPTIONS.includes(action.settings?.spokes) ? action.settings.spokes : DEFAULT_SPOKES;
      return startRound({ ...state, teams, settings: { rounds, spokes }, history: [], lastEvent: null }, 1, 0);
    }

    case ACTIONS.PICK: {
      if (state.phase !== PHASES.PICKING || !colorIdsOf(state).includes(action.colorId)) return state;
      const picker = selectPicker(state);
      if (!picker) return state;
      const picks = [...state.picks, { teamId: picker.id, colorId: action.colorId }];
      const done = picks.length === state.teams.length;
      return {
        ...state,
        picks,
        phase: done ? PHASES.READY : PHASES.PICKING,
        lastEvent: makeEvent(state, { type: "picked", teamId: picker.id, colorId: action.colorId }),
      };
    }

    case ACTIONS.UNDO_PICK: {
      if ((state.phase !== PHASES.PICKING && state.phase !== PHASES.READY) || state.picks.length === 0) return state;
      return { ...state, phase: PHASES.PICKING, picks: state.picks.slice(0, -1) };
    }

    case ACTIONS.SPIN: {
      if (state.phase !== PHASES.READY) return state;
      const random = typeof action.random === "number" && action.random >= 0 && action.random < 1 ? action.random : 0;
      const ids = colorIdsOf(state);
      const target = ids[Math.min(ids.length - 1, Math.floor(random * ids.length))];
      return { ...state, phase: PHASES.SPINNING, target };
    }

    case ACTIONS.LAND: {
      // The UI reports the spinner has stopped; the engine already knows where.
      if (state.phase !== PHASES.SPINNING) return state;
      const winners = state.picks.filter((p) => p.colorId === state.target).map((p) => p.teamId);
      const points = payoutFor(winners.length);
      const teams = winners.reduce((acc, id) => addScore(acc, id, points), state.teams);
      return {
        ...state,
        teams,
        phase: PHASES.RESULT,
        result: { colorId: state.target, winners, points },
        history: [...state.history, state.target],
        lastEvent: makeEvent(state, { type: "landed", colorId: state.target, winners, points }),
      };
    }

    case ACTIONS.NEXT_ROUND: {
      if (state.phase !== PHASES.RESULT) return state;
      if (state.round >= state.settings.rounds) return { ...state, phase: PHASES.FINISHED, lastEvent: null };
      return startRound(state, state.round + 1, nextTeamIndex(state.starterIndex, state.teams.length));
    }

    case ACTIONS.END_GAME: {
      if (state.phase === PHASES.SETUP || state.phase === PHASES.FINISHED) return state;
      // A spin that hasn't landed doesn't count.
      return { ...state, phase: PHASES.FINISHED, round: state.phase === PHASES.RESULT ? state.round : state.round - 1, lastEvent: null };
    }

    case ACTIONS.NEW_GAME: {
      return { ...createInitialState(), teams: state.teams.map((t) => ({ ...t, score: 0 })), settings: state.settings };
    }

    default:
      return state;
  }
}

/** On load: a spin interrupted by a reload goes back to "ready to spin". */
export function migrateState(saved) {
  if (!saved || typeof saved !== "object") return saved;
  const state = { ...createInitialState(), ...saved };
  // Saves from before the spokes option were all six-spoke spinners.
  state.settings = { rounds: saved.settings?.rounds ?? DEFAULT_ROUNDS, spokes: saved.settings?.spokes ?? 6 };
  if (state.phase === PHASES.SPINNING) {
    state.phase = PHASES.READY;
    state.target = null;
  }
  return state;
}

export function isValidState(state) {
  if (!state || typeof state !== "object") return false;
  if (!Object.values(PHASES).includes(state.phase)) return false;
  if (!Array.isArray(state.teams) || !Array.isArray(state.picks) || !Array.isArray(state.history)) return false;
  if (state.phase !== PHASES.SETUP && state.teams.length < 1) return false;
  if (!SPOKE_OPTIONS.includes(state.settings?.spokes)) return false;
  if (state.picks.some((p) => !colorIdsOf(state).includes(p.colorId))) return false;
  return true;
}
