"use client";

import { Check } from "lucide-react";
import { getCategory } from "@/lib/games/pictionary/data/categories";
import { cn } from "@/lib/games/pictionary/utils";
import { CategoryIcon } from "@/features/pictionary/shared/category-badge";

export function CategoryPicker({ value, onChange, all }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter((c) => c !== id) : [...value, id]);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {all.map((id) => {
        const c = getCategory(id);
        const on = value.includes(id);
        return (
          <button
            key={id}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => toggle(id)}
            className={cn(
              "relative flex min-h-14 items-center gap-2.5 rounded-2xl border-2 px-3 py-2 text-left font-display font-bold transition active:scale-[0.97]",
              on ? "border-ink shadow-[0_3px_0_0_var(--color-ink)]" : "border-line bg-paper text-ink-muted",
            )}
            style={on ? { background: c.color, color: c.ink } : undefined}
          >
            <CategoryIcon category={id} className="size-5 shrink-0" strokeWidth={2.5} />
            <span className="leading-tight">{c.label}</span>
            {on && (
              <span className="absolute -top-2 -right-2 inline-flex size-6 items-center justify-center rounded-full border-2 border-ink bg-paper text-ink">
                <Check className="size-3.5" strokeWidth={4} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
