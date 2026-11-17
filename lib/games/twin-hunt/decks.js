/**
 * Twin Hunt card faces. Built-in emoji sets, no network needed.
 * Each deck has at least 18 faces (the biggest board), with a name for screen readers.
 */

export const DECKS = [
  {
    id: "animals",
    label: "Animals",
    faces: [
      ["🐶", "dog"], ["🐱", "cat"], ["🐭", "mouse"], ["🐰", "rabbit"], ["🦊", "fox"], ["🐻", "bear"],
      ["🐼", "panda"], ["🐨", "koala"], ["🐯", "tiger"], ["🦁", "lion"], ["🐮", "cow"], ["🐷", "pig"],
      ["🐸", "frog"], ["🐵", "monkey"], ["🐔", "chicken"], ["🐧", "penguin"], ["🦉", "owl"], ["🐢", "turtle"],
      ["🐙", "octopus"], ["🦋", "butterfly"], ["🐘", "elephant"], ["🦒", "giraffe"],
    ],
  },
  {
    id: "food",
    label: "Food",
    faces: [
      ["🍕", "pizza"], ["🍔", "burger"], ["🍟", "fries"], ["🌮", "taco"], ["🍩", "doughnut"], ["🍦", "ice cream"],
      ["🍉", "watermelon"], ["🍓", "strawberry"], ["🍌", "banana"], ["🍇", "grapes"], ["🍍", "pineapple"], ["🥭", "mango"],
      ["🥥", "coconut"], ["🌽", "corn"], ["🥕", "carrot"], ["🍪", "cookie"], ["🧁", "cupcake"], ["🍿", "popcorn"],
      ["🍛", "curry"], ["🍋", "lemon"], ["🥨", "pretzel"], ["🍒", "cherries"],
    ],
  },
  {
    id: "things",
    label: "Things",
    faces: [
      ["⚽", "football"], ["🏏", "cricket bat"], ["🎸", "guitar"], ["🎈", "balloon"], ["🎁", "gift"], ["🚀", "rocket"],
      ["🚗", "car"], ["🚲", "bicycle"], ["✈️", "plane"], ["⛵", "sailboat"], ["🎩", "top hat"], ["👑", "crown"],
      ["💎", "gem"], ["🔑", "key"], ["⏰", "alarm clock"], ["📷", "camera"], ["🎲", "dice"], ["🧸", "teddy bear"],
      ["🪁", "kite"], ["🔔", "bell"], ["🌂", "umbrella"], ["🎺", "trumpet"],
    ],
  },
];

export const DECK_OPTIONS = ["mixed", ...DECKS.map((d) => d.id)];
export const DECK_LABELS = { mixed: "Mixed", ...Object.fromEntries(DECKS.map((d) => [d.id, d.label])) };

/** Every face in a deck (or all decks for "mixed"), as `{ emoji, name }`. */
export function facesFor(deckId) {
  const decks = deckId === "mixed" ? DECKS : DECKS.filter((d) => d.id === deckId);
  return (decks.length ? decks : DECKS).flatMap((d) => d.faces.map(([emoji, name]) => ({ emoji, name })));
}

/**
 * `count` colours spread evenly round the hue wheel, so twins share a colour and
 * no two pairs on the board look alike. Lightness alternates so neighbouring hues
 * still separate on a big board.
 */
export function pairColors(count, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const hue = Math.round((offset * 360 + (i * 360) / count) % 360);
    const light = i % 2 ? 0.8 : 0.88;
    return `oklch(${light} 0.12 ${hue})`;
  });
}
