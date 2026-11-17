/**
 * The puzzle: each emoji on its own little sticker, slightly tilted, so a clue
 * reads left to right like a sentence. `size="sm"` is the compact strip used
 * on the round-over screen.
 *
 * @param {{ tiles: string[], size?: "lg" | "sm", label?: string }} props
 */
const TILT = [-5, 3, -2, 5, -4, 2];

export function EmojiRow({ tiles, size = "lg", label = "Emoji clue" }) {
  const big = size === "lg";
  return (
    <ul aria-label={label} className={`flex flex-wrap justify-center ${big ? "gap-2 sm:gap-3.5" : "gap-1.5"}`}>
      {tiles.map((tile, i) => (
        <li
          key={`${i}-${tile}`}
          className={`sticker anim-pop grid place-items-center ${
            big ? "size-[clamp(3rem,13vw,6.5rem)] rounded-[clamp(1rem,3.5vw,1.4rem)] text-[clamp(1.7rem,7.5vw,3.9rem)]" : "size-12 rounded-xl text-[1.75rem]"
          }`}
          style={{ "--tilt": `${TILT[i % TILT.length]}deg`, animationDelay: big ? `${i * 70}ms` : undefined }}
        >
          <span className="leading-none">{tile}</span>
        </li>
      ))}
    </ul>
  );
}
