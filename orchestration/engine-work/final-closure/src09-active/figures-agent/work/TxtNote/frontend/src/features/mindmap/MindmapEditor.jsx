/**
 * "Haritalandırmalı Not" — the mindmap note type.
 *
 * Owns the document (nodes and edges) and wires the component palette to the
 * canvas. Mounted keyed by tab id, so each note starts from its own saved map;
 * every change is pushed up through `onMindmapChange` and survives tab
 * switches the same way the other note types do.
 *
 * Palette drags are tracked here because they start in one pane and finish in
 * the other: the editor follows the pointer and asks the canvas to place the
 * item, since only the canvas knows where its own world sits.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createId } from "../../lib/id";
import { DOT_COLOR, NODE_KIND, NODE_SIZE, NOTE_COLOR, NOTE_SHAPE } from "./constants";
import { centerOf, insertIndexAlongPath, routePoints } from "./geometry";
import { MindmapCanvas } from "./MindmapCanvas";
import { MindmapHelp } from "./MindmapHelp";
import { MindmapPalette } from "./MindmapPalette";

/** Below this much travel the press counts as a click, not a drag. */
const DRAG_SLOP = 4;

const detachPinFromAllEdges = (edges, pinId) =>
  edges.map((edge) => ({
    ...edge,
    waypointIds: (edge.waypointIds ?? []).filter((id) => id !== pinId),
  }));

/**
 * Move a pin onto one arrow: first unhook it from every other rope, then
 * insert it on the closest stretch of the chosen path so several pins can
 * share a single line.
 */
const clipPinOntoEdge = (edges, nodes, pinId, edgeId) => {
  const pin = nodes.find((item) => item.id === pinId);
  const cleared = detachPinFromAllEdges(edges, pinId);
  const edge = cleared.find((item) => item.id === edgeId);
  if (!edge || !pin) return cleared;
  if (pinId === edge.sourceId || pinId === edge.targetId) return cleared;

  const source = nodes.find((item) => item.id === edge.sourceId);
  const target = nodes.find((item) => item.id === edge.targetId);
  if (!source || !target) return cleared;

  const others = edge.waypointIds ?? [];
  const waypointNodes = others
    .map((id) => nodes.find((item) => item.id === id))
    .filter(Boolean);
  const index = insertIndexAlongPath(routePoints(source, target, waypointNodes), centerOf(pin));
  const waypointIds = [...others.slice(0, index), pinId, ...others.slice(index)];

  return cleared.map((item) => (item.id === edgeId ? { ...item, waypointIds } : item));
};

