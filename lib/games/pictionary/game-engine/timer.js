/**
 * Wall-clock timer. State stores timestamps rather than a ticking counter, so
 * remaining time stays correct when the tab is backgrounded, throttled or
 * reloaded.
 */

/** @typedef {import('../types.js').TurnTimer} TurnTimer */

/** @returns {TurnTimer} */
export function createTimer(seconds) {
  return { durationMs: seconds * 1000, elapsedMs: 0, startedAt: null, running: false };
}

/** @param {TurnTimer} timer */
export function elapsed(timer, now) {
  const live = timer.running && timer.startedAt != null ? Math.max(0, now - timer.startedAt) : 0;
  return Math.min(timer.durationMs, timer.elapsedMs + live);
}

/** @param {TurnTimer} timer */
export function remaining(timer, now) {
  return Math.max(0, timer.durationMs - elapsed(timer, now));
}

/** @param {TurnTimer} timer */
export function isExpired(timer, now) {
  return remaining(timer, now) <= 0;
}

/** @param {TurnTimer} timer @returns {TurnTimer} */
export function startTimer(timer, now) {
  if (timer.running) return timer;
  return { ...timer, running: true, startedAt: now };
}

/** @param {TurnTimer} timer @returns {TurnTimer} */
export function pauseTimer(timer, now) {
  if (!timer.running) return timer;
  return { ...timer, running: false, startedAt: null, elapsedMs: elapsed(timer, now) };
}
