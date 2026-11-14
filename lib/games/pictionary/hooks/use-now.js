"use client";

import { useEffect, useState } from "react";

/**
 * Current time, refreshed every `interval` ms while `active`, and immediately
 * when the tab becomes visible again. Pair with the timestamp-based timer so
 * the display catches up after the tab was throttled in the background.
 */
export function useNow(active = true, interval = 200) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, interval);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    // Sync once on activation; deferred so it doesn't set state during the effect.
    const raf = requestAnimationFrame(tick);
    return () => {
      clearInterval(id);
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, interval]);

  return now;
}
