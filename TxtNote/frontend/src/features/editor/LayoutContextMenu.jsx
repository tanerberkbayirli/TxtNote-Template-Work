import React, { useLayoutEffect, useRef, useState } from "react";

const menuStyle = { width: 258, maxHeight: "min(76vh, 620px)", overflow: "auto", padding: 7, border: "1px solid #d4d4d8", borderRadius: 9, background: "#fff", color: "#18181b", boxShadow: "0 14px 42px rgba(24,24,27,.22)", pointerEvents: "auto", font: "13px/1.35 system-ui,sans-serif" };
const buttonStyle = { display: "block", width: "100%", padding: "7px 8px", border: 0, borderRadius: 5, background: "transparent", color: "inherit", textAlign: "left", cursor: "pointer", font: "inherit" };

/** Compact, object-specific right-click menu for selected layout objects. */
export default function LayoutContextMenu({ contextMenu, selectedElements = [], onAction = () => {}, onOpenInspector = () => {}, onToggleWritingPlan, onClose = () => {} }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const selected = Array.isArray(selectedElements) ? selectedElements : [];
  const textOnly = selected.length > 0 && selected.every((item) => item.type === "text");
  const disabled = selected.some((item) => item.locked || !item.editableLayout);
  useLayoutEffect(() => {
    if (!contextMenu) return;
    const rect = ref.current?.getBoundingClientRect();
    const width = rect?.width || 258, height = rect?.height || 420;
    setPosition({ x: Math.max(8, Math.min(contextMenu.x, window.innerWidth - width - 8)), y: Math.max(8, Math.min(contextMenu.y, window.innerHeight - height - 8)) });
  }, [contextMenu, selected.length, textOnly]);
  useLayoutEffect(() => {
    if (!contextMenu) return undefined;
    const outside = (event) => { if (!ref.current?.contains(event.target)) onClose(); };
    const escape = (event) => { if (event.key === "Escape") { event.preventDefault(); onClose(); } };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", escape, true);
    return () => { document.removeEventListener("pointerdown", outside, true); document.removeEventListener("keydown", escape, true); };
  }, [contextMenu, onClose]);
  if (!contextMenu) return null;
  const invoke = (action) => { if (action === "inspect") onOpenInspector(); else onAction(action); onClose(); };
  const action = (name, title, extra = {}) => <button key={name} type="button" role="menuitem" disabled={Boolean(extra.disabled)} onClick={() => invoke(name)} onPointerOver={(event) => { event.currentTarget.style.background = "#f4f4f5"; }} onPointerOut={(event) => { event.currentTarget.style.background = "transparent"; }} style={{ ...buttonStyle, opacity: extra.disabled ? 0.45 : 1, cursor: extra.disabled ? "not-allowed" : "pointer" }}>{title}</button>;
  const rule = <hr style={{ border: 0, borderTop: "1px solid #e4e4e7", margin: "5px 2px" }} />;
  return <div ref={ref} data-thesis-editor-only="true" data-export-ignore="" role="menu" aria-label="Öğe menüsü" style={{ ...menuStyle, position: "fixed", left: position.x, top: position.y, zIndex: 10001 }} onPointerDown={(event) => event.stopPropagation()}>
    <div style={{ padding: "0 3px" }}>{action("inspect", "Ayrıntıları aç", { disabled: false })}
      {textOnly && onToggleWritingPlan && <button type="button" role="menuitem" style={buttonStyle}
        onMouseDown={event => event.preventDefault()}
        onClick={() => { onToggleWritingPlan(); onClose(); }}>
        {selected.every(item => item.canonical?.inWritingPlan) ? "Yazım planından çıkar" : "Yazım planına ekle"}
      </button>}
    </div>
    {rule}
    {action("duplicate", "Çoğalt", { disabled })}
    {action("copy", "Kopyala", { disabled })}
    {action("delete", "Sil", { disabled })}
    {action(selected.every((item) => item.locked) ? "unlock" : "lock", selected.every((item) => item.locked) ? "Kilidi aç" : "Kilitle", { disabled: false })}
    {rule}
    {[ ["bringForward", "Bir katman öne"], ["sendBackward", "Bir katman arkaya"], ["bringToFront", "En öne getir"], ["sendToBack", "En arkaya gönder"] ].map(([name, title]) => action(name, title, { disabled }))}
  </div>;
}
