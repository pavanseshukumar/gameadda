import Link from "next/link";
import { ChevronLeftIcon } from "@/components/ui/icons";

/**
 * Shared page frame: themed page, top bar with back link, and content column.
 * Mobile first: a slim bar that respects the notch, and a content column that
 * fills the screen so play screens can dock their input (`.dock`) at the bottom.
 */
export function GameShell({ teamColor, right, children, wide = false }) {
  return (
    <div className="stage flex min-h-dvh flex-col" style={teamColor ? { "--team": teamColor } : undefined}>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-0.5 rounded-full pl-1 pr-3 text-sm font-semibold text-muted transition hover:text-foreground sm:text-base"
        >
          <ChevronLeftIcon size={20} strokeWidth={2.5} />
          <span className="sm:hidden">Games</span>
          <span className="hidden sm:inline">All games</span>
        </Link>
        <div className="flex min-w-0 items-center gap-1">{right}</div>
      </header>
      <main
        className={`mx-auto flex w-full flex-1 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-8 sm:pt-4 lg:pb-5 ${wide ? "max-w-6xl" : "max-w-3xl"}`}
      >
        {children}
      </main>
    </div>
  );
}
