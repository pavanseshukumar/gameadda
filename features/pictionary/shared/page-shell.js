import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/games/pictionary/utils";

/** Centered page column with safe-area padding. */
export function PageShell({ children, className, wide }) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full flex-1 flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6",
        wide ? "max-w-6xl" : "max-w-2xl",
        className,
      )}
    >
      {children}
    </main>
  );
}

/** Back link + title row for secondary screens. */
export function PageHeader({ title, eyebrow, backHref = "/games/pictionary", backLabel = "Home", action }) {
  return (
    <header className="mb-6 pt-2">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={backHref}
          className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 font-semibold text-ink-soft transition hover:text-ink"
        >
          <ChevronLeft className="size-5" />
          {backLabel}
        </Link>
        {action}
      </div>
      {eyebrow && <p className="mt-4 font-display text-sm font-bold tracking-[0.14em] text-coral uppercase">{eyebrow}</p>}
      <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
    </header>
  );
}

export function SectionTitle({ step, children, aside }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <h2 className="flex items-center gap-3 font-display text-2xl font-extrabold tracking-tight">
        {step && (
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-ink text-base text-sun">
            {step}
          </span>
        )}
        {children}
      </h2>
      {aside}
    </div>
  );
}
