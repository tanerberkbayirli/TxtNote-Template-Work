/**
 * Tool panel on the left edge of the mindmap editor.
 *
 * Dragging is pointer-driven rather than HTML5 drag & drop: the native API
 * refuses to start a drag in several environments, and it has no touch story
 * at all. The editor tracks the pointer and hands the drop to the canvas.
 * A plain click — press and release without moving — still adds the item.
 */

import { AlertTriangle, Circle, File, HelpCircle, ImageIcon, ImagePlus, Shapes, StickyNote } from "lucide-react";
import { memo } from "react";
import { cn } from "../../lib/cn";
import { DOT_COLOR, EDGE_KIND, EDGE_LABELS, NODE_KIND } from "./constants";

/**
 * A miniature of the arrow the tool actually draws, so the three of them can
 * never be mistaken for one another.
 */
const ArrowPreview = ({ kind }) => {
  const markerId = `arrow-preview-${kind}`;
  const hasTail = kind !== EDGE_KIND.RIGHT;
  const hasHead = kind !== EDGE_KIND.LEFT;

  return (
    <svg viewBox="0 0 40 12" className="h-3 w-10" aria-hidden="true">
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="8"
          markerHeight="8"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 8 4 L 0 7 z" fill="currentColor" />
        </marker>
      </defs>
      <line
        x1="5"
        y1="6"
        x2="35"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        markerStart={hasTail ? `url(#${markerId})` : undefined}
        markerEnd={hasHead ? `url(#${markerId})` : undefined}
      />
    </svg>
  );
};

const DotPreview = () => (
  <span className="flex items-center gap-[3px]">
    {[DOT_COLOR.NEUTRAL, DOT_COLOR.BLUE, DOT_COLOR.RED].map((color) => (
      <span
        key={color}
        className={cn(
          "h-2 w-2 rounded-full border",
          color === DOT_COLOR.NEUTRAL && "border-neutral-400",
          color === DOT_COLOR.BLUE && "border-blue-500",
          color === DOT_COLOR.RED && "border-red-500",
        )}
      />
    ))}
  </span>
);

const PIN_SPHERE =
  "radial-gradient(circle at 32% 28%, #7a7a7a 0%, #2a2a2a 45%, #111111 75%, #050505 100%)";

const PinGlyph = ({ className, strokeWidth: _strokeWidth, ...props }) => (
  <span
    aria-hidden="true"
    className={cn(
      "inline-block rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.45)] ring-1 ring-black/50",
      className,
    )}
    style={{ background: PIN_SPHERE }}
    {...props}
  />
);

const SensitivePreview = () => (
  <span
    aria-hidden="true"
    className="relative flex h-4 w-4 items-center justify-center overflow-hidden rounded-full bg-red-400/80"
  >
    <span className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.35),transparent_70%)] blur-[1px]" />
    <span className="relative text-[9px] font-bold leading-none text-white">!</span>
  </span>
);

const IMAGE_ITEMS = [
  {
    kind: NODE_KIND.IMAGE_PLAIN,
    label: "Saf görsel",
    description: "Yalnızca görsel bloğu.",
    icon: ImageIcon,
    tile: "bg-violet-50 text-violet-400 dark:bg-violet-950/40 dark:text-violet-300",
    ring: "hover:border-violet-200 dark:hover:border-violet-800",
  },
  {
    kind: NODE_KIND.IMAGE_CAPTION,
    label: "Yazılı görsel",
    description: "Görselin altında yazı.",
    icon: ImagePlus,
    tile: "bg-indigo-50 text-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-300",
    ring: "hover:border-indigo-200 dark:hover:border-indigo-800",
  },
  {
    kind: NODE_KIND.IMAGE_SENSITIVE,
    label: "Uyarılı görsel",
    description: "Tıklanınca hassas içerik uyarısı.",
    icon: AlertTriangle,
    tile: "bg-rose-50 text-rose-400 dark:bg-rose-950/40 dark:text-rose-300",
    ring: "hover:border-rose-200 dark:hover:border-rose-800",
    preview: <SensitivePreview />,
  },
];

