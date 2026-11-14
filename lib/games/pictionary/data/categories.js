/**
 * Category metadata shared by the word bank, the board and the UI.
 * `icon` is a Lucide icon name resolved in features/pictionary/shared/category-badge.js.
 */
export const CATEGORIES = {
  person: {
    id: "person",
    label: "Person",
    short: "P",
    color: "#F4A62A",
    ink: "#4A2C00",
    icon: "UserRound",
    hint: "People, jobs, characters and famous faces",
  },
  place: {
    id: "place",
    label: "Place",
    short: "PL",
    color: "#3D8BF2",
    ink: "#FFFFFF",
    icon: "MapPin",
    hint: "Landmarks, buildings and locations",
  },
  animal: {
    id: "animal",
    label: "Animal",
    short: "A",
    color: "#2FAE72",
    ink: "#FFFFFF",
    icon: "PawPrint",
    hint: "Creatures great and small",
  },
  object: {
    id: "object",
    label: "Object",
    short: "O",
    color: "#8E63E6",
    ink: "#FFFFFF",
    icon: "Lamp",
    hint: "Things you can hold, use or own",
  },
  action: {
    id: "action",
    label: "Action",
    short: "AC",
    color: "#EF6A43",
    ink: "#FFFFFF",
    icon: "Zap",
    hint: "Verbs, activities and things people do",
  },
  food: {
    id: "food",
    label: "Food",
    short: "F",
    color: "#E2508E",
    ink: "#FFFFFF",
    icon: "Pizza",
    hint: "Dishes, snacks, fruit and drinks",
  },
  movies: {
    id: "movies",
    label: "Movies",
    short: "M",
    color: "#1F9FB4",
    ink: "#FFFFFF",
    icon: "Clapperboard",
    hint: "Bollywood, Hollywood and beyond",
  },
  "all-play": {
    id: "all-play",
    label: "All Play",
    short: "AP",
    color: "#1B2140",
    ink: "#FFE9A8",
    icon: "Users",
    hint: "Everyone guesses at once — fastest team wins",
  },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES);

/** Categories that can be drawn on a normal turn (All Play is special). */
export const STANDARD_CATEGORY_IDS = CATEGORY_IDS.filter((id) => id !== "all-play");

export const DIFFICULTIES = {
  easy: { id: "easy", label: "Easy", stars: 1 },
  medium: { id: "medium", label: "Medium", stars: 2 },
  hard: { id: "hard", label: "Hard", stars: 3 },
};

export function getCategory(id) {
  return CATEGORIES[id] ?? CATEGORIES.object;
}
