"use client";

import { useLayoutEffect } from "react";

/**
 * Marks <html> with the page's theme (`data-page`) so the page background and
 * overscroll match the game. Set in a layout effect: with Cache Components, Next
 * keeps a left route mounted but hidden (React <Activity>), and hiding runs this
 * cleanup, so the old game's background never leaks onto the next page.
 * (A `html:has(.theme-x)` rule would, since the hidden route stays in the DOM.)
 */
export function PageTheme({ name }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.page = name;
    return () => {
      if (root.dataset.page === name) delete root.dataset.page;
    };
  }, [name]);
  return null;
}
