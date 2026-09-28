/**
 * Quiet side rail: start a session, or open the short explanation.
 */

import { cn } from "../../lib/cn";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500";

const primaryButton = cn(
  "inline-flex w-full items-center justify-center rounded-lg bg-neutral-900 px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white",
  focusRing,
);

const quietButton = cn(
  "inline-flex w-full items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
  focusRing,
);

export function FlashcardControls({ mode, warning, notice, onStart, onHelp, onExit }) {
  return (
    <aside
      aria-label="Flashcard kontrolleri"
      className="w-full max-w-md rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3 dark:border-neutral-800 dark:bg-neutral-900/40 lg:w-60 lg:max-w-none"
    >
      <div className="flex flex-col gap-2">
        {mode === "edit" ? (
          <button type="button" className={primaryButton} onClick={onStart}>
            Çalışmaya Başla
          </button>
        ) : null}
        {mode === "study" ? (
          <button type="button" className={quietButton} onClick={onExit}>
            Düzenlemeye Dön
          </button>
        ) : null}
        <button type="button" className={quietButton} onClick={onHelp}>
          Nasıl Çalışır?
        </button>
      </div>
      {mode === "edit" && warning ? (
        <p className="mt-3 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">{warning}</p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-3 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          {notice}
        </p>
      ) : null}
    </aside>
  );
}
