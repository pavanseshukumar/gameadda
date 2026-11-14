"use client";

import { useId, useState } from "react";
import { searchMovies } from "@/lib/games/hot-and-cold/pool";

/**
 * Guess box with movie autocomplete (ARIA combobox). Only films from the pool
 * can be guessed, so picking from the list is how a guess is made.
 *
 * @param {{
 *   pool: import("@/lib/games/hot-and-cold/pool").HotColdPool | null,
 *   guessedIds: Set<string>,
 *   disabled: boolean,
 *   onPick: (movie: object) => void,
 * }} props
 */
export function MovieSearch({ pool, guessedIds, disabled, onPick, ref: inputRef }) {
  const [text, setText] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const listId = useId();
  const loading = !pool || pool.source !== "online";
  const results = open && !disabled ? searchMovies(pool, text) : [];
  const highlighted = Math.min(active, Math.max(0, results.length - 1));

  const pick = (movie) => {
    if (!movie || guessedIds.has(movie.id)) return;
    onPick(movie);
    setText("");
    setActive(0);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const director = (movie) => (movie.d ?? []).map((id) => pool?.people[id]).filter(Boolean)[0];

  return (
    <div className="relative">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Guess a movie
      </label>
      <input
        ref={inputRef}
        id={`${listId}-input`}
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={results.length ? `${listId}-${highlighted}` : undefined}
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        enterKeyHint="go"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        disabled={disabled || loading}
        placeholder={loading ? "Loading movies…" : "Type a Telugu movie…"}
        className="h-12 w-full field px-4 text-base font-medium sm:h-14 sm:text-lg"
      />
      {results.length ? (
        <ul
          id={listId}
          role="listbox"
          className="sheet-panel absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-2xl p-1.5 shadow-2xl"
        >
          {results.map((movie, i) => {
            const guessed = guessedIds.has(movie.id);
            return (
              <li
                key={movie.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === highlighted}
                aria-disabled={guessed}
                // mousedown, not click: fires before the input's blur closes the list.
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(movie);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-baseline justify-between gap-3 rounded-xl px-3 py-2.5 ${i === highlighted ? "bg-surface-strong" : ""} ${guessed ? "cursor-not-allowed opacity-45" : ""}`}
              >
                <span className="min-w-0 truncate font-medium">{movie.title}</span>
                <span className="shrink-0 text-xs text-subtle">
                  {guessed ? "already guessed" : [movie.year, director(movie)].filter(Boolean).join(" · ")}
                </span>
              </li>
            );
          })}
        </ul>
      ) : open && !disabled && text.trim().length >= 2 && !loading ? (
        <p className="sheet-panel absolute inset-x-0 top-full z-30 mt-2 rounded-2xl px-4 py-3 text-sm text-muted">
          No Telugu movie by that name in our list.
        </p>
      ) : null}
    </div>
  );
}
