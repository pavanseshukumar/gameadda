import { ArrowRightIcon } from "@/components/ui/icons";

/**
 * "Pass the device" card shown before a timed turn starts (or while paused).
 *
 * @param {{
 *   team: { name: string, color: string },
 *   paused?: boolean,
 *   seconds: number,
 *   detail?: React.ReactNode,
 *   label?: string,               eyebrow text instead of "Your turn" (e.g. "Steal chance")
 *   onStart: () => void,
 * }} props
 */
export function TurnHandoff({ team, paused = false, seconds, detail, label, onStart }) {
  return (
    <div
      className="sheet-panel anim-pop w-full max-w-sm rounded-[1.75rem] p-6 text-center sm:p-8"
      style={{ boxShadow: `0 0 0 1px ${team.color}, 0 30px 70px -30px ${team.color}` }}
      role="dialog"
      aria-labelledby="handoff-title"
    >
      <span
        className="anim-pulse mx-auto grid size-14 place-items-center rounded-full font-display text-2xl font-extrabold text-white"
        style={{ background: team.color }}
      >
        {team.name.replace(/^team\s+/i, "").charAt(0).toUpperCase()}
      </span>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: team.color }}>
        {paused ? "Paused" : (label ?? "Your turn")}
      </p>
      <h2 id="handoff-title" className="mt-1 font-display text-3xl font-bold tracking-tight">
        {team.name}
      </h2>
      {detail ? <div className="mt-2 text-sm text-muted">{detail}</div> : null}
      <button type="button" autoFocus onClick={onStart} className="btn btn-primary mt-6 h-14 w-full text-base">
        {paused ? `Resume · ${seconds}s left` : `Start · ${seconds}s`} <ArrowRightIcon size={18} />
      </button>
    </div>
  );
}
