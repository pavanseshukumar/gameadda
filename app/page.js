import Link from "next/link";
import { GAMES } from "@/lib/games/registry";
import { ArrowRightIcon, SparkleIcon } from "@/components/ui/icons";

const TILT = [-6, 4, -3, 7, -5, 3, -4];

function previewStyle(game, char, i) {
  if (game.preview.style === "pixel") {
    return { background: char, aspectRatio: "1 / 1", borderRadius: "0.2rem", boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.08)" };
  }
  if (game.preview.style === "jumble") {
    return {
      background: "linear-gradient(180deg, var(--key-top), var(--key-bottom))",
      color: "var(--key-fg)",
      boxShadow: "0 3px 0 var(--key-edge)",
      transform: `rotate(${TILT[i % TILT.length]}deg) translateY(${i % 2 ? 3 : -2}px)`,
    };
  }
  return char
    ? { background: "var(--tile-revealed)", color: "var(--tile-revealed-fg)" }
    : { background: "var(--tile-hidden)", boxShadow: `inset 0 -3px 0 ${game.accent[0]}` };
}

export default function Home() {
  return (
    <div className="stage flex min-h-dvh flex-col" style={{ "--team": "#8b5cf6" }}>
      <main className="mx-auto flex w-full min-w-0 max-w-5xl flex-1 flex-col px-4 pb-12 pt-8 sm:px-6 sm:pt-20">
        <p className="font-display text-lg font-bold tracking-tight">GameAdda</p>
        <h1 className="mt-6 max-w-3xl font-display text-[clamp(2.25rem,11vw,5.5rem)] font-extrabold leading-[0.92] tracking-[-0.04em]">
          One screen.
          <br />
          <span className="text-accent-2">Everyone</span> plays.
        </h1>
        <p className="mt-4 max-w-lg text-base text-muted sm:mt-5 sm:text-lg">
          Party games built for the living room. Pass the phone, cast to the TV, or crowd around a laptop.
        </p>

        <ul className="mt-8 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2">
          {GAMES.map((game) => (
            <li key={game.slug} className="min-w-0">
              <Link
                href={game.href}
                className="card group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.75rem] p-5 transition duration-300 hover:-translate-y-1 sm:p-8"
              >
                <span
                  aria-hidden="true"
                  className="absolute -right-16 -top-16 size-56 rounded-full opacity-50 blur-3xl transition duration-500 group-hover:opacity-80"
                  style={{ background: `linear-gradient(135deg, ${game.accent[0]}, ${game.accent[1]})` }}
                />
                <div aria-hidden="true" className="relative grid w-full max-w-[17rem] grid-cols-7 gap-1.5">
                  {game.preview.tiles.map((char, i) => (
                    <span
                      key={i}
                      className="grid aspect-[3/4] min-w-0 place-items-center rounded-lg font-display text-[clamp(0.95rem,4.5vw,1.25rem)] font-bold"
                      style={previewStyle(game, char, i)}
                    >
                      {game.preview.style === "pixel" ? null : char}
                    </span>
                  ))}
                </div>
                <h2 className="relative mt-6 font-display text-2xl font-bold leading-tight tracking-tight sm:mt-8 sm:text-3xl">{game.title}</h2>
                <p className="relative mt-2 text-muted">{game.tagline}</p>
                <div className="relative mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 sm:mt-8">
                  <span className="text-sm text-subtle">
                    {game.players} · {game.duration}
                  </span>
                  <span className="btn btn-primary h-11 px-5 text-sm">
                    Play <ArrowRightIcon size={16} />
                  </span>
                </div>
              </Link>
            </li>
          ))}
          <li className="flex min-h-40 min-w-0 flex-col items-center justify-center gap-3 rounded-[1.75rem] border border-dashed border-line-strong p-6 sm:min-h-56 sm:p-8 text-center text-muted">
            <SparkleIcon size={24} />
            <p className="font-medium">More games are on the way</p>
          </li>
        </ul>
      </main>
    </div>
  );
}
