/**
 * Right-click menu for a workspace row, with its edit flyout.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, Image as ImageIcon, Pencil, Pin, PinOff, Trash2, Type } from "lucide-react";
import { PinnedIndicator } from "../../components/ui/PinnedIndicator";
import { MENU_EDGE_PADDING, WORKSPACE_MENU_WIDTH, WORKSPACE_SUBMENU_WIDTH } from "../../config/layout";
import { WorkspaceBadge } from "./WorkspaceBadge";
import { useDismiss } from "../../hooks/useDismiss";
import { useIsomorphicLayoutEffect } from "../../hooks/useIsomorphicLayoutEffect";
import { cn } from "../../lib/cn";

export const WORKSPACE_SETTINGS_LABEL_ID = "workspace-settings-section";

/** Shared row shape for both the menu and its flyout. */
export const WORKSPACE_MENU_ITEM_CLASS =
  "flex w-full items-center gap-2.5 rounded-[5px] px-2.5 py-2 text-left text-[15px] leading-snug transition-colors duration-100 focus-visible:outline-none";

/**
 * Right-click surface for one workspace. Everything sits under a single
 * "Çalışma Ortamı Ayarları" section: pin, edit and delete, in that order.
 * Edit is a flyout, because the two things it changes — the name and the
 * picture — each open a dialog of their own.
 */
