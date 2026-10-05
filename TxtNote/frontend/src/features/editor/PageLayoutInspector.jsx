import React, { useEffect, useState } from "react";

const inputStyle = { boxSizing: "border-box", width: "100%", padding: "7px 9px", border: "1px solid #cbd2dc", borderRadius: 6, font: "inherit", color: "#172033", background: "#fff" };
const fieldStyle = { display: "grid", gap: 4, fontSize: 12, color: "#485366" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 9 };
const num = (value) => Number.isFinite(value) ? String(value) : "";
const typographyKeys = ["fontFamily", "fontSizePt", "fontWeight", "italic", "decoration", "align", "lineHeight", "characterSpacingPt", "spaceBeforePt", "spaceAfterPt", "firstLineIndentMm", "leftIndentMm", "rightIndentMm", "color"];
const numericTypography = new Set(["fontSizePt", "fontWeight", "lineHeight", "characterSpacingPt", "spaceBeforePt", "spaceAfterPt", "firstLineIndentMm", "leftIndentMm", "rightIndentMm"]);

function fromPage(page = {}) {
  return {
    size: page.size || "", widthMm: num(page.widthMm), heightMm: num(page.heightMm), orientation: page.orientation || "portrait",
    margins: Object.fromEntries(["topMm", "bottomMm", "leftMm", "rightMm"].map((key) => [key, num(page.margins?.[key])])),
    header: Object.fromEntries(["heightMm", "distanceMm"].map((key) => [key, num(page.header?.[key])])),
    footer: Object.fromEntries(["heightMm", "distanceMm"].map((key) => [key, num(page.footer?.[key])])),
  };
}

function fromTypography(style = {}) {
  return Object.fromEntries(typographyKeys.map((key) => [key, numericTypography.has(key) ? num(style[key]) : key === "italic" ? String(Boolean(style[key])) : style[key] ?? ""]));
}

function TextInput({ label, value, onChange, type = "number", step = 0.1 }) {
  return <label style={fieldStyle}><span>{label}</span><input aria-label={label} type={type} step={type === "number" ? step : undefined} value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle} /></label>;
}

function SelectInput({ label, value, onChange }) {
  return <label style={fieldStyle}><span>{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle}><option value="portrait">Dikey</option><option value="landscape">Yatay</option></select></label>;
}

