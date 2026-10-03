import { useEffect, useId, useState, useRef } from "react";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, BookOpen, Check, FilePlus2, FileText, Heading1, Image as ImageIcon, IndentDecrease, IndentIncrease, Link2, List, ListOrdered, Minus, Printer, Redo2, ScanEye, Search, Undo2, SquareDashed, Table2, TextCursorInput, ZoomIn, ZoomOut, Highlighter } from "lucide-react";

const tabs = ["Dosya", "Giriş", "Ekle", "Düzen", "Başvurular", "Görünüm"];
const control = "thesis-ribbon-control";
const tool = "thesis-ribbon-tool";
const fontSizePresets = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

function FontSizeBox({ activeFormat, remember, keep, invoke, disabled = false }) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef(null);
  const currentSizePt = activeFormat?.sizePt ?? activeFormat?.sizeComputedPt;
  const displaySize = editing ? draft : (currentSizePt ? String(currentSizePt) : (activeFormat?.sizeMixed ? "" : ""));

  const parseSize = (str) => {
    const normalized = str.replace(",", ".");
    const num = parseFloat(normalized);
    return isNaN(num) ? null : Math.max(1, Math.min(400, Math.round(num * 2) / 2));
  };

  const applySize = (size) => {
    if (size !== currentSizePt) invoke("applySize", size);
    setEditing(false);
    setInvalid(false);
  };

  const handleChange = (e) => setDraft(e.target.value);

  const handleBlur = () => {
    const size = parseSize(draft);
    if (size !== null) {
      applySize(size);
    } else {
      setInvalid(true);
      setDraft("");
      setEditing(false);
      setTimeout(() => setInvalid(false), 1500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const size = parseSize(draft);
      if (size !== null) {
        applySize(size);
      } else {
        setInvalid(true);
        setTimeout(() => setInvalid(false), 1500);
      }
    } else if (e.key === "Escape") {
      setDraft("");
      setEditing(false);
      setInvalid(false);
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <input
        ref={inputRef}
        type="text"
        className={control}
        aria-label="Yazı boyutu"
        aria-invalid={invalid}
        placeholder="Boyut"
        value={displaySize}
        disabled={disabled}
        onMouseDown={(e) => { remember(e); setEditing(true); setDraft(displaySize); }}
        onFocus={() => { setEditing(true); setDraft(displaySize); }}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{ width: "64px", paddingRight: "22px" }}
      />
      <button
        type="button"
        aria-label="Boyut önayarları"
        disabled={disabled}
        onMouseDown={(e) => { e.preventDefault(); keep(e); }}
        onClick={(e) => {
          e.preventDefault();
          const menu = e.currentTarget.nextElementSibling;
          menu.style.display = menu.style.display === "block" ? "none" : "block";
        }}
        style={{
          position: "absolute",
          right: "2px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px",
          fontSize: "12px",
        }}
      >
        ▼
      </button>
      <div
        style={{
          display: "none",
          position: "absolute",
          top: "100%",
          left: 0,
          background: "white",
          border: "1px solid #ccc",
          borderRadius: "4px",
          maxHeight: "200px",
          overflowY: "auto",
          zIndex: 1000,
          minWidth: "60px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {fontSizePresets.map((size) => (
          <button
            key={size}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); keep(e); }}
            onClick={(e) => {
              e.preventDefault();
              applySize(size);
              e.currentTarget.parentElement.style.display = "none";
              inputRef.current?.focus();
            }}
            style={{
              display: "block",
              width: "100%",
              padding: "6px 8px",
              border: "none",
              background: "none",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "13px",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f0f0f0"}
            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
          >
            {size} pt
          </button>
        ))}
      </div>
    </div>
  );
}

