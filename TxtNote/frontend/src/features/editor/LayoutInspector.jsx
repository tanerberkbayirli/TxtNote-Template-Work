import React from "react";
import { toggleLayoutDecoration } from "../../thesis/layoutInteraction.js";

const input = { boxSizing: "border-box", width: "100%", minWidth: 0, padding: "6px 8px", border: "1px solid #d4d4d8", borderRadius: 6, background: "white", color: "#18181b", font: "inherit" };
const label = { display: "grid", gap: 4, fontSize: 12, color: "#52525b" };
const grid = { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 };
const toolbar = { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 };
const buttonStyle = { ...input, width: "auto", padding: "5px 8px", cursor: "pointer" };
const mixed = "__mixed__";
const common = (items, read) => { const values = items.map(read); return values.every((v) => Object.is(v, values[0])) ? values[0] : mixed; };

function Field({ title, value, onChange, type = "text", step = "any", placeholder = "", disabled = false }) {
  return <label style={label}><span>{title}</span><input aria-label={title} type={type} step={type === "number" ? step : undefined} value={value === undefined || value === null || value === mixed ? "" : value} placeholder={value === mixed ? "Karışık" : placeholder} disabled={disabled} onChange={(event) => onChange(type === "number" ? event.target.value === "" ? undefined : Number(event.target.value) : event.target.value)} style={input} /></label>;
}

