/**
 * A single coloured note on the map. Drag from the header, resize from the
 * corner, open the design menu to recolour or change the silhouette.
 *
 * Shapes: rounded rectangle, a long hexagon (three corners each side), oval.
 */

import { memo, useEffect, useRef, useState } from "react";
import { GripHorizontal, Palette } from "lucide-react";
import { cn } from "../../lib/cn";
import {
  NODE_KIND,
  NODE_SIZE,
  NOTE_COLOR,
  NOTE_MAX,
  NOTE_MIN,
  NOTE_SHAPE,
  NOTE_SHAPE_LABEL,
  NOTE_SHAPE_HINT,
  NOTE_SHAPE_PAINT,
  NOTE_SHAPE_TEXT,
  NOTE_SWATCH,
} from "./constants";
import {
  contentClip,
  contentInset,
  isPolygonalNote,
  pointsAttr,
  resolveNoteShape,
  shapePoints,
  documentPath,
  minAspect,
} from "./noteShape";

const stopPointer = (event) => event.stopPropagation();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const ShapeGlyph = ({ shape, className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    {shape === NOTE_SHAPE.RECTANGLE && (
      <rect x="3.5" y="6.5" width="17" height="11" rx="2.4" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.65" />
    )}
    {shape === NOTE_SHAPE.OVAL && (
      <ellipse cx="12" cy="12" rx="8.6" ry="5.8" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.65" />
    )}
    {shape === NOTE_SHAPE.PARALLELOGRAM && (
      <polygon points="7.5,6.5 21.5,6.5 16.5,17.5 2.5,17.5" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round" />
    )}
    {shape === NOTE_SHAPE.DIAMOND && (
      <polygon points="12,3.5 22,12 12,20.5 2,12" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round" />
    )}
    {shape === NOTE_SHAPE.DOCUMENT && (
      <path d="M3.5,5.5 H20.5 V16 Q16,20 12,16 Q8,12 3.5,16 Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round" />
    )}
    {shape === NOTE_SHAPE.HEXAGON && (
      <polygon
        points="5.2,7.2 18.8,7.2 22,12 18.8,16.8 5.2,16.8 2,12"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinejoin="round"
      />
    )}
  </svg>
);

const NoteFrame = ({ shape, width, height, color, selected }) => {
  const paint = NOTE_SHAPE_PAINT[color] ?? NOTE_SHAPE_PAINT[NOTE_COLOR.YELLOW];
  const resolved = resolveNoteShape(shape);
  const points = isPolygonalNote(resolved) ? shapePoints(resolved, width, height) : null;
  const stroke = selected ? 2.25 : 1.4;

  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("pointer-events-none absolute inset-0 overflow-visible drop-shadow-sm", paint)}
    >
      {resolved === NOTE_SHAPE.OVAL && (
        <ellipse
          cx={width / 2}
          cy={height / 2}
          rx={width / 2 - 1.4}
          ry={height / 2 - 1.4}
          fill="inherit"
          stroke="inherit"
          strokeWidth={stroke}
        />
      )}
      {resolved === NOTE_SHAPE.RECTANGLE && (
        <rect x="1.2" y="1.2" width={width - 2.4} height={height - 2.4} rx="14" fill="inherit" stroke="inherit" strokeWidth={stroke} />
      )}
      {resolved === NOTE_SHAPE.DOCUMENT && (
        <path d={documentPath(width, height)} fill="inherit" stroke="inherit" strokeWidth={stroke} strokeLinejoin="round" />
      )}
      {points && resolved !== NOTE_SHAPE.DOCUMENT && (
        <polygon points={pointsAttr(points)} fill="inherit" stroke="inherit" strokeWidth={stroke} strokeLinejoin="round" />
      )}
    </svg>
  );
};

