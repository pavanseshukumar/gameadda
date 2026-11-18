import Link from "next/link";
import { GAMES } from "@/lib/games/registry";
import { ArrowRightIcon, SparkleIcon } from "@/components/ui/icons";
import { GameGrid } from "@/components/hub/GameGrid";

const TILT = [-6, 4, -3, 7, -5, 3, -4];

/** Tiny clay shading for the preview tiles. */
const CLAY_NUB = "0 3px 5px -2px var(--depth), inset 2px 2px 3px -1px rgb(255 255 255 / 0.7), inset -2px -2px 3px -1px rgb(0 0 0 / 0.14)";

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
  if (game.preview.style === "lineup") return tile || null;
  if (game.preview.style === "chalk") return tile || null;
  if (game.preview.style === "fill") return tile || null;
  if (game.preview.style === "ice") return tile || null;
  if (game.preview.style === "marks") return tile ? tile.split(":")[0] : null;
  if (game.preview.style === "swipe") return tile;
  if (game.preview.style === "emoji") return tile || "?";
  if (game.preview.style === "spin") return null;
  if (game.preview.style === "twins") return tile ? tile.split("|")[0] : null;
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
  if (game.preview.style === "lineup") {
    // A line-up of player silhouettes (head + shoulders); "?" is the imposter, in red.
    const imposter = tile === "?";
    const ink = imposter ? "var(--accent-2)" : "var(--fg-subtle)";
    return imposter
      ? { background: "var(--accent-2)", color: "var(--accent-2-ink)", border: "1.5px solid var(--edge)", boxShadow: CLAY_NUB }
      : {
          background: `radial-gradient(circle at 50% 36%, ${ink} 0 19%, transparent 20%), radial-gradient(ellipse 46% 34% at 50% 100%, ${ink} 0 98%, transparent 100%), var(--tile-hidden)`,
          boxShadow: "inset 0 0 0 1.5px var(--line-strong)",
        };
  }
  if (game.preview.style === "spin") {
    // Spinner weights: coloured discs with a bearing; "*" marks the one it stopped on,
    // a blank slot is the little spinner arrow.
    if (!tile) return { background: "transparent", boxShadow: "none" };
    const hit = tile.startsWith("*");
    const color = hit ? tile.slice(1) : tile;
    return {
      aspectRatio: "1",
      alignSelf: "center",
      borderRadius: "999px",
      background: `radial-gradient(circle at 50% 50%, #eef1f5 0 18%, #9aa3ae 19% 24%, transparent 25%), radial-gradient(circle at 35% 30%, rgb(255 255 255 / 0.6), transparent 55%), ${color}`,
      border: "2px solid #fff",
      boxShadow: hit ? `0 0 0 2.5px ${color}, ${CLAY_NUB}` : CLAY_NUB,
      transform: hit ? "scale(1.18)" : `translateY(${i % 2 ? 2 : -2}px)`,
    };
  }
  if (game.preview.style === "emoji") {
    // Emoji stickers, tilted; an empty string is a face-down sticker.
    return tile
      ? { background: "#fff", border: "1.5px solid #fff", boxShadow: CLAY_NUB, rotate: `${TILT[i % TILT.length] / 2}deg`, fontSize: "clamp(0.85rem,3.6vw,1.25rem)" }
      : {
          background: "repeating-linear-gradient(135deg, #ffcf3f 0 5px, #ffd95f 5px 10px)",
          color: "#6b4a00",
          border: "1.5px solid #fff",
          boxShadow: CLAY_NUB,
          rotate: `${TILT[i % TILT.length] / 2}deg`,
        };
  }
  if (game.preview.style === "ladder") {
    // Rungs climbing left to right; one out of order (taller than the next) is highlighted.
    const tiles = game.preview.tiles;
    const outOfPlace = i < tiles.length - 1 && tile > tiles[i + 1];
    const color = outOfPlace ? game.accent[1] : game.accent[0];
    return {
      background: `linear-gradient(to top, ${color} ${tile}%, var(--tile-hidden) ${tile}%)`,
      borderRadius: "0.35rem",
    };
  }
  if (game.preview.style === "twins") {
    // Indigo card backs; a face-up card shows its pair's colour (twins match).
    if (!tile) {
      return {
        background: "radial-gradient(circle, rgb(255 255 255 / 0.16) 1px, transparent 1.4px) 0 0 / 5px 5px, linear-gradient(155deg, #5560cc, #2f3796)",
        boxShadow: CLAY_NUB,
      };
    }
    return { background: tile.split("|")[1], boxShadow: CLAY_NUB, fontSize: "clamp(0.8rem,3.4vw,1.15rem)" };
  }
  if (game.preview.style === "swipe") {
    // A turn's results: green "got it" and red "pass" chips.
    const got = tile === "✓";
    return { background: got ? "var(--hit)" : "var(--miss)", color: "#fff", borderRadius: "999px", boxShadow: CLAY_NUB, transform: `translateY(${got ? -2 : 2}px)` };
  }
  if (game.preview.style === "marks") {
    // A marked guess: teal = right spot, pink = wrong spot, slate = not in the word.
    const mark = tile ? tile.split(":")[1] : null;
    if (!mark) return { boxShadow: "inset 0 0 0 1.5px var(--line)", borderRadius: "0.35rem" };
    const fill = { hit: "var(--hit)", near: "var(--near)", miss: "var(--absent)" }[mark];
    return { background: fill, color: mark === "miss" ? "var(--fg-muted)" : "#fff", borderRadius: "0.35rem" };
  }
  if (game.preview.style === "ice") {
    // Letters on frosted ice cubes; an empty slot is the gap between words.
    if (!tile) return { background: "transparent" };
    return {
      color: "var(--foreground)",
      background: "linear-gradient(160deg, rgb(255 255 255 / 0.9), rgb(255 255 255 / 0) 50%), linear-gradient(#e0f4ff, #b9e3f7)",
      border: "1.5px solid var(--edge)",
      boxShadow: CLAY_NUB,
      transform: `rotate(${TILT[i % TILT.length] / 2}deg)`,
    };
  }
  if (game.preview.style === "fill") {
    // Shown letters inked in; blanks are pale boxes, like a half-filled listing.
    return tile
      ? { background: "var(--tile-revealed)", color: "var(--tile-revealed-fg)" }
      : { background: "var(--tile-hidden)", boxShadow: `inset 0 -2.5px 0 ${game.accent[0]}` };
  }
  if (game.preview.style === "chalk") {
    // Chalk letters over blank underlines, like a half-solved hangman word.
    return {
      color: "var(--foreground)",
      borderRadius: 0,
      boxShadow: `inset 0 -2.5px 0 ${tile ? "var(--fg-subtle)" : game.accent[0]}`,
    };
  }
  if (game.preview.style === "jumble") {
    return {
      background: "var(--key-bg)",
      color: "var(--key-fg)",
      border: "1.5px solid var(--edge)",
      boxShadow: CLAY_NUB,
      transform: `rotate(${TILT[i % TILT.length]}deg) translateY(${i % 2 ? 2 : -1}px)`,
    };
  }
  return tile
    ? { background: "var(--tile-revealed)", color: "var(--tile-revealed-fg)", boxShadow: CLAY_NUB }
    : { background: "var(--tile-hidden)", boxShadow: `inset 0 0 0 1.5px var(--line-strong), inset 0 -3px 0 ${game.accent[0]}` };
}

