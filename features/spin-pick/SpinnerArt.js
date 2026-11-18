import { memo } from "react";

/**
 * The fidget spinner drawn as a real machined one: a single contoured body with
 * concave cut-outs between the arms, a bevelled edge, each arm anodised in its
 * colour, steel ball bearings in every arm and a big centre bearing under a
 * ridged finger cap. Pure SVG (viewBox −100…100), drawn once; the parent turns it.
 *
 * Geometry: arm i's weight sits on a circle of radius ARM_RADIUS around the
 * centre, at angle i·(360/n) from the top. Between two arms the edge dips in along
 * a concave arc (radius CUT) tangent to both weights, so the outline is one smooth curve.
 */

const ARM_DISTANCE = 63; // centre → middle of each arm's bearing
const ARM_RADIUS = 24.5; // outer edge of each arm around its bearing
const CUT = 11; // radius of the scooped cut-out between arms
const BEVEL = 0.94; // the flat top face, as a share of the full outline
const BALLS = 9;

const r2 = (x) => Math.round(x * 100) / 100;
const rad = (deg) => (deg * Math.PI) / 180;
const polar = (dist, deg) => [Math.cos(rad(deg)) * dist, Math.sin(rad(deg)) * dist];

/** Outline of the body: arcs around each weight joined by concave cut-outs. */
function bodyPath(count, scale = 1) {
  const step = 360 / count;
  const D = ARM_DISTANCE * scale;
  const r = ARM_RADIUS * scale;
  const rc = CUT * scale;
  // Distance from centre to each cut-out's circle, so it touches both neighbouring arms:
  // |C_arm − C_cut| = r + rc, with the cut centred halfway between the arms.
  const half = rad(step / 2);
  const b = 2 * D * Math.cos(half);
  const c = D * D - (r + rc) ** 2;
  const Dc = (b + Math.sqrt(b * b - 4 * c)) / 2;

  const arms = Array.from({ length: count }, (_, i) => polar(D, i * step - 90));
  const cuts = Array.from({ length: count }, (_, i) => polar(Dc, i * step - 90 + step / 2));
  const touch = (arm, cut) => {
    const dx = cut[0] - arm[0];
    const dy = cut[1] - arm[1];
    const len = Math.hypot(dx, dy);
    return [arm[0] + (dx / len) * r, arm[1] + (dy / len) * r];
  };

  let d = "";
  for (let i = 0; i < count; i += 1) {
    const arm = arms[i];
    const into = touch(arm, cuts[(i - 1 + count) % count]); // from the previous cut-out
    const out = touch(arm, cuts[i]); // into the next one
    const next = touch(arms[(i + 1) % count], cuts[i]);
    if (i === 0) d += `M${r2(into[0])} ${r2(into[1])}`;
    // Round the outside of the arm (the long way, clockwise)…
    const a0 = Math.atan2(into[1] - arm[1], into[0] - arm[0]);
    const a1 = Math.atan2(out[1] - arm[1], out[0] - arm[0]);
    const sweep = (a1 - a0 + 2 * Math.PI) % (2 * Math.PI);
    d += `A${r2(r)} ${r2(r)} 0 ${sweep > Math.PI ? 1 : 0} 1 ${r2(out[0])} ${r2(out[1])}`;
    // …then scoop in to the next arm.
    d += `A${r2(rc)} ${r2(rc)} 0 0 0 ${r2(next[0])} ${r2(next[1])}`;
  }
  return `${d}Z`;
}

/** A pie slice for arm i's colour (the body clips it). */
function wedge(i, count) {
  const step = 360 / count;
  const from = polar(140, i * step - 90 - step / 2);
  const to = polar(140, i * step - 90 + step / 2);
  return `M0 0L${r2(from[0])} ${r2(from[1])}A140 140 0 0 1 ${r2(to[0])} ${r2(to[1])}Z`;
}

