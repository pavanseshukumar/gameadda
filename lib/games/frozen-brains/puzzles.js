/**
 * Frozen Brains puzzles: hand-written, original sound-alikes. Each clue is a run of
 * real words that, said aloud and fast, sounds like the answer
 * ("POLY HORROR" → "Pulihora"). Shipped in the repo, so the game needs no network.
 *
 * What makes a good one (rule 1 is checked before each change; there is no automated test yet):
 *   1. The clue must not share 4+ letters in a row with the answer's spelling, so it
 *      can't be solved by eye. Only saying it aloud gives it away.
 *   2. Break the words in different places from the answer (CHEEK IN BEERY ON KNEE).
 *   3. Prefer clues that read like a real, misleading phrase (PRAWN BUS → Prabhas).
 * Read every new clue aloud at speed before adding it.
 *
 * To add one, append to the right group:
 *   ["CLUE WORDS", "Answer", ["Other Accepted Spelling", …]?]
 * Ids come from the answer, so don't rename answers once played (saved games list used ids).
 *
 * @typedef {{ id: string, clue: string, answer: string, aliases: string[], category: string, difficulty: "easy"|"medium"|"hard" }} Puzzle
 */

export const CATEGORIES = [
  { id: "food", label: "Food", color: "#f97316" },
  { id: "movies", label: "Movies & Stars", color: "#e11d48" },
  { id: "places", label: "Places", color: "#0891b2" },
  { id: "phrases", label: "Everyday Talk", color: "#7c3aed" },
];

