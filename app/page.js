import Link from "next/link";
import { GAMES } from "@/lib/games/registry";
import { ArrowRightIcon, SparkleIcon } from "@/components/ui/icons";

const TILT = [-6, 4, -3, 7, -5, 3, -4];

/** A made-up poster (warm sky, dark ground) the "scramble" preview cuts into strips. */
const POSTER_ART = "linear-gradient(165deg, #1e1b4b 0%, #7c2d12 30%, #f59e0b 48%, #fde68a 56%, #ea580c 68%, #4c1d95 84%, #0f172a 100%)";

/** Thermometer colours, freezing → burning (matches Hot & Cold's bands). */
function heatColor(degrees) {
  if (degrees >= 100) return "var(--hit)";
  if (degrees >= 70) return "#ef4444";
  if (degrees >= 45) return "#f97316";
  if (degrees >= 25) return "#fbbf24";
  if (degrees >= 10) return "#22d3ee";
  return "#60a5fa";
}

/** Text shown on a preview tile: letters for the word games, nothing for the picture ones. */
function previewText(game, tile) {
  if (game.preview.style === "board") return tile === "★" ? tile : null;
  return game.preview.style === "hidden" || game.preview.style === "jumble" ? tile : null;
}

function previewStyle(game, tile, i) {
  if (game.preview.style === "scramble") {
    // `tile` is which vertical strip of the poster sits in this slot.
    const strips = game.preview.tiles.length;
    return {
      backgroundImage: POSTER_ART,
      backgroundSize: `${strips * 100}% 100%`,
      backgroundPosition: `${(tile / (strips - 1)) * 100}% 0`,
      filter: "blur(1.5px)",
      borderRadius: "0.3rem",
    };
  }
  if (game.preview.style === "thermo") {
    // `tile` is a temperature reading in degrees, drawn as a filled bar.
    const color = heatColor(tile);
    return {
      background: `linear-gradient(to top, ${color} ${Math.max(8, tile)}%, var(--tile-hidden) ${Math.max(8, tile)}%)`,
      boxShadow: `inset 0 0 0 1.5px color-mix(in oklab, ${color} 50%, transparent)`,
    };
  }
  if (game.preview.style === "wave") {
    // `tile` is an equaliser bar height in %.
    return {
      background: `linear-gradient(to top, ${game.accent[0]} ${tile}%, var(--tile-hidden) ${tile}%)`,
      borderRadius: "999px",
    };
  }
  if (game.preview.style === "board") {
    // `tile` is a board space colour; "★" is the space a team token sits on.
    // Alternate heights so the strip reads as a winding path.
    const token = tile === "★";
    return {
      background: token ? "var(--tile-revealed)" : tile,
      color: token ? game.accent[1] : undefined,
      borderRadius: "0.45rem",
      border: "1.5px solid var(--edge)",
      transform: `translateY(${[3, -1, -4, -3, 1, 4, 2][i % 7]}px)`,
    };
  }
  if (game.preview.style === "jumble") {
    return {
      background: "var(--key-bg)",
      color: "var(--key-fg)",
      border: "1.5px solid var(--edge)",
      boxShadow: "0 2px 0 var(--depth)",
      transform: `rotate(${TILT[i % TILT.length]}deg) translateY(${i % 2 ? 2 : -1}px)`,
    };
  }
  return tile
    ? { background: "var(--tile-revealed)", color: "var(--tile-revealed-fg)", boxShadow: "0 2px 0 var(--depth)" }
    : { background: "var(--tile-hidden)", boxShadow: `inset 0 0 0 1.5px var(--line-strong), inset 0 -3px 0 ${game.accent[0]}` };
}

export default function Home() {
  return (
    <div className="stage flex min-h-dvh flex-col" style={{ "--team": "#8b5cf6" }}>
      <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col px-4 pb-6 pt-5 sm:px-6 sm:pt-8">
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <p className="font-display text-base font-bold tracking-tight text-muted">GameAdda</p>
            <h1 className="mt-1 font-display text-[clamp(1.9rem,6.5vw,3.5rem)] font-extrabold leading-[0.95] tracking-[-0.035em]">
              One screen. <span className="text-accent-2">Everyone</span> plays.
            </h1>
          </div>
          <p className="max-w-sm text-sm text-muted sm:text-base">
            Party games for the living room. Pass the phone, cast to the TV, or crowd round a laptop.
          </p>
        </header>

        <ul className="mt-5 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 md:grid-cols-3">
          {GAMES.map((game) => (
            <li key={game.slug} className="min-w-0">
              {/* Each card wears its game's theme (app/game-themes.css), so the hub previews every look. */}
              <Link
                href={game.href}
                className={`card theme-${game.theme} group flex h-full min-w-0 flex-col rounded-[1.5rem] p-3.5 text-foreground transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-1 sm:p-5`}
                style={{
                  backgroundImage: "radial-gradient(var(--dot) 1px, transparent 1px)",
                  backgroundSize: "18px 18px",
                }}
              >
                <div aria-hidden="true" className="grid w-full max-w-[14rem] grid-cols-7 gap-1 sm:gap-1.5">
                  {game.preview.tiles.map((char, i) => (
                    <span
                      key={i}
                      className="grid aspect-[3/4] min-w-0 place-items-center rounded-md font-display text-[clamp(0.7rem,3vw,1.05rem)] font-bold"
                      style={previewStyle(game, char, i)}
                    >
                      {previewText(game, char)}
                    </span>
                  ))}
                </div>
                <h2 className="mt-3 font-display text-[1.05rem] font-bold leading-tight tracking-tight sm:mt-5 sm:text-2xl">{game.title}</h2>
                <p className="mt-1.5 hidden text-sm text-muted sm:line-clamp-2">{game.tagline}</p>
                <div className="mt-auto flex items-end justify-between gap-2 pt-3 sm:pt-5">
                  <span className="min-w-0 text-xs leading-snug text-subtle sm:text-sm">
                    {game.players}
                    <span className="hidden min-[420px]:inline"> · </span>
                    <br className="min-[420px]:hidden" />
                    {game.duration}
                  </span>
                  <span className="btn btn-primary size-9 shrink-0 rounded-xl p-0 sm:size-11" aria-hidden="true">
                    <ArrowRightIcon size={18} />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-subtle">
          <SparkleIcon size={16} /> More games are on the way
        </p>
      </main>
    </div>
  );
}
