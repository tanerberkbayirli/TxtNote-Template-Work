/**
 * Study pass. The card is the only focus; scoring stays under it.
 */

import { cn } from "../../lib/cn";
import { FlashcardCard } from "./FlashcardCard";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500";

const answerButton = cn(
  "inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
  focusRing,
);

const hintClass = "text-center text-[12px] text-neutral-400 dark:text-neutral-500";

export function FlashcardStudyMode({
  card,
  revealed,
  known,
  total,
  repeat,
  skipped,
  onFlip,
  onKnow,
  onAgain,
}) {
  const pct = total > 0 ? Math.round((known / total) * 100) : 0;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-3 w-full">
        <div className="mb-1.5 flex items-center justify-between text-[12px] text-neutral-400 dark:text-neutral-500">
          <span>{repeat ? "Tekrar" : "Çalışma"}</span>
          <span className="tabular-nums">
            Bilinen {known} / {total}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div className="flashcard-progress h-full bg-neutral-700 dark:bg-neutral-200" style={{ width: `${pct}%` }} />
        </div>
        {skipped > 0 ? <p className={cn("mt-1.5", hintClass)}>Boş kartlar bu oturumda yok.</p> : null}
      </div>

      <FlashcardCard key={card.id} card={card} flipped={revealed} editable={false} onFlip={onFlip} />

      <div className="mt-4 flex min-h-10 items-center justify-center gap-2">
        {revealed ? (
          <>
            <button type="button" className={answerButton} onClick={onKnow}>
              Biliyordum
            </button>
            <button type="button" className={answerButton} onClick={onAgain}>
              Tekrar Et
            </button>
          </>
        ) : (
          <p className={hintClass}>Önce cevabı düşün, sonra kartı çevir</p>
        )}
      </div>
      <p className={cn("mt-2", hintClass)}>
        {revealed ? "Sonucunu işaretle" : "Kartı çevirmek için karta tıkla"}
        {" · "}
        Space: Kartı çevir · ← →: kartlar
      </p>
    </div>
  );
}
