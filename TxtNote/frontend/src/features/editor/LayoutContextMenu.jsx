import React, { useLayoutEffect, useRef, useState } from "react";
import { toggleLayoutDecoration } from "../../../../../engine/src/layoutInteraction.js";

const menuStyle = { width: 258, maxHeight: "min(76vh, 620px)", overflow: "auto", padding: 7, border: "1px solid #d4d4d8", borderRadius: 9, background: "#fff", color: "#18181b", boxShadow: "0 14px 42px rgba(24,24,27,.22)", pointerEvents: "auto", font: "13px/1.35 system-ui,sans-serif" };
const fieldStyle = { display: "grid", gap: 3, fontSize: 11, color: "#52525b" };
const inputStyle = { boxSizing: "border-box", width: "100%", minWidth: 0, padding: "5px 7px", border: "1px solid #d4d4d8", borderRadius: 5, font: "13px system-ui,sans-serif", color: "#18181b", background: "white" };
const buttonStyle = { display: "block", width: "100%", padding: "7px 8px", border: 0, borderRadius: 5, background: "transparent", color: "inherit", textAlign: "left", cursor: "pointer", font: "inherit" };
const grid = { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 6 };

function NumberField({ name, value, onChange, step = 0.1, disabled = false }) {
  return <label style={fieldStyle}><span>{name}</span><input aria-label={name} type="number" step={step} value={Number.isFinite(value) ? value : ""} disabled={disabled} onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))} style={inputStyle} /></label>;
}

