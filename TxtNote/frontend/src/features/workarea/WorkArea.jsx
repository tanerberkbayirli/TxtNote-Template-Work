/**
 * Tiled work area: drop a tab or sidebar item onto an edge to split the pane.
 * At most nine leaves. Divider between splits can be dragged to resize.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { CanvasMessage } from "../canvas/CanvasMessage";
// geçici denetleme barı — kullanıcı ikinci bir komut verene kadar gizli
// import { SyncTestPanel } from "../sync/SyncTestPanel";
import { cn } from "../../lib/cn";
import { DocumentPane } from "./DocumentPane";
import { getLiveDragItem, hasDragItem } from "./drag";
import { halfRect, resolveDropTarget } from "./dropTarget";
import { countLeaves, findLeafByTab, MAX_PANES } from "./layout";

const EDGE_LABEL = {
  pane: {
    left: "Sola böl",
    right: "Sağa böl",
    top: "Üste böl",
    bottom: "Alta böl",
    center: "Burada aç",
  },
  group: {
    left: "Grubun soluna",
    right: "Grubun sağına",
    top: "Grubun üstüne",
    bottom: "Grubun altına",
    center: "Burada aç",
  },
  area: {
    left: "Tüm alanın soluna",
    right: "Tüm alanın sağına",
    top: "Tüm alanın üstüne",
    bottom: "Tüm alanın altına",
    center: "Burada aç",
  },
};

const SplitGutter = ({ axis, ratio, onRatioDrag }) => {
  const dragRef = useRef(null);

  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const parent = event.currentTarget.parentElement;
    if (!parent) return;
    dragRef.current = {
      start: axis === "x" ? event.clientX : event.clientY,
      origin: ratio ?? 0.5,
      size: axis === "x" ? parent.clientWidth : parent.clientHeight,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    const delta = ((axis === "x" ? event.clientX : event.clientY) - drag.start) / drag.size;
    onRatioDrag(drag.origin + delta);
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div
      role="separator"
      aria-orientation={axis === "x" ? "vertical" : "horizontal"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        "z-10 shrink-0 touch-none bg-neutral-200 hover:bg-neutral-400 dark:bg-neutral-800 dark:hover:bg-neutral-600",
        axis === "x" ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize",
      )}
    />
  );
};

const DropHint = ({ hint, canSplit }) => {
  if (!hint?.preview || !hint.workRect) return null;
  const split = hint.edge !== "center";
  const blocked = split && !canSplit;
  const labels = EDGE_LABEL[hint.scope] ?? EDGE_LABEL.pane;
  const { preview, workRect } = hint;
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-30 rounded-md border-2 border-dashed transition-all duration-75",
        blocked
          ? "border-neutral-400 bg-neutral-300/70 dark:border-neutral-500 dark:bg-neutral-800/70"
          : "border-neutral-500 bg-neutral-400/40 dark:border-neutral-300 dark:bg-neutral-500/35",
      )}
      style={{
        left: preview.x - workRect.x,
        top: preview.y - workRect.y,
        width: preview.width,
        height: preview.height,
      }}
    >
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-neutral-600 shadow-sm dark:bg-neutral-900/90 dark:text-neutral-300">
        {blocked ? "En fazla 9 alan" : labels[hint.edge]}
      </span>
    </div>
  );
};

const LeafPane = ({
  leaf,
  tab,
  note,
  focused,
  onFocus,
  onProbe,
  onDropItem,
  onTitleChange,
  onContentChange,
  onNoteChange,
  onCreateAcademicFromTemplate,
  onReplaceFile,
  onExtractArchive,
}) => {
  return (
    <section
      data-leaf-id={leaf.id}
      onPointerDown={() => onFocus(leaf.tabId)}
      aria-current={focused ? "true" : undefined}
      onDragOverCapture={(event) => {
        if (!getLiveDragItem() && !hasDragItem(event)) return;
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "copy";
        onProbe(leaf.id, event);
      }}
      onDropCapture={(event) => {
        if (!getLiveDragItem() && !hasDragItem(event)) return;
        event.preventDefault();
        event.stopPropagation();
        onDropItem(leaf.id, event);
      }}
      className="relative flex h-full w-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white outline-none dark:bg-neutral-950"
    >
      <div className="h-full min-h-0 min-w-0 flex-1 overflow-hidden">
        <DocumentPane
          tab={tab}
          note={note}
          onTitleChange={onTitleChange}
          onContentChange={onContentChange}
          onNoteChange={onNoteChange}
          onCreateAcademicFromTemplate={onCreateAcademicFromTemplate}
          onReplaceFile={onReplaceFile}
          onExtractArchive={onExtractArchive}
        />
      </div>
    </section>
  );
};

const LayoutNode = ({
  node,
  tabsById,
  notes,
  focusedTabId,
  onFocus,
  onProbe,
  onDropItem,
  onRatioChange,
  onTitleChange,
  onContentChange,
  onNoteChange,
  onCreateAcademicFromTemplate,
  onReplaceFile,
  onExtractArchive,
}) => {
  if (!node) return null;

  if (node.kind === "leaf") {
    const tab = tabsById.get(node.tabId);
    return (
      <LeafPane
        leaf={node}
        tab={tab}
        note={notes[node.tabId]}
        focused={node.tabId === focusedTabId}
        onFocus={onFocus}
        onProbe={onProbe}
        onDropItem={onDropItem}
        onTitleChange={onTitleChange}
        onContentChange={onContentChange}
        onNoteChange={onNoteChange}
        onCreateAcademicFromTemplate={onCreateAcademicFromTemplate}
        onReplaceFile={onReplaceFile}
        onExtractArchive={onExtractArchive}
      />
    );
  }

  const ratio = node.ratio ?? 0.5;
  const horizontal = node.axis === "x";

  return (
    <div className={cn("flex h-full w-full min-h-0 min-w-0", horizontal ? "flex-row" : "flex-col")}>
      <div className="flex min-h-0 min-w-0 overflow-hidden" style={{ flex: `${ratio} 1 0%` }}>
        <LayoutNode
          key={node.a.id}
          node={node.a}
          tabsById={tabsById}
          notes={notes}
          focusedTabId={focusedTabId}
          onFocus={onFocus}
          onProbe={onProbe}
          onDropItem={onDropItem}
          onRatioChange={onRatioChange}
          onTitleChange={onTitleChange}
          onContentChange={onContentChange}
          onNoteChange={onNoteChange}
          onCreateAcademicFromTemplate={onCreateAcademicFromTemplate}
          onReplaceFile={onReplaceFile}
          onExtractArchive={onExtractArchive}
        />
      </div>
      <SplitGutter
        axis={node.axis}
        ratio={ratio}
        onRatioDrag={(next) => onRatioChange(node.id, next)}
      />
      <div className="flex min-h-0 min-w-0 overflow-hidden" style={{ flex: `${1 - ratio} 1 0%` }}>
        <LayoutNode
          key={node.b.id}
          node={node.b}
          tabsById={tabsById}
          notes={notes}
          focusedTabId={focusedTabId}
          onFocus={onFocus}
          onProbe={onProbe}
          onDropItem={onDropItem}
          onRatioChange={onRatioChange}
          onTitleChange={onTitleChange}
          onContentChange={onContentChange}
          onNoteChange={onNoteChange}
          onCreateAcademicFromTemplate={onCreateAcademicFromTemplate}
          onReplaceFile={onReplaceFile}
          onExtractArchive={onExtractArchive}
        />
      </div>
    </div>
  );
};

export const WorkArea = ({
  tree,
  tabs,
  notes,
  focusedTabId,
  onFocus,
  onDropOnLeaf,
  onDropEmpty,
  onRatioChange,
  onTitleChange,
  onContentChange,
  onNoteChange,
  onCreateAcademicFromTemplate,
  onReplaceFile,
  onExtractArchive,
  sync,
  planTier,
}) => {
  const tabsById = new Map(tabs.map((tab) => [tab.id, tab]));
  const canSplit = countLeaves(tree) < MAX_PANES;
  const areaRef = useRef(null);
  const treeRef = useRef(tree);
  const hintRef = useRef(null);
  const onDropOnLeafRef = useRef(onDropOnLeaf);
  const onDropEmptyRef = useRef(onDropEmpty);
  const [hint, setHint] = useState(null);
  const [emptyHover, setEmptyHover] = useState(false);
  treeRef.current = tree;
  hintRef.current = hint;
  onDropOnLeafRef.current = onDropOnLeaf;
  onDropEmptyRef.current = onDropEmpty;

  const workRectOf = () => {
    const box = areaRef.current?.getBoundingClientRect();
    if (!box) return null;
    return { x: box.left, y: box.top, width: box.width, height: box.height };
  };

  const payloadAt = useCallback((layout, leafId, clientX, clientY) => {
    if (!leafId) return null;
    const workRect = workRectOf();
    const room = countLeaves(layout) < MAX_PANES;
    if (!layout || !workRect) {
      return { leafId, nodeId: leafId, edge: room ? "right" : "center" };
    }
    const target = resolveDropTarget(layout, leafId, { x: clientX, y: clientY }, workRect);
    if (!target) return { leafId, nodeId: leafId, edge: room ? "right" : "center" };
    if (!room) return { leafId, nodeId: leafId, edge: "center" };
    if (target.edge === "center") {
      return { leafId, nodeId: leafId, edge: "right" };
    }
    return { leafId, nodeId: target.nodeId, edge: target.edge };
  }, []);

  const showHintAt = useCallback(
    (leafId, clientX, clientY) => {
      const dragging = getLiveDragItem();
      if (dragging?.id && findLeafByTab(tree, dragging.id)) {
        setHint(null);
        return;
      }
      const workRect = workRectOf();
      if (!workRect || !leafId) return;
      const target = resolveDropTarget(tree, leafId, { x: clientX, y: clientY }, workRect);
      if (!target?.preview) {
        setHint(null);
        return;
      }
      const room = countLeaves(tree) < MAX_PANES;
      if (!room) {
        setHint({ ...target, leafId, edge: "center", workRect });
        return;
      }
      if (target.edge === "center") {
        setHint({
          ...target,
          leafId,
          edge: "right",
          preview: halfRect(target.preview, "right"),
          workRect,
        });
        return;
      }
      setHint({ ...target, leafId, workRect });
    },
    [tree],
  );

  const probe = useCallback(
    (leafId, event) => {
      showHintAt(leafId, event.clientX, event.clientY);
    },
    [showHintAt],
  );

  useEffect(() => {
    const hitElement = (event) => {
      const raw = document.elementFromPoint(event.clientX, event.clientY) ?? event.target;
      return raw instanceof Element ? raw : raw?.parentElement ?? null;
    };

    const onMove = (event) => {
      if (!getLiveDragItem()) return;
      const hit = hitElement(event);
      const overArea = Boolean(areaRef.current?.contains(hit));
      if (event.type === "dragover" && overArea) {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
      }
      if (!overArea) {
        setHint(null);
        return;
      }
      const leaf = hit?.closest("[data-leaf-id]");
      if (!leaf) {
        setHint(null);
        return;
      }
      showHintAt(leaf.getAttribute("data-leaf-id"), event.clientX, event.clientY);
    };

    const onDrop = (event) => {
      if (!getLiveDragItem()) return;
      const hit = hitElement(event);
      if (hit?.closest("[data-sidebar], [data-content-row], [data-unfile], [data-tab-id]")) return;

      const area = areaRef.current;
      const lastHint = hintRef.current;
      const overArea = Boolean(area && hit && (area.contains(hit) || hit === area));
      if (!overArea && !lastHint) return;

      event.preventDefault();
      event.stopPropagation();
      setHint(null);

      const layout = treeRef.current;
      if (!layout) {
        onDropEmptyRef.current?.(event);
        return;
      }

      const leafId =
        hit?.closest("[data-leaf-id]")?.getAttribute("data-leaf-id") ?? lastHint?.leafId;
      const payload =
        payloadAt(layout, leafId, event.clientX, event.clientY) ??
        (lastHint
          ? { leafId: lastHint.leafId, nodeId: lastHint.nodeId, edge: lastHint.edge }
          : null);
      if (!payload) return;
      onDropOnLeafRef.current?.(payload, event);
    };

    const onEnd = () => {
      window.setTimeout(() => setHint(null), 0);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("dragover", onMove);
    window.addEventListener("drop", onDrop, true);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("dragend", onEnd);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("dragover", onMove);
      window.removeEventListener("drop", onDrop, true);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("dragend", onEnd);
    };
  }, [payloadAt, showHintAt]);

  const handleEmptyOver = useCallback((event) => {
    if (!hasDragItem(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setEmptyHover(true);
  }, []);

  if (!tree) {
    return (
      <div
        ref={areaRef}
        className="relative h-full"
        onDragOver={handleEmptyOver}
        onDragLeave={() => setEmptyHover(false)}
        onDrop={(event) => {
          event.preventDefault();
          setEmptyHover(false);
          onDropEmpty(event);
        }}
      >
        <CanvasMessage heading="Henüz bir içerik açmadın">
          Soldaki listeden bir içeriğe tıkla; yukarıda sekme olarak açılır. Bir sekmeyi veya
          dosyayı buraya sürükleyerek de açabilirsin.
        </CanvasMessage>
        {emptyHover && (
          <div className="pointer-events-none absolute inset-2 z-20 rounded-md border-2 border-dashed border-neutral-400/80 bg-neutral-900/8 dark:border-neutral-500 dark:bg-white/10">
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-neutral-600 shadow-sm dark:bg-neutral-900/90 dark:text-neutral-300">
              Burada aç
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={areaRef}
        className="relative flex min-h-0 flex-1 overflow-hidden"
        onDragLeave={(event) => {
          const next = event.relatedTarget;
          if (next && areaRef.current?.contains(next)) return;
          window.requestAnimationFrame(() => {
            const el = document.elementFromPoint(event.clientX, event.clientY);
            if (!areaRef.current?.contains(el)) setHint(null);
          });
        }}
      >
        <LayoutNode
          node={tree}
          tabsById={tabsById}
          notes={notes}
          focusedTabId={focusedTabId}
          onFocus={onFocus}
          onProbe={probe}
          onDropItem={(leafId, event) => {
            const payload = payloadAt(tree, leafId, event.clientX, event.clientY) ?? {
              leafId,
              nodeId: leafId,
              edge: "right",
            };
            setHint(null);
            onDropOnLeaf(payload, event);
          }}
          onRatioChange={onRatioChange}
          onTitleChange={onTitleChange}
          onContentChange={onContentChange}
          onNoteChange={onNoteChange}
          onCreateAcademicFromTemplate={onCreateAcademicFromTemplate}
          onReplaceFile={onReplaceFile}
          onExtractArchive={onExtractArchive}
        />
        <DropHint hint={hint} canSplit={canSplit} />
      </div>
      {/* geçici denetleme barı — kullanıcı ikinci bir komut verene kadar gizli
      {sync && (
        <SyncTestPanel
          lanes={sync.lanes}
          peerDebounceMs={sync.peerDebounceMs}
          networkErrorEnabled={sync.networkErrorEnabled}
          onToggleNetworkError={() => sync.setNetworkErrorEnabled(!sync.networkErrorEnabled)}
          onSkipCloud={sync.skipCloudInterval}
          planTier={planTier}
          onPlanTierChange={sync.onPlanTierChange}
        />
      )}
      */}
    </div>
  );
};
