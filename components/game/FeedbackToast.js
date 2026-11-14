/**
 * Brief, self-dismissing feedback pill (CSS animation handles show/hide, so no timers).
 *
 * @param {{ message: { id: number, tone: "hit" | "miss" | "info", title: string, detail?: string } | null }} props
 */
export function FeedbackToast({ message }) {
  const tones = {
    hit: { dot: "var(--hit)", ring: "color-mix(in oklab, var(--hit) 45%, transparent)" },
    miss: { dot: "var(--miss)", ring: "color-mix(in oklab, var(--miss) 45%, transparent)" },
    info: { dot: "var(--accent)", ring: "var(--line-strong)" },
  };

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-40 h-0">
      {message ? (
        <div
          key={message.id}
          className="toast sheet-panel absolute left-1/2 flex w-max max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full py-2.5 pl-3 pr-5"
          style={{ borderColor: tones[message.tone].dot }}
        >
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: tones[message.tone].dot }} />
          <span className="text-sm font-semibold">{message.title}</span>
          {message.detail ? <span className="truncate text-sm text-muted">{message.detail}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
