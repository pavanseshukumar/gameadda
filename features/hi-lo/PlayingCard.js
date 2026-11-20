import { cardName, parseCard } from "@/lib/games/hi-lo/engine";

/**
 * A playing card, drawn (no images): corner indices, the classic pip layouts for
 * 2–10, a big suit for aces, and a framed letter for J/Q/K. Sized by its container
 * width (everything inside is in container units), so the same card works as a
 * big table card or a tiny history chip.
 *
 * @param {{ card?: string | null, faceDown?: boolean, className?: string, style?: object }} props
 */

/** Suit shapes on a 100×100 box (drawn, so they look the same on every phone). */
const SUIT_PATHS = {
  H: <path d="M50 90C21 66 4 50 4 31 4 16 16 5 30 5c9 0 16 5 20 13 4-8 11-13 20-13 14 0 26 11 26 26 0 19-17 35-46 59z" />,
  D: <path d="M50 3Q67 27 89 50 67 73 50 97 33 73 11 50 33 27 50 3z" />,
  S: (
    <path d="M50 4C36 24 6 39 6 60c0 13 10 22 22 22 9 0 16-4 20-11-1 11-5 19-13 25h30c-8-6-12-14-13-25 4 7 11 11 20 11 12 0 22-9 22-22C94 39 64 24 50 4z" />
  ),
  C: (
    <g>
      <circle cx="50" cy="27" r="20" />
      <circle cx="27" cy="58" r="20" />
      <circle cx="73" cy="58" r="20" />
      <path d="M44 50h12v10c0 16 5 27 13 36H31c8-9 13-20 13-36z" />
    </g>
  ),
};

export function SuitIcon({ suit, className = "", style }) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden="true" fill="currentColor">
      {SUIT_PATHS[suit]}
    </svg>
  );
}

/** Pip centres for 2–10, in % of the pip area (x, y). Bottom-half pips are drawn upside down. */
const PIPS = {
  2: [[50, 8], [50, 92]],
  3: [[50, 8], [50, 50], [50, 92]],
  4: [[25, 8], [75, 8], [25, 92], [75, 92]],
  5: [[25, 8], [75, 8], [50, 50], [25, 92], [75, 92]],
  6: [[25, 8], [75, 8], [25, 50], [75, 50], [25, 92], [75, 92]],
  7: [[25, 8], [75, 8], [50, 29], [25, 50], [75, 50], [25, 92], [75, 92]],
  8: [[25, 8], [75, 8], [50, 29], [25, 50], [75, 50], [50, 71], [25, 92], [75, 92]],
  9: [[25, 8], [75, 8], [25, 36], [75, 36], [50, 50], [25, 64], [75, 64], [25, 92], [75, 92]],
  10: [[25, 8], [75, 8], [50, 22], [25, 36], [75, 36], [25, 64], [75, 64], [50, 78], [25, 92], [75, 92]],
};

function Face({ rank, suit }) {
  if (rank === "A") {
    return (
      <div className="pc-center grid place-items-center">
        <SuitIcon suit={suit} className="pc-ace" />
      </div>
    );
  }
  if (rank === "J" || rank === "Q" || rank === "K") {
    return (
      <div className="pc-court">
        <SuitIcon suit={suit} className="pc-court-suit" />
        <span className="pc-court-letter">{rank}</span>
        <SuitIcon suit={suit} className="pc-court-suit rotate-180" />
      </div>
    );
  }
  return (
    <div className="pc-pips">
      {PIPS[Number(rank)].map(([x, y], i) => (
        <SuitIcon key={i} suit={suit} className="pc-pip" style={{ left: `${x}%`, top: `${y}%`, rotate: y > 50 ? "180deg" : undefined }} />
      ))}
    </div>
  );
}

export function PlayingCard({ card = null, faceDown = false, className = "", style }) {
  if (faceDown || !card) {
    return (
      <div className={`playing-card pc-back ${className}`} style={style} aria-label="Face-down card" role="img">
        <div className="pc-back-pattern" />
      </div>
    );
  }
  const { rank, suit } = parseCard(card);
  const red = suit === "H" || suit === "D";
  return (
    <div className={`playing-card ${red ? "pc-red" : "pc-black"} ${className}`} style={style} role="img" aria-label={cardName(card)}>
      <div className="pc-index pc-index-top">
        <span>{rank}</span>
        <SuitIcon suit={suit} className="pc-index-suit" />
      </div>
      <Face rank={rank} suit={suit} />
      <div className="pc-index pc-index-bottom">
        <span>{rank}</span>
        <SuitIcon suit={suit} className="pc-index-suit" />
      </div>
    </div>
  );
}
