/**
 * A single content row in the sidebar list.
 * Pointer-drag matches the tab bar: HTML5 drag from these buttons never
 * lands on the writing area in WebView2.
 *
 * One drag does two jobs. The middle of a folder row files the item inside
 * it; the top and bottom edges of any row put the item there in the list,
 * which is how rows move up and down.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Heart, Lock, MoreHorizontal } from "lucide-react";
import { FileTypeIcon, fileKindLabel } from "../../components/ui/FileTypeIcon";
import { PinnedIndicator } from "../../components/ui/PinnedIndicator";
import { UNTITLED_FOLDER, UNTITLED_NOTE } from "../../config/strings";
import { cn } from "../../lib/cn";
import { isFolderItem, MAX_FOLDER_DEPTH } from "../../lib/folder";
import { htmlToPlainText } from "../../lib/richText";
import { normalizeName } from "../../lib/text";
import { beginLiveDrag, clearDragItem } from "../workarea/drag";
import { hitEdgeFromRect } from "../workarea/dropTarget";

const DRAG_THRESHOLD_PX = 6;

/** How much of a row's height counts as "put it above / below me". */
const EDGE_BAND = 0.3;

/** Pixels one level of nesting shifts a row to the right. */
export const INDENT_STEP_PX = 16;

const ROW_PADDING_PX = 12;

/**
 * Reads the row under the pointer and decides what dropping there would mean:
 * `inside` a folder, or `before` / `after` a row in the list.
 */
export const dropHintFromPoint = (x, y, draggedId) => {
  const hit = document.elementFromPoint(x, y);
  if (!(hit instanceof Element)) return null;

  const row = hit.closest("[data-content-row]");
  if (!row) return null;

  const id = row.getAttribute("data-item-id");
  if (!id || id === draggedId) return null;

  const rect = row.getBoundingClientRect();
  if (rect.height < 1) return null;
  const offset = (y - rect.top) / rect.height;

  if (row.hasAttribute("data-folder-id")) {
    if (offset < EDGE_BAND) return { id, place: "before" };
    if (offset > 1 - EDGE_BAND) return { id, place: "after" };
    return { id, place: "inside" };
  }

  return { id, place: offset < 0.5 ? "before" : "after" };
};

