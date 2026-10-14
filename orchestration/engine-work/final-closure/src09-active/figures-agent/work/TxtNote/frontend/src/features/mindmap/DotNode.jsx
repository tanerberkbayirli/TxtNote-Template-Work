/**
 * İşaret yazı: a hollow ring whose colour says what kind of note is behind it.
 * Tapping it opens a speech bubble; the bubble flips so it stays on the canvas.
 * Blue dots also hold an outbound web link.
 */

import { memo, useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "../../lib/cn";
import { DOT_ARIA_LABEL, DOT_COLOR, NODE_KIND, NODE_SIZE } from "./constants";

/** What the ring around a dot says about its note. */
const DOT_TONES = {
  [DOT_COLOR.NEUTRAL]: "border-neutral-400 dark:border-neutral-500",
  [DOT_COLOR.BLUE]: "border-sky-400 dark:border-sky-300",
  [DOT_COLOR.RED]: "border-rose-400 dark:border-rose-300",
};

const COLOR_OPTIONS = [
  { value: DOT_COLOR.NEUTRAL, label: "Nötr — normal not", className: "bg-neutral-300" },
  { value: DOT_COLOR.BLUE, label: "Mavi — dış bağlantı var", className: "bg-sky-300" },
  { value: DOT_COLOR.RED, label: "Kırmızı — hassas içerik", className: "bg-rose-300" },
];

const POPOVER_WIDTH = 288;
const POPOVER_HEIGHT = { default: 220, blue: 310 };
const POPOVER_GAP = 14;
const EDGE_PAD = 12;

const POPOVER_CLASS = {
  "top-center": "bottom-[42px] left-1/2 -translate-x-1/2",
  "top-end": "bottom-[42px] right-[36px]",
  "top-start": "bottom-[42px] left-[36px]",
  "bottom-center": "top-[42px] left-1/2 -translate-x-1/2",
  "bottom-end": "top-[42px] right-[36px]",
  "bottom-start": "top-[42px] left-[36px]",
  "left-center": "right-[42px] top-1/2 -translate-y-1/2",
  "right-center": "left-[42px] top-1/2 -translate-y-1/2",
};

const TAIL_CLASS = {
  "top-center":
    "absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r",
  "top-end": "absolute -bottom-[7px] right-4 h-3 w-3 rotate-45 border-b border-r",
  "top-start": "absolute -bottom-[7px] left-4 h-3 w-3 rotate-45 border-b border-r",
  "bottom-center":
    "absolute -top-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t",
  "bottom-end": "absolute -top-[7px] right-4 h-3 w-3 rotate-45 border-l border-t",
  "bottom-start": "absolute -top-[7px] left-4 h-3 w-3 rotate-45 border-l border-t",
  "left-center":
    "absolute -right-[7px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t",
  "right-center":
    "absolute -left-[7px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l",
};

/**
 * Keep the bubble on the visible canvas: above by default, below near the top
 * edge, to the left near the right edge, to the right near the left edge.
 */
const placePopover = (node, pan, viewport, isBlue, zoom = 1) => {
  const dot = NODE_SIZE[NODE_KIND.DOT];
  const scale = zoom || 1;
  const viewX = node.x * scale + (pan?.x ?? 0);
  const viewY = node.y * scale + (pan?.y ?? 0);
  const vw = viewport?.width || 0;
  const vh = viewport?.height || 0;
  const height = (isBlue ? POPOVER_HEIGHT.blue : POPOVER_HEIGHT.default) * scale;
  const popW = POPOVER_WIDTH * scale;
  const dotW = dot.width * scale;
  const dotH = dot.height * scale;

  if (!vw || !vh) return "top-center";

  const spaceAbove = viewY;
  const spaceBelow = vh - (viewY + dotH);
  const spaceLeft = viewX;
  const spaceRight = vw - (viewX + dotW);
  const nearTop = spaceAbove < height + POPOVER_GAP + EDGE_PAD;
  const nearRight = viewX + dotW / 2 + popW / 2 > vw - EDGE_PAD;
  const nearLeft = viewX + dotW / 2 - popW / 2 < EDGE_PAD;

  if (nearTop && spaceBelow >= spaceAbove) {
    if (nearRight && !nearLeft) return "bottom-end";
    if (nearLeft && !nearRight) return "bottom-start";
    return "bottom-center";
  }

  if (nearRight && spaceLeft >= popW + POPOVER_GAP) return "left-center";
  if (nearLeft && spaceRight >= popW + POPOVER_GAP) return "right-center";
  if (nearRight) return "top-end";
  if (nearLeft) return "top-start";
  return "top-center";
};

/**
 * Only http(s) leaves the map. Protocol-less addresses get https:// so
 * "example.com" still counts as a link; javascript: and data: do not.
 */
const resolveHttpUrl = (value) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;

  try {
    const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.href;
  } catch {
    return null;
  }
};