/** Compact, object-specific right-click menu for selected layout objects. */
export default function LayoutContextMenu({ contextMenu, selectedElements = [], onAction = () => {}, onPatch = () => {}, onOpenInspector = () => {}, onClose = () => {} }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const selected = Array.isArray(selectedElements) ? selectedElements : [];
  const one = selected.length === 1 ? selected[0] : null;
  const textOnly = selected.length > 0 && selected.every((item) => item.type === "text");
  const imageOnly = selected.length > 0 && selected.every((item) => item.type === "image");
  const disabled = selected.some((item) => item.locked || !item.editableLayout);
  useLayoutEffect(() => {
    if (!contextMenu) return;
    const rect = ref.current?.getBoundingClientRect();
    const width = rect?.width || 258, height = rect?.height || 420;
    setPosition({ x: Math.max(8, Math.min(contextMenu.x, window.innerWidth - width - 8)), y: Math.max(8, Math.min(contextMenu.y, window.innerHeight - height - 8)) });
  }, [contextMenu, selected.length, textOnly, imageOnly]);
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
  const patchStyle = (key, value) => { onPatch(selected.map((item) => ({ id: item.id, style: { [key]: value } }))); };
  const patchBounds = (key, value) => {
    if (!Number.isFinite(value) || ((key === "widthMm" || key === "heightMm") && value <= 0)) return;
    onPatch(selected.map((item) => {
      if (!item.lockAspectRatio) return { id: item.id, [key]: value };
      const width = item.widthMm ?? item.measuredGeometry?.widthMm;
      const height = item.heightMm ?? item.measuredGeometry?.heightMm;
      const ratio = Number.isFinite(width) && Number.isFinite(height) && height > 0 ? width / height : undefined;
      if (!Number.isFinite(ratio) || ratio <= 0) return { id: item.id, [key]: value };
      return key === "widthMm" ? { id: item.id, widthMm: value, heightMm: value / ratio } : { id: item.id, heightMm: value, widthMm: value * ratio };
    }));
  };
  const checked = (key) => key === "bold" ? Number(one?.style?.fontWeight || 400) >= 600 : key === "underline" ? String(one?.style?.decoration || "").includes("underline") : Boolean(one?.style?.[key]);
  const toggle = (key) => key === "bold" ? patchStyle("fontWeight", checked(key) ? 400 : 700) : key === "underline"
    ? onPatch(selected.map((item) => ({ id: item.id, style: { decoration: toggleLayoutDecoration(item.style?.decoration, "underline", !checked(key)) } })))
    : patchStyle(key, !checked(key));
  const action = (name, title, extra = {}) => <button key={name} type="button" role="menuitem" disabled={Boolean(extra.disabled)} onClick={() => invoke(name)} onPointerOver={(event) => { event.currentTarget.style.background = "#f4f4f5"; }} onPointerOut={(event) => { event.currentTarget.style.background = "transparent"; }} style={{ ...buttonStyle, opacity: extra.disabled ? 0.45 : 1, cursor: extra.disabled ? "not-allowed" : "pointer" }}>{title}</button>;
  const rule = <hr style={{ border: 0, borderTop: "1px solid #e4e4e7", margin: "5px 2px" }} />;
  const boolean = (name, key) => <button key={key} type="button" aria-label={name} aria-pressed={checked(key)} disabled={disabled} onClick={() => toggle(key)} style={{ ...buttonStyle, width: "auto", padding: "5px 8px", fontWeight: key === "bold" ? 700 : undefined, fontStyle: key === "italic" ? "italic" : undefined, textDecoration: key === "underline" ? "underline" : undefined, background: checked(key) ? "#e4e4e7" : "transparent" }}>{name}</button>;
  return <div ref={ref} data-thesis-editor-only="true" data-export-ignore="" role="menu" aria-label="Öğe menüsü" style={{ ...menuStyle, position: "fixed", left: position.x, top: position.y, zIndex: 10001 }} onPointerDown={(event) => event.stopPropagation()}>
    {textOnly && one && <section aria-label="Metin biçimi" style={{ display: "grid", gap: 6, padding: 5 }}>
      <strong style={{ fontSize: 12 }}>Metin biçimi</strong>
      <label style={fieldStyle}><span>Yazı tipi</span><input aria-label="Yazı tipi" value={one.style?.fontFamily || ""} disabled={disabled} onChange={(event) => patchStyle("fontFamily", event.target.value)} style={inputStyle} /></label>
      <NumberField name="Punto (pt)" value={one.style?.fontSizePt ?? one.fontSizePt} disabled={disabled} onChange={(value) => patchStyle("fontSizePt", value)} />
      <div style={{ display: "flex", gap: 3 }}>{boolean("Kalın", "bold")}{boolean("İtalik", "italic")}{boolean("Altı çizili", "underline")}</div>
      <label style={fieldStyle}><span>Kutu içi hizalama</span><select aria-label="Kutu içi hizalama" value={one.style?.align || ""} disabled={disabled} onChange={(event) => patchStyle("align", event.target.value)} style={inputStyle}><option value="">—</option><option value="left">Sola</option><option value="center">Ortala</option><option value="right">Sağa</option><option value="justify">İki yana</option></select></label>
    </section>}
    {imageOnly && <section aria-label="Görsel boyutu" style={{ display: "grid", gap: 6, padding: 5 }}><strong style={{ fontSize: 12 }}>Görsel boyutu</strong><div style={grid}><NumberField name="Genişlik (mm)" value={one?.widthMm} disabled={disabled} onChange={(value) => patchBounds("widthMm", value)} /><NumberField name="Yükseklik (mm)" value={one?.heightMm} disabled={disabled} onChange={(value) => patchBounds("heightMm", value)} /></div><label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}><input type="checkbox" aria-label="En-boy oranını kilitle" checked={selected.every((item) => item.lockAspectRatio)} disabled={disabled} onChange={(event) => onPatch(selected.map((item) => ({ id: item.id, lockAspectRatio: event.target.checked })))} />En-boy oranını koru</label></section>}
    {(textOnly || imageOnly) && rule}
    <div style={{ padding: "0 3px" }}>{action("inspect", "Ayrıntıları aç", { disabled: false })}</div>
    {selected.length > 0 && <>{rule}<strong style={{ display: "block", padding: "4px 8px", fontSize: 11, color: "#71717a" }}>{selected.length === 1 ? "Öğeyi sayfaya hizala" : "Hizala ve dağıt"}</strong>{[["alignLeft", "Sola hizala"], ["alignCenter", "Ortala"], ["alignRight", "Sağa hizala"], ["alignTop", "Üste hizala"], ["alignMiddle", "Dikey ortala"], ["alignBottom", "Alta hizala"]].map(([name, title]) => action(name, title, { disabled }))}{selected.length > 1 && [["distributeHorizontal", "Yatay dağıt"], ["distributeVertical", "Dikey dağıt"]].map(([name, title]) => action(name, title, { disabled: disabled || selected.length < 3 }))}</>}
    {rule}
    {action("duplicate", "Çoğalt", { disabled })}
    {action("copy", "Kopyala", { disabled })}
    {action("delete", "Sil", { disabled })}
    {action(selected.every((item) => item.locked) ? "unlock" : "lock", selected.every((item) => item.locked) ? "Kilidi aç" : "Kilitle", { disabled: false })}
    {rule}
    {[ ["bringForward", "Bir katman öne"], ["sendBackward", "Bir katman arkaya"], ["bringToFront", "En öne getir"], ["sendToBack", "En arkaya gönder"] ].map(([name, title]) => action(name, title, { disabled }))}
  </div>;
}
