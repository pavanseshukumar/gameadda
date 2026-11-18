"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { SpinnerArt } from "./SpinnerArt";

/**
 * The fidget spinner: 3–6 coloured arms, a pointer at the top.
 *
 * Motion runs outside React: one requestAnimationFrame loop writes the rotation
 * straight onto the rotor's `transform`, so a spin never re-renders the page.
 *
 *  - Free spin (any time `grabbable`): drag it round either way and let go; it keeps
 *    your speed, slows with fidget-like friction, then the detent catches it and it
 *    rocks into line with an arm under the pointer. Just for fun, no result.
 *  - Scoring spin (`spinning` + `targetIndex`): eases down from the current speed
 *    (your flick, or a strong default for the Spin button), with velocity continuous
 *    at the hand-off, then finishes with one of three endings:
 *      clean    stops just past the winner and swings back and forth into line
 *      teeter   stalls on the colour before, creeps… and just tips over
 *      fallback slips into the next colour, hangs there, then swings back
 *    The winner always ends dead centre under the pointer. Then `onLand`.
 *
 * A flick hard enough while `canFlick` calls `onFlick` instead of free-spinning:
 * the parent starts the scoring spin and this picks your speed up from there.
 *
 * Every arm that passes the pointer flaps the pointer, ticks (if `sound`) and buzzes
 * phones that support vibration. A soft colour blur fades in behind it at speed.
 *
 * @param {{
 *   colors: { id: string, label: string, hex: string }[],
 *   grabbable: boolean,
 *   canFlick: boolean,
 *   onFlick: () => void,
 *   spinning: boolean,
 *   targetIndex: number | null,
 *   onLand: () => void,
 *   restIndex?: number | null,   arm to show under the pointer when idle (e.g. the last result)
 *   sound: boolean,
 * }} props
 */

/** Free-spin friction (1/s): v *= e^(−k·dt). Low, so it keeps going like a real fidget. */
const FRICTION = 0.75;
const MIN_FLICK = 360; // deg/s that counts as a spin
const DEFAULT_SPIN = [1500, 2100]; // deg/s for the Spin button
const MAX_SPEED = 2800;
/** Below this speed a free spin is caught by the detent and rocks into line. */
const CATCH_SPEED = 70;
/** Detent spring: one swing takes this long; each swing back is this share of the last. */
const SWING_PERIOD = 0.8;
const SWING_RETURN = 0.28;
const SETTLE_LIMIT = 2.6; // s

const mod = (a, n) => ((a % n) + n) % n;
const stepFor = (count) => 360 / count;

/** Which arm sits under the pointer (top) at rotation `angle`. */
export function lobeAt(angle, count) {
  const step = stepFor(count);
  return mod(Math.round(mod(-angle, 360) / step), count);
}

/** The nearest rotation that puts an arm dead centre under the pointer. */
const nearestCentre = (angle, count) => Math.round(angle / stepFor(count)) * stepFor(count);

const easeOut3 = (p) => 1 - (1 - p) ** 3;
const easeInOut = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);

/**
 * A damped swing about `centre`, starting `amp` away with velocity `v0` (deg/s):
 * θ(t) = centre + e^(−ζt)·(A·cos ωt + B·sin ωt). Swings both ways, each smaller.
 */
function swing(centre, amp, v0) {
  const omega = (2 * Math.PI) / SWING_PERIOD;
  const zeta = (Math.log(1 / SWING_RETURN) * omega) / Math.PI;
  const B = (v0 + zeta * amp) / omega;
  const size = Math.max(Math.abs(amp), Math.abs(B), 0.01);
  const duration = Math.min(SETTLE_LIMIT, Math.max(0.5, Math.log(size / 0.08) / zeta));
  return {
    duration,
    at: (t) => centre + Math.exp(-zeta * t) * (amp * Math.cos(omega * t) + B * Math.sin(omega * t)),
    end: centre,
  };
}