export default function Home() {
  return (
    <div className="stage flex min-h-dvh flex-col" style={{ "--team": "#8b5cf6" }}>
      <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pt-8">
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <p className="font-display text-sm font-bold tracking-tight text-muted sm:text-base">GameAdda</p>
            <h1 className="mt-1 font-display text-[clamp(1.85rem,8.4vw,3.5rem)] font-extrabold leading-[0.95] tracking-[-0.035em]">
              One screen. <span className="text-accent-2">Everyone</span> plays.
            </h1>
          </div>
          <p className="hidden max-w-sm text-base text-muted sm:block">
            Party games for the living room. Pass the phone, cast to the TV, or crowd round a laptop.
          </p>
        </header>

        {/* The All / Solo filter lives in GameGrid; the cards are rendered here. */}
        <GameGrid
          items={GAMES.map((game) => ({
            slug: game.slug,
            modes: game.modes,
            card: (
              // Each card wears its game's theme (app/game-themes.css), so the hub previews every look.
              <Link
                href={game.href}
                className={`card hub-card theme-${game.theme} group flex h-full min-w-0 flex-col rounded-[1.75rem] p-3.5 text-foreground transition-transform duration-200 ease-out hover:-translate-y-1 active:scale-[0.97] sm:p-5`}
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
                  <span className="btn btn-primary size-9 shrink-0 rounded-full p-0 sm:size-11" aria-hidden="true">
                    <ArrowRightIcon size={18} />
                  </span>
                </div>
              </Link>
            ),
          }))}
        />

        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-subtle">
          <SparkleIcon size={16} /> More games are on the way
        </p>
      </main>
    </div>
  );
}
