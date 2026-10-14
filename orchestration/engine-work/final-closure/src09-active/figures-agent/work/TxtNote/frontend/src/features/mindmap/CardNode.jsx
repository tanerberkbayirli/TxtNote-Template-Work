/**
 * Image blocks on the map: plain picture, captioned picture, or a fogged
 * sensitive picture that asks before it is shown. Legacy "card" nodes render
 * as captioned pictures so older maps keep working.
 */

import { memo, useEffect, useRef, useState } from "react";
import { GripHorizontal, ImagePlus, X } from "lucide-react";
import { CARD_IMAGE_MAX_BYTES, CARD_IMAGE_MAX_LABEL } from "../../config/limits";
import { cn } from "../../lib/cn";
import { CARD_IMAGE_HEIGHT, NODE_KIND, NODE_SIZE } from "./constants";

const stopPointer = (event) => event.stopPropagation();

const TITLE = {
  [NODE_KIND.IMAGE_PLAIN]: "Saf görsel",
  [NODE_KIND.IMAGE_CAPTION]: "Yazılı görsel",
  [NODE_KIND.IMAGE_SENSITIVE]: "Uyarılı görsel",
  [NODE_KIND.CARD]: "Yazılı görsel",
};

const ARIA = {
  [NODE_KIND.IMAGE_PLAIN]: "Saf görsel",
  [NODE_KIND.IMAGE_CAPTION]: "Yazılı görsel",
  [NODE_KIND.IMAGE_SENSITIVE]: "Uyarılı görsel",
  [NODE_KIND.CARD]: "Yazılı görsel",
};

const readImageFile = (file, { onOk, onError }) => {
  if (!file.type.startsWith("image/")) {
    onError("Yalnızca görsel dosyası seçebilirsin.");
    return null;
  }
  if (file.size > CARD_IMAGE_MAX_BYTES) {
    onError(`Görsel en fazla ${CARD_IMAGE_MAX_LABEL} olabilir. Daha küçük bir dosya seç.`);
    return null;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result;
    if (typeof result !== "string" || !result.startsWith("data:image/")) {
      onError("Görsel okunamadı. Başka bir dosya dene.");
      return;
    }
    onOk(result);
  };
  reader.onerror = () => onError("Görsel okunamadı. Başka bir dosya dene.");
  reader.readAsDataURL(file);
  return reader;
};

