"use client";

import { MinusIcon, PlusIcon } from "@/components/ui/icons";

/**
 * Segmented choice (Solo / Teams, turn timer…), one style for every game.
 * The selected option is inverted with a coloured underline; colours come from the theme.
 *
 * @param {{
 *   value: any,
 *   onChange: (value: any) => void,
 *   options: { value: any, label: React.ReactNode, hint?: string }[],
 *   label?: string,            accessible name, when there's no visible heading
 *   labelledBy?: string,       id of the visible heading
 *   className?: string,
 * }} props
 */
export function Segmented({ value, onChange, options, label, labelledBy, className = "" }) {
  return (
    <div
      role="radiogroup"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      className={`grid auto-cols-fr grid-flow-col gap-2 ${className}`}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className="seg tabular-nums"
          >
            <span className="block leading-tight">{option.label}</span>
            {option.hint ? <span className="block text-xs font-medium opacity-70">{option.hint}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * − value + stepper.
 *
 * @param {{ value: number, min: number, max: number, onChange: (value: number) => void, label: string, unit: string }} props
 */
export function Stepper({ value, min, max, onChange, label, unit }) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button
        type="button"
        className="step-btn size-11"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`Fewer ${unit}`}
      >
        <MinusIcon size={18} strokeWidth={3} />
      </button>
      <output aria-live="polite" className="min-w-10 text-center font-display text-2xl font-extrabold tabular-nums">
        {value}
      </output>
      <button
        type="button"
        className="step-btn size-11"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`More ${unit}`}
      >
        <PlusIcon size={18} strokeWidth={3} />
      </button>
    </div>
  );
}