const OTHER_ITEMS = [
  {
    kind: NODE_KIND.NOTE,
    label: "Not",
    description: "Büyüt, küçült, rengini değiştir.",
    icon: StickyNote,
    tile: "bg-amber-50 text-amber-400 dark:bg-amber-950/40 dark:text-amber-300",
    ring: "hover:border-amber-200 dark:hover:border-amber-800",
  },
  {
    kind: NODE_KIND.FILE,
    label: "Dosya",
    description: "PDF, görsel ve diğer dosyaları bırak.",
    icon: File,
    tile: "bg-sky-50 text-sky-400 dark:bg-sky-950/40 dark:text-sky-300",
    ring: "hover:border-sky-200 dark:hover:border-sky-800",
  },
  {
    kind: NODE_KIND.DOT,
    label: "İşaret Yazı",
    description: "Tıklanınca not açan nokta. Rengi içeriğini anlatır.",
    icon: Circle,
    tile: "bg-rose-50 text-rose-400 dark:bg-rose-950/40 dark:text-rose-300",
    ring: "hover:border-rose-200 dark:hover:border-rose-800",
    preview: <DotPreview />,
  },
  {
    kind: NODE_KIND.PIN,
    label: "İğne",
    description: "Oka bağla; sürükleyerek oku yazının çevresinden dolandır.",
    icon: PinGlyph,
    tile: "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100",
    ring: "hover:border-neutral-400 dark:hover:border-neutral-500",
    preview: <PinGlyph className="h-2.5 w-2.5" />,
  },
];

const EDGE_ITEMS = [
  { kind: EDGE_KIND.RIGHT, ...EDGE_LABELS[EDGE_KIND.RIGHT] },
  { kind: EDGE_KIND.LEFT, ...EDGE_LABELS[EDGE_KIND.LEFT] },
  { kind: EDGE_KIND.BOTH, ...EDGE_LABELS[EDGE_KIND.BOTH] },
];

const ToolButton = ({ item, onPointerDown }) => {
  const { kind, label, description, icon: Icon, tile, ring, preview } = item;

  return (
    <button
      type="button"
      onPointerDown={(event) => onPointerDown(event, "node", kind, label)}
      className={cn(
        "group flex w-full cursor-grab touch-none select-none items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left shadow-sm transition-all",
        "hover:shadow-md active:cursor-grabbing active:scale-[0.99]",
        "dark:border-neutral-700 dark:bg-neutral-800",
        ring,
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
          tile,
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
            {label}
          </span>
          {preview}
        </span>
        <span className="mt-1 block text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">
          {description}
        </span>
      </span>
    </button>
  );
};

export const MindmapPalette = memo(function MindmapPalette({
  activeEdgeKind,
  onItemPointerDown,
  onHelpClick,
}) {
  const handlePointerDown = (event, entity, kind, label) => {
    if (event.button !== 0) return;
    event.preventDefault();
    onItemPointerDown({ entity, kind, label }, event);
  };

  return (
    <aside
      aria-label="Harita bileşenleri"
      className="flex w-64 shrink-0 flex-col overflow-y-auto border-r border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/60"
    >
      <div className="flex items-center gap-2 px-4 pb-3 pt-4">
        <Shapes
          className="h-4 w-4 text-neutral-500 dark:text-neutral-400"
          strokeWidth={2}
        />
        <span className="mr-auto text-[13px] font-semibold text-neutral-700 dark:text-neutral-200">
          Tuval Araçları
        </span>
        <button
          type="button"
          title="Yardım / Nasıl kullanılır?"
          aria-label="Yardım / Nasıl kullanılır?"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onHelpClick}
          className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        >
          <HelpCircle className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
        Görsel ekleme
      </p>

      <div className="flex flex-col gap-2 px-3">
        {IMAGE_ITEMS.map((item) => (
          <ToolButton key={item.kind} item={item} onPointerDown={handlePointerDown} />
        ))}
      </div>

      <p className="px-4 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
        Bileşenler
      </p>

      <div className="flex flex-col gap-2 px-3">
        {OTHER_ITEMS.map((item) => (
          <ToolButton key={item.kind} item={item} onPointerDown={handlePointerDown} />
        ))}
      </div>

      <p className="px-4 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
        Bağlantı Okları
      </p>

      <div className="flex flex-col gap-1.5 px-3 pb-4">
        {EDGE_ITEMS.map(({ kind, label, hint }) => {
          const isActive = activeEdgeKind === kind;

          return (
            <button
              key={kind}
              type="button"
              title={`${label} — ${hint}`}
              aria-pressed={isActive}
              onPointerDown={(event) => handlePointerDown(event, "edge", kind, label)}
              className={cn(
                "group flex cursor-grab touch-none select-none items-center gap-3 rounded-xl border px-2.5 py-2 text-left transition-all active:cursor-grabbing",
                isActive
                  ? "border-neutral-900 bg-neutral-100 shadow-sm dark:border-neutral-200 dark:bg-neutral-800"
                  : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-11 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
                  isActive
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "bg-neutral-100 text-neutral-600 dark:bg-neutral-700/60 dark:text-neutral-300",
                )}
              >
                <ArrowPreview kind={kind} />
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-[13px] font-semibold",
                    isActive
                      ? "text-sky-600 dark:text-sky-200"
                      : "text-neutral-800 dark:text-neutral-100",
                  )}
                >
                  {label}
                </span>
                <span className="mt-0.5 block text-[11px] text-neutral-500 dark:text-neutral-400">
                  {isActive ? "Seçili — iki öğeye tıkla" : hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
});
