/**
 * Picks the right shape for a node and works out how it should be highlighted.
 *
 * Nodes deliberately have no click handler: the canvas holds pointer capture
 * during a drag, which sends the native click to the canvas instead. Taps are
 * resolved there, on pointer up. Keyboard Enter/Space is handled on the node.
 */

import { memo } from "react";
import { ImageBlock } from "./CardNode";
import { DotNode } from "./DotNode";
import { FileBlock } from "./FileBlock";
import { NoteBlock } from "./NoteBlock";
import { PinNode } from "./PinNode";
import { NODE_KIND, isImageKind } from "./constants";

export const MindmapNode = memo(function MindmapNode({
  node,
  isSelected,
  isDragging,
  isPendingSource,
  isConnecting,
  isDotOpen,
  isOnSelectedEdge,
  revealed,
  pan,
  zoom,
  viewport,
  onPointerDown,
  onSelect,
  onActivate,
  onNodeChange,
  onPreviewImage,
  onDetachPin,
  onRequestReveal,
}) {
  const pinHighlight =
    isPendingSource
      ? "ring-2 ring-neutral-400 ring-offset-1 ring-offset-white dark:ring-neutral-500 dark:ring-offset-neutral-950"
      : isSelected
        ? "ring-2 ring-neutral-400 ring-offset-1 ring-offset-white dark:ring-neutral-500 dark:ring-offset-neutral-950"
        : null;

  const highlight = isPendingSource
    ? "ring-2 ring-neutral-400 ring-offset-2 ring-offset-white dark:ring-neutral-500 dark:ring-offset-neutral-950"
    : isSelected
      ? "ring-2 ring-neutral-400 ring-offset-2 ring-offset-white dark:ring-neutral-500 dark:ring-offset-neutral-950"
      : null;

  const zIndex = isDotOpen
    ? 40
    : node.kind === NODE_KIND.PIN
      ? isDragging
        ? 45
        : isSelected
          ? 41
          : 40
      : isDragging
        ? 30
        : isSelected
          ? 15
          : 10;

  if (node.kind === NODE_KIND.PIN) {
    return (
      <PinNode
        node={node}
        highlight={pinHighlight}
        zIndex={zIndex}
        isOnSelectedEdge={isOnSelectedEdge}
        onPointerDown={onPointerDown}
        onSelect={onSelect}
        onDetach={() => onDetachPin?.(node.id)}
      />
    );
  }

  if (node.kind === NODE_KIND.DOT) {
    return (
      <DotNode
        node={node}
        highlight={highlight}
        zIndex={zIndex}
        isOpen={isDotOpen}
        pan={pan}
        zoom={zoom}
        viewport={viewport}
        onPointerDown={onPointerDown}
        onSelect={onSelect}
        onActivate={onActivate}
        onChange={onNodeChange}
      />
    );
  }

  if (node.kind === NODE_KIND.NOTE) {
    return (
      <NoteBlock
        node={node}
        highlight={highlight}
        zIndex={zIndex}
        isSelected={isSelected}
        isConnecting={isConnecting}
        zoom={zoom}
        onPointerDown={onPointerDown}
        onSelect={onSelect}
        onChange={onNodeChange}
      />
    );
  }

  if (node.kind === NODE_KIND.FILE) {
    return (
      <FileBlock
        node={node}
        highlight={highlight}
        zIndex={zIndex}
        isConnecting={isConnecting}
        onPointerDown={onPointerDown}
        onSelect={onSelect}
        onChange={onNodeChange}
        onPreviewImage={onPreviewImage}
      />
    );
  }

  if (isImageKind(node.kind)) {
    return (
      <ImageBlock
        node={node}
        highlight={highlight}
        zIndex={zIndex}
        isSelected={isSelected}
        isConnecting={isConnecting}
        revealed={revealed}
        onPointerDown={onPointerDown}
        onSelect={onSelect}
        onChange={onNodeChange}
        onPreviewImage={onPreviewImage}
        onRequestReveal={onRequestReveal}
      />
    );
  }

  return (
    <ImageBlock
      node={node}
      highlight={highlight}
      zIndex={zIndex}
      isSelected={isSelected}
      isConnecting={isConnecting}
      revealed={revealed}
      onPointerDown={onPointerDown}
      onSelect={onSelect}
      onChange={onNodeChange}
      onPreviewImage={onPreviewImage}
      onRequestReveal={onRequestReveal}
    />
  );
});