export const ContentRow = ({
  item,
  isActive,
  onSelect,
  onContextMenu,
  depth = 0,
  isExpanded = false,
  onToggleExpand,
  isRenaming = false,
  onFocusRow,
  onRenameStart,
  onRenameCommit,
  onRenameCancel,
  dropPlace = null,
  onDropHint,
  onMoveIntoFolder,
  onMoveBeside,
  onUnfileItem,
  onDropOnPane,
  onActivate,
}) => {
  const folder = isFolderItem(item);
  const fallback = folder ? UNTITLED_FOLDER : UNTITLED_NOTE;
  const rowTitle = normalizeName(htmlToPlainText(item.title ?? "")) || fallback;
  const title = item.fileName ? `${rowTitle} · ${fileKindLabel(item)}` : rowTitle;
  const indent = Math.min(depth, MAX_FOLDER_DEPTH) * INDENT_STEP_PX;
  const inputRef = useRef(null);
  const rowRef = useRef(null);
  const renameDelayRef = useRef(null);
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [draft, setDraft] = useState(rowTitle === fallback ? "" : rowTitle);
  const [dragging, setDragging] = useState(false);

  useEffect(() => () => window.clearTimeout(renameDelayRef.current), []);

  useEffect(() => {
    if (!isRenaming) return;
    setDraft(rowTitle === fallback ? "" : rowTitle);
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isRenaming, rowTitle, fallback]);

  const stopListening = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    window.removeEventListener("pointermove", drag.onMove);
    window.removeEventListener("pointerup", drag.onUp);
    window.removeEventListener("pointercancel", drag.onUp);
  }, []);

  const endDrag = useCallback(
    (event) => {
      const drag = dragRef.current;
      stopListening();
      dragRef.current = null;
      setDragging(false);
      onDropHint?.(null);
      clearDragItem();
      if (!drag?.moved) return;
      suppressClickRef.current = true;
      window.clearTimeout(renameDelayRef.current);

      const x = event.clientX;
      const y = event.clientY;
      const hit = document.elementFromPoint(x, y);
      if (!(hit instanceof Element)) return;

      const overPane = hit.closest("[data-leaf-id]");
      const overSidebar = hit.closest("[data-sidebar]");
      if (overPane && !overSidebar && onDropOnPane) {
        const rect = overPane.getBoundingClientRect();
        const edge = hitEdgeFromRect({ x, y }, rect);
        onDropOnPane(drag.item.id, {
          leafId: overPane.getAttribute("data-leaf-id"),
          nodeId: overPane.getAttribute("data-leaf-id"),
          edge: edge === "center" ? "right" : edge,
        });
        return;
      }

      if (!overSidebar && onDropOnPane && hit.closest("main")) {
        onDropOnPane(drag.item.id, { leafId: null, nodeId: null, edge: "right" });
        return;
      }

      if (!overSidebar) return;

      const hint = dropHintFromPoint(x, y, drag.item.id);
      if (hint?.place === "inside") {
        onMoveIntoFolder?.(hint.id, drag.item.id);
        return;
      }
      if (hint) {
        onMoveBeside?.(drag.item.id, hint.id, hint.place);
        return;
      }
      // Empty sidebar space: the item leaves whatever folder it was in.
      if (drag.item.parentId) onUnfileItem?.(drag.item.id);
    },
    [onDropHint, onDropOnPane, onMoveBeside, onMoveIntoFolder, onUnfileItem, stopListening],
  );

  const startDrag = useCallback(
    (event) => {
      if (event.button !== 0 || isRenaming) return;
      if (event.target.closest('[aria-haspopup="menu"]')) return;

      const onMove = (moveEvent) => {
        const drag = dragRef.current;
        if (!drag) return;
        const dx = moveEvent.clientX - drag.x;
        const dy = moveEvent.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
        if (!drag.moved) {
          drag.moved = true;
          beginLiveDrag(drag.item);
          setDragging(true);
        }
        onDropHint?.(dropHintFromPoint(moveEvent.clientX, moveEvent.clientY, drag.item.id));
      };

      stopListening();
      dragRef.current = {
        item,
        x: event.clientX,
        y: event.clientY,
        moved: false,
        onMove,
        onUp: (upEvent) => endDrag(upEvent),
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", dragRef.current.onUp);
      window.addEventListener("pointercancel", dragRef.current.onUp);
    },
    [endDrag, isRenaming, item, onDropHint, stopListening],
  );

  useEffect(() => () => stopListening(), [stopListening]);

  useEffect(() => {
    const node = rowRef.current;
    if (!node) return;
    const onDown = (event) => startDrag(event);
    node.addEventListener("pointerdown", onDown);
    return () => node.removeEventListener("pointerdown", onDown);
  }, [startDrag]);

  const commitRename = () => {
    onRenameCommit?.(normalizeName(draft));
  };

  return (
    <div
      ref={rowRef}
      data-content-row=""
      data-item-id={item.id}
      data-folder-id={folder ? item.id : undefined}
      className={cn("group/row relative select-none", dragging && "opacity-50")}
      title={isRenaming ? undefined : title}
      onContextMenu={(event) => onContextMenu(event, item.id)}
    >
      {dropPlace === "before" && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-0.5 left-0 right-0 z-10 h-0.5 rounded-full bg-neutral-900 dark:bg-neutral-100"
        />
      )}
      {dropPlace === "after" && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-0.5 left-0 right-0 z-10 h-0.5 rounded-full bg-neutral-900 dark:bg-neutral-100"
        />
      )}

      <button
        type="button"
        title={isRenaming ? undefined : title}
        aria-current={isActive ? "true" : undefined}
        aria-expanded={folder ? isExpanded : undefined}
        style={{ paddingLeft: ROW_PADDING_PX + indent }}
        onFocus={() => onFocusRow?.(item.id)}
        onClick={() => {
          if (isRenaming) return;
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          window.clearTimeout(renameDelayRef.current);
          if (folder) onToggleExpand?.(item.id);
          if (isActive && !folder) {
            renameDelayRef.current = window.setTimeout(() => onRenameStart?.(item.id), 450);
            return;
          }
          onSelect(item);
        }}
        onDoubleClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          window.clearTimeout(renameDelayRef.current);
          if (!folder && onActivate) {
            onActivate(item);
            return;
          }
          onRenameStart?.(item.id);
        }}
        onKeyDown={(event) => {
          if (isRenaming) return;
          if (event.key === "F2") {
            event.preventDefault();
            onRenameStart?.(item.id);
          }
        }}
        className={cn(
          "flex h-10 w-full cursor-grab items-center gap-2.5 rounded-md pr-3 text-[15px] transition-colors duration-150 active:cursor-grabbing",
          "touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500",
          dropPlace === "inside" &&
            "bg-neutral-200/80 ring-1 ring-inset ring-neutral-400 dark:bg-neutral-800 dark:ring-neutral-500",
          isActive
            ? "bg-neutral-200/70 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
            : "text-neutral-600 group-hover/row:bg-neutral-200/50 group-hover/row:text-neutral-900 dark:text-neutral-400 dark:group-hover/row:bg-neutral-800/60 dark:group-hover/row:text-neutral-100",
        )}
      >
        {isActive && depth === 0 && (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-neutral-900 dark:bg-neutral-100" />
        )}

        <FileTypeIcon item={item} open={folder && isExpanded} className="h-[18px] w-[18px] shrink-0 opacity-80" />

        {isRenaming ? (
          <input
            ref={inputRef}
            value={draft}
            placeholder={fallback}
            aria-label="Dosya adı"
            onChange={(event) => setDraft(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                commitRename();
              } else if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                onRenameCancel?.();
              }
            }}
            className="min-w-0 flex-1 cursor-text bg-transparent text-left text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-50 dark:placeholder:text-neutral-500"
          />
        ) : (
          <span className="flex-1 truncate text-left">{rowTitle}</span>
        )}

        <span className="flex items-center gap-2 group-hover/row:invisible">
          {item.isPinned && <PinnedIndicator />}
          {item.isPrivate && (
            <Lock
              className="h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500"
              strokeWidth={2}
              aria-label="Gizli"
            />
          )}
          {item.isFavorite && (
            <Heart
              className="h-4 w-4 shrink-0 fill-rose-500/20 text-rose-500 dark:fill-rose-400/20 dark:text-rose-400"
              strokeWidth={2}
              aria-label="Favori"
            />
          )}
        </span>
      </button>

      <button
        type="button"
        aria-label={`${rowTitle} işlemleri`}
        aria-haspopup="menu"
        onClick={(event) => onContextMenu(event, item.id)}
        onPointerDown={(event) => event.stopPropagation()}
        className="invisible absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-300/60 hover:text-neutral-900 focus-visible:visible focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 group-hover/row:visible dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
};
