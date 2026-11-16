import { ExitIcon } from "@/components/ui/icons";

/**
 * The "End game" action in every game's top bar. Always labelled (an icon alone
 * wasn't clear on phones), with an exit (door and arrow) icon and a soft red tint so it reads as "stop".
 * Very narrow phones (< 400px) show just "End" so the bar still fits.
 *
 * @param {{ onClick: () => void, label?: string, shortLabel?: string }} props
 */
export function EndGameButton({ onClick, label = "End game", shortLabel = "End" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn h-9 gap-1.5 rounded-full px-3 text-sm transition hover:bg-miss/10"
      // .btn sets its text colour from --btn-fg, so the red goes there (a text-* class would lose).
      style={{ "--btn-fg": "var(--miss)" }}
      aria-label={label}
    >
      <ExitIcon size={16} />
      <span className="min-[400px]:hidden" aria-hidden="true">
        {shortLabel}
      </span>
      <span className="hidden min-[400px]:inline" aria-hidden="true">
        {label}
      </span>
    </button>
  );
}
