/**
 * Hi-Lo — pure game engine. Higher or lower, with a real deck of cards.
 *
 * Solo or 2–8 players (no teams). Every player is dealt the same number of
 * cards (2–4). On your turn your hand is face up: pick one of your cards and play
 * it to the table, call Higher or Lower, and the top card of the deck is turned
 * over against it. Call it right and you win that deck card. Either way the card
 * you played is used up. Play your whole hand, then pass the phone. Most cards
 * won wins; solo, you chase your best for that hand size.
 *
 * Which card you play is the strategy: a King is a safe "lower", an Ace a safe
 * "higher", a 7 is a coin toss. A card of the same rank never wins.
 *
 * Aces are low: A < 2 < 3 < … < 10 < J < Q < K.
 *
 * Everyone draws from one shared shoe; when it runs out a fresh deck is shuffled
 * in. Randomness: START_GAME brings a `seed` (Math.random() in the UI) and every
 * shuffle derives its own seed from it, so the reducer stays pure.
 *
 *   ready ──START_TURN──▶ playing ⟲ (SELECT a card, then GUESS) ──hand empty──▶ turnOver
 *     ▲                                                                              │
 *     └────────────────────────NEXT_TURN (next player)───────────────────────────────┤
 *                                                     NEXT_TURN (last player) ──▶ finished
 */

import { addScore } from "../core/teams";
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

/** Cards dealt to each player. */
export const HAND_OPTIONS = [2, 3, 4];
export const DEFAULT_HAND = 3;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;
/** One colour per seat (the shared six, plus two more for seats 7–8). */
export const PLAYER_COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#06b6d4", "#3b82f6", "#f97316", "#0d9488", "#78716c"];
const GOLDEN = 0.6180339887498949;

export const playerColor = (i) => PLAYER_COLORS[i % PLAYER_COLORS.length];
export const defaultPlayerName = (i) => `Player ${i + 1}`;

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
  SELECT: "SELECT",
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

export function freshDeck() {
  return SUITS.flatMap((s) => RANKS.map((r) => `${r}${s.id}`));
}

function seededDeck(seed, shuffles) {
  return shuffle(freshDeck(), (seed + GOLDEN * (shuffles + 1)) % 1);
}

/** Outcome of playing `played` and calling `guess` when `next` turns up. */
export function judge(played, next, guess) {
  const a = cardValue(played);
  const b = cardValue(next);
  if (a === b) return "same";
  return (guess === "higher") === b > a ? "won" : "lost";
}

/** Players from setup drafts (`{ id, name }`), up to MAX_PLAYERS. */
export function buildPlayers(drafts) {
  return drafts.slice(0, MAX_PLAYERS).map((draft, index) => ({
    id: String(draft.id),
    name: draft.name?.trim() || defaultPlayerName(index),
    color: playerColor(index),
    score: 0,
  }));
}

/* ------------------------------------------------------------------ */
/* State                                                                */
/* ------------------------------------------------------------------ */

export function createInitialState() {
  return {
    phase: PHASES.SETUP,
    /** `[{ id, name, color, score }]`; score = cards won. (Called `teams` so the shared scoreboard reads it.) */
    teams: [],
    /** `showOdds`: show how many cards left in the deck are higher / lower (a memory aid). */
    settings: { handSize: DEFAULT_HAND, showOdds: false },
    seed: 0,
    /** How many decks have been shuffled in so far. */
    shuffles: 0,
    /** Cards still to draw, top first. */
    shoe: [],
    /** Every player's hand: `{ [playerId]: string[] }`. */
    hands: {},
    turnIndex: 0,
    /** The card the active player has picked from their hand (not yet called). */
    selected: null,
    /** This turn's plays: `[{ played, card, guess, outcome }]`. */
    calls: [],
    streak: 0,
    bestStreak: 0,
    /** Cards each player has won: `{ [playerId]: string[] }`. */
    won: {},
    /** Solo bests per hand size: `{ [handSize]: cardsWon }`. Kept across games. */
    bests: {},
    /** Solo result: `{ kept, newBest, previousBest, complete }`. */
    result: null,
    lastEvent: null,
  };
}

function makeEvent(state, event) {
  return { seq: (state.lastEvent?.seq ?? 0) + 1, ...event };
}

/** Take the top card, shuffling a fresh deck in when the shoe is empty. */
function draw(state) {
  if (state.shoe.length > 0) {
    const [card, ...shoe] = state.shoe;
    return { card, state: { ...state, shoe }, reshuffled: false };
  }
  const shuffles = state.shuffles + 1;
  const [card, ...shoe] = seededDeck(state.seed, shuffles);
  return { card, state: { ...state, shoe, shuffles }, reshuffled: true };
}

export function selectActivePlayer(state) {
  return state.teams[state.turnIndex] ?? null;
}

export function selectHand(state) {
  const player = selectActivePlayer(state);
  return player ? (state.hands[player.id] ?? []) : [];
}

const isSoloGame = (state) => state.teams.length === 1;

