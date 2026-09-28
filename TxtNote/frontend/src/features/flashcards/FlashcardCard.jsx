/**
 * One physical card. Both faces stay mounted so the flip is a rotation,
 * not a cross-fade.
 */

import { ImagePlus, RotateCw, X } from "lucide-react";
import { useRef } from "react";
import { UNDO_APP_ATTR } from "../../lib/undoHistory";
import { cn } from "../../lib/cn";

const faceShell =
  "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_16px_40px_-22px_rgba(23,23,23,0.45)] dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-[0_16px_40px_-22px_rgba(0,0,0,0.8)]";

const fieldClass =
  "min-h-0 w-full flex-1 resize-none bg-transparent px-5 py-3 text-[17px] leading-relaxed text-neutral-800 outline-none placeholder:text-neutral-400 break-words dark:text-neutral-100 dark:placeholder:text-neutral-500";

const textButton =
  "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";

const StudyText = ({ value, emptyLabel }) => {
  const text = String(value ?? "");
  const empty = !text.trim();
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden px-5 py-4">
      <p
        className={cn(
          "max-h-full overflow-y-auto whitespace-pre-wrap break-words text-[17px] leading-relaxed",
          empty ? "text-center text-[13px] text-neutral-400 dark:text-neutral-500" : "text-neutral-800 dark:text-neutral-100",
        )}
      >
        {empty ? emptyLabel : text}
      </p>
    </div>
  );
};

const FaceLabel = ({ children }) => (
  <p className="px-5 pt-4 pr-14 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
    {children}
  </p>
);

export function FlashcardCard({
  card,
  flipped,
  editable,
  imageError,
  frontRef,
  onFlip,
  onFrontChange,
  onBackChange,
  onPickImage,
  onClearImage,
}) {
  const fileRef = useRef(null);
  const image = card?.image || null;
  const openPicker = () => fileRef.current?.click();

  const onFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onPickImage?.(file);
  };

  return (
    <div className="flashcard-fade relative w-full">
      <button
        type="button"
        title="Kartı çevir"
        aria-label={flipped ? "Ön yüze dön" : "Kartı çevir"}
        onClick={(event) => {
          event.stopPropagation();
          onFlip?.();
        }}
        className="absolute right-2.5 top-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white/95 text-neutral-500 shadow-sm transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-800/95 dark:text-neutral-300 dark:hover:text-white"
      >
        <RotateCw className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>

      <div
        className={cn("flashcard-scene", !editable && "cursor-pointer")}
        onClick={() => {
          if (!editable) onFlip?.();
        }}
      >
        <div className={cn("flashcard-inner", flipped && "is-flipped")}>
          <div
            className={cn("flashcard-face flashcard-front", flipped && "pointer-events-none")}
            aria-hidden={flipped}
            inert={flipped ? true : undefined}
          >
            <div className={faceShell}>
              <FaceLabel>Ön</FaceLabel>
              {image ? (
                <div className="relative mx-5 mt-3 flex min-h-0 flex-[1_1_46%] items-center justify-center overflow-hidden rounded-lg bg-neutral-50 dark:bg-neutral-950">
                  <img
                    src={image}
                    alt={card.front?.trim() ? "" : "Kart görseli"}
                    draggable={false}
                    className="max-h-full max-w-full object-contain"
                  />
                  {editable ? (
                    <button
                      type="button"
                      title="Görseli kaldır"
                      aria-label="Görseli kaldır"
                      onClick={(event) => {
                        event.stopPropagation();
                        onClearImage?.();
                      }}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-neutral-500 shadow-sm hover:text-neutral-900 dark:bg-neutral-800/90 dark:text-neutral-300 dark:hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                  ) : null}
                </div>
              ) : null}
              {editable ? (
                <textarea
                  ref={frontRef}
                  {...{ [UNDO_APP_ATTR]: "true" }}
                  value={card.front}
                  aria-label="Ön yüz"
                  placeholder="Soru, kavram veya formül"
                  onChange={(event) => onFrontChange?.(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  className={fieldClass}
                />
              ) : (
                <StudyText value={card.front} emptyLabel="Bu yüz boş." />
              )}
              {editable ? (
                <div className="flex items-center gap-1 px-3 pb-3">
                  <button
                    type="button"
                    title={image ? "Görseli değiştir" : "Görsel ekle"}
                    aria-label={image ? "Görseli değiştir" : "Görsel ekle"}
                    onClick={(event) => {
                      event.stopPropagation();
                      openPicker();
                    }}
                    className={textButton}
                  >
                    <ImagePlus className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {image ? "Görseli değiştir" : "Görsel ekle"}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={onFile}
                  />
                </div>
              ) : null}
              {editable && imageError ? (
                <p className="px-5 pb-3 text-[11px] text-red-600 dark:text-red-400">{imageError}</p>
              ) : null}
            </div>
          </div>

          <div
            className={cn("flashcard-face flashcard-back", !flipped && "pointer-events-none")}
            aria-hidden={!flipped}
            inert={!flipped ? true : undefined}
          >
            <div className={faceShell}>
              <FaceLabel>Arka</FaceLabel>
              {editable ? (
                <textarea
                  {...{ [UNDO_APP_ATTR]: "true" }}
                  value={card.back}
                  aria-label="Arka yüz"
                  placeholder="Cevap veya açıklama"
                  onChange={(event) => onBackChange?.(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  className={fieldClass}
                />
              ) : (
                <StudyText value={card.back} emptyLabel="Bu yüz boş." />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
