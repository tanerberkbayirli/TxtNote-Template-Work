/**
 * Right-click format menu: size, colour, alignment, and independent emphasis.
 */

import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Underline, Strikethrough } from "lucide-react";
import { useRef, useState } from "react";
import { FORMAT_ALIGNS, FORMAT_COLORS, FORMAT_POINTS, FORMAT_SIZES } from "../../config/format";
import { MENU_EDGE_PADDING } from "../../config/layout";
import { useDismiss } from "../../hooks/useDismiss";
import { useIsomorphicLayoutEffect } from "../../hooks/useIsomorphicLayoutEffect";
import { cn } from "../../lib/cn";

const STYLE_OPTIONS = [
  { id: "bold", label: "Kalın", icon: Bold },
  { id: "italic", label: "İtalik", icon: Italic },
  { id: "underline", label: "Altı çizili", icon: Underline },
  { id: "overline", label: "Üstünden çiz", icon: Underline, flip: true },
  { id: "strike", label: "Ortadan çiz", icon: Strikethrough },
];

const ALIGN_ICONS = {
  left: AlignLeft,
  center: AlignCenter,
  right: AlignRight,
};

/**
 * @param {{
 *   isOpen: boolean,
 *   position: { x: number, y: number },
 *   activeFormat: { size: string, color: string, align?: string, bold: boolean, italic: boolean, strike: boolean },
 *   onPickSize: (size: string) => void,
 *   onPickColor: (color: string) => void,
 *   onPickAlign?: (align: "left" | "center" | "right") => void,
 *   onToggleStyle: (style: "bold" | "italic" | "strike" | "underline" | "overline") => void,
 *   onClearLines?: () => void,
 *   onClose: () => void,
 *   showAlign?: boolean,
 *   showPoints?: boolean,
 * }} props
 */
export const FormatContextMenu = ({
  isOpen,
  position,
  activeFormat,
  onPickSize,
  onPickColor,
  onPickAlign,
  onToggleStyle,
  onClearLines,
  onClose,
  showAlign = false,
  showPoints = false,
}) => {
  const menuRef = useRef(null);
  const [coords, setCoords] = useState(position);

  useDismiss(isOpen, menuRef, onClose);

  useIsomorphicLayoutEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const { offsetWidth, offsetHeight } = menuRef.current;
    setCoords({
      x: Math.max(
        MENU_EDGE_PADDING,
        Math.min(position.x, window.innerWidth - offsetWidth - MENU_EDGE_PADDING),
      ),
      y: Math.max(
        MENU_EDGE_PADDING,
        Math.min(position.y, window.innerHeight - offsetHeight - MENU_EDGE_PADDING),
      ),
    });
  }, [isOpen, position.x, position.y]);

  if (!isOpen) return null;

  const optionClass =
    "flex w-full items-center gap-2.5 rounded-[5px] px-2.5 py-2 text-[14px] transition-colors duration-100 focus-visible:outline-none";

  const keepSelection = (event) => event.preventDefault();

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Metin biçimlendirme"
      style={{ top: coords.y, left: coords.x }}
      className="fixed z-[100] w-56 origin-top-left rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40"
      onContextMenu={(event) => event.preventDefault()}
      onMouseDown={keepSelection}
    >
      <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        Boyut
      </p>
      {showPoints ? (
        <div className="mb-1 grid grid-cols-4 gap-1 px-1.5 pb-1">
          {FORMAT_POINTS.map(({ id, pt }) => (
            <button
              key={id}
              type="button"
              role="menuitemradio"
              aria-checked={activeFormat.size === id}
              title={`${pt} punto`}
              onClick={() => onPickSize(id)}
              className={cn(
                "h-8 rounded-[5px] text-[12px] tabular-nums transition-colors duration-100 focus-visible:outline-none",
                activeFormat.size === id
                  ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-50"
                  : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700",
              )}
            >
              {pt}
            </button>
          ))}
        </div>
      ) : null}
      {FORMAT_SIZES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="menuitemradio"
          aria-checked={activeFormat.size === id}
          onClick={() => onPickSize(id)}
          className={cn(
            optionClass,
            activeFormat.size === id
              ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-50"
              : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700",
          )}
        >
          <span
            className={cn(
              "flex-1 truncate text-left",
              id === "heading" && "text-[22px] leading-tight",
              id === "subheading" && "text-[17px] leading-snug",
              id === "body" && "text-[14px] leading-normal",
            )}
          >
            {label}
          </span>
        </button>
      ))}

      {showAlign ? (
        <>
          <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-700" />
          <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Hizalama
          </p>
          <div className="mb-0.5 flex gap-1 px-1.5 pb-1">
            {FORMAT_ALIGNS.map(({ id, label }) => {
              const Icon = ALIGN_ICONS[id];
              const isOn = (activeFormat.align ?? "left") === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="menuitemradio"
                  aria-label={label}
                  aria-checked={isOn}
                  title={label}
                  onClick={() => onPickAlign?.(id)}
                  className={cn(
                    "flex h-9 flex-1 items-center justify-center rounded-[5px] transition-colors duration-100 focus-visible:outline-none",
                    isOn
                      ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-50"
                      : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-700" />

      <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        Stil
      </p>
      {STYLE_OPTIONS.map(({ id, label, icon: Icon, flip }) => {
        const isOn = Boolean(activeFormat[id]);
        return (
          <button
            key={id}
            type="button"
            role="menuitemcheckbox"
            aria-checked={isOn}
            title={isOn ? `${label} · kaldır` : label}
            onClick={() => onToggleStyle(id)}
            className={cn(
              optionClass,
              isOn
                ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-50"
                : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700",
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", flip && "-scale-y-100")} strokeWidth={2} />
            <span
              className={cn(
                "flex-1 truncate text-left",
                id === "bold" && "font-bold",
                id === "italic" && "italic",
                id === "underline" && "underline underline-offset-2",
                id === "overline" && "overline",
                id === "strike" && "line-through",
              )}
            >
              {isOn ? `${label} · kaldır` : label}
            </span>
          </button>
        );
      })}
      {onClearLines && (activeFormat.strike || activeFormat.overline || activeFormat.underline) ? (
        <button
          type="button"
          role="menuitem"
          onClick={() => onClearLines()}
          className={cn(optionClass, "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700")}
        >
          <span className="flex-1 truncate text-left">Çizgileri kaldır</span>
        </button>
      ) : null}

      <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-700" />

      <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        Renk
      </p>
      {FORMAT_COLORS.map(({ id, label, swatch }) => (
        <button
          key={id}
          type="button"
          role="menuitemradio"
          aria-checked={activeFormat.color === id}
          onClick={() => onPickColor(id)}
          className={cn(
            optionClass,
            activeFormat.color === id
              ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-50"
              : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700",
          )}
        >
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 rounded-full border border-neutral-200 dark:border-neutral-600"
            style={{ backgroundColor: swatch }}
          />
          <span className="flex-1 truncate text-left">{label}</span>
        </button>
      ))}
    </div>
  );
};
