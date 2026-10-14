/**
 * Generic destructive-action confirmation dialog.
 */

import { useEffect, useRef } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

/**
 * Gate in front of anything that cannot be undone. Same shell as the workspace
 * dialog, so the app only ever shows one kind of modal.
 *
 * Focus lands on Vazgeç rather than the destructive button: a stray Enter
 * should back out of a permanent delete, not confirm it.
 */
export const ConfirmDialog = ({ isOpen, title, description, confirmLabel, onConfirm, onClose }) => {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const frame = window.requestAnimationFrame(() => cancelRef.current?.focus());
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[200] flex items-start justify-center bg-neutral-900/40 px-4 pt-[18vh] backdrop-blur-[1px] dark:bg-black/60"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-4 shadow-xl shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/50"
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
          >
            <AlertTriangle className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>

          <div className="min-w-0">
            <h2
              id="confirm-dialog-title"
              className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50"
            >
              {title}
            </h2>
            <p
              id="confirm-dialog-description"
              className="mt-1 text-[12px] leading-5 text-neutral-500 dark:text-neutral-400"
            >
              {description}
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className="h-9 rounded-full border border-neutral-300 px-4 text-[12px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex h-9 items-center gap-1.5 rounded-full bg-red-600 px-4 text-[12px] font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 dark:bg-red-500 dark:hover:bg-red-400 dark:focus-visible:ring-offset-neutral-800"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================== */
/*  Sidebar                                                                    */
/* ========================================================================== */
