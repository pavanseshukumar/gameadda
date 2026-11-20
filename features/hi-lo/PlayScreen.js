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
import { ACTIONS, PHASES, cardName, oddsFor, selectActivePlayer, selectHand } from "@/lib/games/hi-lo/engine";
import { PlayingCard } from "./PlayingCard";

/** How long a reveal shows (deal, flip, stamp) before the next call; a card won then becomes the top card. */
const REVEAL_MS = 1000;
/** Vertical drag (px) on the table that counts as a swipe. */
const SWIPE_PX = 48;

const OUTCOME = {
  won: { mark: "✓", label: "You win it! Keep going", tone: "hit" },
  lost: { mark: "✗", label: "Wrong way. Run over", tone: "miss" },
  same: { mark: "=", label: "Same rank. Run over", tone: "same" },
};

/** @param {{ state: any, dispatch: Function }} props */
export function PlayScreen({ state, dispatch }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyTimer = useRef(null);
  const player = selectActivePlayer(state);
  const hand = selectHand(state);
  const solo = state.teams.length === 1;
  const playing = state.phase === PHASES.PLAYING;

  useEffect(() => () => clearTimeout(busyTimer.current), []);

  const select = (card) => {
    if (!playing || busy) return;
    dispatch({ type: ACTIONS.SELECT, card });
  };
  const guess = (dir) => {
    if (!playing || busy || !state.selected) return;
    dispatch({ type: ACTIONS.GUESS, guess: dir });
    setBusy(true);
    clearTimeout(busyTimer.current);
    busyTimer.current = setTimeout(() => setBusy(false), REVEAL_MS);
  };

  // Keys: 1–4 pick a card, ↑ / H higher, ↓ / L lower.
  const onKeyDown = useEffectEvent((e) => {
    if (confirmEnd || !playing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[1-9]$/.test(e.key) && Number(e.key) <= hand.length) select(hand[Number(e.key) - 1]);
    else if (e.key === "ArrowUp" || e.key.toLowerCase() === "h") {
      e.preventDefault();
      guess("higher");
    } else if (e.key === "ArrowDown" || e.key.toLowerCase() === "l") {
      e.preventDefault();
      guess("lower");
    }
  });
  useEffect(() => {
    const handler = (e) => onKeyDown(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toast = state.lastEvent?.reshuffled
    ? { id: state.lastEvent.seq, tone: "info", title: "Fresh deck", detail: "The deck ran out, so a new one was shuffled in" }
    : null;

  return (
    <GameShell
      wide
      teamColor={player.color}
      right={
        <>
          {playing || state.phase === PHASES.TURN_OVER ? (
            <span className="chip mr-0.5 whitespace-nowrap px-3 py-1.5 text-sm font-semibold tabular-nums">
              {hand.length} {hand.length === 1 ? "card" : "cards"} left
            </span>
          ) : null}
          <EndGameButton onClick={() => setConfirmEnd(true)} />
        </>
      }
    >
      <FeedbackToast message={toast} />
      {solo ? null : <Scoreboard teams={state.teams} activeTeamId={player.id} />}

      {state.phase === PHASES.READY ? (
        <ReadyCard team={player} eyebrow={`Player ${state.turnIndex + 1} of ${state.teams.length}`} seconds={0} onStart={() => dispatch({ type: ACTIONS.START_TURN })}>
          <div className="mx-auto mt-5 flex w-fit -space-x-7" aria-hidden="true">
            {hand.map((_, i) => (
              <div key={i} className="w-14" style={{ rotate: `${(i - (hand.length - 1) / 2) * 9}deg`, translate: `0 ${Math.abs(i - (hand.length - 1) / 2) * 4}px` }}>
                <PlayingCard faceDown />
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">Pass the phone to {player.name}. Your {hand.length} cards are waiting, no peeking!</p>
        </ReadyCard>
      ) : (
        <>
          <div className={solo ? "" : "mt-3 sm:mt-5"}>
            {solo ? (
              <SoloStats state={state} />
            ) : (
              <TurnIndicator team={player} hint={playing ? "Play a card, then keep calling until you miss" : "Turn over"} />
            )}
          </div>

          <div className="lg:mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] lg:items-start lg:gap-8">
            <Table state={state} busy={busy} onSwipe={guess} />
            <div>
              {playing ? (
                <>
                  <Controls state={state} busy={busy} onGuess={guess} />
                  <Hand cards={hand} selected={state.inRun ? null : state.selected} locked={state.inRun} busy={busy} onSelect={select} />
                </>
              ) : (
                <TurnSummary state={state} player={player} onNext={() => dispatch({ type: ACTIONS.NEXT_TURN })} />
              )}
              <CallStrip calls={state.calls} />
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmEnd}
        title="End the game?"
        body={solo ? "This hand won’t count toward your best." : "We’ll skip to the final standings with the cards won so far."}
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
      <Stat label="Won" value={state.teams[0].score} accent />
      <Stat label="Streak" value={state.streak} />
      <Stat label="Best" value={best == null ? "—" : best} />
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
 * The felt: the card you played on the left, the deck on the right. When you call,
 * the top card slides off the deck, flips face up next to yours and is stamped.
 * Swipe the table up for higher, down for lower.
 */
function Table({ state, busy, onSwipe }) {
  const drag = useRef(null);
  const yourRef = useRef(null);
  const playing = state.phase === PHASES.PLAYING;
  const lastCall = state.calls.at(-1) ?? null;
  // The last call's result shows while it's being revealed, and after a miss until
  // the next card is picked. After a right call the card won then moves over as the top card.
  const showingResult = Boolean(lastCall && (busy || !state.selected));
  const yours = showingResult ? lastCall.played : state.selected;
  const outcome = showingResult ? OUTCOME[lastCall.outcome] : null;

  const onPointerDown = (e) => {
    if (!playing || busy || !state.selected) return;
    drag.current = { id: e.pointerId, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (drag.current?.id !== e.pointerId) return;
    const dy = Math.max(-60, Math.min(60, e.clientY - drag.current.y));
    if (yourRef.current) yourRef.current.style.translate = `0 ${dy}px`;
  };
  const onPointerUp = (e) => {
    if (drag.current?.id !== e.pointerId) return;
    const dy = e.clientY - drag.current.y;
    drag.current = null;
    if (yourRef.current) yourRef.current.style.translate = "";
    if (dy <= -SWIPE_PX) onSwipe("higher");
    else if (dy >= SWIPE_PX) onSwipe("lower");
  };

  return (
    <section
      aria-label="Table"
      className="felt relative mt-3 touch-none select-none rounded-[1.75rem] px-4 pb-4 pt-5 sm:mt-5 sm:rounded-[2.25rem] sm:px-8 sm:py-8 lg:mt-0"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <p className="sr-only" aria-live="polite">
        {showingResult
          ? `You played ${cardName(lastCall.played)} and called ${lastCall.guess}. It was the ${cardName(lastCall.card)}. ${outcome.label}`
          : state.selected
            ? `${cardName(state.selected)} on the table. Higher or lower?`
            : ""}
      </p>
      <div className="mx-auto grid max-w-md grid-cols-2 items-end gap-4 sm:gap-8">
        {/* Your card. */}
        <div className="flex flex-col items-center gap-2">
          <p className="felt-label">{state.inRun || showingResult ? "Top card" : "Your card"}</p>
          <div ref={yourRef} className="relative w-full max-w-[min(38vw,22dvh,11rem)] transition-[translate] duration-150">
            {yours ? (
              <div key={yours} className="anim-pop">
                <PlayingCard card={yours} />
              </div>
            ) : (
              <div className="felt-slot grid aspect-[5/7] place-items-center rounded-[9%/6.4%] p-3 text-center text-xs font-semibold">Pick a card from your hand</div>
            )}
          </div>
        </div>

        {/* The deck, and the card it turned up. */}
        <div className="flex flex-col items-center gap-2">
          <p className="felt-label">{showingResult ? "It was…" : "Next card"}</p>
          <div className="relative w-full max-w-[min(38vw,22dvh,11rem)]">
            <div className={showingResult ? "opacity-0" : ""}>
              <DeckPile />
            </div>
            {showingResult ? (
              <>
                {/* Positioned by a wrapper: .deal-flip sets position: relative. */}
                <div className="absolute inset-0">
                  <div key={state.calls.length} className="deal-flip" style={{ "--from-x": "0%" }}>
                    <div className="flip-inner">
                      <PlayingCard card={lastCall.card} className="flip-front" />
                      <PlayingCard faceDown className="flip-back" />
                    </div>
                  </div>
                </div>
                <span key={`stamp-${state.calls.length}`} className={`stamp stamp-${outcome.tone}`} aria-hidden="true">
                  {outcome.mark}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <p className="felt-label mt-3 text-center opacity-80">
        {showingResult
          ? `${lastCall.guess === "higher" ? "Higher" : "Lower"} · ${outcome.label}`
          : state.selected
            ? state.inRun
              ? "The card you won is on top · swipe to call"
              : "Swipe up for higher · down for lower"
            : " "}
      </p>
    </section>
  );
}

/** A face-down deck: a few offset backs. */
function DeckPile() {
  return (
    <div className="relative">
      <PlayingCard faceDown />
      {[1, 2].map((i) => (
        <div key={i} className="absolute inset-0" style={{ translate: `${i * 2.5}px ${-i * 2.5}px` }}>
          <PlayingCard faceDown />
        </div>
      ))}
    </div>
  );
}

function Controls({ state, busy, onGuess }) {
  const ready = !!state.selected && !busy;
  const odds = state.settings.showOdds && state.selected ? oddsFor(state, state.selected) : null;
  return (
    <div className="mt-4 lg:mt-0">
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="btn hilo-btn hilo-higher h-14 text-lg sm:h-16 sm:text-xl" onClick={() => onGuess("higher")} disabled={!ready}>
          <ChevronUpIcon size={26} strokeWidth={3} /> Higher
        </button>
        <button type="button" className="btn hilo-btn hilo-lower h-14 text-lg sm:h-16 sm:text-xl" onClick={() => onGuess("lower")} disabled={!ready}>
          <ChevronDownIcon size={26} strokeWidth={3} /> Lower
        </button>
      </div>
      <p className="mt-2 min-h-4 text-center text-xs font-semibold text-subtle tabular-nums">
        {state.inRun && state.streak > 0 ? <span className="run-badge mr-1.5">Run of {state.streak}</span> : null}
        {!state.selected
          ? "Tap a card in your hand to play it"
          : odds
            ? `Left in the deck: ${odds.higher} higher · ${odds.lower} lower · ${odds.same} same`
            : state.inRun
              ? "Keep going until you miss"
              : "Aces are low. The same rank doesn’t count."}
      </p>
    </div>
  );
}

/** Your hand, face up: tap a card to play it (tap again to take it back). Locked mid-run. */
function Hand({ cards, selected, locked, busy, onSelect }) {
  return (
    <section aria-label="Your hand" className={`mt-4 transition-opacity ${locked ? "opacity-50" : ""}`}>
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-subtle">
        Your hand{locked ? " · waiting until you miss" : ""}
      </p>
      <ul className="flex justify-center gap-2 sm:gap-3">
        {cards.map((card, i) => {
          const picked = card === selected;
          return (
            <li key={card} className="w-[min(22vw,6.5rem)]">
              <button
                type="button"
                className={`hand-card block w-full ${picked ? "is-picked" : ""}`}
                onClick={() => onSelect(card)}
                disabled={busy || locked}
                aria-pressed={picked}
                aria-label={`${cardName(card)}${picked ? ", on the table" : ""}`}
              >
                <PlayingCard card={card} />
                <span className="hand-key" aria-hidden="true">
                  {i + 1}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function TurnSummary({ state, player, onNext }) {
  const solo = state.teams.length === 1;
  const won = state.calls.filter((c) => c.outcome === "won").length;
  const last = state.turnIndex + 1 >= state.teams.length;
  return (
    <section className="card anim-rise mt-4 rounded-[1.75rem] p-4 text-center sm:p-6 lg:mt-0" aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: solo ? undefined : teamText(player.color) }}>
        {solo ? "Hand played" : `${player.name}’s turn`}
      </p>
      <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">
        {solo ? "You" : player.name} won {won} {won === 1 ? "card" : "cards"}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {state.calls.length} {state.calls.length === 1 ? "call" : "calls"}
        {state.bestStreak > 1 ? ` · longest run ${state.bestStreak}` : ""}
      </p>
      <button type="button" autoFocus className="btn btn-primary mt-5 h-14 w-full text-lg" onClick={onNext}>
        {last ? (
          <>
            <TrophyIcon size={20} /> {solo ? "See result" : "Final standings"}
          </>
        ) : (
          <>
            Pass to {state.teams[state.turnIndex + 1].name} <ArrowRightIcon size={20} />
          </>
        )}
      </button>
    </section>
  );
}

/** This turn's plays: the card you played, and what turned up (marked right or wrong). */
function CallStrip({ calls }) {
  if (!calls.length) return null;
  return (
    <ol className="mt-4 flex flex-wrap justify-center gap-3" aria-label="This turn">
      {calls.map((call, i) => {
        const tone = OUTCOME[call.outcome].tone;
        return (
          <li key={i} className="flex items-center gap-1" title={`${cardName(call.played)}, ${call.guess} → ${cardName(call.card)}`}>
            <div className="w-7 opacity-70 sm:w-8">
              <PlayingCard card={call.played} />
            </div>
            {call.guess === "higher" ? <ChevronUpIcon size={14} strokeWidth={3} className="text-subtle" /> : <ChevronDownIcon size={14} strokeWidth={3} className="text-subtle" />}
            <div className={`call-chip call-${tone} w-7 sm:w-8`}>
              <PlayingCard card={call.card} />
              <span className="call-mark">{OUTCOME[call.outcome].mark}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
