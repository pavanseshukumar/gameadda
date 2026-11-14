import Link from "next/link";
import { cn } from "@/lib/games/pictionary/utils";

const VARIANTS = {
  ink: { "--btn-bg": "var(--color-ink)", "--btn-fg": "var(--color-cream)" },
  sun: { "--btn-bg": "var(--color-sun)", "--btn-fg": "var(--color-ink)", "--btn-depth": "#a86f00" },
  success: { "--btn-bg": "var(--color-mint)", "--btn-fg": "#fff", "--btn-depth": "var(--color-mint-deep)" },
  danger: { "--btn-bg": "var(--color-coral)", "--btn-fg": "#fff", "--btn-depth": "var(--color-coral-deep)" },
  team: { "--btn-bg": "var(--team)", "--btn-fg": "var(--team-fg)", "--btn-depth": "var(--team-deep)" },
  paper: {
    "--btn-bg": "var(--color-paper)",
    "--btn-fg": "var(--color-ink)",
    "--btn-depth": "var(--color-ink)",
  },
};

const SIZES = {
  sm: "min-h-10 px-4 text-sm rounded-2xl [--btn-lift:3px]",
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-6 text-lg",
  xl: "min-h-16 px-7 text-xl sm:min-h-[4.5rem] sm:text-2xl",
};

function classes({ size = "md", variant = "ink", block, className }) {
  return cn("btn-3d", SIZES[size], variant === "paper" && "border-2 border-ink", block && "w-full", className);
}

export function Button({ variant = "ink", size = "md", block, className, style, type = "button", ...props }) {
  return (
    <button
      type={type}
      className={classes({ size, variant, block, className })}
      style={{ ...VARIANTS[variant], ...style }}
      {...props}
    />
  );
}

export function ButtonLink({ variant = "ink", size = "md", block, className, style, ...props }) {
  return (
    <Link className={classes({ size, variant, block, className })} style={{ ...VARIANTS[variant], ...style }} {...props} />
  );
}

/** Round icon-only button for toolbars. */
export function IconButton({ label, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-paper text-ink transition hover:bg-cream-deep focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sun active:scale-95",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
