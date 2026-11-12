/**
 * Scrambled letter tiles. Used tiles stay in place as faded ghosts so the
 * rack doesn't jump around while a team builds its answer.
 *
 * @param {{
 *   tiles: { id: string, char: string }[],
 *   usedIds: Set<string>,
 *   onPick: (tileId: string) => void,
 *   disabled?: boolean,
 * }} props
 */
export function TileRack({ tiles, usedIds, onPick, disabled = false, maxPerRow = 8 }) {
  // Even rows: 10 tiles → 5 + 5 (big tiles), 22 tiles → 8 + 8 + 6.
  const perRow = Math.max(1, Math.ceil(tiles.length / Math.ceil(tiles.length / maxPerRow)));
  return (
    <div className="jumble-rack w-full" style={{ "--per-row": perRow }}>
      <div role="group" aria-label="Scrambled letters" className="flex flex-wrap justify-center gap-[0.45rem]">
        {tiles.map((tile, index) => {
          const used = usedIds.has(tile.id);
          return (
            <button
              key={tile.id}
              type="button"
              className="jtile anim-pop"
              data-used={used}
              disabled={disabled || used}
              onClick={() => onPick(tile.id)}
              aria-label={used ? `${tile.char}, placed` : `Place ${tile.char}`}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {tile.char}
            </button>
          );
        })}
      </div>
    </div>
  );
}