const GROUPS = [
  // ── Food ───────────────────────────────────────────────────────────────
  {
    category: "food",
    difficulty: "easy",
    puzzles: [
      ["FRY DRY ICE", "Fried Rice"],
      ["JELLY BEE", "Jalebi"],
      ["SOME OH SAW", "Samosa"],
      ["MUSS ALLAH DOUGH SAW", "Masala Dosa"],
      ["FEEL TOUR CAUGHT FEE", "Filter Coffee"],
      ["POUR BUDGIE", "Pav Bhaji", ["Pao Bhaji"]],
      ["LOSS SEE", "Lassi"],
      ["PAN EAT POOR EE", "Pani Puri", ["Paani Puri"]],
    ],
  },
  {
    category: "food",
    difficulty: "medium",
    puzzles: [
      ["CHEEK IN BEERY ON KNEE", "Chicken Biryani", ["Chicken Biriyani"]],
      ["PUN EAR TEA CAR", "Paneer Tikka"],
      ["GOO LAP JAR MOON", "Gulab Jamun"],
      ["RUSS MY LIE", "Rasmalai", ["Ras Malai"]],
      ["MERE CHEE BUDGIE", "Mirchi Bajji"],
      ["BUD A CHEEK KIN", "Butter Chicken"],
      ["UN YEN PUCK ODOR", "Onion Pakoda", ["Onion Pakora"]],
      ["EDDY LEE SOME BAR", "Idli Sambar", ["Idly Sambar"]],
      ["CHIP ATE TEA", "Chapati", ["Chapathi"]],
      ["MAN SHOE RE AN", "Manchurian"],
      ["OOP MAR", "Upma"],
    ],
  },
  {
    category: "food",
    difficulty: "hard",
    puzzles: [
      ["POLY HORROR", "Pulihora"],
      ["PAY SIR ROT TWO", "Pesarattu"],
      ["BOP BUT LOO", "Bobbatlu"],
      ["GONE GURU PIC CALL", "Gongura Pickle"],
      ["GOOD TEA WAN CUT YA", "Gutti Vankaya"],
      ["HIDE A ROBBED HE BEERY ON KNEE", "Hyderabadi Biryani", ["Hyderabadi Biriyani"]],
      ["DUB ALL COME EAT HA", "Double Ka Meetha", ["Double Ka Mitha"]],
      ["AREA SAIL OO", "Ariselu"],
      ["POOH TAR RACK COO LOO", "Pootharekulu", ["Pootarekulu"]],
      ["TOMB AT OH PUP OO", "Tomato Pappu"],
    ],
  },

  // ── Movies & Stars ─────────────────────────────────────────────────────
  {
    category: "movies",
    difficulty: "easy",
    puzzles: [
      ["BAR WHO BALLY", "Baahubali", ["Bahubali"]],
      ["PRAWN BUS", "Prabhas"],
      ["EAGER", "Eega"],
      ["COO SHE", "Khushi", ["Kushi"]],
      ["OAK CUD DO", "Okkadu"],
      ["AL LOO ARE GUN", "Allu Arjun"],
      ["TALL EVE WOULD", "Tollywood"],
      ["NAH KNEE", "Nani"],
      ["EAR ARE ARE", "RRR", ["Triple R"]],
      ["ARE YUH", "Arya"],
    ],
  },
  {
    category: "movies",
    difficulty: "medium",
    puzzles: [
      ["MUG A DEAR A", "Magadheera"],
      ["POKE EERIE", "Pokiri"],
      ["BOMB ARE ILL LOO", "Bommarillu"],
      ["MA HUN NOT TEA", "Mahanati"],
      ["SEA TAR RUM UM", "Sita Ramam", ["Seetha Ramam"]],
      ["DUE CUE DO", "Dookudu"],
      ["AT THAT DO", "Athadu"],
      ["GEL SAW", "Jalsa"],
      ["CHEER RUN GEE WE", "Chiranjeevi"],
      ["MY HASH BUB OO", "Mahesh Babu"],
      ["POW ONE CALL YARN", "Pawan Kalyan"],
      ["NUG ARE JOON A", "Nagarjuna"],
      ["VAN COT ASH", "Venkatesh"],
      ["SUMMON TAR", "Samantha"],
      ["RUN MAR CHAIR RUN", "Ram Charan"],
      ["SEEM HOD REE", "Simhadri"],
      ["NOTE TOO NAH TOO", "Naatu Naatu", ["Natu Natu"]],
      ["ARE JUNE RAID HE", "Arjun Reddy"],
      ["SAW IT REE", "Savitri", ["Savithri"]],
    ],
  },
  {
    category: "movies",
    difficulty: "hard",
    puzzles: [
      ["RIDGE A MOLE EE", "Rajamouli"],
      ["RUNG GUS TALL UM", "Rangasthalam"],
      ["GATE TOGO WIN DUMB", "Geetha Govindam", ["Geeta Govindam"]],
      ["OTTER RAN TEA KEY THERE EDDY", "Attarintiki Daredi"],
      ["JEW NEAR EN TEA ARE", "Junior NTR"],
      ["BRUM MAN UN DUMB", "Brahmanandam"],
      ["TREE VICAR AM", "Trivikram"],
      ["VEE JAYS DEVOUR A CON DUH", "Vijay Deverakonda"],
    ],
  },

  // ── Places ─────────────────────────────────────────────────────────────
  {
    category: "places",
    difficulty: "easy",
    puzzles: [
      ["SHE NIGH", "Chennai"],
      ["MOM BYE", "Mumbai"],
      ["DO BYE", "Dubai"],
      ["HIDE A ROBBED", "Hyderabad"],
      ["SINK A POOR", "Singapore"],
      ["COAL CUTTER", "Kolkata"],
      ["DELI", "Delhi"],
      ["LUN DUN", "London"],
      ["TOE KEY OH", "Tokyo"],
      ["PAIR IS", "Paris"],
      ["GO ARE", "Goa"],
    ],
  },
  {
    category: "places",
    difficulty: "medium",
    puzzles: [
      ["SHAH MEAN ARR", "Charminar"],
      ["WAR RUN GULL", "Warangal"],
      ["TEA ROO PARTY", "Tirupati", ["Tirupathi"]],
      ["GOAL KHAN DUH", "Golconda", ["Golkonda"]],
      ["WHO SANE SUGAR", "Hussain Sagar"],
      ["AREA COO", "Araku"],
      ["CURE NULL", "Kurnool"],
      ["NAIL LOW RAY", "Nellore"],
      ["UH MARE ICKER", "America"],
      ["GONE TOUR", "Guntur"],
      ["SHE SIGH LUM", "Srisailam"],
      ["BUNG GULL OAR", "Bangalore", ["Bengaluru"]],
    ],
  },
  {
    category: "places",
    difficulty: "hard",
    puzzles: [
      ["WE SACK A PUT NUM", "Visakhapatnam", ["Vishakapatnam"]],
      ["WE JAY OUR WADER", "Vijayawada"],
      ["SICK HUNDRED BAD", "Secunderabad"],
      ["COCKY NOTHER", "Kakinada"],
      ["TEA ROOM ALLAH", "Tirumala"],
      ["KEN YUCK OO MARRY", "Kanyakumari"],
      ["PAPPY CON DULL OO", "Papikondalu"],
    ],
  },

  // ── Everyday Talk ──────────────────────────────────────────────────────
  {
    category: "phrases",
    difficulty: "easy",
    puzzles: [
      ["HIPPIE BIRD DAY", "Happy Birthday"],
      ["HIPPY KNEW EAR", "Happy New Year"],
      ["HOLLY DAY", "Holiday"],
      ["EGGS ZACK LEE", "Exactly"],
      ["TRAP HICK JAM", "Traffic Jam"],
      ["AISLE OF YOU", "I Love You"],
      ["TANK HUE", "Thank You"],
      ["SEA USE SUN", "See You Soon"],
      ["WOT SUP", "WhatsApp", ["Whats App"]],
      ["EWE TOOB", "YouTube", ["You Tube"]],
    ],
  },
  {
    category: "phrases",
    difficulty: "medium",
    puzzles: [
      ["WAN SAP PAWN A THYME", "Once Upon A Time"],
      ["BRAY KIN NOOSE", "Breaking News"],
      ["FEUD ELLE IVORY", "Food Delivery"],
      ["SEW SHELL MEE DEAR", "Social Media"],
      ["SEEN YA SIT IS ZEN", "Senior Citizen"],
      ["TEA KID EEZY", "Take It Easy"],
      ["WAR KIN FRUMP HOLM", "Work From Home"],
      ["BUT TREE LOW", "Battery Low"],
      ["NAP RAW BLUM", "No Problem"],
      ["INNS TUG RUM", "Instagram"],
    ],
  },
  {
    category: "phrases",
    difficulty: "hard",
    puzzles: [
      ["COUNT GRAB YOU LAY SHUNS", "Congratulations"],
      ["HIPPIE ANY WORSE ARE EE", "Happy Anniversary"],
      ["ODE TOE RIG SURE", "Auto Rickshaw"],
      ["MARE EASE CRY STUMPS", "Merry Christmas"],
      ["EGGS SUM FEE VAR", "Exam Fever"],
    ],
  },
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** @type {Puzzle[]} */
export const PUZZLES = GROUPS.flatMap(({ category, difficulty, puzzles }) =>
  puzzles.map(([clue, answer, aliases = []]) => ({ id: `${category}:${slugify(answer)}`, clue, answer, aliases, category, difficulty })),
);

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
export const DIFFICULTY_IDS = ["easy", "medium", "hard"];

export function categoryOf(id) {
  return CATEGORIES.find((c) => c.id === id) ?? { id, label: "Mystery", color: "var(--accent)" };
}

export function puzzlesFor(categoryIds, difficultyIds) {
  return PUZZLES.filter((p) => categoryIds.includes(p.category) && difficultyIds.includes(p.difficulty));
}