export const NoteBlock = memo(function NoteBlock({
  node,
  highlight,
  zIndex = 10,
  isSelected,
  isConnecting,
  onPointerDown,
  onSelect,
  onChange,
  zoom = 1,
}) {
  const textareaRef = useRef(null);
  const menuRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState(node.text ?? "");
  const [liveSize, setLiveSize] = useState(null);
  const resizeRef = useRef(null);

  const defaults = NODE_SIZE[NODE_KIND.NOTE];
  const width = liveSize?.width ?? node.width ?? defaults.width;
  const height = liveSize?.height ?? node.height ?? defaults.height;
  const color = node.color ?? NOTE_COLOR.YELLOW;
  const shape = resolveNoteShape(node.shape);
  const inset = contentInset(shape, width, height);
  const clip = contentClip(shape, width, height);

  useEffect(() => {
    setDraft(node.text ?? "");
  }, [node.text]);

  useEffect(
    () => () => {
      const resize = resizeRef.current;
      if (!resize) return;
      window.removeEventListener("pointermove", resize.move);
      window.removeEventListener("pointerup", resize.up);
      window.removeEventListener("pointercancel", resize.up);
    },
    [],
  );

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDoc = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [menuOpen]);

  const applySize = (nextWidth, nextHeight) => {
    let nextW = clamp(nextWidth, NOTE_MIN.width, NOTE_MAX.width);
    const nextH = clamp(nextHeight, NOTE_MIN.height, NOTE_MAX.height);
    const aspect = minAspect(shape);
    if (aspect) {
      nextW = clamp(Math.max(nextW, Math.round(nextH * aspect)), NOTE_MIN.width, NOTE_MAX.width);
    }
    return { width: nextW, height: nextH };
  };

  const startResize = (event) => {
    if (event.button !== 0 || isConnecting) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect?.(node.id);

    const startX = event.clientX;
    const startY = event.clientY;
    const originW = width;
    const originH = height;
    const scale = zoom || 1;

    const move = (next) => {
      setLiveSize(applySize(originW + (next.clientX - startX) / scale, originH + (next.clientY - startY) / scale));
    };

    const up = (next) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      resizeRef.current = null;
      const size = applySize(originW + (next.clientX - startX) / scale, originH + (next.clientY - startY) / scale);
      setLiveSize(null);
      onChange(node.id, size);
    };

    resizeRef.current = { move, up };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const pickShape = (nextShape) => {
    const aspect = minAspect(nextShape);
    if (aspect) {
      const nextWidth = clamp(Math.max(width, Math.round(height * Math.max(aspect, 1.7))), NOTE_MIN.width, NOTE_MAX.width);
      onChange(node.id, { shape: nextShape, width: nextWidth, height });
    } else {
      onChange(node.id, { shape: nextShape });
    }
    setMenuOpen(false);
  };

  const bodyClass = isConnecting ? "pointer-events-none" : null;
  const textTone = NOTE_SHAPE_TEXT[color] ?? NOTE_SHAPE_TEXT[NOTE_COLOR.YELLOW];

  return (
    <div
      ref={menuRef}
      data-node-id={node.id}
      role="group"
      tabIndex={0}
      aria-label="Not"
      onPointerDown={(event) => onPointerDown(event, node)}
      onFocus={(event) => {
        if (event.target === event.currentTarget) onSelect?.(node.id);
      }}
      onKeyDown={(event) => {
        if (event.target instanceof HTMLTextAreaElement) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        onSelect?.(node.id);
        textareaRef.current?.focus();
      }}
      className={cn(
        "absolute",
        textTone,
        isEditing
          ? "ring-2 ring-neutral-400 ring-offset-2 ring-offset-white dark:ring-neutral-500 dark:ring-offset-neutral-950"
          : highlight,
      )}
      style={{
        left: node.x,
        top: node.y,
        width,
        height,
        zIndex: isEditing || menuOpen ? Math.max(zIndex, 22) : zIndex,
      }}
    >
      <NoteFrame shape={shape} width={width} height={height} color={color} selected={isSelected || isEditing} />

      <div
        className="relative flex h-full min-h-0 flex-col overflow-hidden"
        style={{
          paddingTop: inset.top,
          paddingRight: inset.right,
          paddingBottom: inset.bottom,
          paddingLeft: inset.left,
          clipPath: clip,
        }}
      >
        <div className="flex h-7 shrink-0 cursor-grab items-center gap-1 px-1.5 active:cursor-grabbing">
          <GripHorizontal className="h-3.5 w-3.5 shrink-0 opacity-40" strokeWidth={2} />
          <span className="mr-auto select-none text-[10px] font-semibold uppercase tracking-wide opacity-50">
            Not
          </span>
          <button
            type="button"
            tabIndex={-1}
            title="Tasarım"
            aria-label="Not tasarımı"
            aria-expanded={menuOpen}
            onPointerDown={stopPointer}
            onClick={() => {
              onSelect?.(node.id);
              setMenuOpen((open) => !open);
            }}
            className={cn(
              "rounded-md p-1 opacity-70 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10",
              menuOpen && "bg-black/5 opacity-100 dark:bg-white/10",
              bodyClass,
            )}
          >
            <Palette className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>

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
          placeholder="Notunu yaz..."
          aria-label="Not metni"
          className={cn(
            "min-h-0 flex-1 resize-none overflow-x-hidden overflow-y-auto break-words bg-transparent px-1.5 pb-2 text-[12px] leading-relaxed outline-none placeholder:opacity-40 [overflow-wrap:anywhere]",
            bodyClass,
          )}
        />
      </div>

      <button
        type="button"
        tabIndex={-1}
        title="Boyutu değiştir"
        aria-label="Notu büyüt veya küçült"
        onPointerDown={startResize}
        className={cn(
          "absolute bottom-0.5 right-0.5 z-10 h-4 w-4 cursor-nwse-resize",
          "before:absolute before:bottom-1 before:right-1 before:h-2 before:w-2 before:border-b-2 before:border-r-2 before:border-current before:opacity-30",
          bodyClass,
        )}
      />

      {menuOpen && (
        <div
          role="dialog"
          aria-label="Not tasarımı"
          onPointerDown={stopPointer}
          className="absolute right-0 top-8 z-50 w-[168px] rounded-xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        >
          <p className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            Renk
          </p>
          <div className="mb-2 flex flex-wrap gap-1.5 px-1">
            {Object.values(NOTE_COLOR).map((swatch) => (
              <button
                key={swatch}
                type="button"
                title="Renk"
                aria-label={`Not rengi ${swatch}`}
                aria-pressed={color === swatch}
                onClick={() => onChange(node.id, { color: swatch })}
                className={cn(
                  "h-4 w-4 rounded-full",
                  NOTE_SWATCH[swatch],
                  color === swatch && "ring-2 ring-neutral-500 ring-offset-1 dark:ring-neutral-300",
                )}
              />
            ))}
          </div>
          <p className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            Şekil
          </p>
          <div className="grid grid-cols-3 gap-1">
            {Object.values(NOTE_SHAPE).map((item) => (
              <button
                key={item}
                type="button"
                title={NOTE_SHAPE_HINT[item] ? `${NOTE_SHAPE_LABEL[item]} — ${NOTE_SHAPE_HINT[item]}` : NOTE_SHAPE_LABEL[item]}
                aria-label={NOTE_SHAPE_LABEL[item]}
                aria-pressed={shape === item}
                onClick={() => pickShape(item)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[9px] text-neutral-500 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800",
                  shape === item && "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100",
                )}
              >
                <ShapeGlyph shape={item} className="h-6 w-6" />
                {NOTE_SHAPE_LABEL[item]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
