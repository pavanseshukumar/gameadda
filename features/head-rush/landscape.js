"use client";

import { useSyncExternalStore } from "react";

/**
 * Head Rush plays sideways and full screen. Browsers differ:
 *  - Android Chrome: full screen + `screen.orientation.lock("landscape")` both work
 *    (the lock needs full screen first, and both need a tap to start them).
 *  - iPhone Safari: neither is available to web pages, so the turn screen asks the
 *    player to turn the phone sideways (and to switch off rotation lock if needed).
 * Every call is best effort: failures are expected and ignored.
 */
export async function enterPlayMode() {
  const root = document.documentElement;
  try {
    if (!document.fullscreenElement && root.requestFullscreen) await root.requestFullscreen({ navigationUI: "hide" });
  } catch {
    // Not allowed here (e.g. iPhone, or an embedded frame).
  }
  try {
    await screen.orientation?.lock?.("landscape");
  } catch {
    // Lock unsupported or refused; the rotate prompt covers it.
  }
}

export async function exitPlayMode() {
  try {
    screen.orientation?.unlock?.();
  } catch {
    // Nothing to unlock.
  }
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch {
    // Already out of full screen.
  }
}

const PORTRAIT = "(orientation: portrait)";

function subscribe(onChange) {
  const media = window.matchMedia(PORTRAIT);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** True while the screen is taller than it is wide. */
export function usePortrait() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PORTRAIT).matches,
    () => false,
  );
}

/** A short buzz, where the device supports it. */
export function buzz(pattern) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // No vibration motor or API.
  }
}
