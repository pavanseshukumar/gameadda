"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Scoreboard } from "@/components/game/Scoreboard";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { ReadyCard } from "@/components/game/ReadyCard";
import { GameShell } from "@/components/game/GameShell";
import { FeedbackToast } from "@/components/game/FeedbackToast";
import { EndGameButton } from "@/components/game/EndGameButton";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ArrowRightIcon, ChevronDownIcon, ChevronUpIcon, TrophyIcon } from "@/components/ui/icons";
import { teamText } from "@/lib/games/core/teams";
import { ACTIONS, PHASES, cardName, cardsLeft, selectActiveTeam, selectOdds } from "@/lib/games/hi-lo/engine";
import { PlayingCard } from "./PlayingCard";

/** How long a reveal takes (deal, flip, stamp); calls wait for it. */
const REVEAL_MS = 750;
/** Vertical drag (px) on the table that counts as a swipe. */
const SWIPE_PX = 48;

const OUTCOME = {
  won: { mark: "✓", label: "Kept it!", tone: "hit" },
  lost: { mark: "✗", label: "Wrong way", tone: "miss" },
  same: { mark: "=", label: "Same rank: no card", tone: "same" },
};

/** @param {{ state: any, dispatch: Function }} props */
export function PlayScreen({ state, dispatch }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyTimer = useRef(null);
  const team = selectActiveTeam(state);
  const solo = state.teams.length === 1;
  const hand = state.settings.handSize;
  const playing = state.phase === PHASES.PLAYING;
  const lastCall = state.calls.at(-1) ?? null;
  const left = cardsLeft(state);

  useEffect(() => () => clearTimeout(busyTimer.current), []);

  const guess = (dir) => {
    if (!playing || busy) return;
    dispatch({ type: ACTIONS.GUESS, guess: dir });
    setBusy(true);
    clearTimeout(busyTimer.current);
    busyTimer.current = setTimeout(() => setBusy(false), REVEAL_MS);
  };

  // Keys: ↑ / H higher, ↓ / L lower, Enter to move on.
  const onKeyDown = useEffectEvent((e) => {
    if (confirmEnd || e.metaKey || e.ctrlKey || e.altKey) return;
    if (playing && (e.key === "ArrowUp" || e.key.toLowerCase() === "h")) {
      e.preventDefault();
      guess("higher");
    } else if (playing && (e.key === "ArrowDown" || e.key.toLowerCase() === "l")) {
      e.preventDefault();
      guess("lower");
    }
  });
  useEffect(() => {
    const handler = (e) => onKeyDown(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toast =
    state.lastEvent?.type === "reshuffled" || state.lastEvent?.reshuffled
      ? { id: state.lastEvent.seq, tone: "info", title: "Fresh deck", detail: "The shoe ran out, so a new deck was shuffled in" }
      : null;

  return (
    <GameShell
      wide
      teamColor={team.color}
      right={
        <>
          {state.phase === PHASES.PLAYING || state.phase === PHASES.TURN_OVER ? (
            <span className="chip mr-0.5 whitespace-nowrap px-3 py-1.5 text-sm font-semibold tabular-nums">
              Card {Math.min(hand, state.calls.length + (playing ? 1 : 0))}/{hand}
            </span>
          ) : null}
          <EndGameButton onClick={() => setConfirmEnd(true)} />
        </>
      }
    >
      <FeedbackToast message={toast} />
      {solo ? null : <Scoreboard teams={state.teams} activeTeamId={team.id} />}

      {state.phase === PHASES.READY ? (
        <ReadyCard team={team} solo={solo} eyebrow={`Player ${state.turnIndex + 1} of ${state.teams.length}`} seconds={0} onStart={() => dispatch({ type: ACTIONS.START_TURN })}>
          <div className="mx-auto mt-5 flex w-fit -space-x-8" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-16" style={{ rotate: `${(i - 1) * 8}deg`, translate: `0 ${i === 1 ? -4 : 0}px` }}>
                <PlayingCard faceDown />
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">
            {hand} cards to call. Pass the phone to {team.name}.
          </p>
        </ReadyCard>
      ) : (
        <>
          <div className={solo ? "" : "mt-3 sm:mt-5"}>
            {solo ? (
              <SoloStats state={state} />
            ) : (
              <TurnIndicator team={team} hint={playing ? "Higher or lower than the card showing?" : "Turn over"} />
            )}
          </div>

          <Table state={state} lastCall={lastCall} left={left} busy={busy} onSwipe={guess} />

          {playing ? (
            <Controls state={state} busy={busy} onGuess={guess} />
          ) : (
            <TurnSummary state={state} team={team} onNext={() => dispatch({ type: ACTIONS.NEXT_TURN })} />
          )}

          <CallStrip calls={state.calls} hand={hand} />
        </>
      )}

      <ConfirmDialog
        open={confirmEnd}
        title="End the game?"
        body={solo ? "This hand won’t count toward your best." : "We’ll skip to the final standings with the cards kept so far."}
        confirmLabel="End game"
        tone="danger"
        onCancel={() => setConfirmEnd(false)}
        onConfirm={() => {
          setConfirmEnd(false);
          dispatch({ type: ACTIONS.END_GAME });
        }}
      />
    </GameShell>
  );
}

function SoloStats({ state }) {
  const best = state.bests[String(state.settings.handSize)];
  return (
    <div className="grid grid-cols-3 gap-2">
      <Stat label="Kept" value={state.teams[0].score} accent />
      <Stat label="Streak" value={state.streak} />
      <Stat label="Best" value={best == null ? "—" : `${best}/${state.settings.handSize}`} />
    </div>
  );
}

function Stat({ label, value, accent = false }) {
  return (
    <div className="card rounded-2xl px-3 py-2">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-subtle">{label}</p>
      <p key={value} className={`anim-pop font-display text-2xl font-bold tabular-nums leading-tight ${accent ? "text-accent" : ""}`}>
        {value}
      </p>
    </div>
  );
}

/**
 * The felt: the card to beat in the middle, your face-down hand to the right.
 * Swipe the table up for higher, down for lower. A new card slides off your hand,
 * flips onto the pile and gets stamped right or wrong.
 */
function Table({ state, lastCall, left, busy, onSwipe }) {
  const handRef = useRef(null);
  const drag = useRef(null);
  const playing = state.phase === PHASES.PLAYING;

  const onPointerDown = (e) => {
    if (!playing || busy) return;
    drag.current = { id: e.pointerId, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (drag.current?.id !== e.pointerId) return;
    const dy = Math.max(-70, Math.min(70, e.clientY - drag.current.y));
    if (handRef.current) handRef.current.style.translate = `0 ${dy}px`;
  };
  const onPointerUp = (e) => {
    if (drag.current?.id !== e.pointerId) return;
    const dy = e.clientY - drag.current.y;
    drag.current = null;
    if (handRef.current) handRef.current.style.translate = "";
    if (dy <= -SWIPE_PX) onSwipe("higher");
    else if (dy >= SWIPE_PX) onSwipe("lower");
  };

  // The card under the new one: the previous card to beat.
  const under = lastCall ? lastCall.base : null;
  const top = state.base;
  const outcome = lastCall ? OUTCOME[lastCall.outcome] : null;

  return (
    <section
      aria-label="Table"
      className="felt relative mt-3 touch-none select-none overflow-hidden rounded-[1.75rem] px-4 pb-5 pt-6 sm:mt-5 sm:rounded-[2.25rem] sm:px-8 sm:py-9"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <p className="sr-only" aria-live="polite">
        {lastCall ? `${cardName(lastCall.card)}. ${outcome.label}.` : top ? `Starting card: ${cardName(top)}.` : ""}
      </p>
      <div className="mx-auto grid max-w-md grid-cols-[1fr_auto] items-center gap-4 sm:gap-8">
        {/* The pile: the card to beat on top. */}
        <div className="relative mx-auto w-[min(46vw,25dvh,13rem)]">
          {/* Positioned by wrappers: the card's own CSS sets position: relative. */}
          {under ? (
            <div className="absolute inset-0 rotate-[-5deg] opacity-90">
              <PlayingCard card={under} />
            </div>
          ) : null}
          {top ? (
            <div key={state.calls.length} className={lastCall ? "deal-flip" : "anim-pop"} style={{ "--from-x": "120%" }}>
              <div className="flip-inner">
                <PlayingCard card={top} className="flip-front" />
                <PlayingCard faceDown className="flip-back" />
              </div>
            </div>
          ) : (
            <PlayingCard faceDown />
          )}
          {outcome ? (
            <span key={`stamp-${state.calls.length}`} className={`stamp stamp-${outcome.tone}`} aria-hidden="true">
              {outcome.mark}
            </span>
          ) : null}
        </div>

        {/* Your hand: what's left to call, face down. Drags with your swipe. */}
        <div className="flex flex-col items-center gap-2">
          <div ref={handRef} className="hand-stack relative w-[min(20vw,11dvh,6rem)] transition-[translate] duration-150" aria-hidden="true">
            {Array.from({ length: Math.min(4, Math.max(left, 0)) }, (_, i) =>
              i === 0 ? (
                <PlayingCard key={i} faceDown />
              ) : (
                <div key={i} className="absolute inset-0" style={{ translate: `${i * 2.5}px ${-i * 2.5}px` }}>
                  <PlayingCard faceDown />
                </div>
              ),
            )}
            {left <= 0 ? <div className="aspect-[5/7] rounded-[10%] border-2 border-dashed border-white/50" /> : null}
          </div>
          <p className="text-xs font-bold tabular-nums text-[color:var(--felt-ink)]">{Math.max(left, 0)} left</p>
        </div>
      </div>
      {playing ? (
        <p className="mt-4 text-center text-xs font-semibold text-[color:var(--felt-ink)] opacity-80">Swipe up for higher · down for lower</p>
      ) : null}
    </section>
  );
}

function Controls({ state, busy, onGuess }) {
  const odds = state.settings.showOdds ? selectOdds(state) : null;
  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="btn hilo-btn hilo-higher h-16 text-lg sm:h-20 sm:text-xl" onClick={() => onGuess("higher")} disabled={busy}>
          <ChevronUpIcon size={26} strokeWidth={3} /> Higher
        </button>
        <button type="button" className="btn hilo-btn hilo-lower h-16 text-lg sm:h-20 sm:text-xl" onClick={() => onGuess("lower")} disabled={busy}>
          <ChevronDownIcon size={26} strokeWidth={3} /> Lower
        </button>
      </div>
      {odds ? (
        <p className="mt-2 text-center text-xs font-semibold text-subtle tabular-nums">
          Still in the deck: {odds.higher} higher · {odds.lower} lower · {odds.same} same
        </p>
      ) : (
        <p className="mt-2 text-center text-xs text-subtle">Aces are low. The same rank doesn’t count.</p>
      )}
    </div>
  );
}

function TurnSummary({ state, team, onNext }) {
  const solo = state.teams.length === 1;
  const kept = state.calls.filter((c) => c.outcome === "won").length;
  const last = state.turnIndex + 1 >= state.teams.length;
  return (
    <section className="card anim-rise mt-4 rounded-[1.75rem] p-4 text-center sm:p-6" aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: solo ? undefined : teamText(team.color) }}>
        {solo ? "Hand over" : `${team.name}’s turn`}
      </p>
      <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">
        {solo ? "You" : team.name} kept {kept} of {state.settings.handSize}
      </h2>
      {state.bestStreak > 1 ? <p className="mt-1 text-sm text-muted">Longest streak so far: {state.bestStreak}</p> : null}
      <button type="button" autoFocus className="btn btn-primary mt-5 h-14 w-full text-lg" onClick={onNext}>
        {last ? (
          <>
            <TrophyIcon size={20} /> {solo ? "See result" : "Final standings"}
          </>
        ) : (
          <>
            Next: {state.teams[state.turnIndex + 1].name} <ArrowRightIcon size={20} />
          </>
        )}
      </button>
    </section>
  );
}

/** This turn's calls as tiny cards: kept ones lifted, missed ones faded. */
function CallStrip({ calls, hand }) {
  return (
    <ol className="mt-4 flex flex-wrap justify-center gap-1.5" aria-label="This turn">
      {Array.from({ length: hand }, (_, i) => {
        const call = calls[i];
        if (!call) return <li key={i} className="aspect-[5/7] w-7 rounded-md border-2 border-dashed border-line-strong sm:w-9" />;
        const tone = OUTCOME[call.outcome].tone;
        return (
          <li key={i} className={`call-chip call-${tone} w-7 sm:w-9`} title={`${call.guess} → ${cardName(call.card)}`}>
            <PlayingCard card={call.card} />
            <span className="call-mark">{OUTCOME[call.outcome].mark}</span>
          </li>
        );
      })}
    </ol>
  );
}
