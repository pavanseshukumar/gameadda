import { teamInk } from "@/lib/games/core/teams";

/** Round team/player badge in their colour, outlined like Pictionary's team number. */
export function TeamBadge({ color, children, className = "size-9 text-sm" }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border-2 border-edge font-display font-extrabold ${className}`}
      style={{ background: color, color: teamInk(color) }}
    >
      {children}
    </span>
  );
}
