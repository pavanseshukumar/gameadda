"use client";

import { useSyncExternalStore } from "react";

/**
 * Shared ticking clock for countdowns. Ticks every 200 ms only while at least
 * one component is subscribed with `active = true`.
 */
let now = 0;
let timer = null;
const listeners = new Set();

function tick() {
  now = Date.now();
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(tick, 200);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot() {
  if (!now) now = Date.now();
  return now;
}

const noopSubscribe = () => () => {};
const getServerSnapshot = () => 0;

/** Current time in ms, re-rendering ~5×/second while `active`. */
export function useClock(active) {
  return useSyncExternalStore(active ? subscribe : noopSubscribe, getSnapshot, getServerSnapshot);
}
