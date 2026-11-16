"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Scoreboard } from "@/components/game/Scoreboard";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { TurnTimer } from "@/components/game/TurnTimer";
import { FeedbackToast } from "@/components/game/FeedbackToast";
import { GameShell } from "@/components/game/GameShell";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { EndGameButton } from "@/components/game/EndGameButton";

import { Clapperboard, Eye, Flag, Lightbulb } from "lucide-react";
import { isSolo, teamText } from "@/lib/games/core/teams";
import {
  ACTIONS,
  availableClues,
  canRevealClue,
  canRevealLetter,
  currentIndex,
  pointsFor,
  selectActiveTeam,
  selectDoneCount,
  selectList,
  selectTeamAfterReveal,
} from "@/lib/games/fill-the-film/engine";
import { CLUE_LABEL, MovieRow } from "./MovieRow";
import { GuessDialog } from "./GuessDialog";
import { RevealDialog } from "./RevealDialog";
import { feedbackFromEvent } from "./feedback";

export function PlayScreen({ state, dispatch }) {
  const [dialog, setDialog] = useState(null); // "guess" | "give-up" | "end" | null
  const team = selectActiveTeam(state);
  const list = selectList(state, team.id);
  const solo = isSolo(state.teams);
  const reveal = state.reveal;
  const seconds = state.settings.turnSeconds;
  // While a reveal is up, the team is still on the movie it asked about.
  const index = reveal ? reveal.movieIndex : currentIndex(list);
  const entry = list[index] ?? null;
  const done = selectDoneCount(state, team.id);
  const live = !reveal;
  const eventSeq = state.lastEvent?.seq ?? 0;
  const nextClue = entry ? availableClues(entry).find((key) => !entry.clues.includes(key)) : null;

  const act = (type, extra) => dispatch({ type, ...extra });
  const statusOf = (item, i) => (item.solved ? "solved" : item.gaveUp ? "gave-up" : i === currentIndex(list) ? "current" : "upcoming");

  // Laptop: Enter opens the guess box.
  const onKeyDown = useEffectEvent((e) => {
    if (dialog || reveal || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable], button")) return;
    if (e.key !== "Enter") return;
    e.preventDefault();
    setDialog("guess");
  });
  useEffect(() => {
    const handler = (e) => onKeyDown(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <GameShell
      wide
      teamColor={team.color}
      right={
        <>
          <span className="mr-0.5 whitespace-nowrap chip px-3 py-1.5 text-sm font-semibold tabular-nums">
            {done}/{list.length}
            <span className="hidden min-[380px]:inline"> done</span>
          </span>
          <EndGameButton onClick={() => setDialog("end")} />
        </>
      }
    >
      <FeedbackToast message={reveal ? null : feedbackFromEvent(state, state.lastEvent)} />

      <Scoreboard teams={state.teams} activeTeamId={team.id} />

      <div className="mt-3 flex items-center justify-between gap-3 sm:mt-6">
        <TurnIndicator solo={state.teams.length === 1} team={team} hint={solo ? "Work down your list, top to bottom." : "Top to bottom. Guess right and keep going; anything else passes the turn."} />
        {seconds && live ? (
          // Starts with the turn and restarts on every event (new turn, right answer). Held while a confirm box is open.
          <TurnTimer
            key={eventSeq}
            seconds={seconds}
            paused={dialog === "give-up" || dialog === "end"}
            onExpire={() => {
              setDialog(null);
              act(ACTIONS.TIME_UP, { eventSeq });
            }}
          />
        ) : null}
      </div>

      <div className="mt-3 sm:mt-5 lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-6">
        <section aria-label={`${team.name}’s movies`} className="card rounded-[1.5rem] p-1.5 sm:rounded-[2rem] sm:p-3">
          <ol key={team.id} className="anim-rise flex flex-col gap-1">
            {list.map((item, i) => (
              <MovieRow
                key={item.id}
                entry={item}
                number={i + 1}
                status={statusOf(item, i)}
                freshLetter={reveal?.kind === "letter" && reveal.movieIndex === i ? reveal.letterIndex : null}
                freshClue={reveal?.kind === "clue" && reveal.movieIndex === i ? reveal.clue : null}
              />
            ))}
          </ol>
        </section>

        {entry && !reveal ? (
          <section aria-label={`Movie ${index + 1}`} className="sheet-panel sticky bottom-3 z-20 mt-3 rounded-[1.5rem] p-3 sm:p-4 lg:top-6 lg:mt-0 lg:p-5">
            <div className="flex items-end justify-between gap-3 px-1">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em]" style={{ color: teamText(team.color) }}>
                  Now playing
                </p>
                <p className="font-display text-xl font-bold leading-tight">
                  Movie {index + 1} <span className="text-base font-medium text-subtle">of {list.length}</span>
                </p>
              </div>
              <p className="text-right leading-none">
                <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-subtle">Worth</span>
                <span className="font-display text-2xl font-bold tabular-nums text-accent-3">{pointsFor(entry)}</span>
              </p>
            </div>

            <button type="button" className="btn btn-primary mt-3 h-12 w-full text-base lg:h-14" onClick={() => setDialog("guess")}>
              <Clapperboard size={19} /> Guess the movie
            </button>

            <p className="mt-3 px-1 text-xs text-subtle lg:mt-4">{solo ? "Need help?" : "Need help? Each of these ends your turn."}</p>
            <div className="mt-1.5 grid grid-cols-3 gap-2 lg:grid-cols-1">
              <HelpButton
                icon={<Eye size={18} />}
                label="Reveal a letter"
                short="Letter"
                detail={canRevealLetter(entry) ? "next blank" : "last one’s yours"}
                disabled={!canRevealLetter(entry)}
                onClick={() => act(ACTIONS.REVEAL_LETTER)}
              />
              <HelpButton
                icon={<Lightbulb size={18} />}
                label="Get a clue"
                short="Clue"
                detail={nextClue ? CLUE_LABEL[nextClue].toLowerCase() : "none left"}
                disabled={!canRevealClue(entry)}
                onClick={() => act(ACTIONS.REVEAL_CLUE)}
              />
              <HelpButton icon={<Flag size={17} />} label="Give up" short="Give up" detail="0 points" onClick={() => setDialog("give-up")} />
            </div>
          </section>
        ) : null}
      </div>

      <RevealDialog
        reveal={reveal}
        entry={entry}
        team={team}
        nextTeam={selectTeamAfterReveal(state)}
        solo={solo}
        onContinue={() => act(ACTIONS.CONTINUE)}
      />
      <GuessDialog
        open={dialog === "guess"}
        team={team}
        title={`Name movie ${index + 1}`}
        tried={entry?.wrongGuesses ?? []}
        hint={`Right: +${entry ? pointsFor(entry) : 0}, and you go on to the next movie. Wrong${solo ? ": no points." : ": the turn passes."}`}
        onClose={() => setDialog(null)}
        onSubmit={(guess) => {
          setDialog(null);
          act(ACTIONS.GUESS, { guess });
        }}
      />
      <ConfirmDialog
        open={dialog === "give-up"}
        title={`Give up on movie ${index + 1}?`}
        body={`We’ll show the answer and open the next movie. No points for this one${solo ? "" : ", and the turn passes"}.`}
        confirmLabel="Give up"
        tone="danger"
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          setDialog(null);
          act(ACTIONS.GIVE_UP);
        }}
      />
      <ConfirmDialog
        open={dialog === "end"}
        title="End the game?"
        body="We’ll skip to the final standings. Unsolved movies score nothing."
        confirmLabel="End game"
        tone="danger"
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          setDialog(null);
          dispatch({ type: ACTIONS.END_GAME });
        }}
      />
    </GameShell>
  );
}

/**
 * A help action. Phones: icon over a short label, three across.
 * Laptop side panel: a full-width row, label on the left and what it gives on the right.
 */
function HelpButton({ icon, label, short, detail, disabled = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="btn btn-secondary h-14 flex-col gap-0.5 px-1 text-[0.8rem] leading-none lg:h-12 lg:flex-row lg:justify-between lg:gap-3 lg:px-4 lg:text-sm"
    >
      <span className="flex flex-col items-center gap-1 lg:flex-row lg:gap-2.5">
        {icon}
        <span className="lg:hidden">{short}</span>
        <span className="hidden lg:inline">{label}</span>
      </span>
      <span className="hidden text-xs font-medium text-subtle lg:inline">{detail}</span>
    </button>
  );
}
