/**
 * Guess the Telugu Song — pure game engine.
 *
 * The reducer has no side effects: anything random is passed in on the action
 * (e.g. `{ type: "START_GAME", random: Math.random() }`), so the same engine can
 * be unit-tested, replayed or driven by a different UI later.
 *
 * Round flow:
 *   playing ──(correct song title)──────▶ roundOver (solved, method "title")
 *      └─────(last letter revealed)─────▶ roundOver (solved, method "lyrics")
 *
 * Revealing every letter counts as guessing the song: the team that reveals the
 * final letter wins the round and earns the completion bonus.
 */

import { addScore, buildTeams, nextTeamIndex } from "../core/teams";
import { drawWithoutRepeat } from "../core/random";
import { SONG_IDS, getLyricLines, getSongById } from "./songs";
import { countLetter, isFullyRevealed, isTitleMatch, normalizeLetter } from "./lyrics";

export const POINTS_PER_LETTER = 10;
/** Vowels show up far more often in transliterated lyrics, so each occurrence is worth less. */
export const POINTS_PER_VOWEL = 5;
const VOWELS = new Set(["a", "e", "i", "o", "u"]);

export function isVowel(letter) {
  return VOWELS.has(String(letter ?? "").toLowerCase());
}

/** Points earned for each occurrence of `letter` in the lyrics. */
export function pointsPerOccurrence(letter) {
  return isVowel(letter) ? POINTS_PER_VOWEL : POINTS_PER_LETTER;
}
/** Seconds a team has to call a letter (or open a song guess) before the turn passes. */
export const TURN_SECONDS = 10;
/** The solving team's alphabet points from the current round are multiplied by this. */
export const SONG_COMPLETION_MULTIPLIER = 5;

export const PHASES = Object.freeze({
  SETUP: "setup",
  PLAYING: "playing",
  ROUND_OVER: "roundOver",
  FINISHED: "finished",
});

/** Phase from an earlier build where teams identified the song after the lyrics were complete. */
const LEGACY_SONG_COMPLETION = "song-completion";

export const ACTIONS = Object.freeze({
  START_GAME: "START_GAME",
  GUESS_LETTER: "GUESS_LETTER",
  GUESS_SONG: "GUESS_SONG",
  REVEAL_SONG: "REVEAL_SONG",
  TURN_TIMEOUT: "TURN_TIMEOUT",
  NEXT_ROUND: "NEXT_ROUND",
  END_GAME: "END_GAME",
  NEW_GAME: "NEW_GAME",
});

export function createInitialState() {
  return {
    phase: PHASES.SETUP,
    teams: [],
    round: 0,
    roundStarterIndex: 0,
    activeTeamIndex: 0,
    songId: null,
    usedSongIds: [],
    guessedLetters: [],
    /** Alphabet points earned per team this round: `{ [teamId]: number }`. */
    roundPoints: {},
    /**
     * Set when the round ends:
     * `{ outcome: "solved" | "revealed", method: "title" | "lyrics" | null,
     *    winnerTeamId, guess, alphabetPoints, multiplier, bonus }`
     */
    roundResult: null,
    lastEvent: null,
  };
}

/**
 * Bring a saved state from an earlier build up to the current shape.
 */
export function migrateState(saved) {
  if (!saved || typeof saved !== "object") return saved;
  const { completionAttempts, ...rest } = saved;
  let state = { ...createInitialState(), ...rest };
  if (!state.roundPoints || typeof state.roundPoints !== "object") state.roundPoints = {};

  if (state.roundResult) {
    const { outcome } = state.roundResult;
    state.roundResult = {
      winnerTeamId: null,
      guess: null,
      method: state.roundResult.winnerTeamId ? "title" : null,
      alphabetPoints: state.roundResult.winnerTeamId ? (state.roundPoints[state.roundResult.winnerTeamId] ?? 0) : 0,
      multiplier: SONG_COMPLETION_MULTIPLIER,
      // Saves from before the multiplier never awarded a bonus, so 0 keeps their scores honest.
      bonus: 0,
      ...state.roundResult,
      outcome: outcome === "solved" ? "solved" : "revealed",
    };
  }

  // Any save that is mid-round with every letter already out (earlier rules allowed this,
  // and the old song-completion phase): the team that revealed the last letter wins.
  const song = getSongById(state.songId);
  const lyricsDone = song && isFullyRevealed(getLyricLines(song), state.guessedLetters);
  if ((state.phase === PHASES.PLAYING || state.phase === LEGACY_SONG_COMPLETION) && lyricsDone) {
    const revealerId = Array.isArray(completionAttempts) && completionAttempts[0];
    const revealerIndex = revealerId ? state.teams.findIndex((t) => t.id === revealerId) : -1;
    if (revealerIndex >= 0) state.activeTeamIndex = revealerIndex;
    const team = state.teams[state.activeTeamIndex];
    state = team ? solveRound({ ...state, phase: PHASES.PLAYING }, team, { method: "lyrics" }) : state;
  } else if (state.phase === LEGACY_SONG_COMPLETION) {
    state.phase = PHASES.PLAYING;
  }
  return state;
}

