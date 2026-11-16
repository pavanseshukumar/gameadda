import { teamInk, teamText } from "@/lib/games/core/teams";
import { ArrowRightIcon } from "@/components/ui/icons";

/**
 * Before a timed turn (or while it's paused): one card, centred in the free space,
 * that says who's up, previews the puzzle without giving it away, and starts the clock.
 * Replaces the board while shown, so the puzzle stays hidden and nothing is nested.
 *
 * @param {{
 *   team: { name: string, color: string },
 *   solo?: boolean,               one player: "Ready?" instead of repeating their name
 *   eyebrow: string,              e.g. "Round 2" or "Steal chance"
 *   paused?: boolean,
 *   pausedNote?: string,          shown instead of the preview while paused
 *   seconds: number,              0 = untimed: the button just says "Start"
 *   onStart: () => void,
 *   children?: React.ReactNode,   the game's preview and details
 *   bare?: boolean,               render just the content, for a card that already exists
 *                                 (e.g. Hot & Cold, where the public board stays on screen)
 * }} props
 */
export function ReadyCard({ team, solo = false, eyebrow, paused = false, pausedNote, seconds, onStart, children, bare = false }) {
  const content = (
      <section
        aria-labelledby="ready-title"
        className={bare ? "anim-rise text-center" : "card anim-pop w-full max-w-sm rounded-[2rem] px-5 pb-5 pt-6 text-center sm:px-8 sm:pb-8 sm:pt-8"}
      >
        <span
          className="clay-color mx-auto grid size-16 place-items-center rounded-full font-display text-2xl font-extrabold"
          style={{ background: team.color, color: teamInk(team.color), "--tint": team.color }}
          aria-hidden="true"
        >
          {team.name.replace(/^team\s+/i, "").charAt(0).toUpperCase()}
        </span>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: teamText(team.color) }}>
          {paused ? "Paused" : eyebrow}
        </p>
        <h2 id="ready-title" className="mt-1 font-display text-[1.75rem] font-bold leading-tight tracking-tight">
          {solo ? (paused ? "Take a breather" : "Ready?") : team.name}
        </h2>

        {paused ? <p className="mt-2 text-sm text-muted">{pausedNote}</p> : children}

        <button type="button" autoFocus onClick={onStart} className="btn btn-primary mt-6 h-14 w-full text-base">
          {paused ? `Resume · ${seconds}s left` : seconds ? `Start · ${seconds}s` : "Start"} <ArrowRightIcon size={18} />
        </button>
      </section>
  );
  return bare ? content : <div className="grid flex-1 place-items-center py-4 sm:py-10">{content}</div>;
}

/** Solo games: the score, shown where the "Now playing" row would be. */
export function SoloScore({ score }) {
  return (
    <p className="min-w-0">
      <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-subtle sm:text-xs">Score</span>
      <span key={score} className="anim-pop block font-display text-3xl font-bold tabular-nums leading-none sm:text-4xl">
        {score}
      </span>
    </p>
  );
}

/**
 * The shape of a hidden answer: one group of blanks per word, nothing given away.
 * "tile" draws pressed-in clay slots; "line" draws chalk-style underlines.
 *
 * @param {{ lengths: number[], variant?: "tile" | "line" }} props
 */
export function WordShape({ lengths, variant = "tile" }) {
  return (
    <div className="mx-auto mt-5 flex max-w-full flex-wrap justify-center gap-x-3 gap-y-2" aria-hidden="true">
      {lengths.map((length, w) => (
        <span key={w} className={`flex max-w-full flex-wrap justify-center ${variant === "line" ? "gap-1.5" : "gap-1"}`}>
          {Array.from({ length }, (_, i) =>
            variant === "line" ? (
              <span key={i} className="h-6 w-4 border-b-[3px] border-[color-mix(in_oklab,var(--team)_70%,transparent)]" />
            ) : (
              <span key={i} className="clay-well h-7 w-5 rounded-md bg-[var(--tile-hidden)]" />
            ),
          )}
        </span>
      ))}
    </div>
  );
}
