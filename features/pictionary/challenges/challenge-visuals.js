import { Check, EyeClosed, Hand, PencilLine, Spline } from "lucide-react";
import { getChallenge } from "@/lib/games/pictionary/data/challenges";
import { cn } from "@/lib/games/pictionary/utils";

const ICONS = { PencilLine, Hand, EyeClosed, Spline };

export function ChallengeIcon({ id, ...props }) {
  const Icon = ICONS[getChallenge(id).icon] ?? PencilLine;
  return <Icon aria-hidden {...props} />;
}

/** 1–3 filled pips, labelled for screen readers. */
export function ChaosMeter({ level, className }) {
  const label = ["", "Gentle", "Tricky", "Chaotic"][level] ?? "Gentle";
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase", className)}>
      <span className="flex gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn("h-2.5 w-4 rounded-full border-2 border-current", i <= level ? "bg-current" : "opacity-35")} />
        ))}
      </span>
      {label}
    </span>
  );
}

/** Decorative art per challenge, so each card feels different at a glance. */
function Motif({ motif }) {
  const common = "pointer-events-none absolute inset-0 size-full";
  if (motif === "night") {
    return (
      <svg aria-hidden viewBox="0 0 300 200" className={cn(common, "opacity-60")} preserveAspectRatio="xMidYMid slice">
        {[[30, 30], [80, 160], [140, 20], [250, 40], [270, 150], [200, 175], [20, 110], [110, 90]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 ? 1.6 : 2.6} fill="#FFE9A8" />
        ))}
        <path d="M262 74a22 22 0 1 1-16-38 17 17 0 0 0 16 38z" fill="#FFE9A8" opacity="0.8" />
      </svg>
    );
  }
  if (motif === "line") {
    return (
      <svg aria-hidden viewBox="0 0 300 200" className={cn(common, "opacity-30")} preserveAspectRatio="none">
        <path
          d="M-10 160 C 30 120, 60 190, 90 150 S 120 60, 160 100 S 210 190, 240 130 S 280 30, 320 60"
          fill="none"
          stroke="#fff"
          strokeWidth="5"
          strokeLinecap="round"
          className="challenge-line-draw"
          pathLength="1"
        />
      </svg>
    );
  }
  if (motif === "mirror") {
    return (
      <svg aria-hidden viewBox="0 0 300 200" className={cn(common, "opacity-25")} preserveAspectRatio="none">
        <path d="M40 150 q30 -60 70 -30" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
        <path d="M260 150 q-30 -60 -70 -30" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg aria-hidden viewBox="0 0 300 200" className={cn(common, "opacity-[0.12]")} preserveAspectRatio="none">
      <path d="M20 170 c20 -40 40 -10 55 -35 s25 -30 45 -5 M200 40 l30 -10 l-10 30 l30 -10" fill="none" stroke="#1b2140" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The big reveal card the drawer sees before their word. */
export function ChallengeCard({ id, className }) {
  const c = getChallenge(id);
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border-2 border-ink px-6 pt-7 pb-6 text-center shadow-[0_6px_0_0_var(--color-sun)] animate-card-flip",
        className,
      )}
      style={{ background: c.color, color: c.ink }}
    >
      <Motif motif={c.motif} />
      <span
        className="relative mx-auto flex size-24 items-center justify-center rounded-full border-2 border-ink bg-paper text-6xl shadow-[0_4px_0_0_var(--color-ink)] animate-challenge-bounce"
        aria-hidden
      >
        {c.emoji}
      </span>
      <p className="relative mt-5 text-xs font-bold tracking-[0.2em] uppercase opacity-75">Drawing challenge</p>
      <h2 className="relative mt-1 font-display text-[clamp(2.25rem,11vw,3.25rem)] leading-[0.95] font-extrabold tracking-tight">
        {c.name}
      </h2>
      <p className="relative mx-auto mt-3 max-w-xs text-base leading-snug font-medium opacity-90">{c.instruction}</p>
      <ChaosMeter level={c.difficulty} className="relative mt-5 justify-center opacity-80" />
    </div>
  );
}

/** Compact, glanceable reminder (drawing screen, results, word step). */
export function ChallengeBanner({ id, compact, className }) {
  const c = getChallenge(id);
  return (
    <div
      className={cn("flex items-center gap-3 rounded-2xl border-2 border-ink", compact ? "px-3 py-1.5" : "px-4 py-2.5", className)}
      style={{ background: c.color, color: c.ink }}
    >
      <span className={cn("shrink-0 leading-none", compact ? "text-xl" : "text-3xl")} aria-hidden>
        {c.emoji}
      </span>
      <span className="min-w-0 leading-tight">
        <span className={cn("block font-display font-extrabold tracking-wide uppercase", compact ? "text-sm" : "text-lg")}>
          {c.name}
        </span>
        {!compact && <span className="block truncate text-sm font-medium opacity-90">{c.reminder}</span>}
      </span>
    </div>
  );
}

/**
 * Selectable challenge cards. Single-select (`value` is an id) for the host's
 * per-turn pick; multi-select (`value` is an array) for the Random pool.
 */
export function ChallengePicker({ ids, value, onChange, label }) {
  const multi = Array.isArray(value);
  const isOn = (id) => (multi ? value.includes(id) : value === id);
  const toggle = (id) => {
    if (!multi) return onChange(id);
    if (value.includes(id)) {
      if (value.length > 1) onChange(value.filter((v) => v !== id)); // keep at least one
    } else onChange([...value, id]);
  };

  return (
    <div role={multi ? "group" : "radiogroup"} aria-label={label} className="grid grid-cols-2 gap-2.5">
      {ids.map((id) => {
        const c = getChallenge(id);
        const on = isOn(id);
        return (
          <button
            key={id}
            type="button"
            role={multi ? "checkbox" : "radio"}
            aria-checked={on}
            onClick={() => toggle(id)}
            className={cn(
              "relative flex flex-col items-start gap-1.5 rounded-2xl border-2 p-3 text-left transition active:scale-[0.97]",
              on ? "border-ink shadow-[0_4px_0_0_var(--color-ink)]" : "border-line bg-paper opacity-75 hover:opacity-100",
            )}
            style={on ? { background: c.color, color: c.ink } : undefined}
          >
            <span className="text-3xl leading-none" aria-hidden>
              {c.emoji}
            </span>
            <span className="font-display text-base leading-tight font-extrabold">{c.name}</span>
            <span className="text-xs leading-snug opacity-80">{c.short}</span>
            <ChaosMeter level={c.difficulty} className="mt-0.5 opacity-80" />
            {on && (
              <span className="absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded-full border-2 border-ink bg-paper text-ink">
                <Check className="size-3.5" strokeWidth={4} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
