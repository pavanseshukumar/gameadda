"use client";

import { useEffect, useRef } from "react";
import { Button } from "./button";

/** Modal confirmation built on the native <dialog> (focus trap + Esc for free). */
export function ConfirmDialog({ open, title, body, confirmLabel = "Confirm", cancelLabel = "Cancel", tone = "danger", onConfirm, onCancel }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCancel();
      }}
      className="m-auto w-[min(92vw,26rem)] rounded-[1.75rem] open:animate-pop-in border-2 border-ink bg-paper p-0 text-ink shadow-[0_6px_0_0_var(--color-ink)] backdrop:bg-ink/55 backdrop:backdrop-blur-[2px]"
    >
      {/* The pop-in runs on the <dialog> (open:animate-pop-in): on this inner box its overshoot overflowed the dialog and flashed a scrollbar. */}
      {open && (
        <div className="p-6">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">{title}</h2>
          {body && <p className="mt-2 text-ink-soft">{body}</p>}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="paper" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button variant={tone} onClick={onConfirm} autoFocus>
              {confirmLabel}
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );
}
