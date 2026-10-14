/**
 * Right-click menu for a content row, including cloud version history.
 */

import React, { useEffect, useRef, useState } from "react";
import { ChevronRight, Columns2, FolderMinus, History, Pencil, Pin, PinOff, Plus, RotateCcw, Trash2 } from "lucide-react";
import { services } from "@shared/services";
import { ITEM_MENU_WIDTH, MENU_EDGE_PADDING, NOTE_CREATE_SUBMENU_WIDTH, NOTE_HISTORY_SUBMENU_WIDTH } from "../../config/layout";
import { useDismiss } from "../../hooks/useDismiss";
import { useIsomorphicLayoutEffect } from "../../hooks/useIsomorphicLayoutEffect";
import { cn } from "../../lib/cn";
import { isFolderItem } from "../../lib/folder";
import { NOTE_TYPE_OPTIONS } from "./noteTypes";

const HISTORY_DATE = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const menuItemClass =
  "flex w-full items-center gap-2.5 rounded-[5px] px-2.5 py-2 text-[15px] transition-colors duration-100 focus-visible:outline-none";

export const ItemContextMenu = ({
  state,
  item,
  onTogglePin,
  onDelete,
  onRestoreVersion,
  onRename,
  onOpenBeside,
  onRemoveFromFolder,
  onCreateInside,
  onClose,
}) => {
  const menuRef = useRef(null);
  const [coords, setCoords] = useState(state.position);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySide, setHistorySide] = useState("right");
  const [createOpen, setCreateOpen] = useState(false);
  const [createSide, setCreateSide] = useState("right");
  const [versions, setVersions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useDismiss(state.isOpen, menuRef, onClose);

  useEffect(() => {
    if (!state.isOpen) {
      setHistoryOpen(false);
      setCreateOpen(false);
      setVersions([]);
    }
  }, [state.isOpen]);

  useIsomorphicLayoutEffect(() => {
    if (!state.isOpen || !menuRef.current) return;
    const { offsetWidth, offsetHeight } = menuRef.current;
    setCoords({
      x: Math.max(
        MENU_EDGE_PADDING,
        Math.min(state.position.x, window.innerWidth - offsetWidth - MENU_EDGE_PADDING),
      ),
      y: Math.max(
        MENU_EDGE_PADDING,
        Math.min(state.position.y, window.innerHeight - offsetHeight - MENU_EDGE_PADDING),
      ),
    });
  }, [state.isOpen, state.position.x, state.position.y]);

  // Both flyouts open to the right unless the window has run out of room.
  const sideFor = (width) => {
    const menuWidth = menuRef.current?.firstElementChild?.offsetWidth ?? ITEM_MENU_WIDTH;
    const fitsRight = coords.x + menuWidth + width + MENU_EDGE_PADDING <= window.innerWidth;
    const fitsLeft = coords.x - width >= MENU_EDGE_PADDING;
    return !fitsRight && fitsLeft ? "left" : "right";
  };

  useIsomorphicLayoutEffect(() => {
    if (!historyOpen) return;
    setHistorySide(sideFor(NOTE_HISTORY_SUBMENU_WIDTH));
  }, [historyOpen, coords.x]);

  useIsomorphicLayoutEffect(() => {
    if (!createOpen) return;
    setCreateSide(sideFor(NOTE_CREATE_SUBMENU_WIDTH));
  }, [createOpen, coords.x]);

  useEffect(() => {
    if (!state.isOpen || !item || item.type !== "document") return undefined;
    let cancelled = false;

    const load = () => {
      setHistoryLoading(true);
      services.sync
        .listHistory(item.id)
        .then((rows) => {
          if (!cancelled) setVersions(rows);
        })
        .catch(() => {
          if (!cancelled) setVersions([]);
        })
        .finally(() => {
          if (!cancelled) setHistoryLoading(false);
        });
    };

    load();
    const id = window.setInterval(load, 1500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [state.isOpen, item]);

  if (!state.isOpen || !item) return null;

  const showHistory = item.type === "document" && typeof onRestoreVersion === "function";
  const showCreateInside = isFolderItem(item) && typeof onCreateInside === "function";

  const submenuLeft = (side, width) =>
    side === "right" ? coords.x + ITEM_MENU_WIDTH + 6 : coords.x - width - 6;

  return (
    <div ref={menuRef} className="fixed left-0 top-0 z-[100]">
      <div
        role="menu"
        aria-label={`${item.title} işlemleri`}
        style={{ top: coords.y, left: coords.x, width: ITEM_MENU_WIDTH }}
        className="fixed z-[100] origin-top-left rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40"
      >
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onTogglePin(item.id);
            onClose();
          }}
          className={cn(
            menuItemClass,
            "text-neutral-700 hover:bg-neutral-100 focus-visible:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:bg-neutral-700",
          )}
        >
          {item.isPinned ? <PinOff className="h-4 w-4" strokeWidth={1.75} /> : <Pin className="h-4 w-4" strokeWidth={1.75} />}
          {item.isPinned ? "Sabitlemeyi kaldır" : "Sabitle"}
        </button>

        {showCreateInside && (
          <button
            type="button"
            role="menuitem"
            aria-expanded={createOpen}
            onClick={() => {
              // Hover has already opened it; a click must not toggle it shut.
              setCreateOpen(true);
              setHistoryOpen(false);
            }}
            onMouseEnter={() => {
              setCreateOpen(true);
              setHistoryOpen(false);
            }}
            className={cn(
              menuItemClass,
              "justify-between text-neutral-700 hover:bg-neutral-100 focus-visible:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:bg-neutral-700",
            )}
          >
            <span className="flex items-center gap-2.5">
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              Yeni içerik ekle
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-neutral-400" strokeWidth={2} />
          </button>
        )}

        {onRename && (
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onRename(item.id);
              onClose();
            }}
            className={cn(
              menuItemClass,
              "text-neutral-700 hover:bg-neutral-100 focus-visible:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:bg-neutral-700",
            )}
          >
            <Pencil className="h-4 w-4" strokeWidth={1.75} />
            Yeniden adlandır
          </button>
        )}

        {onOpenBeside && !isFolderItem(item) && (
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onOpenBeside(item);
              onClose();
            }}
            className={cn(
              menuItemClass,
              "text-neutral-700 hover:bg-neutral-100 focus-visible:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:bg-neutral-700",
            )}
          >
            <Columns2 className="h-4 w-4" strokeWidth={1.75} />
            Yanında aç
          </button>
        )}

        {item.parentId && onRemoveFromFolder && (
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onRemoveFromFolder(item.id);
              onClose();
            }}
            className={cn(
              menuItemClass,
              "text-neutral-700 hover:bg-neutral-100 focus-visible:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:bg-neutral-700",
            )}
          >
            <FolderMinus className="h-4 w-4" strokeWidth={1.75} />
            Çıkart
          </button>
        )}

        {showHistory && (
          <button
            type="button"
            role="menuitem"
            aria-expanded={historyOpen}
            onClick={() => {
              setHistoryOpen((open) => !open);
              setCreateOpen(false);
            }}
            onMouseEnter={() => {
              setHistoryOpen(true);
              setCreateOpen(false);
            }}
            className={cn(
              menuItemClass,
              "justify-between text-neutral-700 hover:bg-neutral-100 focus-visible:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:bg-neutral-700",
            )}
          >
            <span className="flex items-center gap-2.5">
              <History className="h-4 w-4" strokeWidth={1.75} />
              Not Geçmişi
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-neutral-400" strokeWidth={2} />
          </button>
        )}

        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onDelete(item.id);
            onClose();
          }}
          className={cn(
            menuItemClass,
            "text-red-600 hover:bg-red-50 focus-visible:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:focus-visible:bg-red-500/10",
          )}
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          Sil
        </button>
      </div>

      {showHistory && historyOpen && (
        <div
          role="menu"
          aria-label="Not geçmişi"
          style={{
            top: coords.y,
            left: submenuLeft(historySide, NOTE_HISTORY_SUBMENU_WIDTH),
            width: NOTE_HISTORY_SUBMENU_WIDTH,
          }}
          className="fixed z-[101] max-h-72 origin-top-left overflow-y-auto rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40"
        >
          <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Not Geçmişi
          </p>
          {historyLoading && versions.length === 0 && (
            <p className="px-2.5 py-2 text-[12px] text-neutral-500 dark:text-neutral-400">Yükleniyor…</p>
          )}
          {!historyLoading && versions.length === 0 && (
            <p className="px-2.5 py-2 text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
              Henüz bulut yedeği yok. Ağ yedeklemesi çalışınca sürümler burada görünür.
            </p>
          )}
          {versions.map((version) => (
            <button
              key={version.id}
              type="button"
              role="menuitem"
              onClick={() => {
                onRestoreVersion(item.id, version);
                onClose();
              }}
              className={cn(
                menuItemClass,
                "justify-between text-[13px] text-neutral-700 hover:bg-neutral-100 focus-visible:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:bg-neutral-700",
              )}
            >
              <span className="tabular-nums">{HISTORY_DATE.format(version.createdAt)}</span>
              <RotateCcw className="h-3.5 w-3.5 text-neutral-400" strokeWidth={2} />
            </button>
          ))}
        </div>
      )}

      {showCreateInside && createOpen && (
        <div
          role="menu"
          aria-label={`${item.title} içine yeni içerik`}
          style={{
            top: coords.y,
            left: submenuLeft(createSide, NOTE_CREATE_SUBMENU_WIDTH),
            width: NOTE_CREATE_SUBMENU_WIDTH,
          }}
          className="fixed z-[101] max-h-[70vh] origin-top-left overflow-y-auto rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40"
        >
          <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Bu dosyanın içine
          </p>
          {NOTE_TYPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <React.Fragment key={option.noteType}>
                {option.dividerBefore && (
                  <div
                    role="separator"
                    className="mx-2 my-1.5 h-px bg-neutral-300 dark:bg-neutral-600"
                  />
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onCreateInside(item.id, option.noteType);
                    onClose();
                  }}
                  className="flex w-full items-start gap-3 rounded-[5px] px-2.5 py-2.5 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  <Icon
                    className="mt-0.5 h-[18px] w-[18px] shrink-0 text-neutral-500 dark:text-neutral-400"
                    strokeWidth={1.75}
                  />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-medium text-neutral-800 dark:text-neutral-100">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
                      {option.description}
                    </span>
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};
