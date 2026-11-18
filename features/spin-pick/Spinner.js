"use client";

import { useEffect, useEffectEvent, useRef } from "react";

/**
 * The fidget spinner. Six coloured lobes, a pointer at the top.
 *
 * Motion runs outside React: one requestAnimationFrame loop writes the rotation
 * straight onto the rotor's `transform`, so a spin never re-renders the page.
 *
 *  - Free spin (any time `grabbable`): drag it round with a finger and let go; it
 *    keeps your speed and slows with fidget-like friction. Just for fun, no result.
 *  - Scoring spin (`spinning` + `targetIndex`): eases from the current speed
 *    (your flick, or a strong default for the Spin button) onto the target lobe,
 *    with velocity continuous at the hand-off, then calls `onLand`.
 *
 * A flick hard enough while `canFlick` calls `onFlick` instead of free-spinning:
 * the parent starts the scoring spin and this picks your speed up from there.
 *
 * Every lobe that passes the pointer flicks the pointer, ticks (if `sound`) and
 * buzzes phones that support vibration. A soft colour blur fades in at speed.
 *
 * @param {{
 *   colors: { id: string, label: string, hex: string }[],
 *   grabbable: boolean,
 *   canFlick: boolean,
 *   onFlick: () => void,
 *   spinning: boolean,
 *   targetIndex: number | null,
 *   onLand: () => void,
 *   restIndex?: number | null,   lobe to show under the pointer when idle (e.g. the last result)
 *   sound: boolean,
 * }} props
 */

const LOBE_STEP = 60; // six lobes
const LOBE_RADIUS = 58;
/** Free-spin friction (1/s): v *= e^(−k·dt). Low, so it keeps going like a real fidget. */
const FRICTION = 0.75;
const MIN_FLICK = 360; // deg/s that counts as a spin
const DEFAULT_SPIN = [1500, 2100]; // deg/s for the Spin button
const MAX_SPEED = 2800;

const mod = (a, n) => ((a % n) + n) % n;

/** Which lobe sits under the pointer (top) at rotation `angle`. */
export function lobeAt(angle, count) {
  return mod(Math.round(mod(-angle, 360) / LOBE_STEP), count);
}

