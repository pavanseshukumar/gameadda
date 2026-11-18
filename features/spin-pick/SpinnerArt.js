import { memo } from "react";

/**
 * The fidget spinner, drawn like the classic moulded-plastic one: a glossy body
 * with smooth scooped curves between the arms, a black ring weight around a
 * see-through hole in every arm, and a raised round cap in the middle. Each arm is
 * moulded in its own colour. Works for 3–6 spokes. Pure SVG (viewBox −100…100),
 * drawn once; the parent turns it.
 *
 * Geometry: arm i is centred `D` from the middle, at angle i·(360/n) from the top,
 * and rounded with radius `r`. Between two arms the edge curves in along an arc of
 * radius `rc` that touches both arms, so the outline is one smooth shape.
 */

/** Per spoke count: arm distance, arm radius, curve radius between arms, cap radius. */
const GEOMETRY = {
  3: { D: 57, r: 32, rc: 24, cap: 25 },
  4: { D: 60, r: 29, rc: 17, cap: 23 },
  5: { D: 62, r: 26.5, rc: 13, cap: 22 },
  6: { D: 63, r: 24, rc: 11, cap: 22 },
};
/** Ring weight and hole, as shares of the arm radius. */
const RING_OUTER = 0.8;
const HOLE = 0.5;

const r2 = (x) => Math.round(x * 100) / 100;
const rad = (deg) => (deg * Math.PI) / 180;
const polar = (dist, deg) => [Math.cos(rad(deg)) * dist, Math.sin(rad(deg)) * dist];

export function geometryFor(count) {
  return GEOMETRY[count] ?? GEOMETRY[6];
}

/** Outline of the body: arcs round each arm joined by smooth inward curves. */
function bodyPath(count) {
  const { D, r, rc } = geometryFor(count);
  const step = 360 / count;
  // Distance from the middle to each inward curve's centre, so it touches both
  // neighbouring arms: |C_arm − C_curve| = r + rc, centred halfway between them.
  const b = 2 * D * Math.cos(rad(step / 2));
  const c = D * D - (r + rc) ** 2;
  const Dc = (b + Math.sqrt(b * b - 4 * c)) / 2;

  const arms = Array.from({ length: count }, (_, i) => polar(D, i * step - 90));
  const curves = Array.from({ length: count }, (_, i) => polar(Dc, i * step - 90 + step / 2));
  const touch = (arm, curve) => {
    const dx = curve[0] - arm[0];
    const dy = curve[1] - arm[1];
    const len = Math.hypot(dx, dy);
    return [arm[0] + (dx / len) * r, arm[1] + (dy / len) * r];
  };

  let d = "";
  for (let i = 0; i < count; i += 1) {
    const arm = arms[i];
    const into = touch(arm, curves[(i - 1 + count) % count]);
    const out = touch(arm, curves[i]);
    const next = touch(arms[(i + 1) % count], curves[i]);
    if (i === 0) d += `M${r2(into[0])} ${r2(into[1])}`;
    const a0 = Math.atan2(into[1] - arm[1], into[0] - arm[0]);
    const a1 = Math.atan2(out[1] - arm[1], out[0] - arm[0]);
    const sweep = (a1 - a0 + 2 * Math.PI) % (2 * Math.PI);
    d += `A${r2(r)} ${r2(r)} 0 ${sweep > Math.PI ? 1 : 0} 1 ${r2(out[0])} ${r2(out[1])}`;
    d += `A${r2(rc)} ${r2(rc)} 0 0 0 ${r2(next[0])} ${r2(next[1])}`;
  }
  return `${d}Z`;
}

/** A full circle as a path (to punch holes with the even-odd rule). */
const circlePath = (x, y, r) => `M${r2(x - r)} ${r2(y)}a${r2(r)} ${r2(r)} 0 1 0 ${r2(2 * r)} 0a${r2(r)} ${r2(r)} 0 1 0 ${r2(-2 * r)} 0Z`;

/** A pie slice for arm i's colour (the body clips it). */
function wedge(i, count) {
  const step = 360 / count;
  const from = polar(140, i * step - 90 - step / 2);
  const to = polar(140, i * step - 90 + step / 2);
  return `M0 0L${r2(from[0])} ${r2(from[1])}A140 140 0 0 1 ${r2(to[0])} ${r2(to[1])}Z`;
}

