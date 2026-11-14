/**
 * Drawing challenges (handicaps). Pure data — selection rules live in
 * lib/game-engine/challenges.js. To add a challenge, add an entry here;
 * setup, the reveal card and the drawing reminder pick it up automatically.
 *
 * `icon` is a Lucide icon name (see components/challenges/challenge-icon.js).
 * `motif` picks the decorative art on the reveal card.
 * `difficulty` is 1 (gentle) to 3 (chaotic).
 */
export const CHALLENGES = {
  normal: {
    id: "normal",
    name: "Normal Drawing",
    short: "Any hand, eyes open. Classic.",
    instruction: "Draw however you like. Either hand, eyes open, lift the pen as often as you want.",
    reminder: "Draw it your way",
    emoji: "✏️",
    icon: "PencilLine",
    difficulty: 1,
    color: "#FFFDF8",
    ink: "#1B2140",
    motif: "scribble",
  },
  "opposite-hand": {
    id: "opposite-hand",
    name: "Opposite Hand",
    short: "Your other hand. Good luck.",
    instruction: "Swap the pen to your non-dominant hand and keep it there for the whole drawing.",
    reminder: "Non-dominant hand only!",
    emoji: "🤚",
    icon: "Hand",
    difficulty: 2,
    color: "#8A55E0",
    ink: "#FFFFFF",
    motif: "mirror",
  },
  "eyes-closed": {
    id: "eyes-closed",
    name: "Eyes Closed",
    short: "Draw blind. No peeking.",
    instruction: "Close your eyes before the timer starts and draw without looking at the paper. Teammates can’t help you aim!",
    reminder: "Draw without looking at your paper!",
    emoji: "🙈",
    icon: "EyeClosed",
    difficulty: 3,
    color: "#1B2140",
    ink: "#FFE9A8",
    motif: "night",
  },
  "continuous-line": {
    id: "continuous-line",
    name: "Continuous Line",
    short: "One line. Pen never lifts.",
    instruction: "Put the pen down and don’t lift it until the drawing is finished. Everything has to be one unbroken line.",
    reminder: "Never lift your pen until you’re done!",
    emoji: "➰",
    icon: "Spline",
    difficulty: 2,
    color: "#1E9E6A",
    ink: "#FFFFFF",
    motif: "line",
  },
};

export const CHALLENGE_IDS = Object.keys(CHALLENGES);

export const NORMAL_CHALLENGE = "normal";

export const CHALLENGE_MODES = [
  { value: "normal", label: "Normal only", hint: "No handicaps" },
  { value: "random", label: "Random", hint: "A surprise each turn" },
  { value: "host", label: "Host picks", hint: "Choose every turn" },
];

export function getChallenge(id) {
  return CHALLENGES[id] ?? CHALLENGES[NORMAL_CHALLENGE];
}