/** How many cards left in the deck are higher / same / lower than `card`. For the odds helper. */
export function oddsFor(state, card) {
  if (!card) return null;
  const value = cardValue(card);
  let higher = 0;
  let lower = 0;
  let same = 0;
  for (const c of state.shoe) {
    const v = cardValue(c);
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
      const teams = buildPlayers(action.players ?? []);
      if (teams.length < 1) return state;
      const handSize = HAND_OPTIONS.includes(action.settings?.handSize) ? action.settings.handSize : DEFAULT_HAND;
      const seed = typeof action.seed === "number" && action.seed >= 0 && action.seed < 1 ? action.seed : 0;
      // Deal round the table, one card at a time, like a real dealer.
      let shoe = seededDeck(seed, 0);
      const hands = Object.fromEntries(teams.map((p) => [p.id, []]));
      for (let round = 0; round < handSize; round += 1) {
        for (const p of teams) {
          hands[p.id].push(shoe[0]);
          shoe = shoe.slice(1);
        }
      }
      const next = {
        ...createInitialState(),
        bests: state.bests,
        teams,
        settings: { handSize, showOdds: action.settings?.showOdds === true },
        seed,
        shoe,
        hands,
        won: Object.fromEntries(teams.map((p) => [p.id, []])),
        phase: PHASES.READY,
      };
      // Solo has nobody to pass to: straight in.
      return teams.length === 1 ? { ...next, phase: PHASES.PLAYING } : next;
    }

    case ACTIONS.START_TURN: {
      if (state.phase !== PHASES.READY) return state;
      return { ...state, phase: PHASES.PLAYING, selected: null, calls: [], streak: 0, lastEvent: null };
    }

    case ACTIONS.SELECT: {
      // Pick (or switch) the card to play. Tapping the picked card again puts it back.
      if (state.phase !== PHASES.PLAYING) return state;
      if (action.card == null || action.card === state.selected) return { ...state, selected: null };
      if (!selectHand(state).includes(action.card)) return state;
      return { ...state, selected: action.card };
    }

    case ACTIONS.GUESS: {
      if (state.phase !== PHASES.PLAYING || !state.selected) return state;
      if (action.guess !== "higher" && action.guess !== "lower") return state;
      const player = selectActivePlayer(state);
      const played = state.selected;
      const drawn = draw(state);
      const outcome = judge(played, drawn.card, action.guess);
      const calls = [...state.calls, { played, card: drawn.card, guess: action.guess, outcome }];
      const hand = (state.hands[player.id] ?? []).filter((c) => c !== played);
      const streak = outcome === "won" ? state.streak + 1 : 0;
      let next = {
        ...drawn.state,
        hands: { ...state.hands, [player.id]: hand },
        selected: null,
        calls,
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        lastEvent: makeEvent(state, { type: outcome, card: drawn.card, played, guess: action.guess, reshuffled: drawn.reshuffled }),
      };
      if (outcome === "won") {
        next = { ...next, teams: addScore(next.teams, player.id, 1), won: { ...next.won, [player.id]: [...(next.won[player.id] ?? []), drawn.card] } };
      }
      if (hand.length === 0) next = { ...next, phase: PHASES.TURN_OVER };
      return next;
    }

    case ACTIONS.NEXT_TURN: {
      if (state.phase !== PHASES.TURN_OVER) return state;
      if (state.turnIndex + 1 < state.teams.length) {
        return { ...state, phase: PHASES.READY, turnIndex: state.turnIndex + 1, selected: null, calls: [], streak: 0, lastEvent: null };
      }
      return finish(state, true);
    }

    case ACTIONS.END_GAME: {
      if (state.phase === PHASES.SETUP || state.phase === PHASES.FINISHED) return state;
      return finish(state, false);
    }

    case ACTIONS.NEW_GAME: {
      return { ...createInitialState(), teams: state.teams.map((p) => ({ ...p, score: 0 })), settings: state.settings, bests: state.bests };
    }

    default:
      return state;
  }
}

/** Game over. A solo hand played to the end can set a best. */
function finish(state, complete) {
  let { bests } = state;
  let result = null;
  if (isSoloGame(state)) {
    const kept = state.teams[0].score;
    const key = String(state.settings.handSize);
    const previousBest = bests[key] ?? null;
    const newBest = complete && (previousBest == null || kept > previousBest);
    if (newBest) bests = { ...bests, [key]: kept };
    result = { kept, newBest, previousBest, complete };
  }
  return { ...state, phase: PHASES.FINISHED, selected: null, bests, result, lastEvent: null };
}

/* ------------------------------------------------------------------ */
/* Persistence                                                          */
/* ------------------------------------------------------------------ */

export function migrateState(saved) {
  if (!saved || typeof saved !== "object") return saved;
  const settings = { ...createInitialState().settings, ...saved.settings };
  if (!HAND_OPTIONS.includes(settings.handSize)) settings.handSize = DEFAULT_HAND;
  const state = { ...createInitialState(), ...saved, settings, bests: saved.bests ?? {} };
  // Saves from the first version (no dealt hands) can't be resumed: start over, keeping players and bests.
  if (!saved.hands && saved.phase !== PHASES.SETUP) {
    return { ...createInitialState(), teams: (saved.teams ?? []).map((p) => ({ ...p, score: 0 })), settings, bests: state.bests };
  }
  return state;
}

export function isValidState(state) {
  if (!state || typeof state !== "object") return false;
  if (!Object.values(PHASES).includes(state.phase)) return false;
  if (!Array.isArray(state.teams) || !Array.isArray(state.shoe) || !Array.isArray(state.calls)) return false;
  if (!state.hands || typeof state.hands !== "object") return false;
  if (state.phase !== PHASES.SETUP && state.teams.length < 1) return false;
  return true;
}
