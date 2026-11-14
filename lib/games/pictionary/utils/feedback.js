/**
 * Synthesised sound effects (Web Audio, no asset files) and haptics.
 * All calls are no-ops when disabled in preferences or unsupported.
 */
import { getPrefs } from "../store/prefs-store.js";

let ctx = null;

function audio() {
  if (typeof window === "undefined") return null;
  if (!getPrefs().sound) return null;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, { at = 0, duration = 0.12, type = "sine", gain = 0.18 } = {}) {
  const ac = audio();
  if (!ac) return;
  const start = ac.currentTime + at;
  const osc = ac.createOscillator();
  const vol = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  vol.gain.setValueAtTime(0.0001, start);
  vol.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  vol.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(vol).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function vibrate(pattern) {
  if (!getPrefs().vibration) return;
  // Browsers reject vibration before the first tap (e.g. a buzzer right after a refresh).
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // unsupported
  }
}

export const sfx = {
  /** Call from a user gesture so later timer sounds are allowed to play. */
  unlock: () => audio(),
  tap: () => tone(660, { duration: 0.05, gain: 0.08 }),
  tick: () => tone(880, { duration: 0.06, type: "square", gain: 0.06 }),
  start() {
    tone(523, { duration: 0.1 });
    tone(784, { at: 0.1, duration: 0.18 });
    vibrate(30);
  },
  /** Ten seconds left. */
  warning() {
    tone(988, { duration: 0.09, type: "triangle", gain: 0.12 });
    tone(988, { at: 0.14, duration: 0.09, type: "triangle", gain: 0.12 });
    vibrate([40, 60, 40]);
  },
  timeUp() {
    tone(220, { duration: 0.5, type: "sawtooth", gain: 0.16 });
    tone(196, { at: 0.18, duration: 0.6, type: "sawtooth", gain: 0.14 });
    vibrate([220, 90, 320]);
  },
  correct() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, { at: i * 0.08, duration: 0.16, type: "triangle" }));
    vibrate(40);
  },
  miss() {
    tone(247, { duration: 0.16, type: "triangle", gain: 0.14 });
    tone(196, { at: 0.14, duration: 0.3, type: "triangle", gain: 0.14 });
    vibrate(90);
  },
  undo: () => tone(523, { duration: 0.08, type: "triangle", gain: 0.1 }),
  /** Drawing challenge revealed: a quick rising shimmer. */
  challenge() {
    [659, 880, 1175, 1568].forEach((f, i) => tone(f, { at: i * 0.06, duration: 0.14, type: "sine", gain: 0.09 }));
    vibrate(25);
  },
  rattle() {
    for (let i = 0; i < 7; i++) tone(300 + ((i * 97) % 240), { at: i * 0.11, duration: 0.04, type: "square", gain: 0.05 });
  },
  step: () => tone(740, { duration: 0.05, type: "triangle", gain: 0.07 }),
  fanfare() {
    [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) =>
      tone(f, { at: i * 0.12, duration: i === 7 ? 0.5 : 0.11, type: "triangle", gain: 0.15 }),
    );
    vibrate([60, 60, 60, 60, 200]);
  },
};