function ColorSplitButton({ mode, activeFormat, remember, keep, invoke, disabled = false }) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [lastColor, setLastColor] = useState(mode === "color" ? "#be123c" : "#ffff00");
  const popoverRef = useRef(null);
  const anchorRef = useRef(null);
  const [anchor, setAnchor] = useState(null);
  const isColor = mode === "color";
  // The ribbon clips overflow, so the palette is positioned against the viewport and closes on any outside press.
  useEffect(() => {
    if (!popoverOpen) return undefined;
    const close = (event) => { if (!popoverRef.current?.contains(event.target) && !anchorRef.current?.contains(event.target)) setPopoverOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [popoverOpen]);
  const current = isColor ? activeFormat?.color : activeFormat?.highlight;
  const hexValue = current?.startsWith("#") ? current :
    (mode === "color" ? ({ "black": "#000000", "red": "#be123c", "blue": "#0369a1", "green": "#047857" }[current] || "#000000") :
    ({ "yellow": "#ffff00", "green": "#92d050", "cyan": "#00b0f0", "magenta": "#f5c8ee", "none": "" }[current] || ""));
  const displayHex = (isColor && activeFormat?.colorMixed) || (!isColor && activeFormat?.highlightMixed) ? undefined : hexValue;

  const standardColors = ["#c00000", "#ff0000", "#ffc000", "#ffff00", "#92d050", "#00b050", "#00b0f0", "#0070c0", "#002060", "#7030a0"];
  const grayColors = ["#000000", "#404040", "#808080"];

  const applyColor = (value) => {
    invoke(isColor ? "applyTextColor" : "applyHighlight", value);
    setLastColor(value || (isColor ? "#be123c" : "#ffff00"));
    setPopoverOpen(false);
  };

  return (
    <div ref={anchorRef} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "1px", height: "24px" }}>
      <button
        type="button"
        className={tool}
        aria-label={isColor ? "Yazı rengini uygula" : "Vurgu rengini uygula"}
        disabled={disabled}
        onMouseDown={keep}
        onClick={() => applyColor(lastColor)}
        title={isColor ? "Son kullanılan rengi uygula" : "Son kullanılan vurguyu uygula"}
        style={{ minWidth: "30px", position: "relative" }}
      >
        {isColor ? <span style={{ fontSize: "16px", fontWeight: "bold" }}>A</span> : <Highlighter size={15} />}
        <div style={{
          position: "absolute",
          bottom: "2px",
          left: "6px",
          right: "6px",
          height: "3px",
          background: displayHex || "transparent",
          borderRadius: "1px",
          border: displayHex ? "none" : "1px solid #d9e0e9"
        }} />
      </button>
      <button
        type="button"
        className={tool}
        aria-label="Renk seçenekleri"
        disabled={disabled}
        onMouseDown={keep}
        onClick={() => { const rect = anchorRef.current?.getBoundingClientRect(); setAnchor(rect ? { top: rect.bottom + 4, left: rect.left } : null); setPopoverOpen(!popoverOpen); }}
        style={{ minWidth: "20px", padding: "3px 4px" }}
      >
        ▼
      </button>
      {popoverOpen && (
        <div
          ref={popoverRef}
          role="menu"
          style={{
            position: "fixed",
            top: anchor?.top ?? 0,
            left: anchor?.left ?? 0,
            background: "var(--bg-popover, #fff)",
            border: "1px solid var(--border-popover, #d7dee8)",
            borderRadius: "6px",
            padding: "8px",
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            minWidth: "280px"
          }}
          onKeyDown={(e) => e.key === "Escape" && setPopoverOpen(false)}
        >
          <div style={{ marginBottom: "8px" }}>
            <button
              type="button"
              role="menuitem"
              onMouseDown={keep}
              onClick={() => applyColor(isColor ? "black" : "none")}
              style={{
                display: "block",
                width: "100%",
                padding: "6px 8px",
                border: "1px solid var(--border-popover, #d7dee8)",
                borderRadius: "4px",
                background: "var(--bg-popover, #fff)",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              {isColor ? "Otomatik (Siyah)" : "Renk yok"}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "4px", marginBottom: "8px" }}>
            {standardColors.map((color) => (
              <button
                key={color}
                type="button"
                role="menuitem"
                onMouseDown={keep}
                onClick={() => applyColor(color)}
                aria-label={`Renk ${color}`}
                style={{
                  width: "20px",
                  height: "20px",
                  border: displayHex === color ? "2px solid #000" : "1px solid #ccc",
                  borderRadius: "3px",
                  background: color,
                  cursor: "pointer"
                }}
              />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px", marginBottom: "8px" }}>
            {grayColors.map((color) => (
              <button
                key={color}
                type="button"
                role="menuitem"
                onMouseDown={keep}
                onClick={() => applyColor(color)}
                aria-label={`Renk ${color}`}
                style={{
                  width: "100%",
                  height: "20px",
                  border: displayHex === color ? "2px solid #000" : "1px solid #ccc",
                  borderRadius: "3px",
                  background: color,
                  cursor: "pointer"
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
            <label style={{ flex: 1, display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
              Diğer renkler…
              <input
                type="color"
                onMouseDown={keep}
                onChange={(e) => applyColor(e.target.value)}
                style={{ width: "20px", height: "20px", border: "1px solid #ccc", cursor: "pointer" }}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

function Tool({ children, label, onClick, onMouseDown, disabled = false, pressed, title, type = "button" }) {
  return <button type={type} className={tool} aria-label={label} title={title || label} aria-pressed={pressed} disabled={disabled} onMouseDown={onMouseDown} onClick={onClick}>{children}</button>;
}

function Group({ label, children, className = "" }) {
  return <div className={`thesis-ribbon-group ${className}`}><div className="thesis-ribbon-group-content">{children}</div><span>{label}</span></div>;
}

export default function ThesisRibbon({
  title, activeSection, template, actions, detailsOpen, setDetailsOpen, pageSettingsOpen, setPageSettingsOpen,
  exporting, onExport, onPrint, paginationReady, canUndo, canRedo, onUndo, onRedo, zoomChoice, setZoomChoice,
  zoom, stepZoom, canStepZoom, zoomLevels, totalPages, warningCount, warningsOpen, setWarningsOpen, validationIssues, missingFields,
  warning, indexWarning, message, onImage, captionKinds, pickedFigure, onFigureKind, pickedEquation,
  onEquationNumber, citableItems, onInsertCitation, citeText, setCiteText, citeOpen, setCiteOpen,
  onAddFrame, rulersVisible, setRulersVisible, rulerUnit, setRulerUnit, navigationOpen, setNavigationOpen,
  canNavigate, fontFamily, page,
}) {
  const [tab, setTab] = useState("Giriş");
  const [tableRows, setTableRows] = useState("3");
  const [tableCols, setTableCols] = useState("3");
  const clampInt = (str, min, max, fallback) => {
    const num = Number(str);
    return isNaN(num) || str.trim() === "" ? fallback : Math.max(min, Math.min(max, num));
  };
  const handleTableRowsBlur = () => setTableRows(String(clampInt(tableRows, 1, 30, 3)));
  const handleTableRowsKeyDown = (e) => { if (e.key === "Enter") { e.preventDefault(); setTableRows(String(clampInt(tableRows, 1, 30, 3))); } };
  const handleTableColsBlur = () => setTableCols(String(clampInt(tableCols, 1, 12, 3)));
  const handleTableColsKeyDown = (e) => { if (e.key === "Enter") { e.preventDefault(); setTableCols(String(clampInt(tableCols, 1, 12, 3))); } };
  const [tableCaption, setTableCaption] = useState("");
  const [linkHref, setLinkHref] = useState("");
  const [linkText, setLinkText] = useState("");
  const [footnoteText, setFootnoteText] = useState("");
  const ids = useId();
  const remember = actions.saveSelection;
  const keep = actions.keepSelection;
  const invoke = (name, ...args) => actions.runSaved((body) => body?.[name]?.(...args));
  const headingOptions = Object.keys(activeSection?.rules.headings || template.typography.headings || {});
  const paragraphOptions = Object.keys(template.typography.paragraphStyles || {});
  const submitCitation = (event) => { event.preventDefault(); onInsertCitation(footnoteText); setFootnoteText(""); };

  return <header className="thesis-ribbon" aria-label="Tez belge araçları">
    <div className="thesis-titlebar">
      <div className="thesis-brand"><span className="thesis-brand-mark" aria-hidden="true">T</span><div><strong>TxtNote</strong><span>Tez düzenleyicisi</span></div></div>
      <div className="thesis-titlebar-actions">
        <span className="thesis-save-indicator"><i /> Otomatik kayıt</span>
      </div>
      <div className="thesis-document-name" title={title || "Adsız tez"}>{title || "Adsız tez"}<span> · {template.displayName || template.universityName}</span></div>
      <div className="thesis-titlebar-actions thesis-titlebar-right">
        <button type="button" className="thesis-detail-button" onMouseDown={keep} onClick={() => setDetailsOpen(!detailsOpen)} aria-expanded={detailsOpen}>Tez bilgileri</button>
        <Tool label="Sayfa düzeni" pressed={pageSettingsOpen} onMouseDown={keep} onClick={() => setPageSettingsOpen(!pageSettingsOpen)}>⚙</Tool>
      </div>
    </div>
    <div role="tablist" aria-label="Şerit sekmeleri" className="thesis-tabs">
      {tabs.map((item) => <button key={item} role="tab" id={`${ids}-thesis-tab-${item}`} aria-selected={tab === item} aria-controls={`${ids}-thesis-ribbon-panel`} tabIndex={tab === item ? 0 : -1} className={tab === item ? "is-active" : ""} onMouseDown={keep} onClick={(event) => { event.currentTarget.focus(); setTab(item); }} onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault(); const index = tabs.indexOf(tab); const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
        setTab(tabs[next]); event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')[next]?.focus();
      }}>{item}</button>)}
      {activeSection ? <span className="thesis-active-section" title={activeSection.title}>{activeSection.title}</span> : <span className="thesis-active-section is-muted">Düzenlemek için bir metin bölümüne tıklayın</span>}
    </div>
    <div id={`${ids}-thesis-ribbon-panel`} role="tabpanel" aria-labelledby={`${ids}-thesis-tab-${tab}`} className={`thesis-ribbon-panel thesis-ribbon-panel--${tabs.indexOf(tab)}`} data-ribbon-tab={tab}>
      {tab === "Giriş" && <>
        <Group label="Geçmiş" className="thesis-ribbon-history-group"><div className="thesis-ribbon-button-row"><Tool label="Geri al (Ctrl+Z)" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("undo")}><Undo2 size={15} aria-hidden="true" /></Tool><Tool label="Yinele (Ctrl+Y)" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("redo")}><Redo2 size={15} aria-hidden="true" /></Tool></div></Group>
        <Group label="Yazı tipi" className="thesis-ribbon-font-group">
          <span className="thesis-ribbon-font-name" title="Yazı tipi şablon tarafından belirlenir">{fontFamily || "Şablon yazı tipi"}</span>
          <FontSizeBox activeFormat={actions.activeFormat} remember={remember} keep={keep} invoke={invoke} disabled={!activeSection} />
          <div className="thesis-ribbon-button-row"><Tool label="Kalın" disabled={!activeSection} pressed={actions.activeFormat?.bold} onMouseDown={keep} onClick={() => invoke("toggleStyle", "bold")}><b>B</b></Tool><Tool label="İtalik" disabled={!activeSection} pressed={actions.activeFormat?.italic} onMouseDown={keep} onClick={() => invoke("toggleStyle", "italic")}><i>I</i></Tool><Tool label="Altı çizili" disabled={!activeSection} pressed={actions.activeFormat?.underline} onMouseDown={keep} onClick={() => invoke("toggleStyle", "underline")}><u>U</u></Tool><Tool label="Üstü çizili" disabled={!activeSection} pressed={actions.activeFormat?.strike} onMouseDown={keep} onClick={() => invoke("toggleStyle", "strike")}><s>S</s></Tool></div>
          <div className="thesis-ribbon-button-row"><ColorSplitButton mode="color" activeFormat={actions.activeFormat} remember={remember} keep={keep} invoke={invoke} disabled={!activeSection} /><ColorSplitButton mode="highlight" activeFormat={actions.activeFormat} remember={remember} keep={keep} invoke={invoke} disabled={!activeSection} /></div>
        </Group>
        <Group label="Paragraf" className="thesis-ribbon-paragraph-group"><select className={control} aria-label="Paragraf biçimi" disabled={!activeSection} value={actions.activeFormat?.block ?? ""} onMouseDown={remember} onChange={(event) => { const value = event.target.value; if (value.startsWith("style:")) actions.runSaved((body) => body?.setBlockType?.(0, value.slice(6))); else if (value !== "") invoke("setBlockType", Number(value)); }}><option value="">Paragraf biçimi</option><option value="0">Normal</option>{headingOptions.map((level) => <option key={level} value={level}>Başlık {level}</option>)}{paragraphOptions.map((id) => <option key={id} value={`style:${id}`}>{id}</option>)}</select>
          <div className="thesis-ribbon-button-row"><Tool label="Sola hizala" disabled={!activeSection} pressed={actions.activeFormat?.align === "left"} onMouseDown={keep} onClick={() => invoke("applyAlign", "left")}><AlignLeft size={15}/></Tool><Tool label="Ortala" disabled={!activeSection} pressed={actions.activeFormat?.align === "center"} onMouseDown={keep} onClick={() => invoke("applyAlign", "center")}><AlignCenter size={15}/></Tool><Tool label="Sağa hizala" disabled={!activeSection} pressed={actions.activeFormat?.align === "right"} onMouseDown={keep} onClick={() => invoke("applyAlign", "right")}><AlignRight size={15}/></Tool><Tool label="İki yana yasla" disabled={!activeSection} pressed={actions.activeFormat?.align === "justify"} onMouseDown={keep} onClick={() => invoke("applyAlign", "justify")}><AlignJustify size={15}/></Tool><Tool label="Madde işaretli liste" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("toggleList", false)}><List size={15}/></Tool><Tool label="Numaralı liste" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("toggleList", true)}><ListOrdered size={15}/></Tool></div>
          <div className="thesis-ribbon-button-row"><Tool label="Girintiyi azalt" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("changeIndent", "decrease")}><IndentDecrease size={15}/></Tool><Tool label="Girintiyi artır" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("changeIndent", "increase")}><IndentIncrease size={15}/></Tool></div>
        </Group>
        <Group label="Stiller" className="thesis-ribbon-style-group"><div className="thesis-style-gallery">{[{ id: "normal", label: "Normal", level: 0, sample: "Gövde metni" }, ...headingOptions.map((level) => ({ id: `heading-${level}`, label: `Başlık ${level}`, level: Number(level), sample: `Bölüm ${level}` })), ...paragraphOptions.map((id) => ({ id: `style-${id}`, label: id, style: id, sample: "Şablon stili" }))].map((style) => { const isActive = style.style ? actions.activeFormat?.block === `style:${style.style}` : actions.activeFormat?.block === String(style.level); return <button key={style.id} type="button" className={`thesis-style-card ${style.level ? `is-heading-${style.level}` : ""} ${isActive ? "is-active" : ""}`} aria-pressed={isActive} disabled={!activeSection} onMouseDown={keep} onClick={() => style.style ? actions.runSaved((body) => body?.setBlockType?.(0, style.style)) : invoke("setBlockType", style.level)}><span>{style.sample}</span><small>{style.label}</small></button>; })}</div></Group>
        <Group label="Düzenleme" className="thesis-ribbon-edit-group"><div className="thesis-ribbon-feature-tile"><Search size={19}/><div><strong>Bölüm gezintisi</strong><small>Başlıklar ve metin bölümleri</small></div><Tool label="Araçlarda bölüm gezintisi" onClick={() => setNavigationOpen(!navigationOpen)} pressed={navigationOpen}>Gezintiyi {navigationOpen ? "kapat" : "aç"}</Tool></div><div className="thesis-ribbon-feature-tile"><TextCursorInput size={19}/><div><strong>Biçim temizle</strong><small>Seçimdeki doğrudan biçim</small></div><Tool label="Biçimi temizle" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("clearFormatting")}>Temizle</Tool></div><Tool label="Yazdır" onClick={onPrint}><Printer size={16}/> Yazdır</Tool></Group>
      </>}
      {tab === "Dosya" && <>
        <Group label="Belge bilgisi"><div className="thesis-file-context"><div className="thesis-file-icon"><FileText size={25}/></div><div><strong>{title || "Adsız tez"}</strong><span>{template.displayName || template.universityName}</span><small>{activeSection?.title || "Belge genel görünümü"}</small></div><Tool label="Tez bilgileri" onMouseDown={keep} onClick={() => setDetailsOpen(!detailsOpen)} pressed={detailsOpen}>Bilgileri aç</Tool></div></Group>
        <Group label="Dışa aktar" className="thesis-ribbon-export-group"><div className="thesis-export-tiles"><button type="button" className="thesis-export-tile" aria-label="PDF" disabled={Boolean(exporting) || !paginationReady} onClick={() => onExport("pdf")}><span className="thesis-export-icon">PDF</span><span><strong>{exporting === "pdf" ? "Hazırlanıyor…" : "PDF olarak indir"}</strong><small>Sayfa düzeni ve görsellerle</small></span></button><button type="button" className="thesis-export-tile" aria-label="Word" disabled={Boolean(exporting) || !paginationReady} onClick={() => onExport("docx")}><span className="thesis-export-icon is-word">W</span><span><strong>{exporting === "docx" ? "Hazırlanıyor…" : "Word belgesi indir"}</strong><small>Düzenlenebilir .docx</small></span></button></div><span className="thesis-export-ready"><Check size={14}/>{paginationReady ? "Dışa aktarmaya hazır" : "Sayfalar hazırlanıyor"}</span></Group>
        <Group label="Yazdırma ve kaynak" className="thesis-ribbon-file-context"><div className="thesis-ribbon-feature-tile"><Printer size={20}/><div><strong>Yazdırma görünümü</strong><small>Belgeyi yazdırma kuyruğuna gönder</small></div><Tool label="Yazdır" onClick={onPrint}>Yazdır</Tool></div><div className="thesis-ribbon-feature-tile"><BookOpen size={20}/><div><strong>Şablon</strong><small>{template.source?.documentName || template.source?.url || template.id || "Etkin şablon"}</small></div></div></Group>
      </>}
      {tab === "Ekle" && <>
        <Group label="Sayfalar"><Tool label="Sayfa sonu ekle" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("insertPageBreak")}><FilePlus2 size={16}/> Sayfa sonu</Tool><select className={control} aria-label="Başlık ekle" disabled={!activeSection} defaultValue="" onMouseDown={remember} onChange={(event) => { const level = event.target.value; if (level) invoke("insertHeading", Number(level)); event.target.value = ""; }}><option value="" disabled>Başlık ekle</option>{headingOptions.map((level) => <option key={level} value={level}>Başlık {level}</option>)}</select></Group>
        <Group label="Tablo"><label className="thesis-ribbon-field">Satır <input aria-label="Tablo satır sayısı" type="number" min="1" max="30" value={tableRows} onChange={(e) => setTableRows(e.target.value)} onBlur={handleTableRowsBlur} onKeyDown={handleTableRowsKeyDown} /></label><label className="thesis-ribbon-field">Sütun <input aria-label="Tablo sütun sayısı" type="number" min="1" max="12" value={tableCols} onChange={(e) => setTableCols(e.target.value)} onBlur={handleTableColsBlur} onKeyDown={handleTableColsKeyDown} /></label><input className={control} aria-label="Tablo başlığı" placeholder="Tablo başlığı (isteğe bağlı)" value={tableCaption} onChange={(event) => setTableCaption(event.target.value)} /><Tool label="Tablo" disabled={!activeSection} onMouseDown={keep} onClick={() => { invoke("insertTable", clampInt(tableRows, 1, 30, 3), clampInt(tableCols, 1, 12, 3), tableCaption); setTableCaption(""); }}><Table2 size={16}/> Tablo</Tool></Group>
        <Group label="Medya"><Tool label="Görsel" onMouseDown={keep} onClick={() => onImage("")}><ImageIcon size={16}/> Görsel</Tool>{captionKinds.map(([id, rule]) => <Tool key={id} label={`${rule.label} ekle`} onMouseDown={keep} onClick={() => onImage(id)}>{rule.label}</Tool>)}{captionKinds.length ? <select aria-label="Görsel türü" className={control} disabled={!pickedFigure?.isConnected} defaultValue="" onMouseDown={remember} onChange={(event) => onFigureKind?.(event.target.value)}><option value="">Görsel türünü seç</option>{captionKinds.map(([id, rule]) => <option key={id} value={id}>{rule.label}</option>)}</select> : null}</Group>
        <Group label="Bağlantı"><form onSubmit={(event) => { event.preventDefault(); invoke("insertLink", linkHref, linkText); setLinkHref(""); setLinkText(""); }}><input className={control} aria-label="Bağlantı adresi" placeholder="https://adres" value={linkHref} onChange={(event) => setLinkHref(event.target.value)} onMouseDown={remember} onFocus={(event) => { const selected = window.getSelection()?.toString(); if (!linkText.trim() && selected) setLinkText(selected); remember(event); }} /><input className={control} aria-label="Bağlantı metni" placeholder="Bağlantı metni" value={linkText} onChange={(event) => setLinkText(event.target.value)} onMouseDown={remember} onFocus={remember} />{linkHref.trim() && !/^(https?:\/\/|mailto:)/i.test(linkHref) && <span className="thesis-ribbon-hint">Adres http://, https:// veya mailto: ile başlamalı</span>}<Tool type="submit" label="Bağlantı ekle" disabled={!activeSection || !linkHref.trim() || !/^(https?:\/\/|mailto:)/i.test(linkHref)} onMouseDown={keep}><Link2 size={16}/> Bağlantı ekle</Tool></form></Group>
        {template.equations ? <Group label="Denklem"><Tool label="Blok denklem ekle" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("insertFormula", true, true)}>∑ Denklem</Tool><Tool label="Denklem numarasını aç veya kapat" disabled={!pickedEquation?.isConnected} onClick={onEquationNumber}>Denklem no</Tool></Group> : null}
        <Group label="Sayfa öğeleri"><Tool label="Metin çerçevesi ekle" onClick={() => onAddFrame("text")}><SquareDashed size={16}/> Metin çerçevesi</Tool><Tool label="Çizgi ekle" onClick={() => onAddFrame("separator")}><Minus size={16}/> Çizgi</Tool></Group>
      </>}
      {tab === "Düzen" && <>
        <Group label="Sayfa düzeni"><div className="thesis-layout-actions"><Tool label="Sayfa düzeni denetçisini aç" pressed={pageSettingsOpen} onClick={() => setPageSettingsOpen(!pageSettingsOpen)}>Kenar boşlukları</Tool><Tool label="Cetvelleri göster veya gizle" pressed={rulersVisible} onClick={() => setRulersVisible(!rulersVisible)}>Cetveller {rulersVisible ? "Açık" : "Kapalı"}</Tool></div><div className="thesis-layout-margins">{[["Sol", page?.margins?.leftMm], ["Sağ", page?.margins?.rightMm], ["Üst", page?.margins?.topMm], ["Alt", page?.margins?.bottomMm]].filter(([, value]) => value !== undefined).map(([label, value]) => <span key={label}>{label}<strong>{value} mm</strong></span>)}</div><label className="thesis-ribbon-field">Cetvel birimi <select aria-label="Cetvel birimi" value={rulerUnit} onChange={(event) => setRulerUnit(event.target.value)}><option value="mm">mm</option><option value="cm">cm</option><option value="pt">pt</option></select></label></Group>
        <Group label="Sayfa ölçüleri" className="thesis-ribbon-page-group"><div className="thesis-page-measure"><span className="thesis-page-mini" aria-hidden="true"/><div><strong>{page?.widthMm && page?.heightMm ? `${page.widthMm} × ${page.heightMm} mm` : "Şablon ölçüleri"}</strong><small>{totalPages} sayfa · etkin bölüm</small></div></div><Tool label="Sayfa düzeni denetçisini aç" onClick={() => setPageSettingsOpen(!pageSettingsOpen)}>Sayfa ayarlarını aç</Tool></Group>
        <Group label="Yerleşim geçmişi"><Tool label="Düzen değişikliğini geri al" disabled={!canUndo} onClick={onUndo}>Yerleşimi geri al</Tool><Tool label="Düzen değişikliğini yinele" disabled={!canRedo} onClick={onRedo}>Yerleşimi yinele</Tool><span className="thesis-ribbon-hint">Sayfa ve çerçeve yerleşimi</span></Group>
      </>}
      {tab === "Başvurular" && <>
        <Group label="Dipnotlar"><form className="thesis-inline-form" onSubmit={submitCitation}><input className={control} aria-label="Dipnot metni" placeholder="Dipnot metni" value={footnoteText} onChange={(event) => setFootnoteText(event.target.value)} onMouseDown={remember} onFocus={remember} /><Tool type="submit" label="Dipnot ekle" disabled={!activeSection || !footnoteText.trim()} onMouseDown={keep}>Ekle</Tool></form></Group>
        <Group label="Kaynakça"><Tool label="Atıf" disabled={!activeSection} pressed={citeOpen} onMouseDown={keep} onClick={() => setCiteOpen(!citeOpen)}>Atıf</Tool>{citableItems.length ? <select aria-label="Kaynakçadan atıf seç" className={control} defaultValue="" onMouseDown={remember} onChange={(event) => { const value = event.target.value; event.target.value = ""; if (value) onInsertCitation(value); }}><option value="">Kaynakçadan seç</option>{citableItems.map((item, index) => <option key={index} value={item}>{item}</option>)}</select> : <span className="thesis-ribbon-hint">Kaynak eklemek için Tez bilgileri panelini açın.</span>}</Group>
        <Group label="Kaynakça araçları" className="thesis-ribbon-reference-tools"><div className="thesis-reference-summary"><BookOpen size={22}/><div><strong>{citableItems.length} kaynak kullanılabilir</strong><span>Atıflar belge içeriğine eklenir.</span></div></div><Tool label="Tez bilgileri" onMouseDown={keep} onClick={() => setDetailsOpen(!detailsOpen)}>Kaynakça bilgilerini yönet</Tool><Tool label="Bölüm gezintisini aç veya kapat" onClick={() => setNavigationOpen(!navigationOpen)} pressed={navigationOpen}>Başlıklara git</Tool></Group>
        {citeOpen && <form className="thesis-citation-popover" aria-label="Atıf ekle" onSubmit={(event) => { event.preventDefault(); onInsertCitation(citeText); }}><input autoFocus className={control} aria-label="Atıf veya dipnot metni" placeholder="Atıf metni" value={citeText} onChange={(event) => setCiteText(event.target.value)} onFocus={remember} onKeyDown={(event) => { if (event.key === "Escape") setCiteOpen(false); }} /><Tool type="submit" label="Atıf ekle" disabled={!citeText.trim()} onMouseDown={keep}>Ekle</Tool></form>}
      </>}
      {tab === "Görünüm" && <>
        <Group label="Gezinti"><div className="thesis-view-action-row"><Tool label="Gezinti bölmesini aç veya kapat" pressed={navigationOpen} disabled={!canNavigate} onClick={() => setNavigationOpen(!navigationOpen)}><Search size={15}/> Gezinti</Tool><Tool label="Cetvelleri göster veya gizle" pressed={rulersVisible} onClick={() => setRulersVisible(!rulersVisible)}>Cetveller</Tool></div><span className="thesis-ribbon-hint">{activeSection?.title || "Belge genel görünümü"} · cetvel {rulersVisible ? "açık" : "kapalı"}</span></Group>
        <Group label="Yakınlaştır" className="thesis-ribbon-zoom-group"><div className="thesis-zoom-feature"><ScanEye size={22}/><div><strong>Sayfa görünümü</strong><small>{totalPages} sayfalı belge</small></div><div className="thesis-ribbon-button-row"><Tool label="Uzaklaştır" disabled={!canStepZoom(-1)} onMouseDown={keep} onClick={() => stepZoom(-1)}><ZoomOut size={16}/></Tool><select aria-label="Yakınlaştırma düzeyi" className={control} value={zoomChoice} onChange={(event) => setZoomChoice(event.target.value)}><option value="fit">Genişliğe sığdır ({Math.round(zoom * 100)}%)</option>{zoomLevels?.map((level) => <option key={level} value={String(level)}>%{level}</option>)}</select><Tool label="Yakınlaştır" disabled={!canStepZoom(1)} onMouseDown={keep} onClick={() => stepZoom(1)}><ZoomIn size={16}/></Tool></div></div></Group>
        <Group label="Belge durumu" className="thesis-ribbon-view-info"><div className="thesis-view-stat"><strong>{activeSection?.title || "Belge"}</strong><span>Etkin metin bölümü</span></div><div className="thesis-view-stat"><strong>{totalPages}</strong><span>Sayfa</span></div><Tool label="Sayfa düzeni denetçisini aç" onClick={() => setPageSettingsOpen(!pageSettingsOpen)}>Sayfa ayarları</Tool></Group>
      </>}
    </div>
    {warningCount > 0 && <div className="thesis-ribbon-warning"><details open={warningsOpen} onToggle={(event) => setWarningsOpen(event.currentTarget.open)}><summary>{validationIssues.length ? `${validationIssues.length} belge uyarısı` : `${warningCount} uyarı`}</summary><div>{warning && <p>{warning}</p>}{missingFields?.length ? <p>Eksik tez bilgisi: {missingFields.join(", ")}</p> : null}{indexWarning && <p>{indexWarning}</p>}{validationIssues.map((issue, index) => <p key={index}>{issue.message}</p>)}</div></details></div>}
    {message ? <div className="thesis-ribbon-message" role="status">{message}</div> : null}
  </header>;
}
