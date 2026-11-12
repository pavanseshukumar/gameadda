"use client";

import { useEffect, useRef } from "react";

/**
 * Accessible modal built on the native <dialog> element (focus trapping,
 * Escape to close and top-layer rendering come for free).
 * Children are only mounted while open, so inner form state resets each time.
 */
export function Dialog({ open, onClose, labelledBy, children, accent }) {
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
      className="sheet"
      aria-labelledby={labelledBy}
      style={accent ? { "--team": accent } : undefined}
      onClose={() => open && onClose?.()}
      onClick={(event) => {
        if (event.target === ref.current) onClose?.();
      }}
    >
      {open ? <div className="sheet-panel rounded-[1.75rem] p-6 sm:p-8">{children}</div> : null}
    </dialog>
  );
}

export function ConfirmDialog({ open, title, body, confirmLabel, tone = "primary", onConfirm, onCancel }) {
  return (
    <Dialog open={open} onClose={onCancel} labelledBy="confirm-title">
      <h2 id="confirm-title" className="font-display text-2xl font-bold tracking-tight">
        {title}
      </h2>
      {body ? <p className="mt-2 text-muted">{body}</p> : null}
      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" className="btn btn-secondary h-12 px-6" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          autoFocus
          className={`btn h-12 px-6 ${tone === "danger" ? "btn-danger" : "btn-primary"}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
