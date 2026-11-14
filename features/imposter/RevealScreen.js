"use client";

import { TeamBadge } from "@/components/game/TeamBadge";
import { ArrowRightIcon, EyeIcon, MaskIcon } from "@/components/ui/icons";
import { teamText } from "@/lib/games/core/teams";
import { ACTIONS, isImposter, playerMark } from "@/lib/games/imposter/engine";
import { categoryLabel } from "@/lib/games/imposter/words";
import { RoundShell } from "./RoundShell";

/**
 * Pass-the-phone card reveal. Each player in turn sees "pass to X", taps to see
 * their card (word or imposter), then hides it before passing on.
 */
export function RevealScreen({ state, dispatch, onEnd }) {
  const player = state.players[state.revealIndex];
  const next = state.players[state.revealIndex + 1];
  const shown = state.cardShown;
  const imposter = isImposter(state, player.id);

  return (
    <RoundShell state={state} teamColor={player.color} onEnd={onEnd} step="Secret cards">
      <ol className="flex justify-center gap-1.5" aria-label={`Player ${state.revealIndex + 1} of ${state.players.length}`}>
        {state.players.map((p, i) => (
          <li
            key={p.id}
            className="h-2 w-full max-w-10 rounded-full transition-colors duration-300"
            style={{ background: i < state.revealIndex ? "var(--fg-subtle)" : i === state.revealIndex ? p.color : "var(--line-strong)" }}
          />
        ))}
      </ol>

      <div className="grid flex-1 place-items-center py-6">
        {!shown ? (
          <section key={`pass-${player.id}`} className="card anim-pop w-full max-w-sm rounded-[1.75rem] p-6 text-center sm:p-8">
            <TeamBadge color={player.color} className="mx-auto size-16 text-2xl">
              {playerMark(player.name)}
            </TeamBadge>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-subtle">Pass the phone to</p>
            <h1 className="mt-1 break-words font-display text-4xl font-extrabold tracking-tight" style={{ color: teamText(player.color) }}>
              {player.name}
            </h1>
            <p className="mt-3 text-muted">Only {player.name} should look at the screen.</p>
            <button
              type="button"
              autoFocus
              className="btn btn-primary mt-7 h-14 w-full text-base"
              onClick={() => dispatch({ type: ACTIONS.SHOW_CARD })}
            >
              <EyeIcon size={20} /> I’m {player.name}, show me
            </button>
          </section>
        ) : (
          <section
            key={`card-${player.id}`}
            className="card anim-pop w-full max-w-sm rounded-[1.75rem] p-6 text-center sm:p-8"
            style={imposter ? { borderColor: "var(--accent-2)", boxShadow: "0 6px 0 0 var(--accent-2)" } : undefined}
            aria-live="polite"
          >
            {imposter ? (
              <>
                <span className="mx-auto grid size-16 place-items-center rounded-full border-2 border-edge bg-accent-2 text-[var(--accent-2-ink)]">
                  <MaskIcon size={34} strokeWidth={2.2} />
                </span>
                <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-subtle">{player.name}, you are</p>
                <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight text-accent-2">The imposter</h1>
                {state.settings.imposterHint ? (
                  <p className="chip mx-auto mt-4 w-fit px-3 py-1 text-sm">
                    <span className="text-subtle">Category </span>
                    <span className="font-bold">{categoryLabel(state.word.category)}</span>
                  </p>
                ) : null}
                <p className="mt-4 text-muted">Blend in. Listen to the clues and fake yours.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-subtle">{player.name}, the secret word is</p>
                <h1 className="mt-3 break-words font-display text-[clamp(2.4rem,11vw,3.5rem)] font-extrabold leading-none tracking-tight">
                  {state.word.text}
                </h1>
                <p className="chip mx-auto mt-4 w-fit px-3 py-1 text-sm font-semibold">{categoryLabel(state.word.category)}</p>
                <p className="mt-4 text-muted">Remember it. Someone at the table doesn’t know it.</p>
              </>
            )}
            <button
              type="button"
              autoFocus
              className="btn btn-secondary mt-7 h-14 w-full text-base"
              onClick={() => dispatch({ type: ACTIONS.HIDE_CARD })}
            >
              {next ? (
                <>
                  Hide it, pass to {next.name} <ArrowRightIcon size={18} />
                </>
              ) : (
                <>
                  Hide it, start the clues <ArrowRightIcon size={18} />
                </>
              )}
            </button>
          </section>
        )}
      </div>
    </RoundShell>
  );
}
