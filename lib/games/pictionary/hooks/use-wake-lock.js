"use client";

import { useEffect } from "react";

/** Keep the screen awake while `active` (e.g. during a drawing round). */
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock = null;
    let cancelled = false;

    const request = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
        if (cancelled) lock.release();
      } catch {
        // Denied or unsupported (e.g. low battery); not critical.
      }
    };
    const onVisible = () => document.visibilityState === "visible" && request();

    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
