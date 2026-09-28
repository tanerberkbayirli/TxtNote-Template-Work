/**
 * Connection arrows between two nodes, drawn as one SVG layer.
 *
 * The layer sits *above* the nodes so an arrowhead resting on a card is never
 * hidden behind it. Pins sit higher still, so a sphere clipped onto the line
 * can be grabbed. Empty labels stay click-through so they do not cover cards.
 *
 * The drawing surface grows with the nodes rather than using a fixed square:
 * an SVG viewport clips whatever falls outside it, and nodes routinely sit
 * far from the origin once the canvas has been panned.
 */

import { memo, useState } from "react";
import { cn } from "../../lib/cn";
import { EDGE_KIND } from "./constants";
import { midpointOf, pathThrough, routePoints, sizeOf } from "./geometry";

/** Room around the node box for the curve, the arrowhead and a label chip. */
const BOUNDS_PAD = 240;

/**
 * Which ends carry a head. Screen position is ignored — only the tool the
 * user picked, and the A → B click order, decide.
 *
 * Path start is A (first click), path end is B (second click):
 *   A → B (İleri)  → head at B
 *   B → A (Geri)   → head at A
 *   A ↔ B (Çift)   → heads at both
 */
const arrowEnds = (kind) => ({
  head: kind === EDGE_KIND.RIGHT || kind === EDGE_KIND.BOTH,
  tail: kind === EDGE_KIND.LEFT || kind === EDGE_KIND.BOTH,
});

const drawingBounds = (nodes) => {
  if (nodes.length === 0) {
    return { minX: -BOUNDS_PAD, minY: -BOUNDS_PAD, width: BOUNDS_PAD * 2, height: BOUNDS_PAD * 2 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const size = sizeOf(node);
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + size.width);
    maxY = Math.max(maxY, node.y + size.height);
  });

  return {
    minX: minX - BOUNDS_PAD,
    minY: minY - BOUNDS_PAD,
    width: Math.max(1, maxX - minX + BOUNDS_PAD * 2),
    height: Math.max(1, maxY - minY + BOUNDS_PAD * 2),
  };
};

const waypointNodesOf = (edge, nodeMap) =>
  (edge.waypointIds ?? [])
    .map((id) => nodeMap.get(id))
    .filter(Boolean);

export const MindmapEdges = memo(function MindmapEdges({
  edges,
  nodes,
  selectedEdgeId,
  hoverEdgeId,
  hitsEnabled = true,
  onSelectEdge,
  onLabelChange,
}) {
  const [editingId, setEditingId] = useState(null);
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const bounds = drawingBounds(nodes);

  if (edges.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute z-20 overflow-visible"
      width={bounds.width}
      height={bounds.height}
      viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
      style={{ left: bounds.minX, top: bounds.minY }}
    >
      <defs>
        <marker
          id="mindmap-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="11"
          markerHeight="11"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 1 L 10 5 L 0 9 z"
            className="fill-neutral-600 stroke-white dark:fill-neutral-300 dark:stroke-neutral-950"
            strokeWidth="1"
          />
        </marker>
        <marker
          id="mindmap-arrow-active"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="11"
          markerHeight="11"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 1 L 10 5 L 0 9 z"
            className="fill-sky-400 stroke-white dark:fill-sky-300 dark:stroke-neutral-950"
            strokeWidth="1"
          />
        </marker>
      </defs>

      {edges.map((edge) => {
        const source = nodeMap.get(edge.sourceId);
        const target = nodeMap.get(edge.targetId);
        if (!source || !target) return null;

        const points = routePoints(source, target, waypointNodesOf(edge, nodeMap));
        const path = pathThrough(points);
        const mid = midpointOf(points);
        const { head, tail } = arrowEnds(edge.kind);
        const isSelected = edge.id === selectedEdgeId;
        const isHover = edge.id === hoverEdgeId && !isSelected;
        const isEditing = editingId === edge.id;
        const hasLabel = Boolean(edge.label);
        const marker = isSelected || isHover ? "url(#mindmap-arrow-active)" : "url(#mindmap-arrow)";

        const pickEdge = (event) => {
          event.stopPropagation();
          onSelectEdge?.(edge.id);
        };

        return (
          <g key={edge.id}>
            {/* Halo first: keeps the line readable where it crosses a picture. */}
            <path
              d={path}
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              className="stroke-white dark:stroke-neutral-950"
            />
            <path
              d={path}
              fill="none"
              stroke="currentColor"
              strokeWidth={isSelected || isHover ? 2.75 : 2}
              strokeLinecap="round"
              className={
                isSelected || isHover
                  ? "text-sky-400 dark:text-sky-300"
                  : "text-neutral-600 dark:text-neutral-300"
              }
              markerStart={tail ? marker : undefined}
              markerEnd={head ? marker : undefined}
            />
            {/* Wide invisible stroke: click selects, double-click edits the label. */}
            <path
              data-edge-id={edge.id}
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth="18"
              strokeLinecap="round"
              className="cursor-pointer"
              style={{ pointerEvents: hitsEnabled ? "stroke" : "none" }}
              onPointerDown={pickEdge}
              onDoubleClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                onSelectEdge?.(edge.id);
                setEditingId(edge.id);
              }}
            >
              <title>Seç; etiketi düzenlemek için çift tıkla. Silmek için Delete. İğne bağlamak için iğneyi bu oka sürükle.</title>
            </path>

            {(hasLabel || isEditing) && (
              <foreignObject x={mid.x - 70} y={mid.y - 16} width="140" height="32">
                <div className="pointer-events-auto flex h-8 items-center justify-center">
                  {isEditing ? (
                    <input
                      autoFocus
                      value={edge.label ?? ""}
                      data-undo-app="true"
                      aria-label="Bağlantı etiketi"
                      placeholder="Bağlantıyı anlat"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        onSelectEdge?.(edge.id);
                      }}
                      onChange={(event) => onLabelChange(edge.id, event.target.value)}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={(event) => {
                        event.stopPropagation();
                        if (event.key === "Enter" || event.key === "Escape") setEditingId(null);
                      }}
                      className="h-8 w-full rounded-full border border-blue-400 bg-white px-3 text-center text-[12px] text-neutral-800 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  ) : (
                    <button
                      type="button"
                      title="Etiketi düzenlemek için çift tıkla"
                      onPointerDown={pickEdge}
                      onDoubleClick={(event) => {
                        event.stopPropagation();
                        setEditingId(edge.id);
                      }}
                      className={cn(
                        "max-w-full truncate rounded-full bg-white/95 px-3 py-1 text-[12px] shadow-sm ring-1 dark:bg-neutral-900/95",
                        isSelected
                          ? "text-neutral-900 ring-neutral-300 dark:text-neutral-100 dark:ring-neutral-600"
                          : "text-neutral-700 ring-neutral-200 dark:text-neutral-200 dark:ring-neutral-700",
                      )}
                    >
                      {edge.label}
                    </button>
                  )}
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}
    </svg>
  );
});