/** Move from `from` to `to` over `duration` s with an easing curve. */
const glide = (from, to, duration, ease) => ({ duration, at: (t) => from + (to - from) * ease(Math.min(1, t / duration)), end: to });
const hold = (angle, duration) => ({ duration, at: () => angle, end: angle });

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
    angle: restIndex == null ? 0 : -restIndex * stepFor(count),
    velocity: 0,
    mode: "idle", // idle | free | drag | script
    lastLobe: null,
    lastTickAt: 0,
    /** `{ segments, index, start, scoring }` while a scripted move plays. */
    script: null,
    pendingVelocity: null,
    drag: null,
    raf: 0,
    lastFrame: 0,
  });

  // Latest props for the animation loop, which outlives any one render.
  const latest = useRef({ sound, onLand });
  useEffect(() => {
    latest.current = { sound, onLand };
  });

  const onTick = () => {
    const s = sim.current;
    const now = performance.now();
    // The pointer flaps back as an arm pushes past it.
    pointerRef.current?.animate(
      [{ transform: "rotate(0deg)" }, { transform: `rotate(${s.velocity >= 0 ? -16 : 16}deg)` }, { transform: "rotate(0deg)" }],
      { duration: 110, easing: "ease-out" },
    );
    if (latest.current.sound) sounds.current?.tick();
    // Buzz only while it's slow enough to feel each arm.
    if (now - s.lastTickAt > 70 && typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(6);
    s.lastTickAt = now;
  };

  const landed = () => {
    if (latest.current.sound) sounds.current?.land();
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([18, 40, 28]);
    latest.current.onLand();
  };

  const paint = () => {
    const s = sim.current;
    if (rotorRef.current) rotorRef.current.style.transform = `rotate(${s.angle}deg)`;
    const speed = Math.abs(s.velocity);
    if (blurRef.current) blurRef.current.style.opacity = String(Math.min(0.85, Math.max(0, (speed - 500) / 1700)));
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

  const frame = (time) => {
    const s = sim.current;
    const dt = Math.min(0.05, (time - (s.lastFrame || time)) / 1000);
    s.lastFrame = time;
    const before = s.angle;

    if (s.mode === "free") {
      s.velocity *= Math.exp(-FRICTION * dt);
      // A little dry friction too, so it slows to a stop instead of crawling for ever.
      s.velocity -= Math.sign(s.velocity) * Math.min(Math.abs(s.velocity), 22 * dt);
      s.angle += s.velocity * dt;
      // Slow enough: the detent catches it and it rocks into line.
      if (Math.abs(s.velocity) < CATCH_SPEED) {
        const centre = nearestCentre(s.angle, count);
        s.script = { segments: [swing(centre, s.angle - centre, s.velocity)], index: 0, start: time, scoring: false };
        s.mode = "script";
      }
    } else if (s.mode === "script") {
      const script = s.script;
      let seg = script.segments[script.index];
      let t = (time - script.start) / 1000;
      while (seg && t >= seg.duration) {
        script.start += seg.duration * 1000;
        t -= seg.duration;
        script.index += 1;
        seg = script.segments[script.index];
      }
      if (!seg) {
        s.angle = script.segments.at(-1).end;
        s.velocity = 0;
        s.mode = "idle";
        s.script = null;
        paint();
        s.raf = 0;
        if (script.scoring) landed();
        return;
      }
      s.angle = seg.at(Math.max(0, t));
      if (dt > 0) s.velocity = (s.angle - before) / dt;
    }

    paint();
    if (s.mode === "free" || s.mode === "script") s.raf = requestAnimationFrame(frame);
    else s.raf = 0;
  };

  const run = () => {
    const s = sim.current;
    if (!s.raf) {
      s.lastFrame = 0;
      s.raf = requestAnimationFrame(frame);
    }
  };

  /** Play a list of moves, then (for a scoring spin) report the landing. */
  const play = (segments, scoring) => {
    const s = sim.current;
    s.script = { segments, index: 0, start: performance.now(), scoring };
    s.mode = "script";
    run();
  };

  // Paint the resting angle on mount, and stop the loop on unmount.
  useEffect(() => {
    sounds.current ??= createSounds();
    paint();
    const s = sim.current;
    return () => cancelAnimationFrame(s.raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start the scoring spin once the engine has picked the landing arm.
  const startTarget = useEffectEvent(() => {
    const s = sim.current;
    const step = stepFor(count);
    const half = step / 2;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let v = s.pendingVelocity;
    s.pendingVelocity = null;
    if (v == null || Math.abs(v) < MIN_FLICK) {
      const [lo, hi] = DEFAULT_SPIN;
      v = (lo + Math.random() * (hi - lo)) * (s.velocity < -50 ? -1 : 1);
    }
    const speed = Math.min(MAX_SPEED, Math.abs(v));
    const dir = Math.sign(v) || 1;
    const baseDuration = reduce ? 1.2 : Math.min(5, Math.max(3, speed / 520));
    const minDistance = (speed * baseDuration) / 3;
    // The winning arm's exact centre, at least `minDistance` further round.
    const rest = mod(-targetIndex * step, 360);
    const ahead = s.angle + dir * minDistance;
    // Rounded onto the arm grid so it ends exactly in line (no float drift).
    const centre = Math.round((ahead + dir * (dir > 0 ? mod(rest - ahead, 360) : mod(ahead - rest, 360))) / step) * step;

    const roll = Math.random();
    const ending = reduce ? "clean" : roll < 0.45 ? "clean" : roll < 0.75 ? "teeter" : "fallback";
    // Where the long slow-down ends, for each ending.
    const stopAt =
      ending === "teeter"
        ? centre - dir * (half + Math.min(4, half * 0.12)) // stalls just short, still on the colour before
        : ending === "fallback"
          ? centre + dir * (half + Math.min(7, half * 0.2)) // slips just past, into the next colour
          : centre + dir * Math.min(9, half * 0.32); // a little past centre
    const distance = Math.abs(stopAt - s.angle);
    // Keep the hand-off speed: v0 = 3·D/T for an ease-out cubic.
    const duration = reduce ? baseDuration : Math.min(7.5, (3 * distance) / speed);
    const segments = [glide(s.angle, stopAt, duration, easeOut3)];

    if (ending === "teeter") {
      // Hangs on the edge… then creeps over it, and the detent pulls it into line.
      const over = centre - dir * (half - Math.min(3, half * 0.1));
      segments.push(hold(stopAt, 0.35), glide(stopAt, over, 1.25, easeInOut), swing(centre, over - centre, dir * 6));
    } else if (ending === "fallback") {
      // Looks like the next colour has it… then it rocks back.
      segments.push(hold(stopAt, 0.55), swing(centre, stopAt - centre, 0));
    } else {
      segments.push(swing(centre, stopAt - centre, 0));
    }
    play(segments, true);
  });
  useEffect(() => {
    if (spinning && targetIndex != null) startTarget();
  }, [spinning, targetIndex]);

  // Snap to a result we're restored onto (e.g. after a reload on the result screen).
  useEffect(() => {
    const s = sim.current;
    if (restIndex == null || s.mode !== "idle" || lobeAt(s.angle, count) === restIndex) return;
    s.angle = -restIndex * stepFor(count);
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
    s.script = null;
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
    s.velocity = v;
    if (canFlick && Math.abs(v) >= MIN_FLICK) {
      s.pendingVelocity = v;
      s.mode = "free"; // keeps turning for the frame or two until the engine answers
      run();
      onFlick();
      return;
    }
    if (Math.abs(v) >= CATCH_SPEED) {
      s.mode = "free";
      run();
    } else {
      // Let go slowly: rock straight into line.
      const centre = nearestCentre(s.angle, count);
      play([swing(centre, s.angle - centre, v)], false);
    }
  };

  return (
    <div className="spinner-stage relative mx-auto aspect-square w-full select-none">
      {/* Soft floor shadow (static, cheap). */}
      <div aria-hidden="true" className="spinner-shadow" />

      {/* Motion blur: a soft ring of every colour behind the body, fading in with speed, so the
          gaps fill in like a real spinner turning into a disc. Static, so it's cheap. */}
      <div
        aria-hidden="true"
        ref={blurRef}
        className="spinner-blur"
        style={{ "--ring": `conic-gradient(${colors.map((c, i) => `${c.hex} ${(i - 0.5) * (360 / count)}deg ${(i + 0.5) * (360 / count)}deg`).join(", ")})` }}
      />
      <div
        className={`absolute inset-0 touch-none ${grabbable ? "cursor-grab active:cursor-grabbing" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <SpinnerArt colors={colors} rotorRef={rotorRef} />
      </div>

      {/* The pointer at the top, and the colour it's on. */}
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[38%]">
        <div ref={pointerRef} className="spinner-pointer" />
      </div>
      <p aria-hidden="true" ref={liveRef} className="spinner-live" />
    </div>
  );
}
