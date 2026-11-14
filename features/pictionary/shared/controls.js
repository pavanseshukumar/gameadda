"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/games/pictionary/utils";

/** Pill segmented control. `options` is [{ value, label, hint? }]. */
export function Segmented({ value, onChange, options, label, className }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("grid auto-cols-fr grid-flow-col gap-2", className)}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-h-12 min-w-0 rounded-2xl border-2 px-2 py-2 text-center font-display font-bold transition active:scale-[0.97]",
              selected
                ? "border-ink bg-ink text-cream shadow-[0_3px_0_0_var(--color-sun)]"
                : "border-line bg-paper text-ink hover:border-ink",
            )}
          >
            <span className="block leading-tight">{o.label}</span>
            {o.hint && (
              <span className={cn("block text-xs font-medium", selected ? "text-cream/70" : "text-ink-muted")}>
                {o.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description, className }) {
  return (
    <label className={cn("flex cursor-pointer items-center justify-between gap-4 py-2", className)}>
      <span>
        <span className="block font-semibold">{label}</span>
        {description && <span className="block text-sm text-ink-muted">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-8 w-14 shrink-0 rounded-full border-2 border-ink transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sun",
          checked ? "bg-mint" : "bg-cream-deep",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-6 rounded-full border-2 border-ink bg-paper transition-transform duration-200",
            checked && "translate-x-6",
          )}
        />
      </button>
    </label>
  );
}

export function Stepper({ value, onChange, min, max, label, unit }) {
  return (
    <div className="flex items-center gap-3" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`Fewer ${unit}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="inline-flex size-12 items-center justify-center rounded-2xl border-2 border-ink bg-paper transition active:scale-95 disabled:opacity-35"
      >
        <Minus className="size-5" strokeWidth={3} />
      </button>
      <output aria-live="polite" className="min-w-20 text-center font-display text-3xl font-extrabold tabular-nums">
        {value}
        <span className="block text-xs font-semibold text-ink-muted">{unit}</span>
      </output>
      <button
        type="button"
        aria-label={`More ${unit}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="inline-flex size-12 items-center justify-center rounded-2xl border-2 border-ink bg-paper transition active:scale-95 disabled:opacity-35"
      >
        <Plus className="size-5" strokeWidth={3} />
      </button>
    </div>
  );
}
