import React from "react";
import LayoutContextMenu from "./LayoutContextMenu.jsx";

const HANDLE_POSITIONS = {
  nw: { left: "0%", top: "0%" }, n: { left: "50%", top: "0%" }, ne: { left: "100%", top: "0%" },
  e: { left: "100%", top: "50%" }, se: { left: "100%", top: "100%" }, s: { left: "50%", top: "100%" },
  sw: { left: "0%", top: "100%" }, w: { left: "0%", top: "50%" },
};

/** Visual-only selection chrome; fixed client coordinates keep it aligned through zoom and scroll. */
export default function LayoutSelectionOverlay({ selectedElements = [], selectedIds = [], overlayRef, editingId, onResizeStart, onAction, onPatch, onOpenInspector, contextMenu, setContextMenu }) {
  const locked = selectedElements.length > 0 && selectedElements.every((item) => item.locked || !item.editableLayout);
  return <div ref={overlayRef} data-thesis-editor-only data-export-ignore="" aria-label="Layout selection" style={{ position: "fixed", inset: 0, zIndex: 10000, pointerEvents: "none" }}>
    {selectedElements.map((item) => {
      const rect = item.element.getBoundingClientRect();
      return <div key={item.id} data-thesis-editor-only data-export-ignore="" data-layout-selection-box={item.id} style={{ position: "fixed", left: rect.left, top: rect.top, width: rect.width, height: rect.height, boxSizing: "border-box", border: "1px solid #2563eb", boxShadow: "0 0 0 1px rgba(255,255,255,.85)", pointerEvents: "none" }}>
        {selectedIds.length === 1 && !locked && editingId !== item.id ? Object.entries(HANDLE_POSITIONS).map(([handle, position]) => <button key={handle} type="button" aria-label={`Resize ${handle}`} onPointerDown={(event) => onResizeStart?.(item.id, handle, event)} data-thesis-editor-only data-export-ignore="" style={{ position: "absolute", left: position.left, top: position.top, transform: "translate(-50%,-50%)", width: 8, height: 8, minWidth: 8, minHeight: 8, padding: 0, border: "1px solid #1d4ed8", borderRadius: 2, background: "white", pointerEvents: "auto", cursor: `${handle}-resize` }} />) : null}
        {selectedIds.length === 1 ? <div data-thesis-editor-only data-export-ignore="" style={{ position: "absolute", left: "50%", top: -30, transform: "translateX(-50%)", padding: "3px 7px", borderRadius: 4, color: "white", background: locked ? "#52525b" : "#1d4ed8", font: "12px/1.2 system-ui,sans-serif", whiteSpace: "nowrap" }}>
          {item.measuredGeometry.widthMm.toFixed(1)} × {item.measuredGeometry.heightMm.toFixed(1)} mm{item.locked ? " · Kilitli" : ""}
        </div> : null}
      </div>;
    })}
    <LayoutContextMenu contextMenu={contextMenu} selectedElements={selectedElements} onAction={onAction} onPatch={onPatch} onOpenInspector={onOpenInspector} onClose={() => setContextMenu?.(null)} />
  </div>;
}
