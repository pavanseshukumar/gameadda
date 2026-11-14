"use client";

import { MinusIcon, PlusIcon } from "@/components/ui/icons";

/**
 * Segmented choice (Solo / Teams, turn timer…), one style for every game.
 * The selected option is inverted with a coloured underline; colours come from the theme.
 *
 * @param {{
 *   value: any,
 *   onChange: (value: any) => void,
 *   options: { value: any, label: React.ReactNode, hint?: string, disabled?: boolean }[],
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
            disabled={option.disabled}
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

/**
 * Pick any number of options (e.g. word categories). Same look as Segmented.
 *
 * @param {{ values: any[], onChange: (values: any[]) => void, options: { value: any, label: React.ReactNode, color?: string }[], label: string, className?: string }} props
 */
export function MultiSelect({ values, onChange, options, label, className = "" }) {
  const toggle = (value) => onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  return (
    <div role="group" aria-label={label} className={`grid gap-2 ${className}`}>
      {options.map((option) => {
        const selected = values.includes(option.value);
        return (
          <button
            key={String(option.value)}
            type="button"
            role="checkbox"
            aria-checked={selected}
            onClick={() => toggle(option.value)}
            className="seg flex items-center justify-center gap-2"
          >
            {option.color ? <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: option.color }} /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * On/off switch with a label and optional description.
 *
 * @param {{ checked: boolean, onChange: (checked: boolean) => void, label: string, description?: string }} props
 */
export function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block font-display font-bold">{label}</span>
        {description ? <span className="block text-sm text-muted">{description}</span> : null}
      </span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="switch">
        <span className="switch-knob" />
      </button>
    </label>
  );
}
