/**
 * The 2D work surface. Nodes live in world coordinates on a transformed
 * layer: pan slides the window, zoom scales around the pointer or the
 * control-panel centre.
 *
 * Pointer roles:
 *  - drag on empty background  → pan
 *  - right-drag                → marquee-select everything in the box
 *  - wheel                     → zoom
 *  - drag on a node            → move that node (or the whole selection)
 *  - press/release on a node   → activate it (connect, or open a dot)
 *  - Delete / Backspace        → remove the selected node(s) or arrow
 */

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, RotateCcw, X } from "lucide-react";
import { cn } from "../../lib/cn";
import {
  CLICK_PLACE_STEP,
  DOT_COLOR,
  NODE_KIND,
  NODE_SIZE,
  ZOOM_DEFAULT,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
} from "./constants";
import { closestEdgeId, closestEdgeMatch, edgesHoldingPin, nodeIntersectsRect, rectFromPoints } from "./geometry";
import { MindmapEdges } from "./MindmapEdge";
import { MindmapNode } from "./MindmapNode";

const GRID_SIZE = 24;
const GRID_DOT = "radial-gradient(circle, rgba(128, 128, 128, 0.28) 1px, transparent 1px)";
const CLICK_SLOP = 4;
const PIN_ATTACH_PX = 40;
const PIN_SWITCH_PX = 22;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const capturePointer = (element, pointerId) => {
  try {
    element.setPointerCapture(pointerId);
  } catch {
    /* pointer already released */
  }
};

const CanvasControls = memo(function CanvasControls({ zoom, onZoomIn, onZoomOut, onReset }) {
  const percent = `${Math.round(zoom * 100)}%`;

  return (
    <div
      data-canvas-ui=""
      className="absolute bottom-3 right-3 z-30 flex items-center gap-0.5 rounded-full border border-neutral-200 bg-white/95 p-1 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/95"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        title="Uzaklaştır"
        aria-label="Uzaklaştır"
        onClick={onZoomOut}
        className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
      <span
        aria-live="polite"
        aria-label={`Yakınlaştırma ${percent}`}
        className="min-w-[3.25rem] px-1 text-center text-[11px] font-semibold tabular-nums text-neutral-700 dark:text-neutral-200"
      >
        {percent}
      </span>
      <button
        type="button"
        title="Yakınlaştır"
        aria-label="Yakınlaştır"
        onClick={onZoomIn}
        className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
      <button
        type="button"
        title="Görünümü sıfırla"
        aria-label="Görünümü sıfırla"
        onClick={onReset}
        className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
    </div>
  );
});

