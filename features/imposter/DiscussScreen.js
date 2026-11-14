"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Countdown } from "@/components/game/Countdown";
import { TeamBadge } from "@/components/game/TeamBadge";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ArrowRightIcon, PauseIcon, PlayIcon, RefreshIcon } from "@/components/ui/icons";
import { teamText } from "@/lib/games/core/teams";
import { useClock } from "@/lib/games/core/useClock";
import { ACTIONS, TIMER, remainingMs, selectSpeakingOrder } from "@/lib/games/imposter/engine";
import { RoundShell } from "./RoundShell";

/** Clue round and discussion: who starts, the speaking order, an optional timer. */
export function DiscussScreen({ state, dispatch, onEnd }) {
  const [confirmSkip, setConfirmSkip] = useState(false);
  const order = selectSpeakingOrder(state);
  const first = order[0];
  const timed = state.settings.discussSeconds > 0;
  const running = state.timer.status === TIMER.RUNNING;
  const now = useClock(running);
  const left = remainingMs(state, now);
  const timeUp = timed && left <= 0;

  // Pause the discussion timer if the tab is hidden or the screen goes away.
  const pauseIfRunning = useEffectEvent(() => {
    if (running) dispatch({ type: ACTIONS.PAUSE_TIMER, now: Date.now() });
  });
  useEffect(() => {
    const onVisibility = () => document.visibilityState === "hidden" && pauseIfRunning();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      pauseIfRunning();
    };
  }, []);

  return (
    <RoundShell state={state} teamColor={first.color} onEnd={onEnd} step="Clue time">
      <section className="anim-rise text-center">
        <p className="text-muted">Going round, each player says one word about the secret.</p>
        <h1 className="mt-2 font-display text-[clamp(1.9rem,7vw,3rem)] font-extrabold leading-tight tracking-tight">
          <span style={{ color: teamText(first.color) }}>{first.name}</span> goes first
        </h1>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start">
        <section className="card rounded-[1.75rem] p-4 sm:p-6" aria-labelledby="order-heading">
          <h2 id="order-heading" className="px-1 font-display text-lg font-bold tracking-tight">
            Speaking order
          </h2>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {order.map((player, i) => (
              <li key={player.id} className="flex items-center gap-3 rounded-2xl bg-surface-strong p-2 pr-3">
                <TeamBadge color={player.color}>{i + 1}</TeamBadge>
                <span className="min-w-0 flex-1 truncate font-semibold">{player.name}</span>
                {i === 0 ? <span className="chip shrink-0 px-2 py-0.5 text-xs font-bold">Starts</span> : null}
              </li>
            ))}
          </ol>
          <p className="mt-4 px-1 text-sm text-muted">
            Then talk it out: whose clue didn’t fit? Go round again if you need more clues.
          </p>
        </section>

        <section className="card flex flex-col items-center gap-4 rounded-[1.75rem] p-5 text-center sm:p-6" aria-label="Discussion">
          {timed ? (
            <>
              <Countdown
                remainingMs={left}
                totalMs={state.settings.discussSeconds * 1000}
                color={first.color}
                urgentAt={15}
                paused={state.timer.status === TIMER.PAUSED}
                format="clock"
              />
              {timeUp ? (
                <p className="font-display text-2xl font-extrabold text-accent-2" aria-live="polite">
                  Time’s up!
                </p>
              ) : null}
              {!timeUp ? (
                <button
                  type="button"
                  className="btn btn-secondary h-12 w-full text-base"
                  onClick={() => dispatch({ type: running ? ACTIONS.PAUSE_TIMER : ACTIONS.START_TIMER, now: Date.now() })}
                >
                  {running ? (
                    <>
                      <PauseIcon size={18} /> Pause timer
                    </>
                  ) : (
                    <>
                      <PlayIcon size={18} /> {state.timer.status === TIMER.PAUSED ? "Resume timer" : "Start timer"}
                    </>
                  )}
                </button>
              ) : null}
            </>
          ) : (
            <p className="text-muted">No timer: vote whenever you’re ready.</p>
          )}
          <button
            type="button"
            autoFocus={timeUp}
            className="btn btn-primary h-14 w-full text-base"
            onClick={() => dispatch({ type: ACTIONS.GO_TO_VOTE, now: Date.now() })}
          >
            Time to vote <ArrowRightIcon size={18} />
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm font-semibold text-subtle underline-offset-4 hover:text-foreground hover:underline"
            onClick={() => setConfirmSkip(true)}
          >
            <RefreshIcon size={14} /> Nobody knows the word? Deal a new one
          </button>
        </section>
      </div>

      <ConfirmDialog
        open={confirmSkip}
        title="Deal a new word?"
        body="Everyone looks at a fresh card, and the imposter may change. Pass the phone round again."
        confirmLabel="Deal again"
        onCancel={() => setConfirmSkip(false)}
        onConfirm={() => {
          setConfirmSkip(false);
          dispatch({ type: ACTIONS.SKIP_WORD, seed: Math.random() });
        }}
      />
    </RoundShell>
  );
}
