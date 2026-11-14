import { Clapperboard, Lamp, MapPin, PawPrint, Pizza, UserRound, Users, Zap } from "lucide-react";
import { getCategory } from "@/lib/games/pictionary/data/categories";
import { cn } from "@/lib/games/pictionary/utils";

const ICONS = { UserRound, MapPin, PawPrint, Lamp, Zap, Pizza, Clapperboard, Users };

export function CategoryIcon({ category, ...props }) {
  const Icon = ICONS[getCategory(category).icon] ?? Lamp;
  return <Icon aria-hidden {...props} />;
}

const SIZES = {
  sm: "gap-1.5 px-2.5 py-1 text-xs [&_svg]:size-3.5",
  md: "gap-2 px-3.5 py-1.5 text-sm [&_svg]:size-4",
  lg: "gap-2.5 px-5 py-2.5 text-lg [&_svg]:size-5",
};

export function CategoryBadge({ category, size = "md", className }) {
  const c = getCategory(category);
  return (
    <span
      className={cn("inline-flex items-center rounded-full font-display font-bold", SIZES[size], className)}
      style={{ background: c.color, color: c.ink }}
    >
      <CategoryIcon category={category} strokeWidth={2.5} />
      {c.label}
    </span>
  );
}

export function DifficultyPips({ difficulty, className }) {
  const level = { easy: 1, medium: 2, hard: 3 }[difficulty] ?? 1;
  const label = { easy: "Easy", medium: "Medium", hard: "Hard" }[difficulty] ?? "Easy";
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm font-semibold", className)}>
      <span className="flex gap-1" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn("size-2.5 rounded-full border-2 border-current", i <= level ? "bg-current" : "opacity-40")}
          />
        ))}
      </span>
      {label}
    </span>
  );
}