export const ImageBlock = memo(function ImageBlock({
  node,
  highlight,
  zIndex = 10,
  isSelected,
  isConnecting,
  revealed = false,
  onPointerDown,
  onSelect,
  onChange,
  onPreviewImage,
  onRequestReveal,
}) {
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const readerRef = useRef(null);
  const size = NODE_SIZE[node.kind] ?? NODE_SIZE[NODE_KIND.IMAGE_PLAIN];
  const [imageError, setImageError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(node.text ?? "");

  const hasCaption = node.kind === NODE_KIND.IMAGE_CAPTION || node.kind === NODE_KIND.CARD;
  const isSensitive = node.kind === NODE_KIND.IMAGE_SENSITIVE;
  const locked = isSensitive && Boolean(node.image) && !revealed;

  useEffect(() => {
    setDraft(node.text ?? "");
  }, [node.text]);

  useEffect(
    () => () => {
      readerRef.current?.abort?.();
      readerRef.current = null;
    },
    [],
  );

  const applyImage = (file) => {
    readerRef.current?.abort?.();
    const reader = readImageFile(file, {
      onOk: (result) => {
        if (readerRef.current !== reader) return;
        setImageError("");
        onChange(node.id, { image: result });
      },
      onError: (message) => {
        if (readerRef.current !== reader && reader) return;
        setImageError(message);
      },
    });
    readerRef.current = reader;
  };

  const handleFilePicked = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    applyImage(file);
  };

  const bodyClass = isConnecting ? "pointer-events-none" : null;

  const openPicker = () => {
    if (isConnecting) return;
    fileInputRef.current?.click();
  };

  const handleImageActivate = (event) => {
    if (isConnecting || !locked) return;
    event.stopPropagation();
    onRequestReveal?.(node.id);
  };

  return (
    <div
      data-node-id={node.id}
      role="group"
      tabIndex={0}
      aria-label={ARIA[node.kind] ?? "Görsel"}
      onPointerDown={(event) => onPointerDown(event, node)}
      onFocus={(event) => {
        if (event.target === event.currentTarget) onSelect?.(node.id);
      }}
      onKeyDown={(event) => {
        if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) {
          return;
        }
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        onSelect?.(node.id);
        if (locked) {
          onRequestReveal?.(node.id);
          return;
        }
        if (hasCaption) textareaRef.current?.focus();
        else if (!node.image) openPicker();
      }}
      className={cn(
        "absolute flex flex-col overflow-hidden rounded-xl border shadow-sm",
        isSensitive
          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40"
          : "border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800",
        isEditing
          ? "ring-2 ring-neutral-400 ring-offset-2 ring-offset-white dark:ring-neutral-500 dark:ring-offset-neutral-950"
          : highlight,
      )}
      style={{
        left: node.x,
        top: node.y,
        width: size.width,
        height: size.height,
        zIndex: isEditing ? Math.max(zIndex, 22) : zIndex,
      }}
    >
      <div
        className={cn(
          "flex h-7 shrink-0 cursor-grab items-center gap-1 border-b px-1.5 active:cursor-grabbing",
          isSensitive
            ? "border-red-200 bg-red-100/80 dark:border-red-900 dark:bg-red-950/70"
            : "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/60",
        )}
      >
        <GripHorizontal
          className="h-3.5 w-3.5 shrink-0 text-neutral-400 dark:text-neutral-500"
          strokeWidth={2}
        />
        <span
          className={cn(
            "mr-auto select-none text-[10px] font-semibold uppercase tracking-wide",
            isSensitive ? "text-red-500 dark:text-red-400" : "text-neutral-400 dark:text-neutral-500",
          )}
        >
          {TITLE[node.kind] ?? "Görsel"}
        </span>

        <button
          type="button"
          tabIndex={-1}
          title={node.image ? "Görseli değiştir" : "Görsel yükle"}
          aria-label={node.image ? "Görseli değiştir" : "Görsel yükle"}
          onPointerDown={stopPointer}
          onClick={openPicker}
          className={cn(
            "rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100",
            bodyClass,
          )}
        >
          <ImagePlus className="h-3.5 w-3.5" strokeWidth={2} />
        </button>

        {node.image && (
          <button
            type="button"
            tabIndex={-1}
            title="Görseli kaldır"
            aria-label="Görseli kaldır"
            onPointerDown={stopPointer}
            onClick={() => {
              setImageError("");
              onChange(node.id, { image: null });
            }}
            className={cn(
              "rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100",
              bodyClass,
            )}
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}
      </div>

      {imageError && (
        <p
          role="alert"
          className="shrink-0 border-b border-red-100 bg-red-50 px-2.5 py-1 text-[10px] leading-snug text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
        >
          {imageError}
        </p>
      )}

      <div
        data-card-image=""
        style={{ height: hasCaption ? CARD_IMAGE_HEIGHT : undefined }}
        className={cn(
          "relative flex min-h-0 items-center justify-center overflow-hidden",
          hasCaption
            ? "shrink-0 border-b border-neutral-200 dark:border-neutral-700"
            : "flex-1",
          !node.image && "bg-neutral-100 dark:bg-neutral-900",
        )}
        onPointerDown={(event) => {
          if (!node.image) stopPointer(event);
        }}
        onClick={handleImageActivate}
        onDoubleClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          if (isConnecting) return;
          if (locked) {
            onRequestReveal?.(node.id);
            return;
          }
          if (node.image) onPreviewImage?.(node.image);
        }}
      >
        {node.image ? (
          <>
            <img
              src={node.image}
              alt=""
              draggable={false}
              title={locked ? "Hassas görsel — tıkla" : "Çift tıkla — orijinal boyutta gör"}
              onError={() => setImageError("Görsel görüntülenemedi. Başka bir dosya dene.")}
              className={cn(
                "max-h-full max-w-full select-none object-contain",
                locked && "scale-110 blur-[10px] saturate-50",
                isConnecting ? "pointer-events-none" : locked ? "cursor-pointer" : "cursor-zoom-in",
              )}
            />
            {locked && (
              <div className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-red-950/45 text-white">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/90 text-lg font-bold shadow-[0_0_18px_rgba(220,38,38,0.85)]">
                  !
                </span>
                <span className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-red-100">
                  Hassas görsel
                </span>
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            tabIndex={-1}
            onPointerDown={stopPointer}
            onClick={openPicker}
            className={cn(
              "flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-medium",
              isSensitive
                ? "bg-[radial-gradient(circle_at_50%_40%,rgba(248,113,113,0.45),rgba(127,29,29,0.35))] text-red-700 dark:text-red-300"
                : "text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300",
              bodyClass,
            )}
          >
            <ImagePlus className="h-6 w-6" strokeWidth={1.75} />
            Görsel ekle
          </button>
        )}
      </div>

      {hasCaption && (
        <textarea
          ref={textareaRef}
          tabIndex={isSelected || isEditing ? 0 : -1}
          value={draft}
          data-undo-app="true"
          onPointerDown={stopPointer}
          onFocus={() => {
            setIsEditing(true);
            onSelect?.(node.id);
          }}
          onBlur={() => setIsEditing(false)}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            onChange(node.id, { text: next });
          }}
          placeholder="Görselin altına yaz..."
          aria-label="Görsel yazısı"
          className={cn(
            "min-h-0 flex-1 resize-none bg-transparent p-2.5 text-[12px] leading-relaxed text-neutral-800 outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500",
            bodyClass,
          )}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFilePicked}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
});

export const CardNode = ImageBlock;
