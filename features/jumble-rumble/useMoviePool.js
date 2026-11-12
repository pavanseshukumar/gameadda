"use client";

import { useEffect, useState } from "react";
import { loadMoviePool } from "@/lib/games/jumble-rumble/moviePool";

/** The movie pool once loaded (`null` while loading). Starts the request on mount. */
export function useMoviePool() {
  const [pool, setPool] = useState(null);
  useEffect(() => {
    let alive = true;
    loadMoviePool().then((result) => {
      if (alive) setPool(result);
    });
    return () => {
      alive = false;
    };
  }, []);
  return pool;
}