/** A ball bearing: outer race, a ring of balls, inner race and the hole. */
function Bearing({ x, y, size, id }) {
  const outer = size;
  const ballRing = size * 0.66;
  const ball = size * 0.17;
  return (
    <g transform={`translate(${r2(x)} ${r2(y)})`}>
      {/* Pocket the bearing is pressed into. */}
      <circle r={outer + 1.6} fill="rgb(0 0 0 / 0.28)" />
      {/* Outer race. */}
      <circle r={outer} fill={`url(#${id}-steel)`} />
      <circle r={outer * 0.86} fill="#3c434d" />
      {/* Balls, each with a pin-point highlight. */}
      {Array.from({ length: BALLS }, (_, k) => {
        const [bx, by] = polar(ballRing, (k * 360) / BALLS);
        return (
          <g key={k}>
            <circle cx={r2(bx)} cy={r2(by)} r={r2(ball)} fill={`url(#${id}-ball)`} />
          </g>
        );
      })}
      {/* Inner race and the bore. */}
      <circle r={size * 0.44} fill={`url(#${id}-steel)`} />
      <circle r={size * 0.27} fill="#2b3038" />
      <circle r={size * 0.27} fill="none" stroke="rgb(255 255 255 / 0.25)" strokeWidth="0.8" />
    </g>
  );
}

export const SpinnerArt = memo(function SpinnerArt({ colors, rotorRef }) {
  const count = colors.length;
  const step = 360 / count;
  const outline = bodyPath(count);
  const face = bodyPath(count, BEVEL);
  const id = "fs";

  return (
    <svg ref={rotorRef} viewBox="-100 -100 200 200" className="spinner-rotor h-full w-full" role="img" aria-label="Fidget spinner">
      <defs>
        <clipPath id={`${id}-outline`}>
          <path d={outline} />
        </clipPath>
        <clipPath id={`${id}-face`}>
          <path d={face} />
        </clipPath>
        {/* Polished steel for the races and the cap. */}
        <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#d5dbe2" />
          <stop offset="55%" stopColor="#8e98a5" />
          <stop offset="78%" stopColor="#dfe4ea" />
          <stop offset="100%" stopColor="#6f7884" />
        </linearGradient>
        <radialGradient id={`${id}-ball`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#c9d0d8" />
          <stop offset="100%" stopColor="#59626d" />
        </radialGradient>
        {/* Anodised sheen over the colours: bright where the light hits, darker at the rim. */}
        <radialGradient id={`${id}-sheen`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.32" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.22" />
        </radialGradient>
        <linearGradient id={`${id}-brush`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
        <radialGradient id={`${id}-cap`} cx="38%" cy="32%" r="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#e9edf2" />
          <stop offset="100%" stopColor="#a8b1bc" />
        </radialGradient>
      </defs>

      {/* Bevel: the full outline in a darker shade of each arm's colour. */}
      <g clipPath={`url(#${id}-outline)`}>
        {colors.map((c, i) => (
          <path key={c.id} d={wedge(i, count)} fill={`color-mix(in oklab, ${c.hex} 80%, black)`} />
        ))}
      </g>
      {/* Top face, inset, in the full colour, with its sheen. */}
      <g clipPath={`url(#${id}-face)`}>
        {colors.map((c, i) => (
          <path key={c.id} d={wedge(i, count)} fill={c.hex} />
        ))}
        <circle r="96" fill={`url(#${id}-sheen)`} />
        <rect x="-100" y="-100" width="200" height="200" fill={`url(#${id}-brush)`} />
        {/* Hairline seams where two arms' colours meet. */}
        {colors.map((c, i) => {
          const [x, y] = polar(100, i * step - 90 + step / 2);
          return <line key={c.id} x1="0" y1="0" x2={r2(x)} y2={r2(y)} stroke="rgb(0 0 0 / 0.12)" strokeWidth="0.8" />;
        })}
      </g>
      {/* Crisp edge highlight on the bevel. */}
      <path d={face} fill="none" stroke="rgb(255 255 255 / 0.45)" strokeWidth="1" />
      <path d={outline} fill="none" stroke="rgb(0 0 0 / 0.25)" strokeWidth="1" />

      {/* A bearing in every arm. */}
      {colors.map((c, i) => {
        const [x, y] = polar(ARM_DISTANCE, i * step - 90);
        return <Bearing key={c.id} x={x} y={y} size={15.5} id={id} />;
      })}

      {/* Centre: a raised collar, the main bearing, and a ridged finger cap. */}
      <circle r="31" fill="rgb(0 0 0 / 0.18)" />
      <Bearing x={0} y={0} size={27} id={id} />
      <circle r="19" fill="rgb(0 0 0 / 0.3)" />
      <circle r="18" fill={`url(#${id}-cap)`} />
      {[14.5, 11, 7.5].map((ring) => (
        <circle key={ring} r={ring} fill="none" stroke="rgb(70 80 95 / 0.28)" strokeWidth="0.9" />
      ))}
      <circle r="4" fill="rgb(255 255 255 / 0.9)" />
    </svg>
  );
});
