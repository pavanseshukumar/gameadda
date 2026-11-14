import { cn } from "@/lib/games/pictionary/utils";
import { PALETTE } from "@/lib/games/pictionary/data/palette";

/** Pencil-squiggle mark: an original logo, not derived from any game brand. */
export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-10", className)} aria-hidden>
      <rect x="2" y="2" width="60" height="60" rx="18" fill={PALETTE.ink} />
      <path
        d="M14 42c6-14 11-20 15-17 4 3-6 13-1 15 5 2 9-14 14-12 4 1-1 9 3 10"
        fill="none"
        stroke={PALETTE.sun}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g transform="rotate(40 47 18)">
        <rect x="41" y="9" width="10" height="20" rx="2" fill={PALETTE.coral} />
        <path d="M41 29h10l-5 8z" fill="#f6d5a8" />
        <path d="M44.5 34.5h3l-1.5 2.5z" fill={PALETTE.ink} />
      </g>
    </svg>
  );
}

export function Logo({ className, size = "md" }) {
  const big = size === "lg";
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark className={big ? "size-16 sm:size-20" : "size-10"} />
      <span className="font-display leading-[0.85] font-extrabold tracking-tight">
        <span className={cn("block", big ? "text-4xl sm:text-5xl" : "text-xl")}>Pictionary</span>
        <span className={cn("block text-coral", big ? "text-4xl sm:text-5xl" : "text-xl")}>Party</span>
      </span>
    </span>
  );
}
