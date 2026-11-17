"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@/components/ui/icons";

/**
 * The movies to sort, as a vertical ladder: drag a card (mouse or finger) to a new
 * rung, or use its up / down buttons (keyboard and screen readers).
 * Each move is sent to `onMove(from, to)`; the order lives in the game state.
 *
 * @param {{
 *   items: { id: string, title: string, lead?: string }[],
 *   disabled?: boolean,
 *   onMove: (from: number, to: number) => void,
 * }} props
 */
export function LadderList({ items, disabled = false, onMove }) {
  const listRef = useRef(null);
  // `{ id, startIndex, originY, dy, pitch }` while a card is held.
  const [drag, setDrag] = useState(null);
  const positions = useRef(new Map());

  // FLIP: when the order changes, slide the other cards from where they were.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const next = new Map();
    for (const el of list.children) {
      const id = el.dataset.id;
      const top = el.offsetTop;
      next.set(id, top);
      const prev = positions.current.get(id);
      if (prev != null && prev !== top && id !== drag?.id) {
        el.animate([{ transform: `translateY(${prev - top}px)` }, { transform: "translateY(0)" }], { duration: 180, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
      }
    }
    positions.current = next;
  }, [items, drag?.id]);

  const indexOf = (id) => items.findIndex((m) => m.id === id);

  const onPointerDown = (event, index) => {
    if (disabled || event.button > 0 || event.target.closest("button")) return;
    const list = listRef.current;
    const rows = list.children;
    const pitch = rows.length > 1 ? rows[1].offsetTop - rows[0].offsetTop : rows[0].offsetHeight;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ id: items[index].id, startIndex: index, originY: event.clientY, dy: 0, pitch });
  };

  const onPointerMove = (event) => {
    if (!drag) return;
    const dy = event.clientY - drag.originY;
    const target = Math.max(0, Math.min(items.length - 1, drag.startIndex + Math.round(dy / drag.pitch)));
    const current = indexOf(drag.id);
    if (target !== current) onMove(current, target);
    setDrag((d) => (d ? { ...d, dy } : d));
  };

  const endDrag = () => setDrag(null);

  return (
    <ol ref={listRef} className="ladder-list" aria-label="Movies, oldest at the top">
      {items.map((movie, index) => {
        const held = drag?.id === movie.id;
        // Keep the held card under the finger: its slot has moved by (index − start) rungs.
        const offset = held ? drag.dy - (index - drag.startIndex) * drag.pitch : 0;
        return (
          <li
            key={movie.id}
            data-id={movie.id}
            className="ladder-row card"
            data-held={held}
            style={held ? { transform: `translateY(${offset}px) scale(1.03)` } : undefined}
            onPointerDown={(event) => onPointerDown(event, index)}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <span className="ladder-rung" aria-hidden="true">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-lg leading-tight sm:text-2xl">{movie.title}</span>
              {movie.lead ? <span className="mt-0.5 block truncate text-xs text-muted sm:text-sm">{movie.lead}</span> : null}
            </span>
            <span className="flex shrink-0 flex-col gap-1 sm:flex-row">
              <button
                type="button"
                className="ladder-step"
                disabled={disabled || index === 0}
                onClick={() => onMove(index, index - 1)}
                aria-label={`Move ${movie.title} earlier`}
              >
                <ChevronUpIcon size={18} strokeWidth={2.75} />
              </button>
              <button
                type="button"
                className="ladder-step"
                disabled={disabled || index === items.length - 1}
                onClick={() => onMove(index, index + 1)}
                aria-label={`Move ${movie.title} later`}
              >
                <ChevronDownIcon size={18} strokeWidth={2.75} />
              </button>
            </span>
            <span className="ladder-grip" aria-hidden="true" />
          </li>
        );
      })}
    </ol>
  );
}
