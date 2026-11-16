"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useClock } from "@/lib/games/core/useClock";
import { useWakeLock } from "@/lib/games/pictionary/hooks/use-wake-lock";
import { ACTIONS, CLOCK, PHASES, remainingMs, selectActiveTeam, selectCurrentWord, selectTurnScore } from "@/lib/games/head-rush/engine";
import { categoryOf } from "@/lib/games/head-rush/words";
import { PauseIcon } from "@/components/ui/icons";
import { buzz, enterPlayMode, usePortrait } from "./landscape";

/** How far (px) a finger has to travel sideways to count as a swipe. */
const SWIPE_PX = 56;

/**
 * The full-screen, sideways turn: a 3-2-1 countdown, then one big word at a time.
 * Swipe right (or →) when the guesser gets it, left (or ←) to pass.
 *
 * Covers the whole viewport (fixed, above the page) so nothing else shows while the
 * phone is on someone's forehead.
 */
export function TurnStage({ state, dispatch, counting, onCountdownDone }) {
  const portrait = usePortrait();
  const team = selectActiveTeam(state);
  const playing = state.phase === PHASES.PLAYING;
  const running = playing && state.clock.status === CLOCK.RUNNING;
  const now = useClock(running);
  const left = remainingMs(state, now);
  const word = selectCurrentWord(state);
  const [flash, setFlash] = useState(null); // { kind: "correct" | "pass", key }
  const pausedByRotate = useRef(false);
  const start = useRef(null);

  useWakeLock(true);

  const act = (type, extra) => dispatch({ type, now: Date.now(), ...extra });

  // Time's up: the engine double-checks the clock, so an early tick is ignored.
  const timedOut = running && left <= 0;
  useEffect(() => {
    if (timedOut) {
      buzz([60, 60, 200]);
      dispatch({ type: ACTIONS.TIME_UP, now: Date.now() });
    }
  }, [timedOut, dispatch]);

  // Turned upright mid-turn (or the tab was hidden): hold the clock until it's back.
  const holdForRotate = useEffectEvent(() => {
    if (portrait && running) {
      pausedByRotate.current = true;
      act(ACTIONS.PAUSE);
    } else if (!portrait && pausedByRotate.current && playing && state.clock.status === CLOCK.PAUSED) {
      pausedByRotate.current = false;
      act(ACTIONS.RESUME);
    }
  });
  useEffect(() => holdForRotate(), [portrait]);

  const pauseIfRunning = useEffectEvent(() => running && act(ACTIONS.PAUSE));
  useEffect(() => {
    const onVisibility = () => document.visibilityState === "hidden" && pauseIfRunning();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const mark = (result) => {
    if (!running) return;
    buzz(result === "correct" ? 40 : [25, 40, 25]);
    setFlash({ kind: result, key: Date.now() });
    act(ACTIONS.MARK, { result });
  };

  // Arrow keys, for laptops and testing.
  const onKeyDown = useEffectEvent((e) => {
    if (e.key === "ArrowRight") mark("correct");
    else if (e.key === "ArrowLeft") mark("pass");
    else if (e.key === " " && playing) {
      e.preventDefault();
      act(running ? ACTIONS.PAUSE : ACTIONS.RESUME);
    }
  });
  useEffect(() => {
    const handler = (e) => onKeyDown(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const onPointerDown = (e) => {
    start.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e) => {
    const from = start.current;
    start.current = null;
    if (!from) return;
    const dx = e.clientX - from.x;
    const dy = e.clientY - from.y;
    if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.2) mark(dx > 0 ? "correct" : "pass");
  };

  const seconds = Math.ceil(left / 1000);
  const urgent = running && seconds <= 10;
  const category = word ? categoryOf(word.category) : null;

  return (
    <div
      className="hr-stage fixed inset-0 z-50 select-none overflow-hidden"
      style={{ "--team": team.color }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (start.current = null)}
    >
      {counting ? (
        <Countdown team={team} ready={!portrait} onDone={onCountdownDone} />
      ) : playing && word ? (
        <>
          {/* Top bar: timer, card count, score, pause. Small: the word is the star. */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 px-[max(1rem,env(safe-area-inset-left))] pt-[max(0.75rem,env(safe-area-inset-top))]">
            <span
              className={`clay-color grid h-12 min-w-16 place-items-center rounded-full px-3 font-display text-2xl tabular-nums ${urgent ? "anim-pulse" : ""}`}
              style={{ background: urgent ? "var(--miss)" : team.color, color: "#fff", "--tint": urgent ? "var(--miss)" : team.color }}
              role="timer"
              aria-label={`${seconds} seconds left`}
            >
              {seconds}
            </span>
            <span className="chip px-3 py-1.5 text-sm font-semibold tabular-nums text-muted">
              Card {Math.min(state.cardIndex + 1, state.deck.length)} of {state.deck.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="chip px-3 py-1.5 font-display text-lg tabular-nums" aria-label={`${selectTurnScore(state)} got`}>
                <span className="text-hit">✓</span> {selectTurnScore(state)}
              </span>
              <button
                type="button"
                className="btn btn-secondary size-11 rounded-full p-0"
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={() => act(ACTIONS.PAUSE)}
                aria-label="Pause"
              >
                <PauseIcon size={18} />
              </button>
            </div>
          </div>

          {/* The word, as big as it can be. */}
          <div className="absolute inset-0 grid place-items-center px-[12vw] pt-14">
            <div key={word.id} className="anim-pop text-center">
              <p className="mb-2 font-semibold uppercase tracking-[0.2em]" style={{ color: category.color, fontSize: "clamp(0.75rem, 3.2dvh, 1.1rem)" }}>
                {category.label}
              </p>
              <p className="font-display leading-[0.95] text-balance break-words" style={{ fontSize: wordSize(word.text) }}>
                {word.text}
              </p>
            </div>
          </div>

          {/* Swipe hints along the edges. */}
          <EdgeHint side="left" label="Pass" color="var(--miss)" onPress={() => mark("pass")} />
          <EdgeHint side="right" label="Got it" color="var(--hit)" onPress={() => mark("correct")} />

          {state.clock.status === CLOCK.PAUSED && !portrait ? (
            <PausedOverlay
              seconds={seconds}
              onResume={() => {
                // Back to full screen too (e.g. after a reload mid-turn).
                enterPlayMode();
                act(ACTIONS.RESUME);
              }}
            />
          ) : null}
        </>
      ) : null}

      {flash ? <Flash key={flash.key} kind={flash.kind} onDone={() => setFlash(null)} /> : null}
      {portrait ? <RotatePrompt /> : null}
    </div>
  );
}

/** Font size that keeps a word on one or two lines across a landscape phone. */
function wordSize(text) {
  const longest = Math.max(...text.split(/\s+/).map((w) => w.length), 3);
  const total = text.length;
  const byWidth = Math.round(150 / Math.max(longest, total * 0.55));
  return `min(${byWidth}vw, 30dvh)`;
}

function EdgeHint({ side, label, color, onPress }) {
  const arrow = side === "left" ? "←" : "→";
  return (
    <div
      className={`pointer-events-none absolute inset-y-0 ${side === "left" ? "left-0" : "right-0"} flex w-[9vw] min-w-14 items-center justify-center`}
      style={{ background: `linear-gradient(to ${side === "left" ? "right" : "left"}, color-mix(in oklab, ${color} 16%, transparent), transparent)` }}
    >
      <span className="flex flex-col items-center gap-1 font-display text-lg" style={{ color }}>
        <span className="text-3xl leading-none">{arrow}</span>
        <span className="[writing-mode:vertical-rl] text-sm uppercase tracking-[0.2em]" style={side === "left" ? { rotate: "180deg" } : undefined}>
          {label}
        </span>
      </span>
      {/* Mouse users (laptops) get a button; on touch, the swipe does it. */}
      <button
        type="button"
        className="pointer-events-auto absolute inset-0 hidden cursor-pointer pointer-fine:block"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={onPress}
        aria-label={label}
      />
    </div>
  );
}

function Flash({ kind, onDone }) {
  const correct = kind === "correct";
  const done = useEffectEvent(onDone);
  useEffect(() => {
    const id = setTimeout(() => done(), 520);
    return () => clearTimeout(id);
  }, []);
  return (
    <div
      className="hr-flash pointer-events-none absolute inset-0 grid place-items-center"
      style={{ background: correct ? "var(--hit)" : "var(--miss)" }}
      aria-hidden="true"
    >
      <span className="font-display text-white" style={{ fontSize: "min(16vw, 30dvh)" }}>
        {correct ? "Got it!" : "Pass"}
      </span>
    </div>
  );
}

function Countdown({ team, ready, onDone }) {
  const [n, setN] = useState(3);
  const done = useEffectEvent(onDone);
  // Counts down only while the phone is sideways; "Go!" shows briefly, then the first word.
  useEffect(() => {
    if (!ready) return;
    if (n === 0) {
      const id = setTimeout(() => done(), 450);
      return () => clearTimeout(id);
    }
    buzz(30);
    const id = setTimeout(() => setN((x) => x - 1), 850);
    return () => clearTimeout(id);
  }, [n, ready]);

  return (
    <div className="absolute inset-0 grid place-items-center text-center">
      <div>
        <p className="font-semibold uppercase tracking-[0.2em]" style={{ color: team.color, fontSize: "clamp(0.8rem, 3.5dvh, 1.2rem)" }}>
          {team.name} · Phone on your forehead!
        </p>
        <p key={n} className="anim-pop font-display leading-none" style={{ fontSize: "min(30vw, 55dvh)", color: team.color }}>
          {n || "Go!"}
        </p>
        <p className="text-muted" style={{ fontSize: "clamp(0.8rem, 3.5dvh, 1.1rem)" }}>
          Swipe → when you get it · ← to pass
        </p>
      </div>
    </div>
  );
}

function PausedOverlay({ seconds, onResume }) {
  return (
    <div
      className="absolute inset-0 z-10 grid place-items-center bg-[color-mix(in_oklab,var(--background)_88%,transparent)] backdrop-blur-md"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <div className="text-center">
        <p className="font-display text-4xl">Paused</p>
        <p className="mt-1 text-muted">The word is hidden while paused.</p>
        <button type="button" autoFocus className="btn btn-primary mt-5 h-14 px-10 text-lg" onClick={onResume}>
          Resume · {seconds}s left
        </button>
      </div>
    </div>
  );
}

function RotatePrompt() {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-[var(--background)] p-8 text-center" onPointerUp={(e) => e.stopPropagation()}>
      <div>
        <div className="hr-rotate mx-auto h-24 w-14 rounded-2xl border-4 border-[var(--foreground)]" aria-hidden="true" />
        <p className="mt-8 font-display text-3xl">Turn your phone sideways</p>
        <p className="mx-auto mt-2 max-w-xs text-muted">
          Head Rush plays in landscape. If it doesn’t turn, switch off rotation lock. The clock waits for you.
        </p>
      </div>
    </div>
  );
}
