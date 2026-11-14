/**
 * Built-in word database. Kept as plain data, independent from game logic.
 *
 * Each group lists words for one category + difficulty. Entries are either a
 * string or [text, tags[]]. IDs are derived from category + text so they stay
 * stable across releases (saved games reference them in `usedWordIds`).
 */

const GROUPS = [
  // ── Person ────────────────────────────────────────────────────────────
  {
    category: "person",
    difficulty: "easy",
    words: [
      "Doctor", "Teacher", "Chef", "Pilot", "Police Officer", "Firefighter",
      "Farmer", "Baby", "King", "Queen", "Pirate", "Clown", "Astronaut",
      "Santa Claus", "Painter",
    ],
  },
  {
    category: "person",
    difficulty: "medium",
    words: [
      "Magician", "Cricketer", "Superhero", "Ninja", "Mermaid", "Cowboy",
      "Wizard", "Dentist", "Photographer", "Lifeguard", "DJ",
      ["Auto Rickshaw Driver", ["india"]], "Referee", "Scientist",
    ],
  },
  {
    category: "person",
    difficulty: "hard",
    words: [
      ["Mahatma Gandhi", ["india", "famous"]], ["Sachin Tendulkar", ["india", "famous", "sport"]],
      ["Albert Einstein", ["famous"]], ["Charlie Chaplin", ["famous"]],
      ["Lionel Messi", ["famous", "sport"]], ["Cleopatra", ["famous", "history"]],
      ["Sherlock Holmes", ["fiction"]], ["Shah Rukh Khan", ["india", "famous"]],
      ["Michael Jackson", ["famous", "music"]], ["Mona Lisa", ["art"]],
    ],
  },

  // ── Place ─────────────────────────────────────────────────────────────
  {
    category: "place",
    difficulty: "easy",
    words: [
      "Beach", "School", "Hospital", "Zoo", "Park", "Airport", "Kitchen",
      "Library", "Farm", "Castle", "Playground", "Swimming Pool",
    ],
  },
  {
    category: "place",
    difficulty: "medium",
    words: [
      ["Taj Mahal", ["india", "landmark"]], ["Eiffel Tower", ["landmark"]], "Desert",
      "Volcano", ["Railway Station", ["india"]], "Lighthouse", "Cinema Hall", "Island",
      "Haunted House", "Supermarket", ["Cricket Stadium", ["sport"]], "Waterfall", "Space Station",
    ],
  },
  {
    category: "place",
    difficulty: "hard",
    words: [
      ["Great Wall of China", ["landmark"]], ["Statue of Liberty", ["landmark"]],
      ["Gateway of India", ["india", "landmark"]], ["Pyramids of Giza", ["landmark"]],
      ["Leaning Tower of Pisa", ["landmark"]], ["Mount Everest", ["landmark"]],
      "Antarctica", "Bermuda Triangle", ["India Gate", ["india", "landmark"]],
      ["Niagara Falls", ["landmark"]], ["Times Square", ["landmark"]],
    ],
  },

  // ── Animal ────────────────────────────────────────────────────────────
  {
    category: "animal",
    difficulty: "easy",
    words: [
      "Cat", "Dog", "Elephant", "Giraffe", "Fish", "Snake", "Lion", "Monkey",
      "Cow", "Rabbit", "Butterfly", "Spider", "Duck", "Bird",
    ],
  },
  {
    category: "animal",
    difficulty: "medium",
    words: [
      "Kangaroo", "Peacock", "Octopus", "Penguin", "Crocodile", "Camel", "Owl",
      "Turtle", "Shark", "Bat", "Snail", "Zebra", "Jellyfish", "Tiger",
    ],
  },
  {
    category: "animal",
    difficulty: "hard",
    words: [
      "Chameleon", "Platypus", "Seahorse", "Porcupine", "Flamingo", "Sloth",
      "Hammerhead Shark", "Armadillo", "Woodpecker", "Praying Mantis",
    ],
  },

  // ── Object ────────────────────────────────────────────────────────────
  {
    category: "object",
    difficulty: "easy",
    words: [
      "Umbrella", "Chair", "Clock", "Key", "Book", "Phone", "Cup", "Ball",
      "Glasses", "Shoe", "Door", "Candle", "Kite", "Balloon",
    ],
  },
  {
    category: "object",
    difficulty: "medium",
    words: [
      ["Pressure Cooker", ["india"]], "Ceiling Fan", "Ladder", "Scissors", "Toothbrush",
      "Headphones", "Remote Control", "Backpack", "Padlock", "Mirror", "Telescope",
      "Hammock", ["Cricket Bat", ["sport", "india"]],
    ],
  },
  {
    category: "object",
    difficulty: "hard",
    words: [
      "Compass", "Hourglass", "Parachute", "Microscope", "Chandelier",
      "Boomerang", "Metronome", "Typewriter", "Sundial", "Wind Chime",
    ],
  },

  // ── Action ────────────────────────────────────────────────────────────
  {
    category: "action",
    difficulty: "easy",
    words: [
      "Sleeping", "Running", "Swimming", "Dancing", "Crying", "Laughing",
      "Eating", "Jumping", "Reading", "Singing", "Fishing", "Cooking",
    ],
  },
  {
    category: "action",
    difficulty: "medium",
    words: [
      "Brushing Teeth", "Taking a Selfie", "Flying a Kite", "Rock Climbing",
      "Sneezing", ["Bowling a Bouncer", ["sport", "india"]], "Juggling", "Skateboarding",
      "Proposing", "Yawning", "Knitting", "Surfing", "Ironing Clothes",
    ],
  },
  {
    category: "action",
    difficulty: "hard",
    words: [
      "Sleepwalking", "Bargaining", "Meditating", "Daydreaming", "Procrastinating",
      "Eavesdropping", "Hiccupping", "Photobombing", "Moonwalking", "Ghosting Someone",
    ],
  },

  // ── Food ──────────────────────────────────────────────────────────────
  {
    category: "food",
    difficulty: "easy",
    words: [
      "Pizza", "Banana", "Apple", "Ice Cream", "Egg", "Burger", "Cake",
      "Watermelon", "Carrot", "Bread", "Popcorn", "Grapes", "Mango",
    ],
  },
  {
    category: "food",
    difficulty: "medium",
    words: [
      ["Samosa", ["india"]], ["Dosa", ["india"]], ["Jalebi", ["india"]],
      ["Biryani", ["india"]], "Noodles", ["Pani Puri", ["india"]], "Sandwich",
      "Hot Dog", "Donut", "Pineapple", "Coconut", "Taco", ["Momos", ["india"]],
    ],
  },
  {
    category: "food",
    difficulty: "hard",
    words: [
      ["Vada Pav", ["india"]], "Sushi", ["Gulab Jamun", ["india"]], ["Pav Bhaji", ["india"]],
      "Croissant", ["Idli Sambar", ["india"]], "Spaghetti and Meatballs",
      ["Kulfi", ["india"]], "Pretzel", ["Masala Chai", ["india"]],
    ],
  },

  // ── Movies ────────────────────────────────────────────────────────────
  {
    category: "movies",
    difficulty: "easy",
    words: [
      ["Titanic", ["hollywood"]], ["Jaws", ["hollywood"]], ["Frozen", ["animated"]],
      ["The Lion King", ["animated"]], ["Spider-Man", ["hollywood"]],
      ["Finding Nemo", ["animated"]], ["Toy Story", ["animated"]], ["Batman", ["hollywood"]],
      ["Jurassic Park", ["hollywood"]], ["Sholay", ["bollywood"]],
      ["Harry Potter", ["hollywood"]], ["King Kong", ["hollywood"]],
    ],
  },
  {
    category: "movies",
    difficulty: "medium",
    words: [
      ["Avatar", ["hollywood"]], ["Baahubali", ["tollywood", "india"]],
      ["3 Idiots", ["bollywood"]], ["Lagaan", ["bollywood"]], ["Star Wars", ["hollywood"]],
      ["The Jungle Book", ["animated"]], ["Up", ["animated"]], ["RRR", ["tollywood", "india"]],
      ["Cars", ["animated"]], ["Krrish", ["bollywood"]], ["Ghostbusters", ["hollywood"]],
      ["Shrek", ["animated"]], ["Dangal", ["bollywood"]],
    ],
  },
  {
    category: "movies",
    difficulty: "hard",
    words: [
      ["Inception", ["hollywood"]], ["Mr. India", ["bollywood"]],
      ["Taare Zameen Par", ["bollywood"]], ["PK", ["bollywood"]], ["Gravity", ["hollywood"]],
      ["The Matrix", ["hollywood"]], ["Life of Pi", ["hollywood"]],
      ["Jab We Met", ["bollywood"]], ["Back to the Future", ["hollywood"]],
      ["Dilwale Dulhania Le Jayenge", ["bollywood"]], ["Interstellar", ["hollywood"]],
      ["Pushpa", ["tollywood", "india"]],
    ],
  },

  // ── All Play ──────────────────────────────────────────────────────────
  {
    category: "all-play",
    difficulty: "easy",
    words: [
      "Birthday Party", "Rainbow", "Snowman", "Ghost", "Fireworks", "Picnic",
      "Sandcastle", "Dinosaur", "Rocket", "Treasure Chest",
    ],
  },
  {
    category: "all-play",
    difficulty: "medium",
    words: [
      "Traffic Jam", ["Wedding", ["india"]], "Roller Coaster", ["Diwali", ["india", "festival"]],
      ["Cricket Match", ["sport", "india"]], "Camping", "Thunderstorm", "Treasure Map",
      "Magic Trick", ["Holi", ["india", "festival"]], ["Monsoon", ["india"]], "Pillow Fight",
    ],
  },
  {
    category: "all-play",
    difficulty: "hard",
    words: [
      "Solar Eclipse", "Time Travel", "Jungle Safari", "Superhero Landing",
      "Global Warming", "Stage Fright", "Butterflies in Your Stomach", "Black Hole",
    ],
  },
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function makeWordId(category, text) {
  return `${category}:${slugify(text)}`;
}

/** @type {import('../types.js').Word[]} */
export const WORDS = GROUPS.flatMap(({ category, difficulty, words }) =>
  words.map((entry) => {
    const [text, tags = []] = Array.isArray(entry) ? entry : [entry];
    return { id: makeWordId(category, text), text, category, difficulty, tags };
  }),
);
