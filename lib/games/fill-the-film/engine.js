/**
 * Fill the Film — pure game engine.
 *
 * Every team gets its own list of Telugu movie titles (English spelling) shown
 * as blanks. Each title starts with its first letter and one other letter showing.
 * Teams work through their list IN ORDER: only the first open movie can be played.
 * On its turn a team can:
 *   - guess the current movie: right → points, next movie, and the team keeps going;
 *     wrong → the turn passes;
 *   - ask for the next letter, or a clue (year, then lead);
 *   - give up on it: 0 points, the title is shown and the next movie opens.
 * A letter, clue or give-up is shown to everyone first (`reveal`); CONTINUE then
 * passes the turn. Wrong guesses are kept on the movie so everyone can see them.
 *
 * Optional turn timer: it starts as soon as a turn begins, restarts after every
 * right answer, and TIME_UP passes the turn.
 *
 * Points for a solved movie: POINTS_PER_HIDDEN × letters still hidden when it was
 * solved (at least MIN_POINTS). The first team to clear its whole list gets FIRST_FINISH_BONUS.
 * Teams that have finished are skipped; the game ends when every list is done.
 *
 * Purity: anything random comes in on the action (`seed: Math.random()`).
 *
 *   playing ──GUESS (right)──▶ playing, same team, next movie
 *      │  ├───GUESS (wrong)──▶ playing, next team
 *      │  └─REVEAL_LETTER / REVEAL_CLUE / GIVE_UP──▶ reveal shown ──CONTINUE──▶ next team
 *      └── every list done ──▶ finished
 */

import { addScore, buildTeams, nextTeamIndex } from "../core/teams";
import { createRandom, shuffle } from "../core/shuffle";
import { MOVIES, answerWords, isPlayable } from "../jumble-rumble/movies";

export const LIST_SIZE_OPTIONS = [6, 8, 10];
export const DEFAULT_LIST_SIZE = 8;
export const POINTS_PER_HIDDEN = 10;
export const MIN_POINTS = 10;
export const FIRST_FINISH_BONUS = 30;
/** Seconds per turn (restarting after each right answer). 0 = no timer. */
export const TURN_SECONDS_OPTIONS = [0, 30, 45, 60];
export const DEFAULT_TURN_SECONDS = 45;
/** Clues in the order they're given, when the movie has them. */
const CLUE_ORDER = ["year", "lead"];

export const PHASES = Object.freeze({ SETUP: "setup", PLAYING: "playing", FINISHED: "finished" });

export const ACTIONS = Object.freeze({
  START_GAME: "START_GAME",
  TIME_UP: "TIME_UP",
  GUESS: "GUESS",
  REVEAL_LETTER: "REVEAL_LETTER",
  REVEAL_CLUE: "REVEAL_CLUE",
  GIVE_UP: "GIVE_UP",
  CONTINUE: "CONTINUE",
  END_GAME: "END_GAME",
  NEW_GAME: "NEW_GAME",
});

/**
 * @typedef {Object} ListEntry
 * @property {string} id
 * @property {string} title
 * @property {number} [year]
 * @property {string} [lead]
 * @property {number[]} revealed   indexes into the title's letters (A–Z only) that are showing
 * @property {string[]} clues      clue keys shown so far ("year", "lead")
 * @property {boolean} solved
 * @property {boolean} gaveUp      skipped with 0 points; the title is shown
 * @property {string[]} wrongGuesses  guesses that weren't it, oldest first
 * @property {number} points       earned when solved
 */

/**
 * What the team just asked for, shown to everyone before the turn passes.
 * @typedef {{ kind: "letter", teamId: string, movieIndex: number, letterIndex: number }
 *   | { kind: "clue", teamId: string, movieIndex: number, clue: string }
 *   | { kind: "gave-up", teamId: string, movieIndex: number }} Reveal
 */