export const MindmapEditor = ({ title, mindmap, onTitleChange, onMindmapChange }) => {
  const [nodes, setNodes] = useState(() => mindmap?.nodes ?? []);
  const [edges, setEdges] = useState(() => mindmap?.edges ?? []);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [activeEdgeKind, setActiveEdgeKind] = useState(null);
  // The palette item currently under the pointer, with its live position.
  const [drag, setDrag] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);

  // Filled in by the canvas: the only place that can turn a screen point into
  // a spot on the map.
  const canvasApi = useRef(null);
  // Tears down the window listeners of the drag in flight, if there is one.
  const releaseDragRef = useRef(null);
  // Live node drags stay off the app tree until the pointer is up.
  const liveMoveRef = useRef(false);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const emittedMindmapRef = useRef(null);
  const emittedSetRef = useRef(typeof WeakSet === "function" ? new WeakSet() : null);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  // Mirror every change up to the app, where the note actually lives.
  useEffect(() => {
    if (liveMoveRef.current) return;
    const next = { nodes, edges };
    emittedMindmapRef.current = next;
    emittedSetRef.current?.add(next);
    onMindmapChange(next);
    // The callback identity changes per parent render; the document is the signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  // Version restore (and any other parent rewrite) replaces the open map.
  // Our own emits are remembered in a WeakSet so a stale parent update cannot
  // rewind typing that has already happened locally.
  useEffect(() => {
    if (!mindmap || mindmap === emittedMindmapRef.current) return;
    if (emittedSetRef.current?.has(mindmap)) {
      emittedMindmapRef.current = mindmap;
      return;
    }
    if (mindmap.nodes === nodesRef.current && mindmap.edges === edgesRef.current) {
      emittedMindmapRef.current = mindmap;
      return;
    }
    const nextNodes = mindmap.nodes ?? [];
    const nextEdges = mindmap.edges ?? [];
    nodesRef.current = nextNodes;
    edgesRef.current = nextEdges;
    setNodes(nextNodes);
    setEdges(nextEdges);
    setSelectedNodeId(null);
    emittedMindmapRef.current = mindmap;
  }, [mindmap]);

  const addNode = useCallback((kind, position, options = {}) => {
    const size = NODE_SIZE[kind];
    if (!size) return;
    liveMoveRef.current = false;

    const extras =
      kind === NODE_KIND.DOT
        ? { color: DOT_COLOR.NEUTRAL, content: "" }
        : kind === NODE_KIND.NOTE
          ? { text: "", color: NOTE_COLOR.YELLOW, shape: NOTE_SHAPE.RECTANGLE, width: size.width, height: size.height }
          : kind === NODE_KIND.FILE
            ? { files: [] }
            : kind === NODE_KIND.IMAGE_CAPTION || kind === NODE_KIND.CARD
              ? { text: "" }
              : {};

    const node = {
      id: createId("node"),
      kind,
      ...extras,
      // The drop point becomes the node's centre, not its top-left corner.
      x: Math.round(position.x - size.width / 2),
      y: Math.round(position.y - size.height / 2),
    };

    const nextNodes = [...nodesRef.current, node];
    nodesRef.current = nextNodes;
    setNodes(nextNodes);
    setSelectedNodeId(node.id);

    if (kind === NODE_KIND.PIN && options.attachToEdgeId) {
      const nextEdges = clipPinOntoEdge(edgesRef.current, nextNodes, node.id, options.attachToEdgeId);
      edgesRef.current = nextEdges;
      setEdges(nextEdges);
    }
  }, []);

  const moveNodes = useCallback((moves, live = false) => {
    if (!moves?.length) return;
    liveMoveRef.current = Boolean(live);
    const byId = new Map(moves.map((move) => [move.id, move]));
    setNodes((current) => {
      const next = current.map((node) => {
        const pos = byId.get(node.id);
        return pos ? { ...node, x: pos.x, y: pos.y } : node;
      });
      nodesRef.current = next;
      return next;
    });
  }, []);

  const moveNode = useCallback(
    (nodeId, x, y, live = false) => {
      moveNodes([{ id: nodeId, x, y }], live);
    },
    [moveNodes],
  );

  const removeNodes = useCallback(
    (ids) => {
      const drop = new Set((ids ?? []).filter(Boolean));
      if (drop.size === 0) return;
      liveMoveRef.current = false;
      setNodes((current) => {
        const next = current.filter((node) => !drop.has(node.id));
        nodesRef.current = next;
        return next;
      });
      setEdges((current) => {
        const next = current
          .filter((edge) => !drop.has(edge.sourceId) && !drop.has(edge.targetId))
          .map((edge) => ({
            ...edge,
            waypointIds: (edge.waypointIds ?? []).filter((id) => !drop.has(id)),
          }));
        edgesRef.current = next;
        return next;
      });
      setSelectedNodeId((current) => (current && drop.has(current) ? null : current));
    },
    [],
  );

  const removeNode = useCallback(
    (nodeId) => {
      removeNodes([nodeId]);
    },
    [removeNodes],
  );

  const updateNode = useCallback((nodeId, patch) => {
    liveMoveRef.current = false;
    setNodes((current) => {
      const next = current.map((node) => (node.id === nodeId ? { ...node, ...patch } : node));
      nodesRef.current = next;
      return next;
    });
  }, []);

  const connectNodes = useCallback(
    (kind, sourceId, targetId) => {
      if (!kind || sourceId === targetId) return;
      const current = edgesRef.current;
      const alreadyThere = current.some(
        (edge) =>
          edge.kind === kind && edge.sourceId === sourceId && edge.targetId === targetId,
      );
      if (alreadyThere) return;
      const next = [
        ...current,
        { id: createId("edge"), kind, sourceId, targetId, label: "", waypointIds: [] },
      ];
      edgesRef.current = next;
      setEdges(next);
    },
    [],
  );

  const attachPinToEdge = useCallback(
    (pinId, edgeId, position) => {
      if (!pinId || !edgeId) return;
      liveMoveRef.current = false;
      const nodesNow = position
        ? nodesRef.current.map((node) => (node.id === pinId ? { ...node, ...position } : node))
        : nodesRef.current;
      const next = clipPinOntoEdge(edgesRef.current, nodesNow, pinId, edgeId);
      edgesRef.current = next;
      setEdges(next);
    },
    [],
  );

  const detachPin = useCallback(
    (pinId) => {
      if (!pinId) return;
      const held = edgesRef.current.some((edge) => (edge.waypointIds ?? []).includes(pinId));
      if (!held) return;
      liveMoveRef.current = false;
      const next = detachPinFromAllEdges(edgesRef.current, pinId);
      edgesRef.current = next;
      setEdges(next);
    },
    [],
  );

  const removeEdge = useCallback((edgeId) => {
    setEdges((current) => {
      const next = current.filter((edge) => edge.id !== edgeId);
      edgesRef.current = next;
      return next;
    });
  }, []);

  const updateEdgeLabel = useCallback((edgeId, label) => {
    setEdges((current) => {
      const next = current.map((edge) => (edge.id === edgeId ? { ...edge, label } : edge));
      edgesRef.current = next;
      return next;
    });
  }, []);

  /* -- palette → canvas ------------------------------------------------------ */

  /**
   * Listeners are wired here rather than from an effect: an effect only runs
   * after React commits, and a quick press can release before that, leaving
   * nothing listening for the pointer that is already up.
   */
  const startPaletteDrag = useCallback((item, event) => {
    const origin = { x: event.clientX, y: event.clientY };

    const hasTravelled = (moveEvent) =>
      Math.abs(moveEvent.clientX - origin.x) + Math.abs(moveEvent.clientY - origin.y) > DRAG_SLOP;

    const handleMove = (moveEvent) => {
      setDrag((current) =>
        current
          ? {
              ...current,
              x: moveEvent.clientX,
              y: moveEvent.clientY,
              moved: hasTravelled(moveEvent),
            }
          : current,
      );
    };

    const handleUp = (upEvent) => {
      releaseDragRef.current?.();
      setDrag(null);

      // A tap on an arrow arms or disarms the tool; a tap on a component drops
      // it in the middle of the view, where the eye already is.
      if (!hasTravelled(upEvent)) {
        if (item.entity === "edge") {
          setActiveEdgeKind((current) => (current === item.kind ? null : item.kind));
        } else {
          canvasApi.current?.dropItem(item.entity, item.kind, null);
        }
        return;
      }

      canvasApi.current?.dropItem(item.entity, item.kind, {
        x: upEvent.clientX,
        y: upEvent.clientY,
      });
    };

    releaseDragRef.current = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      releaseDragRef.current = null;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);

    setDrag({ ...item, ...origin, moved: false });
  }, []);

  const openHelp = useCallback(() => setHelpOpen(true), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);

  // A drag interrupted by the tab closing must not leave listeners behind.
  useEffect(
    () => () => {
      releaseDragRef.current?.();
    },
    [],
  );

  return (
    <div className="relative flex h-full flex-col">
      {/* Slim header: just the note's name, kept plain on purpose. */}
      <header className="shrink-0 border-b border-neutral-200 px-4 py-2.5 dark:border-neutral-800">
        <input
          type="text"
          value={title}
          data-undo-app="true"
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Harita adı"
          aria-label="Harita adı"
          className="w-full bg-transparent text-[16px] font-semibold text-neutral-900 outline-none placeholder:text-neutral-300 dark:text-neutral-50 dark:placeholder:text-neutral-600"
        />
      </header>

      <div className="flex min-h-0 flex-1">
        <MindmapPalette
          activeEdgeKind={activeEdgeKind}
          onItemPointerDown={startPaletteDrag}
          onHelpClick={openHelp}
        />
        <MindmapCanvas
          apiRef={canvasApi}
          nodes={nodes}
          edges={edges}
          activeEdgeKind={activeEdgeKind}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onEdgeToolChange={setActiveEdgeKind}
          onAddNode={addNode}
          onMoveNode={moveNode}
          onMoveNodes={moveNodes}
          onRemoveNode={removeNode}
          onRemoveNodes={removeNodes}
          onNodeChange={updateNode}
          onConnectNodes={connectNodes}
          onAttachPin={attachPinToEdge}
          onDetachPin={detachPin}
          onRemoveEdge={removeEdge}
          onEdgeLabelChange={updateEdgeLabel}
          shortcutsEnabled={!helpOpen}
        />
      </div>

      {/* Stand-in for the native drag image, which pointer drags do not have. */}
      {drag?.moved && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-900/90 px-3 py-1.5 text-[12px] font-medium text-white shadow-lg dark:bg-neutral-100/90 dark:text-neutral-900"
          style={{ left: drag.x, top: drag.y }}
        >
          {drag.label}
        </div>
      )}

      <MindmapHelp open={helpOpen} onClose={closeHelp} />
    </div>
  );
};