/** Draft-based page setup. Nothing is persisted until the user presses Apply. */
export default function PageLayoutInspector({ page, sectionId, sectionTitle, pageIndex = 0, onApply = () => {}, typography = {}, onApplyTypography = () => {}, scope: initialScope = "document", pageScopeSupported = true }) {
  const [scope, setScope] = useState(initialScope);
  const [draft, setDraft] = useState(() => fromPage(page));
  const [base, setBase] = useState(() => fromPage(page));
  const [typeScope, setTypeScope] = useState("section");
  const [typeDraft, setTypeDraft] = useState({});
  const [typeBase, setTypeBase] = useState({});
  useEffect(() => { const next = fromTypography(typography); setTypeDraft(next); setTypeBase(next); }, [typography, sectionId]);
  useEffect(() => { const next = fromPage(page); setDraft(next); setBase(next); }, [page, sectionId, pageIndex]);
  useEffect(() => { if (scope === "page" && !pageScopeSupported) setScope("section"); }, [scope, pageScopeSupported]);
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const updateNested = (group, key, value) => setDraft((current) => ({ ...current, [group]: { ...current[group], [key]: value } }));
  const updateOrientation = (orientation) => setDraft((current) => orientation === current.orientation ? current : ({ ...current, orientation, widthMm: current.heightMm, heightMm: current.widthMm }));
  const changedPage = () => {
    const patch = {};
    for (const key of ["size", "orientation"]) if (draft[key] !== base[key]) patch[key] = draft[key] || undefined;
    for (const key of ["widthMm", "heightMm"]) if (draft[key] !== base[key]) { if (draft[key] !== "") patch[key] = Number(draft[key]); }
    for (const group of ["margins", "header", "footer"]) {
      const nested = {};
      for (const key of Object.keys(draft[group])) if (draft[group][key] !== base[group][key] && draft[group][key] !== "") nested[key] = Number(draft[group][key]);
      if (Object.keys(nested).length) patch[group] = nested;
    }
    return patch;
  };
  const pagePatch = changedPage();
  const changedTypography = () => Object.fromEntries(typographyKeys.flatMap((key) => {
    const value = typeDraft[key];
    if (value === typeBase[key] || value === "") return [];
    return [[key, numericTypography.has(key) ? Number(value) : key === "italic" ? value === "true" : value]];
  }));
  const typographyPatch = changedTypography();
  const typeInvalid = Object.entries(typographyPatch).some(([key, value]) => numericTypography.has(key) && (!Number.isFinite(value) || (["fontSizePt", "lineHeight"].includes(key) && value <= 0)));
  const entries = [...Object.values(draft.margins), ...Object.values(draft.header), ...Object.values(draft.footer), draft.widthMm, draft.heightMm];
  const margin = (key) => draft.margins[key] === "" ? Number(base.margins[key] || 0) : Number(draft.margins[key]);
  const width = draft.widthMm === "" ? Number(base.widthMm) : Number(draft.widthMm);
  const height = draft.heightMm === "" ? Number(base.heightMm) : Number(draft.heightMm);
  const invalid = entries.some((value) => value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0)) || (Number.isFinite(width) && width <= margin("leftMm") + margin("rightMm")) || (Number.isFinite(height) && height <= margin("topMm") + margin("bottomMm"));
  const sectionLabel = sectionTitle || sectionId || "seçili bölüm";
  return <aside aria-label="Sayfa düzeni denetçisi" data-thesis-editor-only="true" style={{ display: "grid", gap: 14, padding: 12, color: "#172033", font: "13px/1.4 system-ui,sans-serif", overflowY: "auto" }}>
    <strong>Sayfa düzeni</strong>
    <label style={fieldStyle}><span>Uygulama kapsamı</span><select aria-label="Uygulama kapsamı" value={scope} onChange={(event) => setScope(event.target.value)} style={inputStyle}><option value="document">Tüm belge</option><option value="section">Bölüm: {sectionLabel}</option><option value="page" disabled={!pageScopeSupported}>Sayfa {pageIndex + 1}</option></select></label>
    {!pageScopeSupported && <small role="status" style={{ color: "#667085" }}>Tek tek sayfa düzenlemesi henüz desteklenmiyor. Bu sayfa için kapsam seçilemez.</small>}
    <div style={gridStyle}><TextInput label="Sayfa adı" type="text" value={draft.size} onChange={(v) => update("size", v)} /><SelectInput label="Yönlendirme" value={draft.orientation} onChange={updateOrientation} /><TextInput label="Genişlik (mm)" value={draft.widthMm} onChange={(v) => update("widthMm", v)} /><TextInput label="Yükseklik (mm)" value={draft.heightMm} onChange={(v) => update("heightMm", v)} /></div>
    <section style={{ display: "grid", gap: 8 }}><strong>Kenar boşlukları (mm)</strong><div style={gridStyle}>{[["topMm", "Üst"], ["bottomMm", "Alt"], ["leftMm", "Sol"], ["rightMm", "Sağ"]].map(([key, label]) => <TextInput key={key} label={label} value={draft.margins[key]} onChange={(v) => updateNested("margins", key, v)} />)}</div></section>
    {[["header", "Üstbilgi"], ["footer", "Altbilgi"]].map(([group, title]) => <section key={group} style={{ display: "grid", gap: 8 }}><strong>{title} (mm)</strong><div style={gridStyle}><TextInput label={`${title} yüksekliği (mm)`} value={draft[group].heightMm} onChange={(v) => updateNested(group, "heightMm", v)} /><TextInput label={`${title} uzaklığı (mm)`} value={draft[group].distanceMm} onChange={(v) => updateNested(group, "distanceMm", v)} /></div></section>)}
    <button type="button" disabled={invalid || !Object.keys(pagePatch).length || (scope === "page" && !pageScopeSupported)} onClick={() => onApply(pagePatch, scope)} style={{ ...inputStyle, cursor: invalid ? "not-allowed" : "pointer", fontWeight: 600 }}>Sayfa ayarlarını uygula</button>
    <details><summary style={{ cursor: "pointer", fontWeight: 600 }}>Belge metin biçimi</summary><div style={{ display: "grid", gap: 9, paddingTop: 9 }}>
      <label style={fieldStyle}><span>Metin biçiminin kapsamı</span><select aria-label="Metin biçiminin kapsamı" value={typeScope} onChange={(event) => setTypeScope(event.target.value)} style={inputStyle}><option value="document">Tüm belge</option><option value="section">Bölüm: {sectionLabel}</option></select></label>
      <TextInput label="Yazı tipi" type="text" value={typeDraft.fontFamily ?? ""} onChange={(v) => setTypeDraft((current) => ({ ...current, fontFamily: v }))} />
      <div style={gridStyle}><TextInput label="Punto (pt)" step={0.5} value={typeDraft.fontSizePt ?? ""} onChange={(v) => setTypeDraft((current) => ({ ...current, fontSizePt: v }))} /><TextInput label="Satır yüksekliği" value={typeDraft.lineHeight ?? ""} onChange={(v) => setTypeDraft((current) => ({ ...current, lineHeight: v }))} /></div>
      <div style={gridStyle}><label style={fieldStyle}><span>Kalınlık</span><input aria-label="Kalınlık" type="number" step="100" value={typeDraft.fontWeight ?? ""} onChange={(event) => setTypeDraft((current) => ({ ...current, fontWeight: event.target.value }))} style={inputStyle} /></label><label style={fieldStyle}><span>İtalik</span><select aria-label="İtalik" value={typeDraft.italic ?? "false"} onChange={(event) => setTypeDraft((current) => ({ ...current, italic: event.target.value }))} style={inputStyle}><option value="false">Kapalı</option><option value="true">Açık</option></select></label></div>
      <label style={fieldStyle}><span>Hizalama</span><select aria-label="Metin hizalaması" value={typeDraft.align || ""} onChange={(event) => setTypeDraft((current) => ({ ...current, align: event.target.value }))} style={inputStyle}><option value="">—</option><option value="left">Sola</option><option value="center">Ortala</option><option value="right">Sağa</option><option value="justify">İki yana</option></select></label>
      <details><summary style={{ cursor: "pointer", fontSize: 12 }}>Paragraf aralıkları ve girintiler</summary><div style={{ ...gridStyle, paddingTop: 8 }}>{[["characterSpacingPt", "Harf aralığı (pt)"], ["spaceBeforePt", "Paragraf önce (pt)"], ["spaceAfterPt", "Paragraf sonra (pt)"], ["firstLineIndentMm", "İlk satır (mm)"], ["leftIndentMm", "Sol girinti (mm)"], ["rightIndentMm", "Sağ girinti (mm)"]].map(([key, title]) => <TextInput key={key} label={title} value={typeDraft[key] ?? ""} onChange={(value) => setTypeDraft((current) => ({ ...current, [key]: value }))} />)}</div></details>
      <button type="button" disabled={typeInvalid || !Object.keys(typographyPatch).length} onClick={() => onApplyTypography(typographyPatch, typeScope)} style={{ ...inputStyle, cursor: typeInvalid ? "not-allowed" : "pointer", fontWeight: 600 }}>Metin biçimini uygula</button>
    </div></details>
  </aside>;
}
