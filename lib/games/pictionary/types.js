/**
 * Domain types for Pictionary Party, expressed as JSDoc typedefs so editors
 * get completion and checking without migrating the project to TypeScript.
 *
 * Import a type with:
 *   /** @typedef {import('../types/game.js').GameSession} GameSession *\/
 */

/** @typedef {'classic' | 'quick'} GameMode */

/** @typedef {'easy' | 'medium' | 'hard'} Difficulty */

/** @typedef {Difficulty | 'mixed'} DifficultySetting */

/**
 * @typedef {'person' | 'place' | 'animal' | 'object' | 'action' | 'food' | 'movies' | 'all-play'} CategoryId
 */

/**
 * @typedef {Object} Word
 * @property {string} id          Stable unique id (category + slug).
 * @property {string} text        The word or phrase to draw.
 * @property {CategoryId} category
 * @property {Difficulty} difficulty
 * @property {string[]} [tags]
 * @property {boolean} [custom]   True for words added by the host.
 */

/**
 * @typedef {Object} Player
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {Object} TeamStats
 * @property {number} turns       Turns this team drew.
 * @property {number} correct     Turns this team drew that were guessed.
 * @property {number} steals      All Play rounds won while another team drew.
 * @property {number} skips
 * @property {number} timeUsedMs  Drawing time spent on successful turns.
 * @property {number | null} fastestMs
 */

/**
 * @typedef {Object} Team
 * @property {string} id
 * @property {string} name
 * @property {string} color       Key into TEAM_COLORS.
 * @property {Player[]} players
 * @property {number} score
 * @property {number} position    Board space index (classic mode).
 * @property {number} drawerIndex Rotates through players each turn.
 * @property {TeamStats} stats
 */

/**
 * @typedef {'start' | 'category' | 'all-play' | 'finish'} BoardSpaceType
 */

/**
 * @typedef {Object} BoardSpace
 * @property {number} index
 * @property {BoardSpaceType} type
 * @property {CategoryId | null} category
 */

/**
 * @typedef {Object} TurnTimer
 * @property {number} durationMs
 * @property {number} elapsedMs        Time banked before the current run.
 * @property {number | null} startedAt Epoch ms when the current run began.
 * @property {boolean} running
 */

/**
 * @typedef {Object} GameTurn
 * @property {string} id
 * @property {number} number
 * @property {number} round
 * @property {string} teamId
 * @property {string} drawerName
 * @property {string | null} [challengeId]  Drawing challenge; null while the host is choosing. Absent on legacy saves (= normal).
 * @property {CategoryId} category
 * @property {boolean} isAllPlay
 * @property {Word} word
 * @property {boolean} recycledWord   True when the pool ran dry and a word repeated.
 * @property {TurnTimer} timer
 * @property {number} skips
 * @property {null | 'correct' | 'incorrect'} result
 * @property {string | null} scoringTeamId
 * @property {number} points
 * @property {number | null} timeUsedMs
 * @property {null | { roll: number, from: number, to: number }} move
 */

/**
 * @typedef {Object} GameSettings
 * @property {GameMode} mode
 * @property {number} timerSeconds          30 | 60 | 90 | 120
 * @property {DifficultySetting} difficulty
 * @property {CategoryId[]} categories
 * @property {number} rounds                Quick Play only.
 * @property {number} boardLength           Classic only; total spaces incl. start & finish.
 * @property {boolean} keepTurnOnSuccess    Classic only.
 * @property {boolean} difficultyBonus      Award extra points for medium/hard words.
 * @property {number} maxSkipsPerTurn
 * @property {boolean} includeCustomWords
 * @property {'normal' | 'random' | 'host'} challengeMode  Drawing challenges (handicaps).
 * @property {string[]} challengePool       Challenge ids enabled for Random mode.
 */

/**
 * @typedef {'lobby' | 'handoff' | 'reveal' | 'drawing' | 'roll' | 'board' | 'scoreboard' | 'finished'} GamePhase
 */

/**
 * @typedef {Object} GameSession
 * @property {string} id
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {GameMode} mode
 * @property {GameSettings} settings
 * @property {Team[]} teams
 * @property {BoardSpace[] | null} board
 * @property {GamePhase} phase
 * @property {number} activeTeamIndex
 * @property {number} round
 * @property {number} turnNumber
 * @property {GameTurn | null} currentTurn
 * @property {GameTurn[]} history
 * @property {string[]} usedWordIds
 * @property {Word[]} customWords
 * @property {string[]} winnerTeamIds
 * @property {boolean} endedEarly
 * @property {number | null} finishedAt
 */

export {};
