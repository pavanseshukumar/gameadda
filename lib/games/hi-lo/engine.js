/**
 * Hi-Lo — pure game engine. Higher or lower, with a real deck of cards.
 *
 * Each player is dealt the same number of cards (the setting). On their turn a
 * starter card goes face up; for every card in their hand they call Higher or
 * Lower, then it's flipped. Right: they keep the card. Wrong (or the same rank):
 * it's discarded. Either way it becomes the card to beat for the next call.
 * Most cards kept wins. Solo, you chase your best for that hand size.
 *
 * Everyone draws from one shared shoe, so a good memory pays: the cards already
 * played are shown, and an empty shoe is reshuffled with a fresh deck.
 *
 * Aces are low: A < 2 < 3 < … < 10 < J < Q < K.
 *
 * Randomness: START_GAME brings a `seed` (Math.random() in the UI); every
 * reshuffle derives its own seed from it, so the reducer stays pure.
 *
 *   ready ──START_TURN──▶ playing ──GUESS × hand──▶ turnOver ──NEXT_TURN──▶ ready (next player)
 *                                                       └──(last player)──▶ finished
 */

import { addScore, buildTeams, isSolo } from "../core/teams";
import { shuffle } from "../core/shuffle";

export const SUITS = Object.freeze([
  { id: "S", label: "Spades", symbol: "♠", red: false },
  { id: "H", label: "Hearts", symbol: "♥", red: true },
  { id: "D", label: "Diamonds", symbol: "♦", red: true },
  { id: "C", label: "Clubs", symbol: "♣", red: false },
]);
/** Low to high. Aces are low. */
export const RANKS = Object.freeze(["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]);
const RANK_NAMES = { J: "Jack", Q: "Queen", K: "King", A: "Ace" };

/** Cards dealt to each player: short, punchy hands. */
export const HAND_OPTIONS = [2, 3, 4];
export const DEFAULT_HAND = 3;
const GOLDEN = 0.6180339887498949;

export const PHASES = Object.freeze({
  SETUP: "setup",
  READY: "ready",
  PLAYING: "playing",
  TURN_OVER: "turnOver",
  FINISHED: "finished",
});

export const ACTIONS = Object.freeze({
  START_GAME: "START_GAME",
  START_TURN: "START_TURN",
  GUESS: "GUESS",
  NEXT_TURN: "NEXT_TURN",
  END_GAME: "END_GAME",
  NEW_GAME: "NEW_GAME",
});

/* ------------------------------------------------------------------ */
/* Cards                                                                */
/* ------------------------------------------------------------------ */

/** "10H" → { rank: "10", suit: "H", value: 10 } */
export function parseCard(card) {
  const rank = card.slice(0, -1);
  const suit = card.slice(-1);
  // A = 1, 2 = 2 … K = 13.
  return { rank, suit, value: RANKS.indexOf(rank) + 1 };
}

export const cardValue = (card) => parseCard(card).value;

export function cardName(card) {
  const { rank, suit } = parseCard(card);
  return `${RANK_NAMES[rank] ?? rank} of ${SUITS.find((s) => s.id === suit)?.label ?? suit}`;
}

export function isRed(card) {
  const suit = card.slice(-1);
  return suit === "H" || suit === "D";
}

export function freshDeck() {
  return SUITS.flatMap((s) => RANKS.map((r) => `${r}${s.id}`));
}

function seededDeck(seed, shuffles) {
  return shuffle(freshDeck(), (seed + GOLDEN * (shuffles + 1)) % 1);
}

/** Outcome of calling `guess` with `base` showing when `next` turns up. */
export function judge(base, next, guess) {
  const a = cardValue(base);
  const b = cardValue(next);
  if (a === b) return "same";
  return (guess === "higher") === b > a ? "won" : "lost";
}

/* ------------------------------------------------------------------ */
/* State                                                                */
/* ------------------------------------------------------------------ */

export function createInitialState() {
  return {
    phase: PHASES.SETUP,
    teams: [],
    /** `showOdds`: show how many unseen cards are higher / lower (a memory aid). */
    settings: { handSize: DEFAULT_HAND, showOdds: false },
    seed: 0,
    /** How many decks have been shuffled into the shoe so far. */
    shuffles: 0,
    /** Cards still to draw, top first. */
    shoe: [],
    /** Cards seen since the last shuffle (for memory). */
    seen: [],
    turnIndex: 0,
    /** The card to beat. */
    base: null,
    /** Calls made this turn: `[{ base, card, guess, outcome }]`. */
    calls: [],
    streak: 0,
    bestStreak: 0,
    /** Cards each player kept: `{ [teamId]: string[] }`. */
    won: {},
    /** Solo bests per hand size: `{ [handSize]: cardsKept }`. Kept across games. */
    bests: {},
    /** Solo result: `{ kept, newBest, previousBest }`. */
    result: null,
    lastEvent: null,
  };
}

function makeEvent(state, event) {
  return { seq: (state.lastEvent?.seq ?? 0) + 1, ...event };
}

/** Take the top card, reshuffling a fresh deck in when the shoe is empty. */
function draw(state) {
  if (state.shoe.length > 0) {
    const [card, ...shoe] = state.shoe;
    return { card, state: { ...state, shoe, seen: [...state.seen, card] }, reshuffled: false };
  }
  const shuffles = state.shuffles + 1;
  const [card, ...shoe] = seededDeck(state.seed, shuffles);
  return { card, state: { ...state, shoe, shuffles, seen: [card] }, reshuffled: true };
}

export function selectActiveTeam(state) {
  return state.teams[state.turnIndex] ?? null;
}

/** Cards still to call this turn. */
export function cardsLeft(state) {
  return state.settings.handSize - state.calls.length;
}

/** How many unseen cards (in this deck) are higher / same / lower than the base. For the odds hint. */
export function selectOdds(state) {
  if (!state.base) return null;
  const value = cardValue(state.base);
  let higher = 0;
  let lower = 0;
  let same = 0;
  for (const card of state.shoe) {
    const v = cardValue(card);
    if (v > value) higher += 1;
    else if (v < value) lower += 1;
    else same += 1;
  }
  return { higher, lower, same, total: state.shoe.length };
}

/* ------------------------------------------------------------------ */
/* Reducer                                                              */
/* ------------------------------------------------------------------ */

export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_GAME: {
      if (state.phase !== PHASES.SETUP) return state;
      const teams = buildTeams(action.teams ?? []);
      if (teams.length < 1) return state;
      const handSize = HAND_OPTIONS.includes(action.settings?.handSize) ? action.settings.handSize : DEFAULT_HAND;
      const seed = typeof action.seed === "number" && action.seed >= 0 && action.seed < 1 ? action.seed : 0;
      const next = {
        ...createInitialState(),
        bests: state.bests,
        teams,
        settings: { handSize, showOdds: action.settings?.showOdds === true },
        seed,
        shoe: seededDeck(seed, 0),
        won: Object.fromEntries(teams.map((t) => [t.id, []])),
        phase: PHASES.READY,
      };
      // Solo has nobody to pass to: go straight in.
      return isSolo(teams) ? reducer(next, { type: ACTIONS.START_TURN }) : next;
    }

    case ACTIONS.START_TURN: {
      if (state.phase !== PHASES.READY) return state;
      const drawn = draw(state);
      return {
        ...drawn.state,
        phase: PHASES.PLAYING,
        base: drawn.card,
        calls: [],
        streak: 0,
        lastEvent: makeEvent(state, { type: drawn.reshuffled ? "reshuffled" : "turn-start", card: drawn.card }),
      };
    }

    case ACTIONS.GUESS: {
      if (state.phase !== PHASES.PLAYING || (action.guess !== "higher" && action.guess !== "lower")) return state;
      const team = selectActiveTeam(state);
      const drawn = draw(state);
      const outcome = judge(state.base, drawn.card, action.guess);
      const call = { base: state.base, card: drawn.card, guess: action.guess, outcome };
      const calls = [...state.calls, call];
      const streak = outcome === "won" ? state.streak + 1 : 0;
      let next = {
        ...drawn.state,
        base: drawn.card,
        calls,
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        lastEvent: makeEvent(state, { type: outcome, card: drawn.card, guess: action.guess, reshuffled: drawn.reshuffled, streak }),
      };
      if (outcome === "won") {
        next = { ...next, teams: addScore(next.teams, team.id, 1), won: { ...next.won, [team.id]: [...(next.won[team.id] ?? []), drawn.card] } };
      }
      if (calls.length >= state.settings.handSize) next = { ...next, phase: PHASES.TURN_OVER };
      return next;
    }

    case ACTIONS.NEXT_TURN: {
      if (state.phase !== PHASES.TURN_OVER) return state;
      if (state.turnIndex + 1 < state.teams.length) {
        return { ...state, phase: PHASES.READY, turnIndex: state.turnIndex + 1, base: null, calls: [], streak: 0, lastEvent: null };
      }
      return finish(state, true);
    }

    case ACTIONS.END_GAME: {
      if (state.phase === PHASES.SETUP || state.phase === PHASES.FINISHED) return state;
      return finish(state, false);
    }

    case ACTIONS.NEW_GAME: {
      return { ...createInitialState(), teams: state.teams.map((t) => ({ ...t, score: 0 })), settings: state.settings, bests: state.bests };
    }

    default:
      return state;
  }
}

