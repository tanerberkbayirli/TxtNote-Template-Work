/**
 * Short explanation of the deck. A few seconds, not a manual.
 */

import { RotateCw, X } from "lucide-react";
import { useEffect, useRef } from "react";

const STEPS = [
  {
    title: "Kartı doldur",
    body: "Ön tarafa soru, kavram, görsel veya hatırlamak istediğin şeyi ekle. Arka tarafa cevabı yaz.",
  },
  {
    title: "Çalışmaya başla",
    body: "Çalışmaya Başla'ya bas. Önce soruyu düşün.",
  },
  {
    title: "Çevir ve işaretle",
    body: "Kartı çevirerek cevabı kontrol et. Bilmediğin kart, bilinene kadar yeniden gelir.",
  },
];

export function FlashcardHelp({ onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onClose?.();
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-neutral-900/40 px-4 pt-[16vh] backdrop-blur-[1px] dark:bg-black/60"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="flashcard-help-title"
        className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-4 shadow-xl shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/50"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="flashcard-help-title" className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
            Nasıl çalışır?
          </h2>
          <button
            ref={closeRef}
            type="button"
            aria-label="Kapat"
            title="Kapat"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-3" aria-hidden="true">
          <div className="flex h-16 w-[5.5rem] items-center justify-center rounded-lg border border-neutral-200 bg-white text-[12px] text-neutral-500 shadow-sm dark:border-neutral-600 dark:bg-neutral-900">
            Ön
          </div>
          <RotateCw className="h-4 w-4 text-neutral-400" strokeWidth={1.75} />
          <div className="flex h-16 w-[5.5rem] items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-[12px] text-neutral-500 dark:border-neutral-600 dark:bg-neutral-900">
            Arka
          </div>
        </div>

        <ol className="mt-4 space-y-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-medium text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-neutral-800 dark:text-neutral-100">
                  {step.title}
                </span>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {step.body}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