export const WorkspaceContextMenu = ({
  state,
  workspace,
  canDelete,
  onTogglePin,
  onRename,
  onChangeAvatar,
  onDelete,
  onClose,
}) => {
  const menuRef = useRef(null);
  const flyoutRef = useRef(null);
  const editTriggerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const [coords, setCoords] = useState(state.position);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editSide, setEditSide] = useState("right");
  const [editShift, setEditShift] = useState(0);

  useDismiss(state.isOpen, menuRef, onClose);

  // Each open starts collapsed, wherever the previous one was left.
  useEffect(() => {
    if (!state.isOpen) {
      setIsEditOpen(false);
      setEditShift(0);
    }
  }, [state.isOpen]);

  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);

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

  // The flyout opens to the right, and folds back over the menu only when the
  // right edge cannot take it and the left edge can.
  useIsomorphicLayoutEffect(() => {
    if (!isEditOpen) return;
    const fitsRight =
      coords.x + WORKSPACE_MENU_WIDTH + WORKSPACE_SUBMENU_WIDTH + MENU_EDGE_PADDING <=
      window.innerWidth;
    const fitsLeft = coords.x - WORKSPACE_SUBMENU_WIDTH >= MENU_EDGE_PADDING;
    setEditSide(!fitsRight && fitsLeft ? "left" : "right");
  }, [isEditOpen, coords.x]);

  // Lift the flyout back on screen when it opens near the bottom. The shift is
  // backed out of the measurement, so this settles after one pass.
  useIsomorphicLayoutEffect(() => {
    if (!isEditOpen || !flyoutRef.current) return;
    const rect = flyoutRef.current.getBoundingClientRect();

    setEditShift((previous) => {
      const top = rect.top - previous;
      const bottom = rect.bottom - previous;
      let next = 0;

      const overflow = bottom - (window.innerHeight - MENU_EDGE_PADDING);
      if (overflow > 0) next = -overflow;
      if (top + next < MENU_EDGE_PADDING) next = MENU_EDGE_PADDING - top;

      return Math.abs(next - previous) < 0.5 ? previous : next;
    });
  }, [isEditOpen, coords.y, editSide]);

  const openEdit = useCallback(() => {
    window.clearTimeout(closeTimerRef.current);
    setIsEditOpen(true);
  }, []);

  // A short grace period, so a diagonal slide into the flyout does not lose it.
  const scheduleCloseEdit = useCallback(() => {
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setIsEditOpen(false), 140);
  }, []);

  if (!state.isOpen || !workspace) return null;

  const run = (action) => {
    action(workspace.id);
    onClose();
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      openEdit();
      window.requestAnimationFrame(() => flyoutRef.current?.querySelector("button")?.focus());
      return;
    }
    if (event.key === "ArrowLeft") setIsEditOpen(false);
  };

  // ESC steps out of the flyout first; the menu itself stays put.
  const handleFlyoutKeyDown = (event) => {
    if (event.key !== "Escape" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    event.stopPropagation();
    setIsEditOpen(false);
    editTriggerRef.current?.focus();
  };

  const neutralItem =
    "text-neutral-700 hover:bg-neutral-100 focus-visible:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:bg-neutral-700";

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={`${workspace.name} çalışma ortamı işlemleri`}
      style={{ top: coords.y, left: coords.x, width: WORKSPACE_MENU_WIDTH }}
      className="fixed z-[100] origin-top-left rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40"
    >
      {/* Which workspace is being acted on — the menu can be opened from a row
          or from the header, so it says so rather than leaving it to memory. */}
      <div className="flex items-center gap-2.5 px-2.5 pb-2 pt-1.5">
        <WorkspaceBadge workspace={workspace} size="sm" tone="muted" />
        <span className="truncate text-[13px] font-medium text-neutral-800 dark:text-neutral-100">
          {workspace.name}
        </span>
        {workspace.isPinned && <PinnedIndicator />}
      </div>

      <div className="mx-1 h-px bg-neutral-200 dark:bg-neutral-700" />

      <div role="group" aria-labelledby={WORKSPACE_SETTINGS_LABEL_ID}>
        <p
          id={WORKSPACE_SETTINGS_LABEL_ID}
          className="px-2.5 pb-1 pt-2 text-[12px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500"
        >
          Çalışma Ortamı Ayarları
        </p>

        {/* 1 — pin */}
        <button
          type="button"
          role="menuitem"
          onClick={() => run(onTogglePin)}
          className={cn(WORKSPACE_MENU_ITEM_CLASS, neutralItem)}
        >
          {workspace.isPinned ? (
            <PinOff className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          ) : (
            <Pin className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          )}
          {workspace.isPinned ? "Sabitlemeyi Kaldır" : "Çalışma Ortamını Sabitle"}
        </button>

        {/* 2 — edit, with the two changeable things behind it */}
        <div className="relative" onMouseEnter={openEdit} onMouseLeave={scheduleCloseEdit}>
          <button
            ref={editTriggerRef}
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={isEditOpen}
            onClick={() => setIsEditOpen((open) => !open)}
            onKeyDown={handleTriggerKeyDown}
            className={cn(
              WORKSPACE_MENU_ITEM_CLASS,
              neutralItem,
              isEditOpen && "bg-neutral-100 dark:bg-neutral-700",
            )}
          >
            <Pencil className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span className="flex-1">Çalışma Ortamını Düzenle</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" strokeWidth={2} />
          </button>

          {isEditOpen && (
            // Padding, not margin: the gap stays inside the hover target, so the
            // pointer can cross it without the flyout closing underneath it.
            <div
              className={cn(
                "absolute top-0",
                editSide === "right" ? "left-full pl-1" : "right-full pr-1",
              )}
              style={{ transform: `translateY(${editShift}px)` }}
            >
              <div
                ref={flyoutRef}
                role="menu"
                aria-label="Çalışma Ortamını Düzenle"
                onKeyDown={handleFlyoutKeyDown}
                style={{ width: WORKSPACE_SUBMENU_WIDTH }}
                className="max-w-[calc(100vw-16px)] rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => run(onRename)}
                  className={cn(WORKSPACE_MENU_ITEM_CLASS, neutralItem)}
                >
                  <Type className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  Çalışma Ortamının Adını Değiştir
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => run(onChangeAvatar)}
                  className={cn(WORKSPACE_MENU_ITEM_CLASS, neutralItem)}
                >
                  <ImageIcon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  Çalışma Ortamının Profil Resmini Değiştir
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3 — delete */}
        <button
          type="button"
          role="menuitem"
          disabled={!canDelete}
          aria-disabled={!canDelete}
          title={canDelete ? undefined : "Son çalışma ortamı silinemez."}
          onClick={() => run(onDelete)}
          className={cn(
            WORKSPACE_MENU_ITEM_CLASS,
            "text-red-600 hover:bg-red-50 focus-visible:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:focus-visible:bg-red-500/10",
            "disabled:cursor-not-allowed disabled:text-neutral-400 disabled:hover:bg-transparent dark:disabled:text-neutral-600 dark:disabled:hover:bg-transparent",
          )}
        >
          <Trash2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Çalışma Ortamını Sil
        </button>
      </div>
    </div>
  );
};

/* ========================================================================== */
/*  Workspace name dialog (create + rename)                                    */
/* ========================================================================== */
