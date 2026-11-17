"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Keyboard } from "./Keyboard";

const MAX_LENGTH = 40;

/**
 * A typed answer without the phone's system keyboard: the guess is shown in a
 * read-only box and typed on the on-screen `Keyboard` (letters, space, delete,
 * guess). On a laptop, the physical keyboard types into it too.
 *
 * `enabled` turns the physical keys on (only while the turn is running).
 * `resetKey` clears the box when it changes (a new card, or a steal).
 *
 * @param {{ enabled: boolean, onSubmit: (text: string) => void, resetKey?: string, blocked?: boolean }} options
 *   `blocked`: ignore the physical keys (e.g. while a confirm dialog is open)
 */
export function useTypedGuess({ enabled, onSubmit, resetKey = "", blocked = false }) {
  const [value, setValue] = useState("");
  const [lastReset, setLastReset] = useState(resetKey);
  if (lastReset !== resetKey) {
    setLastReset(resetKey);
    setValue("");
  }

  const type = (letter) => setValue((v) => (v.length < MAX_LENGTH ? v + letter.toUpperCase() : v));
  // No leading or double spaces.
  const space = () => setValue((v) => (v && !v.endsWith(" ") && v.length < MAX_LENGTH ? `${v} ` : v));
  const backspace = () => setValue((v) => v.slice(0, -1));
  const submit = () => {
    const text = value.trim();
    if (!enabled || !text) return;
    onSubmit(text);
    setValue("");
  };

  const onKeyDown = useEffectEvent((e) => {
    if (!enabled || blocked || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]")) return;
    // Enter on a focused control (Hint, Pass…) clicks it; on an on-screen key it guesses.
    const onControl = e.target instanceof HTMLButtonElement && !e.target.classList.contains("key");
    if (/^[a-z0-9]$/i.test(e.key)) type(e.key);
    else if (e.key === " ") {
      e.preventDefault(); // don't click the focused key again
      space();
    } else if (e.key === "Backspace") backspace();
    else if (e.key === "Enter" && !onControl) {
      e.preventDefault();
      submit();
    }
  });
  useEffect(() => {
    const handler = (e) => onKeyDown(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return { value, type, space, backspace, submit };
}

/**
 * The answer box and the on-screen keyboard, docked together at the bottom of the
 * screen so what's typed stays in view above the keys. The keyboard's Guess key submits.
 * `shakeKey` changes on a wrong guess to shake the box.
 */
export function GuessKeyboard({ guess, disabled = false, placeholder = "Type your answer", shakeKey = null }) {
  const empty = !guess.value;
  return (
    <section aria-label="Keyboard" className="dock">
      <div key={shakeKey ?? "box"} className={`mx-auto mb-2.5 w-full max-w-2xl ${shakeKey ? "anim-shake" : ""}`}>
        <div
          role="textbox"
          aria-readonly="true"
          aria-label="Your answer"
          aria-live="polite"
          className={`field flex h-12 min-w-0 items-center overflow-hidden px-4 text-lg font-semibold tracking-wide sm:h-14 ${disabled ? "opacity-60" : ""}`}
        >
          <span className={`min-w-0 truncate whitespace-pre ${empty ? "text-base font-medium tracking-normal text-subtle" : ""}`}>
            {empty ? placeholder : guess.value}
          </span>
          {disabled ? null : <span aria-hidden="true" className="typed-caret" />}
        </div>
      </div>
      <Keyboard letterStates={{}} reusable disabled={disabled} onKey={guess.type} onBackspace={guess.backspace} onSpace={guess.space} onEnter={guess.submit} enterLabel="Guess" />
      <p className="mt-3 hidden text-center text-xs text-subtle lg:block">Type on your keyboard too · Enter to guess</p>
    </section>
  );
}
