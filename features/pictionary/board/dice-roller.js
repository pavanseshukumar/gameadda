"use client";

import { useEffect, useRef, useState } from "react";
import { Dices } from "lucide-react";
import { rollDie } from "@/lib/games/pictionary/scoring";
import { sfx, vibrate } from "@/lib/games/pictionary/utils/feedback";
import { Button } from "@/features/pictionary/shared/button";
import { Die } from "./die";

const TUMBLE_MS = 900;
const SETTLE_MS = 500;

/**
 * Tap to roll. The result is committed immediately via `onRoll` (so a
 * refresh mid-animation can't buy a re-roll); the die then tumbles, lands,
 * and calls `onSettled` so the board can start moving the token.
 */
export function DiceRoller({ teamName, onRoll, onSettled }) {
  const [face, setFace] = useState(3);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState(null);
  const timers = useRef([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => (clearTimeout(t), clearInterval(t)));
  }, []);

  const roll = () => {
    if (rolling || result) return;
    const value = rollDie();
    setRolling(true);
    sfx.rattle();
    vibrate(20);
    onRoll(value);
    const flicker = setInterval(() => setFace(1 + Math.floor(Math.random() * 6)), 90);
    timers.current.push(
      flicker,
      setTimeout(() => {
        clearInterval(flicker);
        setFace(value);
        setResult(value);
        setRolling(false);
        vibrate(35);
      }, TUMBLE_MS),
      setTimeout(onSettled, TUMBLE_MS + SETTLE_MS),
    );
  };

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <button
        type="button"
        onClick={roll}
        disabled={rolling || result != null}
        aria-label="Roll the die"
        className="rounded-[1.75rem] p-2 transition-transform enabled:hover:-rotate-6 focus-visible:outline-3 focus-visible:outline-sun"
      >
        <span key={rolling ? "rolling" : "still"} className={rolling ? "animate-die-tumble block" : "block"}>
          <Die value={face} size={112} />
        </span>
      </button>
      {result ? (
        <p className="font-display text-3xl font-extrabold animate-pop-in" aria-live="polite">
          {result === 6 ? "A six!" : `Rolled a ${result}`}
        </p>
      ) : (
        <Button size="lg" variant="team" onClick={roll} disabled={rolling} className="min-w-56">
          <Dices className="size-6" />
          {rolling ? "Rolling…" : `Roll for ${teamName}`}
        </Button>
      )}
    </div>
  );
}
