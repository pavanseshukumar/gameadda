"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Scoreboard } from "@/components/game/Scoreboard";
import { SoloScore } from "@/components/game/ReadyCard";
import { GameShell } from "@/components/game/GameShell";
import { Confetti } from "@/components/game/Confetti";
import { EndGameButton } from "@/components/game/EndGameButton";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ArrowRightIcon, TrophyIcon } from "@/components/ui/icons";
import { teamInk, teamText } from "@/lib/games/core/teams";
import {
  ACTIONS,
  PHASES,
  POT,
  colorById,
  payoutFor,
  selectCallers,
  selectPicker,
  selectColors,
  selectSpinner,
} from "@/lib/games/spin-pick/engine";
import { Spinner } from "./Spinner";

const SOUND_KEY = "gameadda:spin-pick:sound";

function readSound() {
  try {
    return window.localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

const initial = (team) => team.name.replace(/^team\s+/i, "").charAt(0).toUpperCase();

/** A tiny team avatar, for "who called this colour". */
function Avatar({ team, size = "size-6 text-[0.7rem]" }) {
  return (
    <span
      title={team.name}
      className={`grid shrink-0 place-items-center rounded-full border-2 border-white font-display font-bold shadow-sm ${size}`}
      style={{ background: team.color, color: teamInk(team.color) }}
    >
      {initial(team)}
    </span>
  );
}

/** @param {{ state: any, dispatch: Function }} props */
export function PlayScreen({ state, dispatch }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [sound, setSound] = useState(readSound);
  const solo = state.teams.length === 1;
  const colors = selectColors(state);
  const colorIds = colors.map((c) => c.id);
  const picker = selectPicker(state);
  const spinnerTeam = selectSpinner(state);
  const active = state.phase === PHASES.PICKING && picker ? picker : spinnerTeam;
  const callers = selectCallers(state);
  const result = state.result;
  const resultColor = result ? colorById(result.colorId) : null;
  const lastRound = state.round >= state.settings.rounds;
  const myCall = solo ? state.picks[0]?.colorId : null;

  const toggleSound = () => {
    setSound((on) => {
      try {
        window.localStorage.setItem(SOUND_KEY, on ? "off" : "on");
      } catch {
        // Not saved; still toggles for now.
      }
      return !on;
    });
  };

  const pick = (colorId) => dispatch({ type: ACTIONS.PICK, colorId });
  const spin = () => dispatch({ type: ACTIONS.SPIN, random: Math.random() });
  const next = () => dispatch({ type: ACTIONS.NEXT_ROUND });
  const undo = () => dispatch({ type: ACTIONS.UNDO_PICK });

  // Keys: 1–6 call a colour, Space/Enter spins, Enter moves on after a result.
  const onKeyDown = useEffectEvent((e) => {
    if (confirmEnd || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]")) return;
    const onButton = e.target instanceof HTMLButtonElement;
    if (state.phase === PHASES.PICKING && /^[1-9]$/.test(e.key) && Number(e.key) <= colorIds.length) pick(colorIds[Number(e.key) - 1]);
    else if (state.phase === PHASES.READY && (e.key === " " || e.key === "Enter") && !onButton) {
      e.preventDefault();
      spin();
    } else if (state.phase === PHASES.RESULT && e.key === "Enter" && !onButton) next();
  });
  useEffect(() => {
    const handler = (e) => onKeyDown(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const targetIndex = state.target ? colorIds.indexOf(state.target) : null;
  const restIndex = result ? colorIds.indexOf(result.colorId) : null;

  return (
    <GameShell
      wide
      teamColor={active.color}
      right={
        <>
          <span className="chip mr-0.5 whitespace-nowrap px-3 py-1.5 text-sm font-semibold tabular-nums">
            <span className="hidden min-[360px]:inline">Round </span>
            {state.round}/{state.settings.rounds}
          </span>
          <button
            type="button"
            className="btn btn-ghost h-10 px-2 text-sm sm:px-3"
            onClick={toggleSound}
            aria-pressed={sound}
            aria-label={sound ? "Mute spinner sounds" : "Turn spinner sounds on"}
          >
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <EndGameButton onClick={() => setConfirmEnd(true)} />
        </>
      }
    >
      {result && result.winners.length && state.phase === PHASES.RESULT ? <Confetti key={state.round} /> : null}

      {solo ? null : <Scoreboard teams={state.teams} activeTeamId={state.phase === PHASES.RESULT ? null : active.id} roundPoints={state.phase === PHASES.RESULT ? Object.fromEntries(result.winners.map((id) => [id, result.points])) : {}} />}

      <div className="relative mt-2 grid flex-1 items-center gap-3 sm:mt-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,27rem)] lg:gap-10">
        {/* The spinner, with the last few landings under it. */}
        <div className="min-w-0">
          {solo ? (
            <div className="mb-1 flex items-end justify-between px-1">
              <SoloScore score={state.teams[0].score} />
              <p className="text-right text-xs font-semibold text-subtle">
                {state.history.length ? `${state.teams[0].score / POT} of ${state.history.length} landed` : "Fidget with it while you decide"}
              </p>
            </div>
          ) : null}
          <div className="mx-auto w-[min(82vw,40dvh,30rem)] pb-7 pt-4 sm:pt-6 lg:w-[min(100%,62dvh,34rem)]">
            <Spinner
              colors={colors}
              grabbable={state.phase === PHASES.PICKING || state.phase === PHASES.READY}
              canFlick={state.phase === PHASES.READY}
              onFlick={spin}
              spinning={state.phase === PHASES.SPINNING}
              targetIndex={targetIndex}
              onLand={() => dispatch({ type: ACTIONS.LAND })}
              restIndex={restIndex}
              sound={sound}
            />
          </div>
          <History history={state.history} />
        </div>

        <section aria-live="polite" className="card anim-rise relative rounded-[1.75rem] p-4 sm:p-6" key={`${state.round}-${state.phase === PHASES.PICKING ? "pick" : state.phase}`}>
          {state.phase === PHASES.PICKING ? (
            <PickPanel state={state} solo={solo} picker={picker} callers={callers} onPick={pick} onUndo={undo} />
          ) : state.phase === PHASES.RESULT ? (
            <ResultPanel state={state} solo={solo} color={resultColor} myCall={myCall} lastRound={lastRound} onNext={next} />
          ) : (
            <SpinPanel state={state} solo={solo} spinnerTeam={spinnerTeam} spinning={state.phase === PHASES.SPINNING} onSpin={spin} onUndo={undo} />
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmEnd}
        title="End the game?"
        body="We’ll skip to the final standings. A spin that hasn’t landed won’t count."
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

/** One row for 3–5 colours; 3 + 3 for six. */
const CHIP_COLUMNS = { 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5", 6: "grid-cols-3" };

/** Whose call it is, and a button per colour. */
function PickPanel({ state, solo, picker, callers, onPick, onUndo }) {
  const colors = selectColors(state);
  const order = state.picks.length;
  const lastPick = state.picks.at(-1);
  const lastTeam = lastPick ? state.teams.find((t) => t.id === lastPick.teamId) : null;
  return (
    <>
      <div className="flex items-center gap-3">
        {solo ? null : <Avatar team={picker} size="size-10 text-base" />}
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] sm:text-xs" style={{ color: solo ? undefined : teamText(picker.color) }}>
            {solo ? `Round ${state.round}` : `Call ${order + 1} of ${state.teams.length}`}
          </p>
          <h2 className="truncate font-display text-2xl font-bold leading-tight tracking-tight">{solo ? "Call a colour" : `${picker.name}, call it`}</h2>
        </div>
      </div>

      <ul className={`mt-4 grid gap-2.5 sm:gap-3 ${CHIP_COLUMNS[colors.length] ?? "grid-cols-3"}`} aria-label="Colours">
        {colors.map((color, i) => {
          const on = callers[color.id];
          const pays = payoutFor(on.length + 1);
          return (
            <li key={color.id}>
              <button
                type="button"
                className="color-chip group w-full"
                style={{ "--chip": color.hex, "--chip-ink": color.ink }}
                onClick={() => onPick(color.id)}
                aria-label={`${color.label}${on.length ? `, called by ${on.map((t) => t.name).join(", ")}` : ""}${solo ? "" : `, pays ${pays}`}`}
              >
                <span className="color-chip-swatch">
                  <span className="hidden text-[0.65rem] font-bold opacity-70 lg:inline" aria-hidden="true">
                    {i + 1}
                  </span>
                </span>
                <span className="text-sm font-bold">{color.label}</span>
                {solo ? null : (
                  <span className="flex min-h-6 items-center justify-center gap-1">
                    {on.length ? (
                      <span className="flex -space-x-1.5">{on.map((t) => <Avatar key={t.id} team={t} size="size-5 text-[0.6rem]" />)}</span>
                    ) : null}
                    <span className="text-[0.7rem] font-semibold tabular-nums text-subtle">{pays} pts</span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {lastTeam ? (
        <button
          type="button"
          className="mx-auto mt-3 flex min-h-9 items-center rounded-full px-3 text-xs font-semibold text-subtle transition hover:bg-surface-strong hover:text-foreground"
          onClick={onUndo}
        >
          Undo {lastTeam.name}’s call
        </button>
      ) : (
        <p className="mt-3 text-center text-xs text-subtle">{solo ? "Spin the spinner while you decide, it doesn’t count yet." : "Fewer callers on a colour = a bigger share."}</p>
      )}
    </>
  );
}

/** Everyone's called: show the calls and the Spin button. */
function SpinPanel({ state, solo, spinnerTeam, spinning, onSpin, onUndo }) {
  const call = colorById(state.picks[0]?.colorId);
  return (
    <>
      <div className="flex items-center gap-3">
        {solo ? (
          <span className="size-10 shrink-0 rounded-full border-[3px] border-white shadow" style={{ background: call?.hex }} />
        ) : (
          <Avatar team={spinnerTeam} size="size-10 text-base" />
        )}
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-subtle sm:text-xs">
            {spinning ? "Round and round…" : solo ? `You called ${call?.label}` : "Everyone’s called"}
          </p>
          <h2 className="truncate font-display text-2xl font-bold leading-tight tracking-tight">
            {spinning ? "Spinning!" : solo ? "Flick it!" : `${spinnerTeam.name}, flick it!`}
          </h2>
        </div>
      </div>

      {solo ? null : <CallList state={state} />}

      <button type="button" className="btn btn-primary mt-5 h-14 w-full text-lg" onClick={onSpin} disabled={spinning}>
        {spinning ? "Spinning…" : "Spin"} {spinning ? null : <ArrowRightIcon size={20} />}
      </button>
      <p className="mt-2 text-center text-xs text-subtle">
        {spinning ? "Where will it stop?" : "Or grab the spinner and flick it round"}
      </p>
      {spinning ? null : (
        <button
          type="button"
          className="mx-auto mt-1 flex min-h-9 items-center rounded-full px-3 text-xs font-semibold text-subtle transition hover:bg-surface-strong hover:text-foreground"
          onClick={onUndo}
        >
          {solo ? "Change my call" : "Undo the last call"}
        </button>
      )}
    </>
  );
}

/** Who called what, one row per colour that was called. */
function CallList({ state, highlight = null }) {
  const callers = selectCallers(state);
  const called = selectColors(state).filter((c) => callers[c.id].length);
  return (
    <ul className="mt-4 flex flex-col gap-1.5" aria-label="Calls this round">
      {called.map((color) => {
        const won = highlight === color.id;
        return (
          <li
            key={color.id}
            className={`flex items-center gap-2.5 rounded-2xl px-2.5 py-1.5 transition ${won ? "call-won" : highlight ? "opacity-55" : ""}`}
            style={{ "--chip": color.hex }}
          >
            <span className="size-5 shrink-0 rounded-full border-2 border-white shadow-sm" style={{ background: color.hex }} />
            <span className="w-16 shrink-0 text-sm font-bold">{color.label}</span>
            <span className="flex min-w-0 flex-1 flex-wrap gap-1">
              {callers[color.id].map((t) => (
                <span key={t.id} className="inline-flex max-w-full items-center gap-1 truncate text-sm font-semibold" style={{ color: teamText(t.color) }}>
                  <Avatar team={t} size="size-5 text-[0.6rem]" />
                  <span className="truncate">{t.name}</span>
                </span>
              ))}
            </span>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-subtle">{payoutFor(callers[color.id].length)}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Where it stopped, who scored, and on to the next round. */
function ResultPanel({ state, solo, color, myCall, lastRound, onNext }) {
  const { winners, points } = state.result;
  const winnerTeams = state.teams.filter((t) => winners.includes(t.id));
  const hit = winners.length > 0;
  const headline = solo
    ? hit
      ? `You called it! +${points}`
      : `You called ${colorById(myCall)?.label}. So close!`
    : hit
      ? winnerTeams.length === 1
        ? `${winnerTeams[0].name} keeps all ${points}!`
        : `${winnerTeams.length} share the pot: +${points} each`
      : `Nobody called ${color.label}`;

  return (
    <>
      <div className="flex items-center gap-4">
        <span className="result-swatch anim-pop" style={{ "--chip": color.hex }} aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-subtle sm:text-xs">It stopped on</p>
          <h2 className="font-display text-4xl font-extrabold leading-none tracking-tight" style={{ color: `color-mix(in oklab, ${color.hex} 70%, var(--foreground))` }}>
            {color.label}!
          </h2>
        </div>
      </div>
      <p className="mt-4 font-display text-lg font-bold leading-snug">{headline}</p>
      {solo ? null : <CallList state={state} highlight={color.id} />}

      <button type="button" autoFocus className="btn btn-primary mt-5 h-14 w-full text-lg" onClick={onNext}>
        {lastRound ? (
          <>
            <TrophyIcon size={20} /> Final results
          </>
        ) : (
          <>
            Next round <ArrowRightIcon size={20} />
          </>
        )}
      </button>
    </>
  );
}

/** The last landings, newest last: is a colour running hot? */
function History({ history }) {
  if (!history.length) return null;
  const recent = history.slice(-12);
  return (
    <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5" aria-label="Recent spins">
      <span className="mr-1 text-xs font-semibold text-subtle">Last spins</span>
      {recent.map((id, i) => {
        const c = colorById(id);
        const newest = i === recent.length - 1;
        return (
          <span
            key={`${history.length - recent.length + i}`}
            title={c.label}
            className={`rounded-full border-2 border-white shadow-sm ${newest ? "size-5 anim-pop" : "size-3.5"}`}
            style={{ background: c.hex }}
          />
        );
      })}
    </div>
  );
}
