/**
 * Horizontal tab strip for the open items of the current workspace.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { TOP_STRIP_HEIGHT } from "../../config/layout";
import { ContentTab } from "./ContentTab";
import { cn } from "../../lib/cn";
import { hitEdgeFromRect } from "../workarea/dropTarget";
import { beginLiveDrag, clearDragItem } from "../workarea/drag";

const DRAG_THRESHOLD_PX = 6;

export const TabBar = ({
  tabs,
  activeTabId,
  onSelect,
  onClose,
  onReorder,
  onDropOnPane,
  sidebarCollapsed = false,
}) => {
  const listRef = useRef(null);
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [dropId, setDropId] = useState(null);
  const [dropPlace, setDropPlace] = useState("before");
  const [draggingId, setDraggingId] = useState(null);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [activeTabId, tabs.length]);

  const hintForPoint = useCallback((clientX) => {
    const nodes = [...(listRef.current?.querySelectorAll("[data-tab-id]") ?? [])];
    const over = nodes.find((node) => {
      const rect = node.getBoundingClientRect();
      return clientX >= rect.left && clientX <= rect.right;
    });
    if (!over) return { id: null, place: "before" };
    const rect = over.getBoundingClientRect();
    return {
      id: over.getAttribute("data-tab-id"),
      place: clientX < rect.left + rect.width / 2 ? "before" : "after",
    };
  }, []);

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
      setDraggingId(null);
      setDropId(null);
      clearDragItem();
      if (!drag?.moved) return;
      suppressClickRef.current = true;

      const x = event.clientX;
      const y = event.clientY;
      const hit = document.elementFromPoint(x, y);
      if (!listRef.current?.contains(hit)) {
        const overPane = hit?.closest("[data-leaf-id]");
        if (overPane && onDropOnPane) {
          const rect = overPane.getBoundingClientRect();
          const edge = hitEdgeFromRect({ x, y }, rect);
          onDropOnPane(drag.id, {
            leafId: overPane.getAttribute("data-leaf-id"),
            nodeId: overPane.getAttribute("data-leaf-id"),
            edge: edge === "center" ? "right" : edge,
          });
          return;
        }
      }

      const hint = hintForPoint(x);
      if (!onReorder || !hint.id || hint.id === drag.id) return;
      onReorder(drag.id, hint.id, hint.place);
    },
    [hintForPoint, onDropOnPane, onReorder, stopListening],
  );

  const startDrag = useCallback(
    (event, tab) => {
      if (event.button !== 0) return;
      if (event.target.closest('[data-tab-close="true"]')) return;

      const onMove = (moveEvent) => {
        const drag = dragRef.current;
        if (!drag) return;
        const dx = moveEvent.clientX - drag.x;
        const dy = moveEvent.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
        if (!drag.moved) {
          drag.moved = true;
          beginLiveDrag(drag.item);
        }
        setDraggingId(drag.id);
        const hint = hintForPoint(moveEvent.clientX);
        if (hint.id && hint.id !== drag.id) {
          setDropId(hint.id);
          setDropPlace(hint.place);
        } else {
          setDropId(null);
        }
      };

      const onUp = (upEvent) => endDrag(upEvent);

      stopListening();
      dragRef.current = {
        id: tab.id,
        item: tab,
        x: event.clientX,
        y: event.clientY,
        moved: false,
        onMove,
        onUp,
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [endDrag, hintForPoint, stopListening],
  );

  useEffect(() => () => stopListening(), [stopListening]);

  /**
   * The empty stretch of the bar closes the tab you are on. A drag that ends
   * out here still fires a click, so the same suppression the tabs use applies.
   */
  const closeOnBlankClick = useCallback(
    (event) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      if (event.target.closest("[data-tab-id]")) return;
      if (!activeTabId) return;
      onClose(activeTabId);
    },
    [activeTabId, onClose],
  );

  return (
    <nav
      ref={listRef}
      aria-label="Açık içerikler"
      onClick={closeOnBlankClick}
      title={activeTabId ? "Boş alana tıklayınca açık içerik kapanır" : undefined}
      className={cn(
        "flex shrink-0 items-end gap-1 overflow-x-auto border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900",
        TOP_STRIP_HEIGHT,
        sidebarCollapsed ? "pl-10" : "px-2",
      )}
    >
      {tabs.length === 0 ? (
        <p className="flex h-9 items-center px-1.5 text-[12px] text-neutral-400 dark:text-neutral-500">
          Açık içerik yok. Soldaki listeden birine tıkla.
        </p>
      ) : (
        tabs.map((tab) => (
          <ContentTab
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            isDragging={draggingId === tab.id}
            dropPlace={dropId === tab.id ? dropPlace : null}
            onSelect={(id) => {
              if (suppressClickRef.current) {
                suppressClickRef.current = false;
                return;
              }
              onSelect(id);
            }}
            onClose={onClose}
            onPointerDownTab={(event) => startDrag(event, tab)}
          />
        ))
      )}
    </nav>
  );
};