/** Short wooden tick and a landing chime, made with Web Audio (no files). */
function createSounds() {
  let ctx = null;
  const ensure = () => {
    if (typeof window === "undefined") return null;
    try {
      ctx ??= new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
    } catch {
      ctx = null;
    }
    return ctx;
  };
  const blip = (freq, duration, gain, type = "triangle", delay = 0) => {
    const ac = ensure();
    if (!ac) return;
    const t = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(amp).connect(ac.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  };
  return {
    unlock: ensure,
    tick: () => blip(1400 + Math.random() * 200, 0.03, 0.06),
    land: () => {
      blip(660, 0.35, 0.09, "sine");
      blip(990, 0.45, 0.07, "sine", 0.08);
    },
  };
}

export function Spinner({ colors, grabbable, canFlick, onFlick, spinning, targetIndex, onLand, restIndex = null, sound }) {
  const count = colors.length;
  const rotorRef = useRef(null);
  const pointerRef = useRef(null);
  const blurRef = useRef(null);
  const liveRef = useRef(null);
  const sounds = useRef(null);
  const sim = useRef({
    angle: restIndex == null ? 0 : -restIndex * LOBE_STEP,
    velocity: 0,
    mode: "idle", // idle | free | drag | target
    lastLobe: null,
    lastTickAt: 0,
    target: null, // { from, distance, dir, duration, start }
    pendingVelocity: null,
    drag: null,
    raf: 0,
    lastFrame: 0,
  });

  const paint = () => {
    const s = sim.current;
    if (rotorRef.current) rotorRef.current.style.transform = `rotate(${s.angle}deg)`;
    const speed = Math.abs(s.velocity);
    if (blurRef.current) blurRef.current.style.opacity = String(Math.min(0.8, Math.max(0, (speed - 500) / 1800)));
    const lobe = lobeAt(s.angle, count);
    if (lobe !== s.lastLobe) {
      const first = s.lastLobe == null;
      s.lastLobe = lobe;
      if (liveRef.current) {
        liveRef.current.textContent = colors[lobe].label;
        liveRef.current.style.setProperty("--live", colors[lobe].hex);
      }
      if (!first && s.mode !== "idle") onTick();
    }
  };

  // Latest props for the animation loop, which outlives any one render.
  const latest = useRef({ sound, onLand });
  useEffect(() => {
    latest.current = { sound, onLand };
  });

  const onTick = () => {
    const s = sim.current;
    const now = performance.now();
    // The pointer flaps back as a lobe pushes past it.
    pointerRef.current?.animate(
      [{ transform: "rotate(0deg)" }, { transform: `rotate(${s.velocity >= 0 ? -16 : 16}deg)` }, { transform: "rotate(0deg)" }],
      { duration: 110, easing: "ease-out" },
    );
    if (latest.current.sound) sounds.current?.tick();
    // Buzz only while it's slow enough to feel each lobe.
    if (now - s.lastTickAt > 70 && typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(6);
    s.lastTickAt = now;
  };

  const landed = () => {
    if (latest.current.sound) sounds.current?.land();
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([18, 40, 28]);
    latest.current.onLand();
  };

  const frame = (time) => {
    const s = sim.current;
    const dt = Math.min(0.05, (time - (s.lastFrame || time)) / 1000);
    s.lastFrame = time;

    if (s.mode === "free") {
      s.velocity *= Math.exp(-FRICTION * dt);
      // A little dry friction too, so it settles instead of crawling for ever.
      s.velocity -= Math.sign(s.velocity) * Math.min(Math.abs(s.velocity), 22 * dt);
      s.angle += s.velocity * dt;
      if (Math.abs(s.velocity) < 4) {
        s.velocity = 0;
        s.mode = "idle";
      }
    } else if (s.mode === "target") {
      const t = s.target;
      const p = Math.min(1, (time - t.start) / 1000 / t.duration);
      // Ease-out cubic: starts at exactly the hand-off speed (3·D/T), ends at rest.
      const eased = 1 - (1 - p) ** 3;
      const angle = t.from + t.dir * t.distance * eased;
      s.velocity = (t.dir * 3 * t.distance * (1 - p) ** 2) / t.duration;
      s.angle = angle;
      if (p >= 1) {
        s.velocity = 0;
        s.mode = "idle";
        paint();
        s.raf = 0;
        landed();
        return;
      }
    }

    paint();
    if (s.mode === "free" || s.mode === "target") s.raf = requestAnimationFrame(frame);
    else s.raf = 0;
  };

  const run = () => {
    const s = sim.current;
    if (!s.raf) {
      s.lastFrame = 0;
      s.raf = requestAnimationFrame(frame);
    }
  };

  // Paint the resting angle on mount, and stop the loop on unmount.
  useEffect(() => {
    sounds.current ??= createSounds();
    paint();
    const s = sim.current;
    return () => cancelAnimationFrame(s.raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start the scoring spin once the engine has picked the landing lobe.
  const startTarget = useEffectEvent(() => {
    const s = sim.current;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let v = s.pendingVelocity;
    s.pendingVelocity = null;
    if (v == null || Math.abs(v) < MIN_FLICK) {
      const [lo, hi] = DEFAULT_SPIN;
      v = (lo + Math.random() * (hi - lo)) * (s.velocity < -50 ? -1 : 1);
    }
    const speed = Math.min(MAX_SPEED, Math.abs(v));
    const dir = Math.sign(v) || 1;
    const baseDuration = reduce ? 1.4 : Math.min(5, Math.max(3, speed / 520));
    const minDistance = (speed * baseDuration) / 3;
    // Land inside the target lobe, away from its edges so it's never a close call.
    const offset = (Math.random() * 2 - 1) * LOBE_STEP * 0.3;
    const rest = mod(-targetIndex * LOBE_STEP + offset, 360);
    const end = s.angle + dir * minDistance;
    const extra = dir > 0 ? mod(rest - end, 360) : mod(end - rest, 360);
    const distance = minDistance + extra;
    // Keep the hand-off speed: v0 = 3·D/T.
    const duration = reduce ? baseDuration : Math.min(7, (3 * distance) / speed);
    s.target = { from: s.angle, distance, dir, duration, start: performance.now() };
    s.mode = "target";
    run();
  });
  useEffect(() => {
    if (spinning && targetIndex != null) startTarget();
  }, [spinning, targetIndex]);

  // Snap to a result we're restored onto (e.g. after a reload on the result screen).
  useEffect(() => {
    const s = sim.current;
    if (restIndex == null || s.mode !== "idle" || lobeAt(s.angle, count) === restIndex) return;
    s.angle = -restIndex * LOBE_STEP;
    paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restIndex, count]);

  /* ---------------- Dragging ---------------- */

  const pointerAngle = (e, centre) => (Math.atan2(e.clientY - centre.y, e.clientX - centre.x) * 180) / Math.PI;

  const onPointerDown = (e) => {
    if (!grabbable) return;
    sounds.current?.unlock();
    const s = sim.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const centre = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    // Ignore touches on the very centre: no leverage there.
    const r = Math.hypot(e.clientX - centre.x, e.clientY - centre.y);
    if (r < rect.width * 0.08) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    s.mode = "drag";
    s.velocity = 0;
    const a = pointerAngle(e, centre);
    s.drag = { id: e.pointerId, centre, last: a, samples: [{ t: performance.now(), angle: s.angle }] };
  };

  const onPointerMove = (e) => {
    const s = sim.current;
    if (s.mode !== "drag" || s.drag?.id !== e.pointerId) return;
    const a = pointerAngle(e, s.drag.centre);
    let delta = a - s.drag.last;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    s.drag.last = a;
    s.angle += delta;
    const now = performance.now();
    s.drag.samples.push({ t: now, angle: s.angle });
    while (s.drag.samples.length > 2 && now - s.drag.samples[0].t > 90) s.drag.samples.shift();
    const first = s.drag.samples[0];
    s.velocity = now > first.t ? ((s.angle - first.angle) / (now - first.t)) * 1000 : 0;
    paint();
  };

  const onPointerUp = (e) => {
    const s = sim.current;
    if (s.mode !== "drag" || s.drag?.id !== e.pointerId) return;
    const now = performance.now();
    const last = s.drag.samples.at(-1);
    // Held still before letting go: no throw.
    const v = now - last.t > 80 ? 0 : Math.max(-MAX_SPEED, Math.min(MAX_SPEED, s.velocity));
    s.drag = null;
    if (canFlick && Math.abs(v) >= MIN_FLICK) {
      s.velocity = v;
      s.pendingVelocity = v;
      s.mode = "free"; // keeps turning for the frame or two until the engine answers
      run();
      onFlick();
      return;
    }
    s.velocity = v;
    s.mode = Math.abs(v) > 4 ? "free" : "idle";
    run();
  };

  return (
    <div className="spinner-stage relative mx-auto aspect-square w-full select-none">
      {/* Soft floor shadow (static, cheap). */}
      <div aria-hidden="true" className="spinner-shadow" />

      <div
        className={`absolute inset-0 touch-none ${grabbable ? "cursor-grab active:cursor-grabbing" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <svg ref={rotorRef} viewBox="-100 -100 200 200" className="spinner-rotor h-full w-full" role="img" aria-label="Fidget spinner">
          <defs>
            <radialGradient id="sp-body" cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="var(--spinner-body, #f3eef7)" />
              <stop offset="100%" stopColor="var(--spinner-body-edge, #dcd2e6)" />
            </radialGradient>
            <radialGradient id="sp-metal" cx="38%" cy="32%" r="75%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#cfd6df" />
              <stop offset="100%" stopColor="#7d8794" />
            </radialGradient>
            <radialGradient id="sp-gloss" cx="35%" cy="28%" r="70%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.75" />
              <stop offset="55%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Body: hub plus a rounded arm to every lobe, all one clay colour. Drawn twice:
              outlined, then plain on top, so only the outer edge of the shape shows. */}
          {["edge", "fill"].map((layer) => (
            <g
              key={layer}
              fill={layer === "edge" ? "var(--spinner-edge, #cbbfd8)" : "url(#sp-body)"}
              stroke={layer === "edge" ? "var(--spinner-edge, #cbbfd8)" : "none"}
              strokeWidth={layer === "edge" ? 3 : 0}
            >
              <circle r="46" />
              {colors.map((c, i) => {
                const a = ((i * LOBE_STEP - 90) * Math.PI) / 180;
                return <circle key={c.id} cx={Math.cos(a) * LOBE_RADIUS} cy={Math.sin(a) * LOBE_RADIUS} r="33" />;
              })}
            </g>
          ))}

          {/* Coloured weights with bearings. */}
          {colors.map((c, i) => {
            const a = ((i * LOBE_STEP - 90) * Math.PI) / 180;
            const x = Math.cos(a) * LOBE_RADIUS;
            const y = Math.sin(a) * LOBE_RADIUS;
            return (
              <g key={c.id}>
                <circle cx={x} cy={y} r="26" fill={c.hex} />
                <circle cx={x} cy={y} r="26" fill="url(#sp-gloss)" />
                <circle cx={x} cy={y} r="26" fill="none" stroke="rgb(0 0 0 / 0.12)" strokeWidth="1.5" />
                <circle cx={x} cy={y} r="10.5" fill="url(#sp-metal)" stroke="rgb(0 0 0 / 0.18)" strokeWidth="1" />
                <circle cx={x} cy={y} r="4" fill="rgb(255 255 255 / 0.85)" />
              </g>
            );
          })}

          {/* Centre cap. */}
          <circle r="21" fill="url(#sp-metal)" stroke="rgb(0 0 0 / 0.18)" strokeWidth="1.2" />
          <circle r="13" fill="var(--spinner-cap, #f8f5fb)" stroke="rgb(0 0 0 / 0.1)" strokeWidth="1" />
          <circle r="13" fill="url(#sp-gloss)" />
        </svg>
      </div>

      {/* Motion blur: a soft ring of every colour, fading in with speed. Static, so it's cheap. */}
      <div aria-hidden="true" ref={blurRef} className="spinner-blur" style={{ "--ring": `conic-gradient(${colors.map((c, i) => `${c.hex} ${(i - 0.5) * (360 / count)}deg ${(i + 0.5) * (360 / count)}deg`).join(", ")})` }} />

      {/* The pointer at the top, and the colour it's on. */}
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[38%]">
        <div ref={pointerRef} className="spinner-pointer" />
      </div>
      <p aria-hidden="true" ref={liveRef} className="spinner-live" />
    </div>
  );
}