/** Used by the persistent store to reject corrupt or outdated saves. */
export function isValidState(state) {
  if (!state || typeof state !== "object") return false;
  if (!Object.values(PHASES).includes(state.phase)) return false;
  if (!Array.isArray(state.teams) || !Array.isArray(state.guessedLetters)) return false;
  if (state.phase === PHASES.PLAYING || state.phase === PHASES.ROUND_OVER) {
    if (state.teams.length < 2 || !getSongById(state.songId)) return false;
    if (state.activeTeamIndex >= state.teams.length) return false;
  }
  return true;
}

function makeEvent(state, event) {
  return { seq: (state.lastEvent?.seq ?? 0) + 1, ...event };
}

function startRound(state, { round, starterIndex, random }) {
  const draw = drawWithoutRepeat(SONG_IDS, state.usedSongIds, random, state.songId);
  return {
    ...state,
    phase: PHASES.PLAYING,
    round,
    roundStarterIndex: starterIndex,
    activeTeamIndex: starterIndex,
    songId: draw.id,
    usedSongIds: draw.usedIds,
    guessedLetters: [],
    roundPoints: {},
    roundResult: null,
    lastEvent: makeEvent(state, {
      type: draw.recycled ? "songs-recycled" : "round-start",
      teamId: state.teams[starterIndex]?.id,
    }),
  };
}

function passTurn(state) {
  return nextTeamIndex(state.activeTeamIndex, state.teams.length);
}

/** Bonus a team would receive for identifying the song right now. */
export function completionBonusFor(state, teamId) {
  return (state.roundPoints[teamId] ?? 0) * SONG_COMPLETION_MULTIPLIER;
}

/**
 * End the round with `team` as the song winner. Called only while playing and
 * always moves to roundOver, so the bonus can't be awarded twice.
 * `method` is "title" (named the song) or "lyrics" (revealed the final letter).
 */
function solveRound(state, team, { method, guess = null }) {
  const alphabetPoints = state.roundPoints[team.id] ?? 0;
  const bonus = alphabetPoints * SONG_COMPLETION_MULTIPLIER;
  return {
    ...state,
    teams: bonus ? addScore(state.teams, team.id, bonus) : state.teams,
    phase: PHASES.ROUND_OVER,
    roundResult: {
      outcome: "solved",
      method,
      winnerTeamId: team.id,
      guess,
      alphabetPoints,
      multiplier: SONG_COMPLETION_MULTIPLIER,
      bonus,
    },
    lastEvent: makeEvent(state, { type: "song-hit", teamId: team.id, method, guess, bonus }),
  };
}

function endRoundUnsolved(state, outcome, event) {
  return {
    ...state,
    phase: PHASES.ROUND_OVER,
    roundResult: {
      outcome,
      method: null,
      winnerTeamId: null,
      guess: null,
      alphabetPoints: 0,
      multiplier: SONG_COMPLETION_MULTIPLIER,
      bonus: 0,
    },
    lastEvent: makeEvent(state, event),
  };
}