export const SpinnerArt = memo(function SpinnerArt({ colors, rotorRef, idPrefix = "fs" }) {
  const count = colors.length;
  const step = 360 / count;
  const { D, r, cap } = geometryFor(count);
  const arms = colors.map((_, i) => polar(D, i * step - 90));
  const ringOuter = r * RING_OUTER;
  const hole = r * HOLE;
  const outline = bodyPath(count);
  const holes = arms.map(([x, y]) => circlePath(x, y, hole)).join("");
  const id = idPrefix;

  return (
    <svg ref={rotorRef} viewBox="-100 -100 200 200" className="spinner-rotor h-full w-full" role="img" aria-label={`Fidget spinner with ${count} spokes`}>
      <defs>
        {/* The body with its holes punched through. */}
        <clipPath id={`${id}-body`}>
          <path d={outline + holes} clipRule="evenodd" />
        </clipPath>
        {/* Glossy moulded plastic: light from the top left, a darker rim. */}
        <radialGradient id={`${id}-gloss`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.38" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.2" />
        </radialGradient>
        {/* The black ring weights: soft plastic with a sheen. */}
        <radialGradient id={`${id}-ring`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#4a4a4f" />
          <stop offset="55%" stopColor="#1d1d21" />
          <stop offset="100%" stopColor="#09090b" />
        </radialGradient>
        <radialGradient id={`${id}-cap`} cx="40%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="65%" stopColor="#f1edf4" />
          <stop offset="100%" stopColor="#cfc6d8" />
        </radialGradient>
      </defs>

      {/* Body: each arm moulded in its colour, then gloss, rim and seams on top. */}
      <g clipPath={`url(#${id}-body)`}>
        {colors.map((c, i) => (
          <path key={c.id} d={wedge(i, count)} fill={c.hex} />
        ))}
        <circle r="98" fill={`url(#${id}-gloss)`} />
        {/* Rim shading round the edge and the holes. */}
        <path d={outline + holes} fill="none" stroke="rgb(0 0 0 / 0.22)" strokeWidth="5" />
        <path d={outline} fill="none" stroke="rgb(255 255 255 / 0.4)" strokeWidth="1.4" transform="translate(-0.9 -0.9)" />
        {colors.map((c, i) => {
          const [x, y] = polar(100, i * step - 90 + step / 2);
          return <line key={c.id} x1="0" y1="0" x2={r2(x)} y2={r2(y)} stroke="rgb(0 0 0 / 0.14)" strokeWidth="0.9" />;
        })}
        {/* A soft specular streak along every arm, like light on shiny plastic. */}
        {arms.map(([x, y], i) => {
          const angle = i * step - 90;
          const [hx, hy] = polar(D * 0.58, angle - 14);
          return (
            <ellipse
              key={i}
              cx={r2(hx)}
              cy={r2(hy)}
              rx={r2(r * 0.55)}
              ry={r2(r * 0.16)}
              transform={`rotate(${r2(angle)} ${r2(hx)} ${r2(hy)})`}
              fill="rgb(255 255 255 / 0.22)"
            />
          );
        })}
      </g>
      <path d={outline} fill="none" stroke="rgb(0 0 0 / 0.28)" strokeWidth="0.9" />

      {/* Ring weights round each see-through hole. */}
      {arms.map(([x, y], i) => (
        <g key={i} transform={`translate(${r2(x)} ${r2(y)})`}>
          <circle r={r2(ringOuter + 1.4)} fill="rgb(0 0 0 / 0.25)" />
          <path d={circlePath(0, 0, ringOuter) + circlePath(0, 0, hole)} fillRule="evenodd" fill={`url(#${id}-ring)`} />
          {/* Moulded lip on the inside edge, and a sheen across the top. */}
          <circle r={r2(hole + 1.3)} fill="none" stroke="rgb(255 255 255 / 0.14)" strokeWidth="1" />
          <circle r={r2(hole)} fill="none" stroke="rgb(0 0 0 / 0.55)" strokeWidth="1.4" />
          <path
            d={`M${r2(-ringOuter * 0.7)} ${r2(-ringOuter * 0.42)}A${r2(ringOuter * 0.82)} ${r2(ringOuter * 0.82)} 0 0 1 ${r2(ringOuter * 0.42)} ${r2(-ringOuter * 0.7)}`}
            fill="none"
            stroke="rgb(255 255 255 / 0.28)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>
      ))}

      {/* The raised centre cap you hold it by. */}
      <circle r={cap + 2.2} fill="rgb(0 0 0 / 0.2)" />
      <circle r={cap} fill={`url(#${id}-cap)`} />
      <circle r={cap} fill="none" stroke="rgb(0 0 0 / 0.12)" strokeWidth="1" />
      <circle r={r2(cap * 0.82)} fill="none" stroke="rgb(255 255 255 / 0.7)" strokeWidth="1" />
      <ellipse cx={r2(-cap * 0.32)} cy={r2(-cap * 0.38)} rx={r2(cap * 0.38)} ry={r2(cap * 0.2)} transform={`rotate(-30 ${r2(-cap * 0.32)} ${r2(-cap * 0.38)})`} fill="rgb(255 255 255 / 0.75)" />
    </svg>
  );
});
