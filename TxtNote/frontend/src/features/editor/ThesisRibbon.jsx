import { useId, useState } from "react";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, IndentDecrease, IndentIncrease, List, ListOrdered } from "lucide-react";

const tabs = ["Dosya", "Giriş", "Ekle", "Düzen", "Başvurular", "Görünüm"];
const control = "thesis-ribbon-control";
const tool = "thesis-ribbon-tool";

function Tool({ children, label, onClick, onMouseDown, disabled = false, pressed, title, type = "button" }) {
  return <button type={type} className={tool} aria-label={label} title={title || label} aria-pressed={pressed} disabled={disabled} onMouseDown={onMouseDown} onClick={onClick}>{children}</button>;
}

function Group({ label, children }) {
  return <div className="thesis-ribbon-group"><div className="thesis-ribbon-group-content">{children}</div><span>{label}</span></div>;
}

export default function ThesisRibbon({
  title, activeSection, template, actions, detailsOpen, setDetailsOpen, pageSettingsOpen, setPageSettingsOpen,
  exporting, onExport, onPrint, paginationReady, canUndo, canRedo, onUndo, onRedo, zoomChoice, setZoomChoice,
  zoom, stepZoom, totalPages, warningCount, warningsOpen, setWarningsOpen, validationIssues, missingFields,
  warning, indexWarning, message, onImage, captionKinds, pickedFigure, onFigureKind, pickedEquation,
  onEquationNumber, citableItems, onInsertCitation, citeText, setCiteText, citeOpen, setCiteOpen,
  onAddFrame, rulersVisible, setRulersVisible, rulerUnit, setRulerUnit, navigationOpen, setNavigationOpen,
  canNavigate, fontFamily,
}) {
  const [tab, setTab] = useState("Giriş");
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableCaption, setTableCaption] = useState("");
  const [linkHref, setLinkHref] = useState("");
  const [linkText, setLinkText] = useState("");
  const [footnoteText, setFootnoteText] = useState("");
  const ids = useId();
  const remember = actions.saveSelection;
  const keep = actions.keepSelection;
  const invoke = (name, ...args) => actions.runSaved((body) => body?.[name]?.(...args));
  const headingOptions = activeSection ? Object.keys(activeSection.rules.headings || template.typography.headings || {}) : [];
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
    <div id={`${ids}-thesis-ribbon-panel`} role="tabpanel" aria-labelledby={`${ids}-thesis-tab-${tab}`} className="thesis-ribbon-panel">
      {tab === "Giriş" && <>
        <Group label="Biçim"><Tool label="Biçimi temizle" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("clearFormatting")}>A̶</Tool></Group>
        <Group label="Yazı tipi">
          <span className="thesis-ribbon-font-name" title="Yazı tipi şablon tarafından belirlenir">{fontFamily || "Şablon yazı tipi"}</span>
          <select className={control} aria-label="Yazı boyutu" defaultValue="" disabled={!activeSection} onMouseDown={remember} onChange={(event) => { const size = event.target.value; if (size) invoke("applySize", size); event.target.value = ""; }}><option value="" disabled>Boyut</option>{[8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24].map((size) => <option key={size} value={`pt${size}`}>{size} pt</option>)}</select>
          <div className="thesis-ribbon-button-row"><Tool label="Kalın" disabled={!activeSection} pressed={actions.activeFormat?.bold} onMouseDown={keep} onClick={() => invoke("toggleStyle", "bold")}><b>B</b></Tool><Tool label="İtalik" disabled={!activeSection} pressed={actions.activeFormat?.italic} onMouseDown={keep} onClick={() => invoke("toggleStyle", "italic")}><i>I</i></Tool><Tool label="Altı çizili" disabled={!activeSection} pressed={actions.activeFormat?.underline} onMouseDown={keep} onClick={() => invoke("toggleStyle", "underline")}><u>U</u></Tool><Tool label="Üstü çizili" disabled={!activeSection} pressed={actions.activeFormat?.strike} onMouseDown={keep} onClick={() => invoke("toggleStyle", "strike")}><s>S</s></Tool></div>
          <div className="thesis-ribbon-button-row"><label className="thesis-ribbon-field">Yazı rengi <select className={control} aria-label="Yazı rengi" disabled={!activeSection} defaultValue="black" onMouseDown={remember} onChange={(event) => invoke("applyTextColor", event.target.value)}><option value="black">Siyah</option><option value="red">Kırmızı</option><option value="blue">Mavi</option><option value="green">Yeşil</option></select></label><label className="thesis-ribbon-field">Vurgu <select className={control} aria-label="Vurgu rengi" disabled={!activeSection} defaultValue="yellow" onMouseDown={remember} onChange={(event) => invoke("applyHighlight", event.target.value)}><option value="yellow">Sarı</option><option value="green">Yeşil</option><option value="cyan">Camgöbeği</option><option value="magenta">Pembe</option><option value="none">Yok</option></select></label></div>
        </Group>
        <Group label="Paragraf"><select className={control} aria-label="Paragraf biçimi" disabled={!activeSection} defaultValue="" onMouseDown={remember} onChange={(event) => { const value = event.target.value; event.target.value = ""; if (value.startsWith("style:")) actions.runSaved((body) => body?.setBlockType?.(0, value.slice(6))); else if (value !== "") invoke("setBlockType", Number(value)); }}><option value="" disabled>Paragraf biçimi</option><option value="0">Normal</option>{headingOptions.map((level) => <option key={level} value={level}>Başlık {level}</option>)}{paragraphOptions.map((id) => <option key={id} value={`style:${id}`}>{id}</option>)}</select>
          <select className={control} aria-label="Hizalama" disabled={!activeSection} defaultValue="" onMouseDown={remember} onChange={(event) => { const value = event.target.value; event.target.value = ""; if (value) invoke("applyAlign", value); }}><option value="">Hizalama</option><option value="left">Sol</option><option value="center">Orta</option><option value="right">Sağ</option><option value="justify">İki yana</option></select>
          <div className="thesis-ribbon-button-row"><Tool label="Sola hizala" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("applyAlign", "left")}><AlignLeft size={15}/></Tool><Tool label="Ortala" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("applyAlign", "center")}><AlignCenter size={15}/></Tool><Tool label="Sağa hizala" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("applyAlign", "right")}><AlignRight size={15}/></Tool><Tool label="İki yana yasla" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("applyAlign", "justify")}><AlignJustify size={15}/></Tool><Tool label="Madde işaretli liste" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("toggleList", false)}><List size={15}/></Tool><Tool label="Numaralı liste" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("toggleList", true)}><ListOrdered size={15}/></Tool></div>
          <div className="thesis-ribbon-button-row"><Tool label="Girintiyi azalt" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("changeIndent", "decrease")}><IndentDecrease size={15}/></Tool><Tool label="Girintiyi artır" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("changeIndent", "increase")}><IndentIncrease size={15}/></Tool></div>
        </Group>
        <Group label="Düzenleme"><Tool label="Araçlarda bölüm gezintisi" onClick={() => setNavigationOpen(!navigationOpen)} pressed={navigationOpen}>☷ Gezinti</Tool><Tool label="Yazdır" onClick={onPrint}>Yazdır</Tool></Group>
      </>}
      {tab === "Dosya" && <>
        <Group label="Dışa aktar"><Tool label="PDF" disabled={Boolean(exporting) || !paginationReady} onClick={() => onExport("pdf")}>{exporting === "pdf" ? "PDF hazırlanıyor…" : "PDF"}</Tool><Tool label="Word" disabled={Boolean(exporting) || !paginationReady} onClick={() => onExport("docx")}>{exporting === "docx" ? "Word hazırlanıyor…" : "Word"}</Tool><Tool label="Yazdır" onClick={onPrint}>Yazdır</Tool></Group>
      </>}
      {tab === "Ekle" && <>
        <Group label="Sayfalar"><Tool label="Sayfa sonu ekle" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("insertPageBreak")}>Sayfa sonu</Tool><Tool label="Başlık ekle" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("insertHeading", 1)}>Başlık 1</Tool></Group>
        <Group label="Tablo"><label className="thesis-ribbon-field">Satır <input aria-label="Tablo satır sayısı" type="number" min="1" max="30" value={tableRows} onChange={(event) => setTableRows(Math.max(1, Math.min(30, Number(event.target.value) || 1)))} /></label><label className="thesis-ribbon-field">Sütun <input aria-label="Tablo sütun sayısı" type="number" min="1" max="12" value={tableCols} onChange={(event) => setTableCols(Math.max(1, Math.min(12, Number(event.target.value) || 1)))} /></label><input className={control} aria-label="Tablo başlığı" placeholder="Tablo başlığı (isteğe bağlı)" value={tableCaption} onChange={(event) => setTableCaption(event.target.value)} /><Tool label="Tablo" disabled={!activeSection} onMouseDown={keep} onClick={() => { invoke("insertTable", tableRows, tableCols, tableCaption); setTableCaption(""); }}>Tablo</Tool></Group>
        <Group label="Medya"><Tool label="Görsel" onMouseDown={keep} onClick={() => onImage("")}>Görsel</Tool>{captionKinds.map(([id, rule]) => <Tool key={id} label={`${rule.label} ekle`} onMouseDown={keep} onClick={() => onImage(id)}>{rule.label}</Tool>)}{captionKinds.length ? <select aria-label="Görsel türü" className={control} disabled={!pickedFigure?.isConnected} defaultValue="" onMouseDown={remember} onChange={(event) => onFigureKind?.(event.target.value)}><option value="">Görsel türünü seç</option>{captionKinds.map(([id, rule]) => <option key={id} value={id}>{rule.label}</option>)}</select> : null}</Group>
        <Group label="Bağlantı"><input className={control} aria-label="Bağlantı adresi" placeholder="https://adres" value={linkHref} onChange={(event) => setLinkHref(event.target.value)} onMouseDown={remember} /><input className={control} aria-label="Bağlantı metni" placeholder="Bağlantı metni" value={linkText} onChange={(event) => setLinkText(event.target.value)} /><Tool label="Bağlantı ekle" disabled={!activeSection || !/^https?:\/\//i.test(linkHref)} onMouseDown={keep} onClick={() => { invoke("insertLink", linkHref, linkText); setLinkHref(""); setLinkText(""); }}>Bağlantı ekle</Tool></Group>
        {template.equations ? <Group label="Denklem"><Tool label="Blok denklem ekle" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("insertFormula", true, true)}>∑ Denklem</Tool><Tool label="Denklem numarasını aç veya kapat" disabled={!pickedEquation?.isConnected} onClick={onEquationNumber}>Denklem no</Tool></Group> : null}
        <Group label="Sayfa öğeleri"><Tool label="Metin çerçevesi ekle" onClick={() => onAddFrame("text")}>Metin çerçevesi</Tool><Tool label="Çizgi ekle" onClick={() => onAddFrame("separator")}>Çizgi</Tool></Group>
      </>}
      {tab === "Düzen" && <>
        <Group label="Sayfa düzeni"><Tool label="Sayfa düzeni denetçisini aç" pressed={pageSettingsOpen} onClick={() => setPageSettingsOpen(!pageSettingsOpen)}>Kenar boşlukları</Tool><Tool label="Cetvelleri göster veya gizle" pressed={rulersVisible} onClick={() => setRulersVisible(!rulersVisible)}>Cetveller {rulersVisible ? "Açık" : "Kapalı"}</Tool><label className="thesis-ribbon-field">Birim <select aria-label="Cetvel birimi" value={rulerUnit} onChange={(event) => setRulerUnit(event.target.value)}><option value="mm">mm</option><option value="cm">cm</option><option value="pt">pt</option></select></label></Group>
        <Group label="Sayfa sayısı"><span className="thesis-ribbon-stat">{totalPages} sayfa · A4</span></Group>
        <Group label="Yerleşim geçmişi"><Tool label="Düzen değişikliğini geri al" disabled={!canUndo} onClick={onUndo}>Geri al</Tool><Tool label="Düzen değişikliğini yinele" disabled={!canRedo} onClick={onRedo}>Yinele</Tool></Group>
      </>}
      {tab === "Başvurular" && <>
        <Group label="Dipnotlar"><form className="thesis-inline-form" onSubmit={submitCitation}><input className={control} aria-label="Dipnot metni" placeholder="Dipnot metni" value={footnoteText} onChange={(event) => setFootnoteText(event.target.value)} onMouseDown={remember} /><Tool type="submit" label="Dipnot ekle" disabled={!activeSection || !footnoteText.trim()}>Ekle</Tool></form></Group>
        <Group label="Kaynakça"><Tool label="Atıf" disabled={!activeSection} pressed={citeOpen} onMouseDown={keep} onClick={() => setCiteOpen(!citeOpen)}>Atıf</Tool>{citableItems.length ? <select aria-label="Kaynakçadan atıf seç" className={control} defaultValue="" onMouseDown={remember} onChange={(event) => { const value = event.target.value; event.target.value = ""; if (value) onInsertCitation(value); }}><option value="">Kaynakçadan seç</option>{citableItems.map((item, index) => <option key={index} value={item}>{item}</option>)}</select> : <span className="thesis-ribbon-hint">Kaynak eklemek için Tez bilgileri panelini açın.</span>}</Group>
        {citeOpen && <form className="thesis-citation-popover" aria-label="Atıf ekle" onSubmit={(event) => { event.preventDefault(); onInsertCitation(citeText); }}><input autoFocus className={control} aria-label="Atıf veya dipnot metni" placeholder="Atıf metni" value={citeText} onChange={(event) => setCiteText(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setCiteOpen(false); }} /><Tool type="submit" label="Atıf ekle" disabled={!citeText.trim()}>Ekle</Tool></form>}
      </>}
      {tab === "Görünüm" && <>
        <Group label="Gezinti"><Tool label="Gezinti bölmesini aç veya kapat" pressed={navigationOpen} disabled={!canNavigate} onClick={() => setNavigationOpen(!navigationOpen)}>Gezinti bölmesi</Tool><Tool label="Cetvelleri göster veya gizle" pressed={rulersVisible} onClick={() => setRulersVisible(!rulersVisible)}>Cetveller</Tool></Group>
        <Group label="Yakınlaştır"><Tool label="Uzaklaştır" disabled={zoom <= 0.5} onMouseDown={keep} onClick={() => stepZoom(-1)}>−</Tool><select aria-label="Yakınlaştırma düzeyi" className={control} value={zoomChoice} onChange={(event) => setZoomChoice(event.target.value)}><option value="fit">Genişliğe sığdır</option>{[50, 75, 100, 125, 150].map((level) => <option key={level} value={String(level)}>%{level}</option>)}</select><Tool label="Yakınlaştır" disabled={zoom >= 1.5} onMouseDown={keep} onClick={() => stepZoom(1)}>+</Tool></Group>
      </>}
    </div>
    {warningCount > 0 && <div className="thesis-ribbon-warning"><details open={warningsOpen} onToggle={(event) => setWarningsOpen(event.currentTarget.open)}><summary>{validationIssues.length ? `${validationIssues.length} belge uyarısı` : `${warningCount} uyarı`}</summary><div>{warning && <p>{warning}</p>}{missingFields?.length ? <p>Eksik tez bilgisi: {missingFields.join(", ")}</p> : null}{indexWarning && <p>{indexWarning}</p>}{validationIssues.map((issue, index) => <p key={index}>{issue.message}</p>)}</div></details></div>}
    {message ? <div className="thesis-ribbon-message" role="status">{message}</div> : null}
  </header>;
}