export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_GAME: {
      const teams = buildTeams(action.teams ?? []);
      if (teams.length < 2) return state;
      return startRound({ ...state, teams }, { round: 1, starterIndex: 0, random: action.random ?? 0 });
    }

    case ACTIONS.GUESS_LETTER: {
      if (state.phase !== PHASES.PLAYING) return state;
      const letter = normalizeLetter(action.letter);
      if (!letter || state.guessedLetters.includes(letter)) return state;

      const lines = getLyricLines(getSongById(state.songId));
      const team = state.teams[state.activeTeamIndex];
      const count = countLetter(lines, letter);
      const guessedLetters = [...state.guessedLetters, letter];

      if (count > 0) {
        const points = count * pointsPerOccurrence(letter);
        const scored = {
          ...state,
          guessedLetters,
          teams: addScore(state.teams, team.id, points),
          roundPoints: { ...state.roundPoints, [team.id]: (state.roundPoints[team.id] ?? 0) + points },
          lastEvent: makeEvent(state, { type: "letter-hit", teamId: team.id, letter, count, points }),
        };
        // Revealing the final letter counts as guessing the song. The letter's points are
        // added first, so they're included in the bonus. Both happen in this single update.
        return isFullyRevealed(lines, guessedLetters) ? solveRound(scored, team, { method: "lyrics" }) : scored;
      }

      const nextIndex = passTurn(state);
      return {
        ...state,
        guessedLetters,
        activeTeamIndex: nextIndex,
        lastEvent: makeEvent(state, {
          type: "letter-miss",
          teamId: team.id,
          letter,
          nextTeamId: state.teams[nextIndex].id,
        }),
      };
    }

    case ACTIONS.GUESS_SONG: {
      if (state.phase !== PHASES.PLAYING) return state;
      const guess = String(action.title ?? "").trim();
      if (!guess) return state;
      const team = state.teams[state.activeTeamIndex];

      if (isTitleMatch(getSongById(state.songId), guess)) return solveRound(state, team, { method: "title", guess });

      const nextIndex = passTurn(state);
      return {
        ...state,
        activeTeamIndex: nextIndex,
        lastEvent: makeEvent(state, {
          type: "song-miss",
          teamId: team.id,
          guess,
          nextTeamId: state.teams[nextIndex].id,
        }),
      };
    }

    case ACTIONS.TURN_TIMEOUT: {
      if (state.phase !== PHASES.PLAYING) return state;
      // `eventSeq` is the event the timer started from; anything newer means the turn
      // already moved on (or was used), so a late timeout must not skip a team.
      if (action.eventSeq !== (state.lastEvent?.seq ?? 0)) return state;
      const team = state.teams[state.activeTeamIndex];
      const nextIndex = passTurn(state);
      return {
        ...state,
        activeTeamIndex: nextIndex,
        lastEvent: makeEvent(state, { type: "turn-timeout", teamId: team.id, nextTeamId: state.teams[nextIndex].id }),
      };
    }

    case ACTIONS.REVEAL_SONG: {
      if (state.phase !== PHASES.PLAYING) return state;
      return endRoundUnsolved(state, "revealed", { type: "song-revealed" });
    }

    case ACTIONS.NEXT_ROUND: {
      if (state.phase !== PHASES.ROUND_OVER) return state;
      return startRound(state, {
        round: state.round + 1,
        starterIndex: nextTeamIndex(state.roundStarterIndex, state.teams.length),
        random: action.random ?? 0,
      });
    }

    case ACTIONS.END_GAME: {
      if (state.phase !== PHASES.PLAYING && state.phase !== PHASES.ROUND_OVER) return state;
      return { ...state, phase: PHASES.FINISHED, lastEvent: null };
    }

    case ACTIONS.NEW_GAME: {
      // Back to setup, keeping team names so the same group can play again quickly.
      return {
        ...createInitialState(),
        teams: state.teams.map((team) => ({ ...team, score: 0 })),
        usedSongIds: state.usedSongIds,
      };
    }

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* Selectors                                                            */
/* ------------------------------------------------------------------ */

export function selectSong(state) {
  return getSongById(state.songId);
}

export function selectActiveTeam(state) {
  return state.teams[state.activeTeamIndex] ?? null;
}

export function selectTeam(state, teamId) {
  return state.teams.find((team) => team.id === teamId) ?? null;
}

/** `{ [letter]: "hit" | "miss" }` for every guessed letter this round. */
export function selectLetterStates(state) {
  const lines = getLyricLines(selectSong(state));
  const result = {};
  for (const letter of state.guessedLetters) {
    result[letter] = countLetter(lines, letter) > 0 ? "hit" : "miss";
  }
  return result;
}

/**
 * Per-team scoring for the current round, in team order:
 * `[{ team, alphabet, bonus, total, isWinner }]`.
 */
export function selectRoundBreakdown(state) {
  const winnerId = state.roundResult?.winnerTeamId ?? null;
  return state.teams.map((team) => {
    const alphabet = state.roundPoints[team.id] ?? 0;
    const bonus = team.id === winnerId ? (state.roundResult?.bonus ?? 0) : 0;
    return { team, alphabet, bonus, total: alphabet + bonus, isWinner: team.id === winnerId };
  });
}
