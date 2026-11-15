"use client";

import { useId } from "react";

/** Body parts in the order misses draw them. Each is drawn as one chalk stroke. */
const PARTS = [
  { key: "head", el: <circle cx="140" cy="66" r="18" /> },
  { key: "body", el: <line x1="140" y1="84" x2="140" y2="140" /> },
  { key: "arm-l", el: <line x1="140" y1="100" x2="116" y2="124" /> },
  { key: "arm-r", el: <line x1="140" y1="100" x2="164" y2="124" /> },
  { key: "leg-l", el: <line x1="140" y1="140" x2="120" y2="178" /> },
  { key: "leg-r", el: <line x1="140" y1="140" x2="160" y2="178" /> },
];

/**
 * Chalk-drawn gallows and stick figure. `misses` parts are drawn. Complete
 * ("hanged") gets crossed-out eyes; "saved" gets a smile.
 *
 * `drawLatest` animates the newest part in. Pass it only right after the miss that
 * added that part: the board remounts on other events too (e.g. a hit after a miss),
 * and the part must not be redrawn then.
 *
 * @param {{ misses: number, max: number, mood?: "playing" | "hanged" | "saved", drawLatest?: boolean, className?: string }} props
 */
export function Gallows({ misses, max, mood = "playing", drawLatest = false, className = "" }) {
  const filter = `chalk-${useId().replace(/:/g, "")}`;
  const shown = Math.min(misses, PARTS.length);
  const faceVisible = shown >= 1;

  return (
    <svg
      viewBox="0 0 200 220"
      className={`gallows ${className}`}
      role="img"
      aria-label={
        mood === "hanged"
          ? "The stick figure is complete"
          : `${shown} of ${max} parts drawn${mood === "saved" ? ", and saved" : ""}`
      }
    >
      <defs>
        {/* A little displacement makes the strokes wobble like chalk. */}
        <filter id={filter} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="2.4" />
        </filter>
      </defs>
      <g filter={`url(#${filter})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* The frame: always there. */}
        <g className="gallows-frame" strokeWidth="6">
          <line x1="16" y1="206" x2="124" y2="206" />
          <line x1="48" y1="206" x2="48" y2="18" />
          <line x1="44" y1="18" x2="146" y2="18" />
          <line x1="48" y1="52" x2="82" y2="18" />
          <line x1="140" y1="18" x2="140" y2="48" className="gallows-rope" strokeWidth="4" />
        </g>
        <g className="gallows-figure" strokeWidth="5">
          {PARTS.slice(0, shown).map((part, i) => (
            <g key={part.key} className={drawLatest && i === shown - 1 && mood === "playing" ? "chalk-draw" : undefined}>
              {withPathLength(part.el)}
            </g>
          ))}
          {faceVisible && mood === "hanged" ? (
            <g className="chalk-draw" strokeWidth="3">
              <path d="M131 60 l6 6 M137 60 l-6 6 M143 60 l6 6 M149 60 l-6 6" pathLength="1" />
            </g>
          ) : null}
          {faceVisible && mood === "saved" ? (
            <g strokeWidth="3">
              <path d="M133 61 v1 M147 61 v1" />
              <path d="M131 71 q9 8 18 0" className="chalk-draw" pathLength="1" />
            </g>
          ) : null}
        </g>
      </g>
    </svg>
  );
}

/** Give a part's shape `pathLength="1"` so the draw-in animation works on any length. */
function withPathLength(el) {
  const Tag = el.type;
  return <Tag {...el.props} pathLength="1" />;
}