/** Game over. A solo hand played to the end can set a best. */
function finish(state, complete) {
  let { bests } = state;
  let result = null;
  if (isSolo(state.teams)) {
    const kept = state.teams[0].score;
    const key = String(state.settings.handSize);
    const previousBest = bests[key] ?? null;
    const newBest = complete && (previousBest == null || kept > previousBest);
    if (newBest) bests = { ...bests, [key]: kept };
    result = { kept, newBest, previousBest, complete };
  }
  return { ...state, phase: PHASES.FINISHED, bests, result, lastEvent: null };
}

/* ------------------------------------------------------------------ */
/* Persistence                                                          */
/* ------------------------------------------------------------------ */

export function migrateState(saved) {
  if (!saved || typeof saved !== "object") return saved;
  const settings = { ...createInitialState().settings, ...saved.settings };
  // Hands used to be 5/10/15 cards. A game already in play finishes as dealt; the
  // next one starts from a hand size that's still offered.
  if (!HAND_OPTIONS.includes(settings.handSize) && (saved.phase === PHASES.SETUP || saved.phase === PHASES.FINISHED)) {
    settings.handSize = DEFAULT_HAND;
  }
  return { ...createInitialState(), ...saved, settings, bests: saved.bests ?? {} };
}

export function isValidState(state) {
  if (!state || typeof state !== "object") return false;
  if (!Object.values(PHASES).includes(state.phase)) return false;
  if (!Array.isArray(state.teams) || !Array.isArray(state.shoe) || !Array.isArray(state.calls)) return false;
  if (state.phase !== PHASES.SETUP && state.teams.length < 1) return false;
  if (state.phase === PHASES.PLAYING && typeof state.base !== "string") return false;
  return true;
}
