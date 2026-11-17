"use client";

/** Grid shape per board size, as [columns, rows]: phones (portrait) and wider screens. */
const LAYOUTS = {
  8: { base: [4, 4], wide: [4, 4] },
  12: { base: [4, 6], wide: [6, 4] },
  18: { base: [6, 6], wide: [9, 4] },
};

function layoutFor(count) {
  const pairs = count / 2;
  if (LAYOUTS[pairs]) return LAYOUTS[pairs];
  const cols = Math.ceil(Math.sqrt(count));
  const shape = [cols, Math.ceil(count / cols)];
  return { base: shape, wide: shape };
}

/**
 * The card grid. A card is face up while it is flipped this turn or already matched;
 * twins share their emoji and their colour.
 *
 * @param {{
 *   cards: { pairId: number, emoji: string, name: string, color: string, matchedBy: string | null }[],
 *   flipped: number[],
 *   miss: boolean,
 *   freshPair: number[],                         the pair just found, for its little bounce
 *   teamColors: Record<string, string> | null,   team games: who found each pair
 *   disabled: boolean,
 *   onFlip: (index: number) => void,
 * }} props
 */
export function Board({ cards, flipped, miss, freshPair, teamColors, disabled, onFlip }) {
  const { base, wide } = layoutFor(cards.length);

  return (
    <div
      role="group"
      aria-label="Cards"
      className="twin-board"
      data-teams={teamColors ? "true" : "false"}
      style={{ "--cols-base": base[0], "--rows-base": base[1], "--cols-wide": wide[0], "--rows-wide": wide[1] }}
    >
      {cards.map((card, index) => {
        const isFlipped = flipped.includes(index);
        const up = isFlipped || !!card.matchedBy;
        const state = card.matchedBy ? "matched" : isFlipped ? (miss ? "miss" : "up") : "down";
        const label = card.matchedBy ? `${card.name}, found` : isFlipped ? card.name : `Card ${index + 1}, face down`;
        return (
          <button
            key={index}
            type="button"
            className="twin-card"
            data-up={up}
            data-state={state}
            data-fresh={freshPair.includes(index)}
            disabled={up || disabled}
            aria-label={label}
            onClick={() => onFlip(index)}
          >
            <span className="twin-card-inner" aria-hidden="true">
              <span className="twin-back">
                <svg viewBox="0 0 40 28" fill="none" stroke="currentColor" strokeWidth="3.2">
                  <circle cx="14" cy="14" r="10" />
                  <circle cx="26" cy="14" r="10" />
                </svg>
              </span>
              <span className="twin-face" style={{ "--pair": card.color }}>
                <span className="twin-emoji">{card.emoji}</span>
                {card.matchedBy && teamColors?.[card.matchedBy] ? (
                  <span className="twin-owner" style={{ "--owner": teamColors[card.matchedBy] }} />
                ) : null}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