export const MindmapCanvas = ({
  apiRef,
  nodes,
  edges,
  activeEdgeKind,
  selectedNodeId,
  onSelectNode,
  onEdgeToolChange,
  onAddNode,
  onMoveNode,
  onMoveNodes,
  onRemoveNode,
  onRemoveNodes,
  onRemoveEdge,
  onNodeChange,
  onConnectNodes,
  onAttachPin,
  onDetachPin,
  onEdgeLabelChange,
  shortcutsEnabled = true,
}) => {
  const hostRef = useRef(null);
  const worldRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [isPanning, setIsPanning] = useState(false);
  const [pendingConnection, setPendingConnection] = useState(null);
  const [openDotId, setOpenDotId] = useState(null);
  const [warningNodeId, setWarningNodeId] = useState(null);
  const [revealedSensitiveIds, setRevealedSensitiveIds] = useState(() => new Set());
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [hoverAttachEdgeId, setHoverAttachEdgeId] = useState(null);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [marquee, setMarquee] = useState(null);

  const dragRef = useRef(null);
  const didDragRef = useRef(false);
  const clickPlaceCountRef = useRef(0);
  const warningDialogRef = useRef(null);
  const cancelWarningRef = useRef(null);
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const selectedNodeIdRef = useRef(selectedNodeId);
  const selectedIdsRef = useRef(selectedIds);
  const activateRef = useRef(() => {});
  const viewRafRef = useRef(0);
  const handleKeyDownRef = useRef(() => {});
  const handlePointerMoveRef = useRef(() => {});
  const handlePointerUpRef = useRef(() => {});
  const nodeDragListenRef = useRef(null);

  panRef.current = pan;
  zoomRef.current = zoom;
  nodesRef.current = nodes;
  edgesRef.current = edges;
  selectedNodeIdRef.current = selectedNodeId;
  selectedIdsRef.current = selectedIds;

  useEffect(() => {
    if (!selectedNodeId) {
      setSelectedIds((current) => (current.size === 0 ? current : new Set()));
      return;
    }
    setSelectedIds((current) => {
      if (current.has(selectedNodeId)) return current;
      return new Set([selectedNodeId]);
    });
  }, [selectedNodeId]);

  const idsInRect = (rect) =>
    nodesRef.current.filter((node) => nodeIntersectsRect(node, rect)).map((node) => node.id);

  const applySelection = (ids) => {
    const next = new Set(ids);
    setSelectedIds(next);
    onSelectNode(ids[0] ?? null);
  };

  const overlayOpen = Boolean(previewImage || warningNodeId);

  const clientToWorld = useCallback((clientX, clientY) => {
    const host = hostRef.current;
    if (!host) return { x: 0, y: 0 };
    const rect = host.getBoundingClientRect();
    const scale = zoomRef.current || 1;
    return {
      x: (clientX - rect.left - panRef.current.x) / scale,
      y: (clientY - rect.top - panRef.current.y) / scale,
    };
  }, []);

  const pickAttachEdge = useCallback((worldPoint, pinId) => {
    const scale = zoomRef.current || 1;
    const held = pinId ? edgesHoldingPin(edgesRef.current, pinId) : [];
    const maxDist = (held.length ? PIN_SWITCH_PX : PIN_ATTACH_PX) / scale;
    return closestEdgeMatch(worldPoint, edgesRef.current, nodesRef.current, {
      maxDist,
      ignoreEdgeIds: held,
      ignorePinId: pinId,
    })?.id ?? null;
  }, []);

  const applyView = useCallback((nextPan, nextZoom) => {
    panRef.current = nextPan;
    zoomRef.current = nextZoom;
    const world = worldRef.current;
    const host = hostRef.current;
    if (world) {
      world.style.transform = `translate(${nextPan.x}px, ${nextPan.y}px) scale(${nextZoom})`;
    }
    if (host) {
      const size = GRID_SIZE * nextZoom;
      host.style.backgroundSize = `${size}px ${size}px`;
      host.style.backgroundPosition = `${nextPan.x}px ${nextPan.y}px`;
    }
  }, []);

  const commitView = useCallback(() => {
    setPan(panRef.current);
    setZoom(zoomRef.current);
  }, []);

  const zoomAt = useCallback(
    (clientX, clientY, nextZoom) => {
      const host = hostRef.current;
      if (!host) return;
      const z = clamp(nextZoom, ZOOM_MIN, ZOOM_MAX);
      const rect = host.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const current = zoomRef.current;
      const currentPan = panRef.current;
      const worldX = (px - currentPan.x) / current;
      const worldY = (py - currentPan.y) / current;
      const nextPan = { x: px - worldX * z, y: py - worldY * z };
      applyView(nextPan, z);
      if (viewRafRef.current) cancelAnimationFrame(viewRafRef.current);
      viewRafRef.current = requestAnimationFrame(() => {
        viewRafRef.current = 0;
        commitView();
      });
    },
    [applyView, commitView],
  );

  const zoomBy = useCallback(
    (delta) => {
      const host = hostRef.current;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, zoomRef.current + delta);
    },
    [zoomAt],
  );

  const resetView = useCallback(() => {
    applyView({ x: 0, y: 0 }, ZOOM_DEFAULT);
    setPan({ x: 0, y: 0 });
    setZoom(ZOOM_DEFAULT);
  }, [applyView]);

  useEffect(() => {
    setPendingConnection((current) => (current?.kind === activeEdgeKind ? current : null));
  }, [activeEdgeKind]);

  useEffect(() => {
    setSelectedEdgeId((current) =>
      current && edges.some((edge) => edge.id === current) ? current : null,
    );
  }, [edges]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof ResizeObserver === "undefined") return undefined;

    const measure = () => {
      const rect = host.getBoundingClientRect();
      setViewport({ width: rect.width, height: rect.height });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const onWheel = (event) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1 + ZOOM_STEP : 1 / (1 + ZOOM_STEP);
      zoomAt(event.clientX, event.clientY, zoomRef.current * factor);
    };

    host.addEventListener("wheel", onWheel, { passive: false });
    return () => host.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  useEffect(
    () => () => {
      if (viewRafRef.current) cancelAnimationFrame(viewRafRef.current);
      const release = nodeDragListenRef.current;
      if (release) {
        window.removeEventListener("pointermove", release.move);
        window.removeEventListener("pointerup", release.up);
        window.removeEventListener("pointercancel", release.up);
      }
    },
    [],
  );

  const startPan = (event) => {
    if (event.target.closest("[data-canvas-ui]")) return;
    if (event.button === 2) {
      event.preventDefault();
      const origin = clientToWorld(event.clientX, event.clientY);
      dragRef.current = {
        mode: "marquee",
        startX: event.clientX,
        startY: event.clientY,
        origin,
        pointerId: event.pointerId,
        captured: true,
      };
      didDragRef.current = false;
      capturePointer(hostRef.current, event.pointerId);
      setMarquee({ x: origin.x, y: origin.y, width: 0, height: 0 });
      return;
    }
    if (event.button !== 0) return;
    dragRef.current = {
      mode: "pan",
      startX: event.clientX,
      startY: event.clientY,
      origin: { ...panRef.current },
      pointerId: event.pointerId,
      captured: true,
    };
    didDragRef.current = false;
    capturePointer(hostRef.current, event.pointerId);
    setIsPanning(true);
    applySelection([]);
    setSelectedEdgeId(null);
    setOpenDotId(null);
  };

  const releaseNodeDragListen = () => {
    const release = nodeDragListenRef.current;
    if (!release) return;
    nodeDragListenRef.current = null;
    window.removeEventListener("pointermove", release.move);
    window.removeEventListener("pointerup", release.up);
    window.removeEventListener("pointercancel", release.up);
  };

  const startNodeDrag = useCallback(
    (event, node) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      const keepGroup = selectedIdsRef.current.has(node.id) && selectedIdsRef.current.size > 1;
      const ids = keepGroup ? [...selectedIdsRef.current] : [node.id];
      const origins = {};
      ids.forEach((id) => {
        const item = nodesRef.current.find((row) => row.id === id);
        if (item) origins[id] = { x: item.x, y: item.y };
      });
      dragRef.current = {
        mode: "node",
        id: node.id,
        ids,
        origins,
        startX: event.clientX,
        startY: event.clientY,
        originX: node.x,
        originY: node.y,
        pointerId: event.pointerId,
        captured: true,
      };
      didDragRef.current = false;
      if (!keepGroup) {
        applySelection([node.id]);
      } else {
        onSelectNode(node.id);
      }
      setSelectedEdgeId(null);
      if (node.kind !== NODE_KIND.DOT) setOpenDotId(null);
      capturePointer(event.currentTarget, event.pointerId);
      setDraggingNodeId(node.id);

      releaseNodeDragListen();
      const move = (next) => handlePointerMoveRef.current(next);
      const up = (next) => {
        releaseNodeDragListen();
        handlePointerUpRef.current(next);
      };
      nodeDragListenRef.current = { move, up };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    },
    [onSelectNode],
  );

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > CLICK_SLOP) didDragRef.current = true;

    if (didDragRef.current && !drag.captured) {
      capturePointer(hostRef.current, drag.pointerId);
      drag.captured = true;
      if (drag.mode === "node") setDraggingNodeId(drag.id);
    }

    if (drag.mode === "pan") {
      applyView({ x: drag.origin.x + dx, y: drag.origin.y + dy }, zoomRef.current);
      return;
    }

    if (drag.mode === "marquee") {
      const next = rectFromPoints(drag.origin, clientToWorld(event.clientX, event.clientY));
      setMarquee(next);
      if (didDragRef.current) setSelectedIds(new Set(idsInRect(next)));
      return;
    }

    if (!didDragRef.current) return;
    const scale = zoomRef.current || 1;
    const shiftX = dx / scale;
    const shiftY = dy / scale;
    const ids = drag.ids ?? [drag.id];
    const moves = ids
      .map((id) => {
        const origin = drag.origins?.[id] ?? (id === drag.id ? { x: drag.originX, y: drag.originY } : null);
        if (!origin) return null;
        return { id, x: origin.x + shiftX, y: origin.y + shiftY };
      })
      .filter(Boolean);
    if (onMoveNodes) onMoveNodes(moves, true);
    else onMoveNode(drag.id, drag.originX + shiftX, drag.originY + shiftY, true);

    const dragging = nodesRef.current.find((item) => item.id === drag.id);
    if (dragging?.kind === NODE_KIND.PIN && ids.length === 1) {
      const size = NODE_SIZE[NODE_KIND.PIN];
      const pos = moves[0];
      const world = pos
        ? { x: pos.x + size.width / 2, y: pos.y + size.height / 2 }
        : { x: drag.originX + shiftX + size.width / 2, y: drag.originY + shiftY + size.height / 2 };
      setHoverAttachEdgeId(pickAttachEdge(world, drag.id));
    }
  };

  const finishDrag = (event) => {
    releaseNodeDragListen();
    const captured =
      (event?.target instanceof Element && event.target) || hostRef.current;
    if (captured?.hasPointerCapture?.(event.pointerId)) {
      try {
        captured.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
    }
    if (hostRef.current?.hasPointerCapture?.(event.pointerId)) {
      try {
        hostRef.current.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
    }
    const drag = dragRef.current;
    dragRef.current = null;
    setIsPanning(false);
    setDraggingNodeId(null);
    setHoverAttachEdgeId(null);
    setMarquee(null);

    if (drag?.mode === "pan") commitView();
    if (drag?.mode === "marquee" && didDragRef.current && event) {
      const rect = rectFromPoints(drag.origin, clientToWorld(event.clientX, event.clientY));
      applySelection(idsInRect(rect));
      setSelectedEdgeId(null);
      setOpenDotId(null);
    }
    if (drag?.mode === "node" && didDragRef.current) {
      const scale = zoomRef.current || 1;
      const shiftX = event ? (event.clientX - drag.startX) / scale : 0;
      const shiftY = event ? (event.clientY - drag.startY) / scale : 0;
      const ids = drag.ids ?? [drag.id];
      const moves = ids
        .map((id) => {
          const origin = drag.origins?.[id] ?? (id === drag.id ? { x: drag.originX, y: drag.originY } : null);
          if (!origin) return null;
          return { id, x: origin.x + shiftX, y: origin.y + shiftY };
        })
        .filter(Boolean);
      if (moves.length) {
        if (onMoveNodes) onMoveNodes(moves, false);
        else if (moves[0]) onMoveNode(moves[0].id, moves[0].x, moves[0].y, false);
      }

      const node = nodesRef.current.find((item) => item.id === drag.id);
      if (node?.kind === NODE_KIND.PIN && event && ids.length === 1) {
        const size = NODE_SIZE[NODE_KIND.PIN];
        const last = moves[0];
        const world = last
          ? { x: last.x + size.width / 2, y: last.y + size.height / 2 }
          : clientToWorld(event.clientX, event.clientY);
        const edgeId = pickAttachEdge(world, drag.id);
        if (edgeId) onAttachPin?.(drag.id, edgeId, last ? { x: last.x, y: last.y } : null);
      }
    }

    return drag;
  };

  const cancelConnection = useCallback(() => {
    setPendingConnection(null);
    onEdgeToolChange(null);
  }, [onEdgeToolChange]);

  const activateNode = (node) => {
    if (activeEdgeKind) {
      if (!pendingConnection) {
        setPendingConnection({ kind: activeEdgeKind, sourceId: node.id });
        return;
      }
      if (pendingConnection.sourceId === node.id) {
        cancelConnection();
        return;
      }
      onConnectNodes(pendingConnection.kind, pendingConnection.sourceId, node.id);
      cancelConnection();
      return;
    }

    if (node.kind === NODE_KIND.IMAGE_SENSITIVE && node.image && !revealedSensitiveIds.has(node.id)) {
      setWarningNodeId(node.id);
      return;
    }

    if (node.kind !== NODE_KIND.DOT) return;
    if (openDotId === node.id) {
      setOpenDotId(null);
      return;
    }

    if ((node.color ?? DOT_COLOR.NEUTRAL) === DOT_COLOR.RED) setWarningNodeId(node.id);
    else setOpenDotId(node.id);
  };

  activateRef.current = activateNode;

  const handleActivate = useCallback((nodeId) => {
    const node = nodesRef.current.find((item) => item.id === nodeId);
    if (!node) return;
    onSelectNode(nodeId);
    activateRef.current(node);
  }, [onSelectNode]);

  const handleRequestReveal = useCallback((nodeId) => {
    const node = nodesRef.current.find((item) => item.id === nodeId);
    if (!node) return;
    onSelectNode(nodeId);
    if (node.kind === NODE_KIND.IMAGE_SENSITIVE && node.image && !revealedSensitiveIds.has(node.id)) {
      setWarningNodeId(node.id);
    }
  }, [onSelectNode, revealedSensitiveIds]);

  const handlePointerUp = (event) => {
    const drag = finishDrag(event);
    if (!drag || didDragRef.current) return;

    if (drag.mode === "pan" && activeEdgeKind) {
      cancelConnection();
      return;
    }

    if (drag.mode !== "node") return;

    const node = nodesRef.current.find((item) => item.id === drag.id);
    if (!node) return;
    activateNode(node);
  };

  const selectEdge = useCallback(
    (edgeId) => {
      const selected = nodesRef.current.find((item) => item.id === selectedNodeIdRef.current);
      if (selected?.kind === NODE_KIND.PIN && !activeEdgeKind) {
        onAttachPin?.(selected.id, edgeId);
      }
      setSelectedEdgeId(edgeId);
      onSelectNode(null);
      setOpenDotId(null);
      hostRef.current?.focus();
    },
    [activeEdgeKind, onAttachPin, onSelectNode],
  );

  useEffect(() => {
    if (!apiRef) return;

    apiRef.current = {
      dropItem(entity, kind, point) {
        const host = hostRef.current;
        if (!host) return;

        const rect = host.getBoundingClientRect();
        const target = point ?? {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };

        const isOverCanvas =
          target.x >= rect.left &&
          target.x <= rect.right &&
          target.y >= rect.top &&
          target.y <= rect.bottom;
        if (!isOverCanvas) return;

        if (entity === "edge") {
          const sourceId = document
            .elementFromPoint(target.x, target.y)
            ?.closest("[data-node-id]")?.dataset.nodeId;

          onEdgeToolChange(kind);
          setPendingConnection(sourceId ? { kind, sourceId } : null);
          return;
        }

        const origin = point ?? {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
        const scale = zoomRef.current || 1;
        const cascade = point ? 0 : clickPlaceCountRef.current * CLICK_PLACE_STEP;
        if (!point) clickPlaceCountRef.current += 1;

        const world = {
          x: (origin.x - rect.left - panRef.current.x) / scale,
          y: (origin.y - rect.top - panRef.current.y) / scale,
        };
        const attachToEdgeId =
          kind === NODE_KIND.PIN && point
            ? closestEdgeId(world, edgesRef.current, nodesRef.current, {
                maxDist: PIN_ATTACH_PX / scale,
              })
            : null;

        onAddNode(
          kind,
          {
            x: (origin.x - rect.left - panRef.current.x) / scale + cascade,
            y: (origin.y - rect.top - panRef.current.y) / scale + cascade,
          },
          attachToEdgeId ? { attachToEdgeId } : undefined,
        );
      },
    };
  });

  const closePreview = () => setPreviewImage(null);
  const closeWarning = () => setWarningNodeId(null);

  const confirmWarning = () => {
    const node = nodesRef.current.find((item) => item.id === warningNodeId);
    if (node?.kind === NODE_KIND.DOT) setOpenDotId(warningNodeId);
    if (node?.kind === NODE_KIND.IMAGE_SENSITIVE && warningNodeId) {
      setRevealedSensitiveIds((current) => {
        const next = new Set(current);
        next.add(warningNodeId);
        return next;
      });
    }
    setWarningNodeId(null);
  };

  useEffect(() => {
    if (!overlayOpen) return undefined;

    const onKey = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (previewImage) closePreview();
      else closeWarning();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayOpen, previewImage]);

  useEffect(() => {
    if (!warningNodeId) return undefined;

    const root = warningDialogRef.current;
    if (!root) return undefined;

    const focusables = () =>
      [...root.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")].filter(
        (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
      );

    const previouslyFocused = document.activeElement;
    const frame = window.requestAnimationFrame(() => cancelWarningRef.current?.focus());

    const onKeyDown = (event) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (!root.contains(active)) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown, true);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [warningNodeId]);

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      if (previewImage) {
        event.preventDefault();
        closePreview();
        return;
      }
      if (warningNodeId) {
        event.preventDefault();
        closeWarning();
        return;
      }
      setOpenDotId(null);
      setPendingConnection(null);
      setSelectedEdgeId(null);
      applySelection([]);
      onEdgeToolChange(null);
      return;
    }

    if (event.key !== "Delete" && event.key !== "Backspace") return;
    if (event.target.closest?.("[role='dialog']")) return;
    if (overlayOpen) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.target.closest?.("[data-canvas-ui]")) return;

    // Any node text you're actually editing owns Backspace/Delete — the
    // canvas-level "remove selection" shortcut only fires once you click
    // away and the node is merely selected, not being typed into.
    if (event.target.closest?.("input, textarea, [contenteditable]")) return;

    if (selectedEdgeId) {
      event.preventDefault();
      onRemoveEdge(selectedEdgeId);
      setSelectedEdgeId(null);
      hostRef.current?.focus();
      return;
    }

    const ids = [...selectedIdsRef.current];
    if (ids.length === 0 && !selectedNodeId) return;

    event.preventDefault();
    const drop = ids.length > 0 ? ids : [selectedNodeId];
    if (onRemoveNodes) onRemoveNodes(drop);
    else drop.forEach((id) => onRemoveNode(id));
    applySelection([]);
    setOpenDotId((current) => (current && drop.includes(current) ? null : current));
    hostRef.current?.focus();
  };

  handleKeyDownRef.current = handleKeyDown;
  handlePointerMoveRef.current = handlePointerMove;
  handlePointerUpRef.current = handlePointerUp;

  useEffect(() => {
    if (!shortcutsEnabled) return undefined;
    const onKey = (event) => handleKeyDownRef.current(event);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcutsEnabled]);

  const selectedWaypointIds = new Set(
    edges.find((edge) => edge.id === selectedEdgeId)?.waypointIds ?? [],
  );

  return (
    <div
      ref={hostRef}
      role="application"
      aria-label="Haritalandırma tuvali"
      tabIndex={0}
      onPointerDown={startPan}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={finishDrag}
      onContextMenu={(event) => event.preventDefault()}
      className={cn(
        "relative min-w-0 flex-1 touch-none overflow-hidden bg-white outline-none dark:bg-neutral-950",
        "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700",
        marquee ? "cursor-crosshair" : isPanning ? "cursor-grabbing" : "cursor-grab",
      )}
      style={{
        backgroundImage: GRID_DOT,
        backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      <div
        ref={worldRef}
        className={cn(
          "absolute left-0 top-0 origin-top-left",
          isPanning && "will-change-transform",
        )}
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        {nodes
          .filter((node) => node.kind !== NODE_KIND.PIN)
          .map((node) => (
          <MindmapNode
            key={node.id}
            node={node}
            isSelected={selectedIds.has(node.id)}
            isDragging={
              node.id === draggingNodeId ||
              (Boolean(draggingNodeId) && selectedIds.has(node.id) && selectedIds.has(draggingNodeId))
            }
            isPendingSource={pendingConnection?.sourceId === node.id}
            isConnecting={Boolean(activeEdgeKind)}
            isDotOpen={node.id === openDotId}
            isOnSelectedEdge={false}
            revealed={revealedSensitiveIds.has(node.id)}
            pan={node.id === openDotId ? pan : null}
            zoom={zoom}
            viewport={node.id === openDotId ? viewport : null}
            onPointerDown={startNodeDrag}
            onSelect={onSelectNode}
            onActivate={handleActivate}
            onNodeChange={onNodeChange}
            onPreviewImage={setPreviewImage}
            onRequestReveal={handleRequestReveal}
          />
        ))}

        <MindmapEdges
          edges={edges}
          nodes={nodes}
          selectedEdgeId={selectedEdgeId}
          hoverEdgeId={hoverAttachEdgeId}
          hitsEnabled={!draggingNodeId || nodes.find((item) => item.id === draggingNodeId)?.kind !== NODE_KIND.PIN}
          onSelectEdge={selectEdge}
          onLabelChange={onEdgeLabelChange}
        />

        {nodes
          .filter((node) => node.kind === NODE_KIND.PIN)
          .map((node) => (
          <MindmapNode
            key={node.id}
            node={node}
            isSelected={selectedIds.has(node.id)}
            isDragging={
              node.id === draggingNodeId ||
              (Boolean(draggingNodeId) && selectedIds.has(node.id) && selectedIds.has(draggingNodeId))
            }
            isPendingSource={pendingConnection?.sourceId === node.id}
            isConnecting={Boolean(activeEdgeKind)}
            isDotOpen={false}
            isOnSelectedEdge={selectedWaypointIds.has(node.id)}
            onPointerDown={startNodeDrag}
            onSelect={onSelectNode}
            onActivate={handleActivate}
            onNodeChange={onNodeChange}
            onDetachPin={onDetachPin}
          />
        ))}

        {marquee && marquee.width + marquee.height > 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-50 border border-neutral-500/80 bg-neutral-400/15 dark:border-neutral-300/70 dark:bg-white/10"
            style={{
              left: marquee.x,
              top: marquee.y,
              width: marquee.width,
              height: marquee.height,
            }}
          />
        )}
      </div>

      {activeEdgeKind && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-40 -translate-x-1/2 rounded-full border border-neutral-200 bg-white/95 px-4 py-2 text-[12px] font-medium text-neutral-600 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/95 dark:text-neutral-300">
          {pendingConnection
            ? "Hedef öğeye tıkla — iptal için kaynağa veya boş alana tıkla"
            : "Bağlantının başlayacağı ilk öğeye tıkla"}
        </div>
      )}

      <CanvasControls
        zoom={zoom}
        onZoomIn={() => zoomBy(ZOOM_STEP)}
        onZoomOut={() => zoomBy(-ZOOM_STEP)}
        onReset={resetView}
      />

      {warningNodeId && (
        <div
          ref={warningDialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sensitive-dot-title"
          className="absolute inset-0 z-50 flex items-center justify-center bg-neutral-950/35 p-6 backdrop-blur-[2px]"
          onPointerDown={(event) => {
            event.stopPropagation();
            if (event.target === event.currentTarget) closeWarning();
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-5 shadow-2xl dark:border-red-900 dark:bg-neutral-900"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-xl font-bold text-red-600 dark:bg-red-950 dark:text-red-400">
              !
            </div>
            <h2
              id="sensitive-dot-title"
              className="text-[16px] font-semibold text-neutral-900 dark:text-neutral-50"
            >
              Hassas içerik uyarısı
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              Bu öğede herkese uygun olmayabilecek görseller veya notlar var. Tıklamadan önce 2
              kez düşünün!
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                ref={cancelWarningRef}
                type="button"
                onClick={closeWarning}
                className="rounded-lg px-4 py-2 text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={confirmWarning}
                className="rounded-lg bg-red-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                Devam Et / Göster
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Görsel önizleme"
          className="absolute inset-0 z-[60] bg-neutral-950/75 backdrop-blur-[2px]"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            title="Kapat"
            aria-label="Kapat"
            onClick={closePreview}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-lg ring-1 ring-black/10 hover:bg-white dark:bg-neutral-800 dark:text-neutral-100 dark:ring-white/15 dark:hover:bg-neutral-700"
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>

          <div
            className="h-full w-full overflow-auto"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) closePreview();
            }}
          >
            <div
              className="flex min-h-full min-w-full items-center justify-center p-16"
              onPointerDown={(event) => {
                if (event.target === event.currentTarget) closePreview();
              }}
            >
              <img
                src={previewImage}
                alt="Kart görseli"
                className="max-w-none shrink-0 select-none shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {nodes.length === 0 && (
        <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-8 text-center text-[14px] text-neutral-400 dark:text-neutral-500">
          Soldaki panelden bir bileşeni buraya sürükle ya da üzerine tıkla.
        </p>
      )}
    </div>
  );
};