export const DotNode = memo(function DotNode({
  node,
  highlight,
  zIndex = 10,
  isOpen,
  pan,
  zoom,
  viewport,
  onPointerDown,
  onSelect,
  onActivate,
  onChange,
}) {
  const color = node.color ?? DOT_COLOR.NEUTRAL;
  const size = NODE_SIZE[NODE_KIND.DOT];
  const isBlue = color === DOT_COLOR.BLUE;
  const href = isBlue ? resolveHttpUrl(node.url) : null;
  const placement = isOpen ? placePopover(node, pan, viewport, isBlue, zoom) : "top-center";
  const ariaLabel = DOT_ARIA_LABEL[color] ?? DOT_ARIA_LABEL[DOT_COLOR.NEUTRAL];
  const contentRef = useRef(null);
  const urlRef = useRef(null);
  const [contentDraft, setContentDraft] = useState(node.content ?? "");
  const [urlDraft, setUrlDraft] = useState(node.url ?? "");

  useEffect(() => {
    setContentDraft(node.content ?? "");
  }, [node.content]);

  useEffect(() => {
    setUrlDraft(node.url ?? "");
  }, [node.url]);

  const openLink = () => {
    if (!href) return;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const handleKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    onActivate?.(node.id);
  };

  return (
    <div
      data-node-id={node.id}
      onPointerDown={(event) => onPointerDown(event, node)}
      className="absolute"
      style={{ left: node.x, top: node.y, zIndex }}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={Boolean(isOpen)}
        title={ariaLabel}
        onFocus={() => onSelect?.(node.id)}
        onKeyDown={handleKeyDown}
        className={cn(
          "cursor-grab rounded-full border-[2.5px] bg-transparent active:cursor-grabbing",
          DOT_TONES[color],
          highlight,
        )}
        style={{ width: size.width, height: size.height }}
      />

      {isOpen && (
        <div
          onPointerDown={(event) => event.stopPropagation()}
          className={cn(
            "absolute w-72 rounded-xl border border-neutral-200 bg-white p-3 shadow-xl shadow-neutral-900/15 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40",
            POPOVER_CLASS[placement],
          )}
        >
          <span
            className={cn(
              TAIL_CLASS[placement],
              "border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800",
            )}
          />

          <textarea
            ref={contentRef}
            autoFocus={!isBlue}
            value={contentDraft}
            data-undo-app="true"
            onChange={(event) => {
              const next = event.target.value;
              setContentDraft(next);
              onChange(node.id, { content: next });
            }}
            placeholder="Bu nokta için not yaz..."
            aria-label="İşaret yazı notu"
            className="relative min-h-24 w-full resize-y bg-transparent text-[13px] leading-relaxed text-neutral-800 outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />

          {isBlue && (
            <div className="relative mt-2 space-y-1.5">
              <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                URL / Web bağlantısı
              </label>
              <input
                ref={urlRef}
                type="url"
                value={urlDraft}
                data-undo-app="true"
                autoFocus
                placeholder="https://örnek.com"
                aria-label="Dış bağlantı adresi"
                onChange={(event) => {
                  const next = event.target.value;
                  setUrlDraft(next);
                  onChange(node.id, { url: next });
                }}
                className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[12px] text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500"
              />
              {href ? (
                <button
                  type="button"
                  onClick={openLink}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-2.5 py-1.5 text-[12px] font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                >
                  <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Yeni sekmede aç
                </button>
              ) : (
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                  Geçerli bir http veya https adresi girince bağlantı açılır.
                </p>
              )}
            </div>
          )}

          <div className="relative mt-2 flex items-center gap-1.5 border-t border-neutral-100 pt-2 dark:border-neutral-700">
            <span className="mr-auto text-[11px] text-neutral-400 dark:text-neutral-500">Renk</span>
            {COLOR_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                title={option.label}
                aria-label={option.label}
                aria-pressed={color === option.value}
                onClick={() => onChange(node.id, { color: option.value })}
                className={cn(
                  "h-5 w-5 rounded-full ring-1 ring-neutral-300 dark:ring-neutral-600",
                  option.className,
                  color === option.value &&
                    "ring-2 ring-neutral-900 ring-offset-1 ring-offset-white dark:ring-neutral-100 dark:ring-offset-neutral-800",
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