function Select({ title, value, values, onChange, disabled = false }) {
  return <label style={label}><span>{title}</span><select aria-label={title} value={value === mixed || value == null ? "" : value} disabled={disabled} onChange={(event) => onChange(event.target.value)} style={input}><option value="">—</option>{values.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>;
}

export default function LayoutInspector({ elements = [], onPatch = () => {}, onAction = () => {}, onOpenInspector = () => {}, geometry = {} }) {
  const selected = Array.isArray(elements) ? elements : [];
  if (!selected.length) return <aside aria-label="Düzen denetçisi" data-thesis-editor-only="true" style={{ padding: 12, color: "#71717a", font: "13px system-ui,sans-serif" }}>Düzenlemek için bir öğe seçin.</aside>;
  const textOnly = selected.every((item) => item.type === "text");
  const imageOnly = selected.every((item) => item.type === "image");
  const disabled = selected.some((item) => !item.editableLayout || item.locked);
  const styleValue = (key) => common(selected, (item) => item.style?.[key] ?? (key === "fontSizePt" ? item.fontSizePt : undefined));
  const patchStyle = (key, value) => onPatch(selected.map((item) => ({ id: item.id, style: { [key]: value } })));
  const patchEach = (make) => onPatch(selected.map((item) => ({ id: item.id, ...make(item) })));
  const bounds = (item) => geometry[item.id] || item.measuredGeometry || {};
  const position = (item, key) => item[key] ?? (item.layoutMode === "absolute" ? bounds(item)[key] : undefined);
  const measuredLabel = (item, key) => item.layoutMode === "flow" && item[key] == null && Number.isFinite(bounds(item)[key]) ? `Ölçülen: ${bounds(item)[key].toFixed(1)} mm (akış)` : "";
  const patchGeometry = (item, key, value) => {
    if (!Number.isFinite(value) || ((key === "widthMm" || key === "heightMm") && value <= 0)) return { id: item.id };
    if (key === "widthMm" || key === "heightMm") {
      if (item.type !== "image" || !item.lockAspectRatio) return { id: item.id, [key]: value };
      const width = item.widthMm ?? item.measuredGeometry?.widthMm ?? bounds(item).widthMm;
      const height = item.heightMm ?? item.measuredGeometry?.heightMm ?? bounds(item).heightMm;
      const ratio = Number.isFinite(width) && Number.isFinite(height) && height > 0 ? width / height : undefined;
      if (!Number.isFinite(ratio) || ratio <= 0) return { id: item.id, [key]: value };
      return key === "widthMm" ? { id: item.id, widthMm: value, heightMm: value / ratio } : { id: item.id, heightMm: value, widthMm: value * ratio };
    }
    if (key !== "xMm" && key !== "yMm") return { id: item.id, [key]: value };
    return { id: item.id, layoutMode: "absolute", ...(item.xMm == null && Number.isFinite(bounds(item).xMm) ? { xMm: bounds(item).xMm } : {}), ...(item.yMm == null && Number.isFinite(bounds(item).yMm) ? { yMm: bounds(item).yMm } : {}), [key]: value };
  };
  const boolValue = (key) => common(selected, (item) => key === "bold" ? Number(item.style?.fontWeight || 400) >= 600 : key === "underline" ? String(item.style?.decoration || "").includes("underline") : Boolean(item.style?.[key]));
  const toggle = (key) => {
    const value = boolValue(key) !== true;
    if (key === "bold") patchStyle("fontWeight", value ? 700 : 400);
    else if (key === "underline") patchEach((item) => ({ style: { decoration: toggleLayoutDecoration(item.style?.decoration, "underline", value) } }));
    else patchStyle("italic", value);
  };
  const checked = (key) => boolValue(key) === true;
  const check = (name, key) => <button type="button" aria-label={name} title={name} aria-pressed={checked(key)} disabled={disabled} onClick={() => toggle(key)} style={{ ...buttonStyle, minWidth: 34, fontWeight: key === "bold" ? 700 : 400, fontStyle: key === "italic" ? "italic" : undefined, textDecoration: key === "underline" ? "underline" : undefined, background: checked(key) ? "#e4e4e7" : "white" }}>{key === "bold" ? "B" : key === "italic" ? "I" : "U"}</button>;

  return <aside aria-label="Düzen denetçisi" data-thesis-editor-only="true" style={{ display: "grid", alignContent: "start", gap: 12, padding: 12, color: "#18181b", font: "13px/1.35 system-ui,sans-serif", overflow: "auto" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}><strong>{selected.length > 1 ? `${selected.length} öğe seçili` : textOnly ? "Metin" : imageOnly ? "Görsel" : "Öğe"}</strong><button type="button" onClick={onOpenInspector} style={{ ...buttonStyle, fontSize: 12 }}>Ayrıntıları aç</button></div>
    {textOnly && <section style={{ display: "grid", gap: 8 }}>
      <Field title="Yazı tipi" value={styleValue("fontFamily")} disabled={disabled} onChange={(value) => patchStyle("fontFamily", value)} placeholder="Şablondan" />
      <div style={grid}><Field title="Punto" type="number" step="0.5" value={styleValue("fontSizePt")} disabled={disabled} onChange={(value) => patchStyle("fontSizePt", value)} /><Select title="Kutu içi hizalama" value={styleValue("align")} disabled={disabled} values={[["left", "Sola"], ["center", "Ortala"], ["right", "Sağa"], ["justify", "İki yana"]]} onChange={(value) => patchStyle("align", value)} /></div>
      <div style={toolbar}>{check("Kalın", "bold")}{check("İtalik", "italic")}{check("Altı çizili", "underline")}</div>
    </section>}
    {imageOnly && <label style={{ display: "flex", alignItems: "center", gap: 7 }}><input type="checkbox" aria-label="En-boy oranını kilitle" checked={selected.every((item) => item.lockAspectRatio)} disabled={disabled} onChange={(event) => onPatch(selected.map((item) => ({ id: item.id, lockAspectRatio: event.target.checked })))} />En-boy oranını koru</label>}
      <section style={{ display: "grid", gap: 8 }}><strong style={{ fontSize: 12 }}>Yerleşim (mm)</strong><div style={grid}>{[["xMm", "X"], ["yMm", "Y"], ["widthMm", "Genişlik"], ["heightMm", "Yükseklik"]].map(([key, title]) => <div key={key} style={{ display: "grid", gap: 3 }}><Field title={`${title} (mm)`} type="number" step="0.1" value={common(selected, (item) => position(item, key))} disabled={disabled} placeholder={(key === "xMm" || key === "yMm") && selected.every((item) => item.layoutMode === "flow" && item[key] == null) ? "Otomatik (akış)" : ""} onChange={(value) => patchEach((item) => patchGeometry(item, key, value))} />{selected.length === 1 && measuredLabel(selected[0], key) && <small style={{ color: "#71717a" }}>{measuredLabel(selected[0], key)}</small>}</div>)}</div></section>
    <label style={{ display: "flex", alignItems: "center", gap: 7 }}><input aria-label="Öğeyi kilitle" type="checkbox" checked={selected.every((item) => item.locked)} onChange={(event) => onAction(event.target.checked ? "lock" : "unlock")} />Öğeyi kilitle</label>
    {textOnly && <details><summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Paragraf ve metin ayrıntıları</summary><div style={{ display: "grid", gap: 8, paddingTop: 9 }}>
      <Field title="Satır yüksekliği" type="number" step="0.05" value={styleValue("lineHeight")} disabled={disabled} onChange={(v) => patchStyle("lineHeight", v)} />
      <div style={grid}>{[["characterSpacingPt", "Harf aralığı (pt)"], ["spaceBeforePt", "Önce (pt)"], ["spaceAfterPt", "Sonra (pt)"], ["fontWeight", "Yazı kalınlığı"]].map(([key, title]) => <Field key={key} title={title} type="number" step="0.1" value={styleValue(key)} disabled={disabled} onChange={(v) => patchStyle(key, v)} />)}</div>
      <Field title="Yazı rengi (#RRGGBB)" value={styleValue("color")} disabled={disabled} onChange={(v) => patchStyle("color", v)} placeholder="#000000" />
      <div style={grid}>{[["firstLineIndentMm", "İlk satır girintisi (mm)"], ["leftIndentMm", "Sol girinti (mm)"], ["rightIndentMm", "Sağ girinti (mm)"]].map(([key, title]) => <Field key={key} title={title} type="number" step="0.1" value={styleValue(key)} disabled={disabled} onChange={(v) => patchStyle(key, v)} />)}</div>
      <Field title="İçerik geçersiz kılması" value={common(selected, (item) => item.text ?? "")} disabled={disabled || selected.some((item) => !item.editableContent)} onChange={(value) => onPatch(selected.map((item) => ({ id: item.id, content: value })))} />
    </div></details>}
  </aside>;
}
