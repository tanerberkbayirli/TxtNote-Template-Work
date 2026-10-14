/**
 * End of a study pass. A short split first, then the full attempt log.
 */

import { useState } from "react";
import { cn } from "../../lib/cn";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500";

const primaryButton = cn(
  "inline-flex items-center justify-center rounded-lg bg-neutral-900 px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white",
  focusRing,
);

const quietButton = cn(
  "inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
  focusRing,
);

const Stat = ({ label, value }) => (
  <div className="rounded-lg bg-neutral-50 px-3 py-3 dark:bg-neutral-950">
    <dt className="text-[11px] leading-snug text-neutral-400 dark:text-neutral-500">{label}</dt>
    <dd className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">{value}</dd>
  </div>
);

const formatDuration = (ms) => {
  const seconds = Math.max(0, Math.round((Number(ms) || 0) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours > 0) return rest || minutes ? `${hours} sa ${minutes} dk` : `${hours} sa`;
  if (minutes > 0) return rest ? `${minutes} dk ${rest} sn` : `${minutes} dk`;
  return `${rest} sn`;
};

const cardLabel = (card) => {
  const front = String(card.front ?? "").replace(/\s+/g, " ").trim();
  if (front) return front;
  if (card.image) return "Görsel kart";
  return "Kart";
};

const attemptLabel = (mark) => (mark === "know" ? "Biliyordum" : "Tekrar");

const AttemptLog = ({ cards }) => (
  <section className="flashcard-fade w-full rounded-2xl border border-neutral-200 bg-white px-5 py-5 text-left shadow-[0_16px_40px_-22px_rgba(23,23,23,0.45)] dark:border-neutral-700 dark:bg-neutral-900">
    <h3 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">Deneme ayrıntısı</h3>
    <p className="mt-1 text-[12px] leading-relaxed text-neutral-400 dark:text-neutral-500">
      Her kartın kaçıncı denemede bilindiği ve o denemeye kadar geçen süre.
    </p>
    <ol className="mt-4 max-h-[min(28rem,55vh)] space-y-2 overflow-y-auto pr-1">
      {cards.map((card) => (
        <li
          key={card.id}
          className="rounded-xl border border-neutral-200 px-3 py-3 dark:border-neutral-700"
        >
          <div className="flex items-start justify-between gap-4">
            <p className="min-w-0 text-[14px] font-medium leading-snug text-neutral-900 dark:text-neutral-50">
              {cardLabel(card)}
            </p>
            <p className="shrink-0 text-right text-[12px] tabular-nums text-neutral-500 dark:text-neutral-400">
              {card.knownOn}. denemede
              <span className="mt-0.5 block text-neutral-400 dark:text-neutral-500">
                {formatDuration(card.totalMs)}
              </span>
            </p>
          </div>
          <ol className="mt-2 space-y-1">
            {card.attempts.map((attempt, index) => (
              <li
                key={`${card.id}-${index}`}
                className="flex items-center justify-between gap-3 text-[12px] text-neutral-500 dark:text-neutral-400"
              >
                <span>
                  {index + 1}. deneme · {attemptLabel(attempt.mark)}
                </span>
                <span className="tabular-nums">{formatDuration(attempt.ms)}</span>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  </section>
);

export function FlashcardResults({ results, onAgain, onEdit }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flashcard-fade w-full max-w-md rounded-2xl border border-neutral-200 bg-white px-6 py-8 text-center shadow-[0_16px_40px_-22px_rgba(23,23,23,0.45)] dark:border-neutral-700 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Oturum tamam</h2>
        <dl className="mt-6 grid grid-cols-2 gap-2">
          <Stat label="Tek seferde bilinen" value={results.firstTry} />
          <Stat label="2 veya daha fazla denemede" value={results.later} />
        </dl>
        {results.skipped > 0 ? (
          <p className="mt-3 text-[12px] text-neutral-400 dark:text-neutral-500">
            Boş kartlar bu sayıya dahil değil.
          </p>
        ) : null}
        <button
          type="button"
          className={cn(quietButton, "mt-5 w-full")}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Daha az göster" : "Daha fazlasını gör"}
        </button>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" className={primaryButton} onClick={onAgain}>
            Tekrar Çalış
          </button>
          <button type="button" className={quietButton} onClick={onEdit}>
            Düzenlemeye Dön
          </button>
        </div>
      </div>
      {open ? <AttemptLog cards={results.cards} /> : null}
    </div>
  );
}