export function createInitialState() {
  return {
    phase: PHASES.SETUP,
    teams: [],
    settings: { listSize: DEFAULT_LIST_SIZE, turnSeconds: DEFAULT_TURN_SECONDS },
    activeTeamIndex: 0,
    /** @type {Record<string, ListEntry[]>} each team's list, by team id */
    lists: {},
    /** @type {Reveal | null} */
    reveal: null,
    /** Movie ids handed out in recent games, so the next game deals fresh ones. */
    usedMovieIds: [],
    /** Team ids in the order they cleared their lists. */
    finishOrder: [],
    /** Turns taken so far (one per pass of the turn). */
    turns: 0,
    lastEvent: null,
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function makeEvent(state, event) {
  return { seq: (state.lastEvent?.seq ?? 0) + 1, ...event };
}

/** Upper-case letters of the title, A–Z only. */
export function titleLetters(entry) {
  return [...answerWords(entry).join("")];
}

/** Words of the title as letter counts, for laying out tiles. */
export function titleWordLengths(entry) {
  return answerWords(entry).map((word) => word.length);
}

/**
 * A guess must spell the title exactly, letter for letter. Only capitals, spaces and
 * punctuation are ignored (the tiles show letters only): "sita ramam" and "SitaRamam"
 * match "Sita Ramam"; "Seetha Ramam" doesn't.
 */
export function isExactTitle(entry, guess) {
  const typed = String(guess ?? "").toUpperCase().replace(/[^A-Z]/g, "");
  return typed.length > 0 && typed === titleLetters(entry).join("");
}

function hiddenCount(entry) {
  return titleLetters(entry).length - entry.revealed.length;
}

export function isResolved(entry) {
  return entry.solved || entry.gaveUp;
}

export function pointsFor(entry) {
  return Math.max(MIN_POINTS, hiddenCount(entry) * POINTS_PER_HIDDEN);
}

export function availableClues(entry) {
  return CLUE_ORDER.filter((key) => entry[key] != null && entry[key] !== "");
}

export function canRevealLetter(entry) {
  // Always leave at least one letter for the team to work out (or give up on).
  return !isResolved(entry) && hiddenCount(entry) > 1;
}

export function canRevealClue(entry) {
  return !isResolved(entry) && availableClues(entry).some((key) => !entry.clues.includes(key));
}

/** A new list entry: first letter plus one random other letter showing. */
function makeEntry(movie, random) {
  const { id, title, year, lead } = movie;
  const entry = { id, title, revealed: [0], clues: [], wrongGuesses: [], solved: false, gaveUp: false, points: 0 };
  if (typeof year === "number") entry.year = year;
  if (typeof lead === "string" && lead) entry.lead = lead;
  const count = titleLetters(entry).length;
  // Short titles keep just the first letter, so there's something left to guess.
  if (count > 3) entry.revealed.push(1 + Math.floor(random() * (count - 1)));
  return entry;
}

/** Deal `size` distinct movies to every team, preferring ones not used in recent games. */
function dealLists(teams, size, movies, usedIds, seed) {
  const pool = (Array.isArray(movies) ? movies : []).filter(isPlayable);
  const source = pool.length >= teams.length * size ? pool : [...pool, ...MOVIES].filter(isPlayable);
  const unique = [...new Map(source.map((m) => [m.id, m])).values()];
  const shuffled = shuffle(unique, seed);
  const fresh = shuffled.filter((m) => !usedIds.includes(m.id));
  const stale = shuffled.filter((m) => usedIds.includes(m.id));
  const order = [...fresh, ...stale];
  const random = createRandom((seed * 7919) % 1);
  // A small (offline) pool shortens every list equally, so teams stay even.
  const perTeam = Math.min(size, Math.floor(order.length / teams.length));

  const lists = {};
  teams.forEach((team, t) => {
    lists[team.id] = order.slice(t * perTeam, (t + 1) * perTeam).map((movie) => makeEntry(movie, random));
  });
  const dealt = Object.values(lists).flat().map((e) => e.id);
  // Remember recent movies, but not so many that a small pool can never be fresh again.
  const keep = unique.length - dealt.length;
  const remembered = keep > 0 ? [...usedIds.filter((id) => !dealt.includes(id)), ...dealt].slice(-keep) : [];
  return { lists, usedMovieIds: remembered };
}

function isListDone(list) {
  return list.length > 0 && list.every(isResolved);
}

/** Index of the movie a team is on: its first unresolved one, or -1 when done. */
export function currentIndex(list) {
  return list.findIndex((entry) => !isResolved(entry));
}

/** The next team (after the active one, ending with itself) that still has movies left, or null. */
function nextOpenTeamIndex(state) {
  const n = state.teams.length;
  for (let step = 1; step <= n; step += 1) {
    const index = (state.activeTeamIndex + step) % n;
    if (!isListDone(state.lists[state.teams[index].id])) return index;
  }
  return null;
}

function updateEntry(state, teamId, movieIndex, patch) {
  const list = state.lists[teamId].map((entry, i) => (i === movieIndex ? { ...entry, ...patch } : entry));
  return { ...state.lists, [teamId]: list };
}

/** Record a team that just cleared its list; the first one gets the bonus. */
function markFinished(state, teamId) {
  if (state.finishOrder.includes(teamId) || !isListDone(state.lists[teamId])) return { state, bonus: 0 };
  const bonus = state.finishOrder.length === 0 && state.teams.length > 1 ? FIRST_FINISH_BONUS : 0;
  return {
    state: { ...state, finishOrder: [...state.finishOrder, teamId], teams: bonus ? addScore(state.teams, teamId, bonus) : state.teams },
    bonus,
  };
}

/** Hand the turn to the next team that still has movies left (or end the game). */
function passTurn(state, event) {
  const nextIndex = nextOpenTeamIndex(state);
  if (nextIndex == null) return { ...state, reveal: null, phase: PHASES.FINISHED, lastEvent: makeEvent(state, { type: "game-over" }) };
  return {
    ...state,
    reveal: null,
    activeTeamIndex: nextIndex,
    turns: state.turns + 1,
    lastEvent: makeEvent(state, { ...event, nextTeamId: state.teams[nextIndex].id }),
  };
}

/** The active team's current movie, if it can be played right now. */
function current(state) {
  if (state.phase !== PHASES.PLAYING || state.reveal) return null;
  const team = state.teams[state.activeTeamIndex];
  const list = state.lists[team.id] ?? [];
  const movieIndex = currentIndex(list);
  return movieIndex === -1 ? null : { team, entry: list[movieIndex], movieIndex };
}

/* ------------------------------------------------------------------ */
/* Reducer                                                              */
/* ------------------------------------------------------------------ */

export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_GAME: {
      // Starting waits for the movie pool, so ignore a late double-start.
      if (state.phase !== PHASES.SETUP) return state;
      const teams = buildTeams(action.teams ?? []);
      if (teams.length < 1) return state;
      const listSize = LIST_SIZE_OPTIONS.includes(action.settings?.listSize) ? action.settings.listSize : DEFAULT_LIST_SIZE;
      const turnSeconds = TURN_SECONDS_OPTIONS.includes(action.settings?.turnSeconds) ? action.settings.turnSeconds : DEFAULT_TURN_SECONDS;
      const { lists, usedMovieIds } = dealLists(teams, listSize, action.movies, state.usedMovieIds, action.seed ?? 0);
      return {
        ...state,
        phase: PHASES.PLAYING,
        teams,
        settings: { listSize, turnSeconds },
        activeTeamIndex: 0,
        lists,
        reveal: null,
        usedMovieIds,
        finishOrder: [],
        turns: 1,
        lastEvent: makeEvent(state, { type: "game-start" }),
      };
    }

    case ACTIONS.TIME_UP: {
      const target = current(state);
      if (!target || !state.settings.turnSeconds) return state;
      // `eventSeq` is the event the clock started from; anything newer means the team already acted.
      if (action.eventSeq !== (state.lastEvent?.seq ?? 0)) return state;
      return passTurn(state, { type: "timeout", teamId: target.team.id, movieIndex: target.movieIndex });
    }

    case ACTIONS.GUESS: {
      const target = current(state);
      const guess = String(action.guess ?? "").trim();
      if (!target || !guess) return state;
      const { team, entry, movieIndex } = target;

      if (!isExactTitle(entry, guess)) {
        const lists = updateEntry(state, team.id, movieIndex, { wrongGuesses: [...(entry.wrongGuesses ?? []), guess] });
        return passTurn({ ...state, lists }, { type: "wrong", teamId: team.id, movieIndex, guess });
      }

      const points = pointsFor(entry);
      const lists = updateEntry(state, team.id, movieIndex, {
        solved: true,
        points,
        revealed: titleLetters(entry).map((_, i) => i),
      });
      const { state: next, bonus } = markFinished({ ...state, lists, teams: addScore(state.teams, team.id, points) }, team.id);
      // Right answer: the team keeps the turn, unless that was its last movie.
      if (!next.finishOrder.includes(team.id)) {
        return { ...next, lastEvent: makeEvent(state, { type: "solved", teamId: team.id, movieIndex, points }) };
      }
      return passTurn(next, { type: "list-done", teamId: team.id, movieIndex, points, bonus });
    }

    case ACTIONS.REVEAL_LETTER: {
      const target = current(state);
      if (!target || !canRevealLetter(target.entry)) return state;
      const { team, entry, movieIndex } = target;
      // "Next letter": the first one, left to right, that's still hidden.
      const letterIndex = titleLetters(entry).findIndex((_, i) => !entry.revealed.includes(i));
      return {
        ...state,
        lists: updateEntry(state, team.id, movieIndex, { revealed: [...entry.revealed, letterIndex].sort((a, b) => a - b) }),
        reveal: { kind: "letter", teamId: team.id, movieIndex, letterIndex },
        lastEvent: makeEvent(state, { type: "letter", teamId: team.id, movieIndex, letterIndex }),
      };
    }

    case ACTIONS.REVEAL_CLUE: {
      const target = current(state);
      if (!target || !canRevealClue(target.entry)) return state;
      const { team, entry, movieIndex } = target;
      const clue = availableClues(entry).find((key) => !entry.clues.includes(key));
      return {
        ...state,
        lists: updateEntry(state, team.id, movieIndex, { clues: [...entry.clues, clue] }),
        reveal: { kind: "clue", teamId: team.id, movieIndex, clue },
        lastEvent: makeEvent(state, { type: "clue", teamId: team.id, movieIndex, clue }),
      };
    }

    case ACTIONS.GIVE_UP: {
      const target = current(state);
      if (!target) return state;
      const { team, entry, movieIndex } = target;
      return {
        ...state,
        lists: updateEntry(state, team.id, movieIndex, { gaveUp: true, revealed: titleLetters(entry).map((_, i) => i) }),
        reveal: { kind: "gave-up", teamId: team.id, movieIndex },
        lastEvent: makeEvent(state, { type: "gave-up", teamId: team.id, movieIndex }),
      };
    }

    case ACTIONS.CONTINUE: {
      // Everyone has seen the letter / clue / answer: now the turn passes.
      if (state.phase !== PHASES.PLAYING || !state.reveal) return state;
      const { teamId } = state.reveal;
      // Giving up the last movie clears the list too.
      const { state: next, bonus } = markFinished(state, teamId);
      const cleared = next.finishOrder.length > state.finishOrder.length;
      return passTurn(next, { type: cleared ? "list-done" : "turn-passed", teamId, bonus });
    }

    case ACTIONS.END_GAME: {
      if (state.phase !== PHASES.PLAYING) return state;
      return { ...state, phase: PHASES.FINISHED, reveal: null, lastEvent: null };
    }

    case ACTIONS.NEW_GAME: {
      return {
        ...createInitialState(),
        teams: state.teams.map((team) => ({ ...team, score: 0 })),
        settings: state.settings,
        usedMovieIds: state.usedMovieIds,
      };
    }

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* Persistence                                                          */
/* ------------------------------------------------------------------ */

export function migrateState(saved) {
  if (!saved || typeof saved !== "object") return saved;
  const base = createInitialState();
  return { ...base, ...saved, settings: { ...base.settings, ...saved.settings } };
}

export function isValidState(state) {
  if (!state || typeof state !== "object") return false;
  if (!Object.values(PHASES).includes(state.phase)) return false;
  if (!Array.isArray(state.teams) || !state.lists || typeof state.lists !== "object") return false;
  if (state.phase === PHASES.PLAYING) {
    if (state.teams.length < 1 || state.activeTeamIndex >= state.teams.length) return false;
    for (const team of state.teams) {
      const list = state.lists[team.id];
      if (!Array.isArray(list) || list.length === 0) return false;
      if (!list.every((entry) => isPlayable(entry) && Array.isArray(entry.revealed) && Array.isArray(entry.clues))) return false;
    }
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Selectors                                                            */
/* ------------------------------------------------------------------ */

export function selectActiveTeam(state) {
  return state.teams[state.activeTeamIndex] ?? null;
}

export function selectTeam(state, teamId) {
  return state.teams.find((team) => team.id === teamId) ?? null;
}

export function selectList(state, teamId) {
  return state.lists[teamId] ?? [];
}

export function selectSolvedCount(state, teamId) {
  return selectList(state, teamId).filter((entry) => entry.solved).length;
}

/** Movies a team has dealt with (solved or given up). */
export function selectDoneCount(state, teamId) {
  return selectList(state, teamId).filter(isResolved).length;
}

/** The team that will play after CONTINUE (null if the game would end). */
export function selectTeamAfterReveal(state) {
  if (!state.reveal) return null;
  const lists = state.lists;
  const n = state.teams.length;
  for (let step = 1; step <= n; step += 1) {
    const team = state.teams[(state.activeTeamIndex + step) % n];
    if (!isListDone(lists[team.id])) return team;
  }
  return null;
}
