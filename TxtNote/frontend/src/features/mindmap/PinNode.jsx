/**
 * Pin: a tiny filled dark sphere. Clip it onto an arrow and drag to reroute
 * the line — around a card, off a different edge, wherever it needs to go.
 */

import { memo } from "react";
import { cn } from "../../lib/cn";
import { NODE_KIND, NODE_SIZE } from "./constants";

const SPHERE =
  "radial-gradient(circle at 32% 28%, #7a7a7a 0%, #3a3a3a 42%, #1a1a1a 72%, #111111 100%)";

/** Extra pixels around the 12px sphere so it is still easy to grab. */
const HIT_PAD = 4;

export const PinNode = memo(function PinNode({
  node,
  highlight,
  zIndex = 40,
  isOnSelectedEdge,
  onPointerDown,
  onSelect,
  onDetach,
}) {
  const size = NODE_SIZE[NODE_KIND.PIN];
  const hit = size.width + HIT_PAD * 2;

  const handleKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    onSelect?.(node.id);
  };

  return (
    <button
      type="button"
      data-node-id={node.id}
      data-pin=""
      title="Sürükle: oku bük. Başka oka bırak: taşı. Çift tık: ipi bırak."
      aria-label="İğne"
      onPointerDown={(event) => onPointerDown(event, node)}
      onDoubleClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        onDetach?.();
      }}
      onFocus={() => onSelect?.(node.id)}
      onKeyDown={handleKeyDown}
      className="absolute flex cursor-grab touch-none items-center justify-center active:cursor-grabbing"
      style={{
        left: node.x - HIT_PAD,
        top: node.y - HIT_PAD,
        width: hit,
        height: hit,
        zIndex,
      }}
    >
      <span
        aria-hidden="true"
        className={cn(
          "block rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.4)] ring-1 ring-black/40 dark:ring-white/25",
          highlight,
          isOnSelectedEdge &&
            !highlight &&
            "ring-2 ring-neutral-400 ring-offset-1 ring-offset-white dark:ring-neutral-400 dark:ring-offset-neutral-950",
        )}
        style={{
          width: size.width,
          height: size.height,
          background: SPHERE,
        }}
      />
    </button>
  );
});
