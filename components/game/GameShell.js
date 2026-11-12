import Link from "next/link";
import { ArrowLeftIcon } from "@/components/ui/icons";

/** Shared page frame: ambient stage, top bar with back link, and content column. */
export function GameShell({ teamColor, right, children, wide = false }) {
  return (
    <div className="stage flex min-h-dvh flex-col" style={teamColor ? { "--team": teamColor } : undefined}>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
        <Link href="/" className="btn btn-ghost -ml-2 h-10 px-3 text-sm" aria-label="Back to all games">
          <ArrowLeftIcon size={18} />
          <span className="font-display font-bold tracking-tight text-foreground">GameAdda</span>
        </Link>
        <div className="flex items-center gap-1.5">{right}</div>
      </header>
      <main className={`mx-auto flex w-full flex-1 flex-col px-4 pb-8 pt-4 sm:px-6 lg:pb-5 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
        {children}
      </main>
    </div>
  );
}
