import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { bibliographyItemsFromResearch, normalizeBibliographyItems } from "../../lib/academicBibliography.js";
import { figureHtml, imageDimensions, readImageAsDataUrl } from "../../lib/academicMedia.js";
import { htmlToPlainText } from "../../lib/richText.js";
import { trustedStyleNonce } from "../../lib/cspStyles.js";
import { buildThesisCss, buildThesisPrintHtml, compileThesisDocument, groupThesisSections, thesisWordBaselineProbes } from "../../thesis/engine.js";
import { measureWordBaselineCss } from "../../thesis/wordBaseline.js";
import { buildThesisPageModel, pageMetrics, thesisPagedCss } from "../../thesis/pageLayout.js";
import { THESIS_TEMPLATE_REGISTRY, resolveThesisTemplate } from "../../thesis/registry.js";
import { THESIS_METADATA_ALIASES, THESIS_METADATA_FIELDS, orderedThesisSections, thesisEnabledSections, thesisMetadataValue, thesisSectionConditionMet, updateThesisMetadata, updateThesisNoteSection } from "../../thesis/document.js";
import { THESIS_PAGE_FOOTNOTES, THESIS_PAGED_LAYOUT, ThesisSectionPages } from "./ThesisSectionPages";
import { decorateThesisSources, INDEX_ITERATION_CAP, renderedIndexPages, resolveGeneratedIndexes } from "../../thesis/generatedIndex.js";
import { layoutThesisFootnotes } from "../../thesis/footnotes.js";

const hiddenFields = new Set(["THESIS_TITLE", "UNIVERSITY_NAME", "INSTITUTE_NAME", "DEGREE_TYPE"]);
// Tailwind's reset removes list markers; the stored ul/ol structure is unchanged.
const EDITOR_CSS = ".thesis-paper.thesis-editor-surface{background:#fff;box-shadow:0 8px 28px rgba(0,0,0,.13);overflow:visible}.thesis-editor-surface .rich-text-body{caret-color:#111}.thesis-body .rich-text-body ul{list-style:disc;padding-left:24pt;margin:0 0 6pt}.thesis-body .rich-text-body ol{list-style:decimal;padding-left:24pt;margin:0 0 6pt}.thesis-body .rich-text-body li{white-space:pre-wrap}";
const ZOOM_LEVELS = [50, 75, 100, 125, 150];
const THESIS_IMAGE_MAX_EDGE = 1200;
const toolClass = "rounded-md border px-2 py-1.5 text-xs dark:border-neutral-700 disabled:cursor-not-allowed disabled:opacity-40";
const metadataGroups = [
  ["TEZ BİLGİLERİ", ["THESIS_TITLE_EN"]],
  ["ÖĞRENCİ BİLGİLERİ", ["STUDENT_NAME", "STUDENT_NUMBER"]],
  ["AKADEMİK BİLGİLER", ["DEPARTMENT_NAME", "DEPARTMENT_NAME_EN", "PROGRAM_NAME"]],
  ["DANIŞMAN", ["ADVISOR_NAME", "ADVISOR_TITLE"]],
  ["İKİNCİ DANIŞMAN", ["CO_ADVISOR_NAME", "CO_ADVISOR_TITLE"]],
  ["YER VE TARİH", ["CITY", "YEAR", "DATE"]],
  ["ÖZET BİLGİLERİ", ["KEYWORDS", "KEYWORDS_EN"]],
  ["TAAHHÜTNAME", ["USED_PROGRAMS"]],
];
const metadataHints = {
  KEYWORDS: "Örnek: veri analizi, yapay zekâ, makine öğrenmesi, eğitim, yazılım",
  KEYWORDS_EN: "Example: data analysis, artificial intelligence, machine learning, education, software",
  USED_PROGRAMS: "Örnek: MATLAB R2026a, Python 3.13, SPSS 29",
};

export function ThesisEditor({ title, content, researchData, onTitleChange, onContentChange, onResearchDataChange }) {
  const thesis = researchData?.thesis && typeof researchData.thesis === "object" ? researchData.thesis : {};
  const selectionKey = JSON.stringify([thesis.templateId, thesis.selection?.universityId, thesis.selection?.instituteId, thesis.selection?.degreeType, thesis.selection?.language]);
  const [resolution, setResolution] = useState(null);
  const resolved = resolution?.key === selectionKey ? resolution.result : null;
  const [exporting, setExporting] = useState("");
  const [message, setMessage] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [zoomChoice, setZoomChoice] = useState("fit");
  const [viewportWidth, setViewportWidth] = useState(900);
  const [activeSectionId, setActiveSectionId] = useState("");
  const [citeOpen, setCiteOpen] = useState(false);
  const [citeText, setCiteText] = useState("");
  // Measured physical pages per page group. Presentation only; never written to the note.
  const [pageCounts, setPageCounts] = useState({});
  const [indexResolution, setIndexResolution] = useState({});
  const [indexWarning, setIndexWarning] = useState("");
  // Page-bottom notes per group/page, derived from the current pagination. Never written to the note.
  const [footnoteViews, setFootnoteViews] = useState({});
  const footnoteState = useRef({});
  const bodyRefs = useRef({});
  const papersRef = useRef(null);
  const viewportRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    let live = true;
    const selection = { ...thesis.selection, templateId: thesis.templateId };
    void resolveThesisTemplate(selection).then((result) => { if (live) setResolution({ key: selectionKey, result }); });
    return () => { live = false; };
  }, [selectionKey]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    const measure = () => setViewportWidth(viewport.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [resolved]);

  const template = resolved?.template;
  const plainTitle = htmlToPlainText(title);
  const bibliographyItems = normalizeBibliographyItems(bibliographyItemsFromResearch(researchData));
  const sourceModel = useMemo(() => template ? compileThesisDocument(template, thesis, plainTitle, content, bibliographyItems) : null, [template, thesis, plainTitle, content, researchData]);
  const model = useMemo(() => sourceModel ? resolveGeneratedIndexes(sourceModel, indexResolution.pages || {}, indexResolution.counts) : null, [sourceModel, indexResolution]);
  const pageGroups = useMemo(() => model ? groupThesisSections(model.sections) : [], [model]);
  const pageModel = useMemo(() => buildThesisPageModel(pageGroups, pageCounts), [pageGroups, pageCounts]);
  const totalPages = pageModel.reduce((sum, entry) => sum + entry.pages.length, 0);
  const onPageCount = useCallback((groupId, count) => setPageCounts((current) => current[groupId] === count ? current : { ...current, [groupId]: count }), []);
  const css = useMemo(() => model ? buildThesisCss(model) + (THESIS_PAGED_LAYOUT ? thesisPagedCss(pageGroups) : "") : "", [model, pageGroups]);
  // Opt-in Word line placement: measure this browser's baseline of every text style (paint-only offsets).
  const baselineProbes = useMemo(() => model ? thesisWordBaselineProbes(model) : [], [model]);
  const baselineProbeKey = baselineProbes.map((probe) => probe.id).join(",");
  const [baselineCss, setBaselineCss] = useState("");
  useLayoutEffect(() => {
    if (!baselineProbes.length) { setBaselineCss(""); return undefined; }
    let alive = true;
    const measure = () => { if (alive) setBaselineCss(measureWordBaselineCss(baselineProbes)); };
    measure();
    document.fonts?.ready?.then(measure);
    document.fonts?.addEventListener?.("loadingdone", measure);
    return () => { alive = false; document.fonts?.removeEventListener?.("loadingdone", measure); };
  }, [baselineProbeKey]);
  const warning = resolved?.fallback ? resolved.reason : thesis.fallback ? thesis.fallbackReason : "";
  const missingFields = model ? [...new Set(model.sections.flatMap((section) => section.missingPlaceholders))] : [];
  const documentWidth = model ? Math.max(...model.sections.map((section) => pageMetrics(section.rules.page).widthPx)) : 794;
  const zoom = zoomChoice === "fit" ? Math.min(1.25, Math.max(0.1, (viewportWidth - 48) / documentWidth)) : Number(zoomChoice) / 100;
  const stepZoom = (direction) => {
    const percentage = Math.round(zoom * 100);
    const next = direction > 0 ? ZOOM_LEVELS.find((level) => level > percentage) : ZOOM_LEVELS.findLast((level) => level < percentage);
    setZoomChoice(String(next ?? (direction > 0 ? 150 : 50)));
  };
  // Optional sections whose declarative condition fails (e.g. a doctorate-only page) are not offered.
  const conditionState = { ...thesis, values: { ...model?.values, degreeType: model?.values.degreeType ?? model?.values.DEGREE_TYPE } };
  const optionalSections = template ? orderedThesisSections(template).filter((section) => section.status === "optional" && thesisSectionConditionMet(section, conditionState)) : [];
  const numberingChoices = template?.captionNumberingChoices || [];
  // Standard metadata fields plus any extra placeholders the template declares; one input per alias pair.
  // Derived values (e.g. the total page count) come from the layout and are never typed in.
  const metadataFields = template ? Object.entries({ ...THESIS_METADATA_FIELDS, ...template.placeholders }).filter(([key, definition], index, all) => !hiddenFields.has(key) && !definition.derived
    && !all.slice(0, index).some(([previous]) => THESIS_METADATA_ALIASES[previous] === key)) : [];
  const metadataByKey = new Map(metadataFields);
  const groupedKeys = new Set(metadataGroups.flatMap(([, keys]) => keys));
  const extraMetadataFields = metadataFields.filter(([key]) => !groupedKeys.has(key));
  const metadataInput = (key) => {
    const definition = metadataByKey.get(key);
    if (!definition) return null;
    const label = key === "CO_ADVISOR_NAME" || key === "CO_ADVISOR_TITLE" ? `${definition.label} (isteğe bağlı)` : key === "USED_PROGRAMS" ? "Kullanılan program (varsa)" : definition.label;
    return <label key={key} className="block text-xs font-medium">{label}{definition.required ? " *" : ""}<input aria-label={`${definition.label}${definition.required ? " *" : ""}`} type={definition.type === "number" ? "number" : definition.type === "date" ? "date" : "text"} className="mt-1 block w-full min-w-0 rounded border border-neutral-300 bg-transparent p-2 text-sm dark:border-neutral-700" value={thesisMetadataValue(thesis, key) ?? definition.defaultValue ?? ""} onChange={(event) => setValue(key, event.target.value)} />{metadataHints[key] ? <span aria-hidden="true" className="mt-1 block text-[11px] font-normal leading-snug text-neutral-500">{metadataHints[key]}</span> : null}</label>;
  };
  const metadataSection = (heading, keys, extraClass = "") => <section key={heading} className={`border-t border-neutral-200 pt-4 dark:border-neutral-800 ${extraClass}`}><h4 className="mb-3 text-[11px] font-semibold tracking-wide text-neutral-600 dark:text-neutral-300">{heading}</h4><div className="grid gap-3">{keys.map(metadataInput)}</div></section>;

  useLayoutEffect(() => { if (model && papersRef.current) decorateThesisSources(papersRef.current, model); }, [model, zoom]);

  // A bounded fixed point over the SAME browser flow. Only local presentation state changes.
  // Page-bottom notes change body capacity (and so heading pages), so notes are laid out
  // first and the generated indexes read the result; one signature covers both.
  useLayoutEffect(() => {
    const root = papersRef.current;
    if (!sourceModel || !root || !THESIS_PAGED_LAYOUT) return;
    let frame = 0, iterations = 0, previous = "", disposed = false, settled = false;
    setIndexWarning("");
    const probe = () => {
      if (disposed) return;
      const groups = groupThesisSections(sourceModel.sections);
      // A frame budget keeps typing responsive in long, note-heavy groups: an incomplete
      // pass (later pages still to re-lay) continues next frame and is not an iteration.
      const { views: notes, incomplete } = THESIS_PAGE_FOOTNOTES ? layoutThesisFootnotes(root, groups, footnoteState.current, performance.now() + 24) : { views: {} };
      if (incomplete) {
        setFootnoteViews((current) => JSON.stringify(current) === JSON.stringify(notes) ? current : notes);
        frame = requestAnimationFrame(probe);
        return;
      }
      const next = renderedIndexPages(root, groups);
      const signature = JSON.stringify([next, notes]);
      if (signature === previous) { settled = true; return; }
      if (iterations++ >= INDEX_ITERATION_CAP) {
        setIndexWarning("Dizin/dipnot sayfalaması kararlı hale gelmedi; son ölçülmüş sonuç kullanılıyor.");
        return;
      }
      previous = signature;
      setIndexResolution((current) => JSON.stringify(current) === JSON.stringify(next) ? current : next);
      setFootnoteViews((current) => JSON.stringify(current) === JSON.stringify(notes) ? current : notes);
      frame = requestAnimationFrame(probe);
    };
    const restart = () => { cancelAnimationFrame(frame); if (settled) { iterations = 0; previous = ""; settled = false; } frame = requestAnimationFrame(probe); };
    restart();
    const observer = new ResizeObserver(restart);
    root.querySelectorAll(".thesis-page-flow").forEach((flow) => observer.observe(flow));
    root.addEventListener("load", restart, true);
    document.fonts.ready.then(() => { if (!disposed) restart(); });
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); root.removeEventListener("load", restart, true); };
  }, [sourceModel, zoom]);

  const saveThesis = (patch) => onResearchDataChange?.({ ...researchData, thesis: { ...thesis, ...patch } });
  const setValue = (key, value) => onResearchDataChange?.({ ...researchData, thesis: updateThesisMetadata(thesis, key, value) });
  const setBibliography = (items) => onResearchDataChange?.({ ...researchData, docBibliographyItems: items });
  const toggleOptional = (id) => {
    const enabled = new Set(thesisEnabledSections(thesis));
    if (enabled.has(id)) enabled.delete(id); else enabled.add(id);
    saveThesis({ enabledSections: [...enabled] });
  };
  const changeTemplate = (id) => {
    const entry = THESIS_TEMPLATE_REGISTRY.find((item) => item.id === id);
    if (!entry) return;
    saveThesis({ templateId: entry.id, templateVersion: entry.templateVersion, selection: { universityId: entry.universityId, instituteId: entry.instituteId, degreeType: entry.degreeType, language: entry.language } });
  };
  const onTextChange = (section, html, reason) => {
    const current = { content, researchData };
    const next = updateThesisNoteSection(current, section, html);
    if (next === current) return;
    if (next.content !== content) onContentChange(next.content, reason);
    else onResearchDataChange?.(next.researchData, reason);
  };
  // The one toolbar drives only the editable section that last had focus. Static and
  // generated sections have no editor instance, and clicking one clears the target.
  const activeSection = model?.sections.find((section) => section.id === activeSectionId && section.editable) || null;
  const activeBody = () => (activeSection ? bodyRefs.current[activeSection.id] || null : null);
  // Take the live caret/selection first; selectionchange can still be queued behind fast typing.
  const run = (command) => { const body = activeBody(); if (!body) return; body.rememberSelection?.(); command(body); };
  const rememberSelection = (event) => { event.preventDefault(); activeBody()?.rememberSelection?.(); };
  const trackSectionPointer = (event) => {
    const flow = event.target.closest?.(".thesis-flow-section");
    if (flow && flow.getAttribute("data-thesis-section-mode") !== "editable") { setActiveSectionId(""); setCiteOpen(false); }
  };
  const keepSelection = (event) => event.preventDefault();
  const citableItems = bibliographyItems.map((item) => item.trim()).filter(Boolean);
  const insertCitation = (text) => {
    const value = String(text || "").trim();
    if (!value) return;
    activeBody()?.insertFootnote(value);
    setCiteText(""); setCiteOpen(false);
  };

  const exportFile = async (kind) => {
    if (!model) return;
    setExporting(kind); setMessage("");
    try {
      const [{ buildThesisDocx, buildThesisPdf }, { buildThesisLayoutPdf }, { academicFileStem, downloadBlob }] = await Promise.all([
        import("../../thesis/export.js"), import("../../thesis/layoutPdf.js"), import("../../lib/academicExport.js"),
      ]);
      // The PDF is drawn from the editor's own paged layout; engines without it keep the model-based writer.
      const blob = kind === "pdf"
        ? (THESIS_PAGED_LAYOUT && papersRef.current ? await buildThesisLayoutPdf({ root: papersRef.current, groups: pageGroups, title: model.title, language: model.language, templateId: model.templateId, systemFonts: model.systemFonts || [] }) : await buildThesisPdf(model))
        : await buildThesisDocx(model, { captionAlignments: Object.fromEntries([...(papersRef.current?.querySelectorAll("[data-thesis-caption-auto]") || [])].map((node) => [node.dataset.thesisAnchor, node.dataset.thesisCaptionAuto])) });
      const path = await downloadBlob(blob, `${academicFileStem(plainTitle || "tez")}.${kind}`);
      setMessage(path ? `Kaydedildi: ${path}` : `${kind.toUpperCase()} indirildi.`);
    } catch (error) { setMessage(error?.message || "Dışa aktarma başarısız."); }
    finally { setExporting(""); }
  };

  const print = () => {
    if (!model) return;
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;width:0;height:0;border:0;visibility:hidden";
    frame.srcdoc = buildThesisPrintHtml(model, { nonce: trustedStyleNonce() });
    frame.onload = () => { frame.contentWindow?.focus(); frame.contentWindow?.print(); setTimeout(() => frame.remove(), 30000); };
    document.body.appendChild(frame);
  };

  // Same image pipeline as AcademicTools: downscaled data URL + academic figure markup.
  // The page column is ~600 CSS px, so 1200 px (2x) is enough; a smaller data URL keeps
  // every save (localStorage/IndexedDB/sync checksum) of the whole note fast.
  const insertImage = async (file) => {
    const body = activeBody();
    if (!file || !body) return;
    try {
      // Photographic PNGs become JPEG: kept as PNG, a 12 MP photo was a 4 MB data URL and
      // every later keystroke re-processed and re-saved it (~0.5 s per key). The opacity
      // scan runs once, only for PNGs over 1 MB, on the downscaled canvas (~130 ms).
      const dataUrl = await readImageAsDataUrl(file, THESIS_IMAGE_MAX_EDGE, { opaqueAsJpeg: true });
      const size = await imageDimensions(dataUrl).catch(() => null);
      body.insertHtml(figureHtml(dataUrl, "", size));
    } catch (error) { setMessage(error?.message || "Görsel eklenemedi."); }
  };

  if (!model) return <div className="flex h-full items-center justify-center text-sm text-neutral-500">Tez şablonu yükleniyor…</div>;

  return <div className="flex h-full min-h-0 flex-col bg-[#e9eaec] dark:bg-neutral-950">
    <style nonce={trustedStyleNonce()} data-thesis-styles>{css + EDITOR_CSS + baselineCss}</style>
    <div className="shrink-0 border-b border-neutral-200 bg-white px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setDetailsOpen((open) => !open)} aria-expanded={detailsOpen} className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium dark:border-neutral-700">Tez bilgileri</button>
        <select aria-label="Paragraf biçimi" disabled={!activeSection} defaultValue="" onMouseDown={() => activeBody()?.rememberSelection?.()} onChange={(event) => { const value = event.target.value; event.target.value = ""; if (value !== "") run((body) => body.setBlockType(Number(value))); }} className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-900 disabled:opacity-40 dark:border-neutral-700">
          <option value="" disabled>Paragraf biçimi</option><option value="0">Normal</option>{Object.keys(model.sections.find((section) => section.id === activeSectionId)?.rules.headings || template.typography.headings).map((level) => <option key={level} value={level}>Başlık {level}</option>)}
        </select>
        <div className="flex items-center rounded-md border border-neutral-300 dark:border-neutral-700">
          {[["B", "bold", "Kalın"], ["I", "italic", "İtalik"], ["U", "underline", "Altı çizili"]].map(([label, style, name]) => <button key={style} type="button" title={name} aria-label={name} disabled={!activeSection} onMouseDown={keepSelection} onClick={() => run((body) => body.toggleStyle(style))} className={`min-w-8 px-2 py-1.5 text-xs disabled:opacity-40 ${style === "bold" ? "font-bold" : style === "italic" ? "italic" : "underline"}`}>{label}</button>)}
        </div>
        <select aria-label="Hizalama" disabled={!activeSection} defaultValue="" onMouseDown={() => activeBody()?.rememberSelection?.()} onChange={(event) => { const align = event.target.value; event.target.value = ""; if (align) run((body) => body.applyAlign(align)); }} className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-900 disabled:opacity-40 dark:border-neutral-700">
          <option value="">Hizalama</option><option value="left">Sol</option><option value="center">Orta</option><option value="right">Sağ</option><option value="justify">İki yana</option>
        </select>
        <button type="button" aria-label="Madde işaretli liste" disabled={!activeSection} onMouseDown={keepSelection} onClick={() => run((body) => body.toggleList(false))} className={toolClass}>• Liste</button>
        <button type="button" aria-label="Numaralı liste" disabled={!activeSection} onMouseDown={keepSelection} onClick={() => run((body) => body.toggleList(true))} className={toolClass}>1. Liste</button>
        <button type="button" disabled={!activeSection} onMouseDown={keepSelection} onClick={() => run((body) => body.insertTable(2, 2, ""))} className={toolClass}>Tablo</button>
        <button type="button" disabled={!activeSection} onMouseDown={rememberSelection} onClick={() => imageInputRef.current?.click()} className={toolClass}>Görsel</button>
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { void insertImage(event.target.files?.[0]); event.target.value = ""; }} />
        <div className="relative">
          <button type="button" aria-expanded={citeOpen} disabled={!activeSection} onMouseDown={rememberSelection} onClick={() => setCiteOpen((open) => !open)} className={toolClass}>Atıf</button>
          {citeOpen && activeSection ? <div role="dialog" aria-label="Atıf ekle" className="absolute left-0 top-full z-30 mt-1 w-72 rounded-md border border-neutral-200 bg-white p-2 text-xs text-neutral-900 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100">
            <form className="flex gap-1" onSubmit={(event) => { event.preventDefault(); insertCitation(citeText); }}>
              <input autoFocus aria-label="Atıf / dipnot metni" placeholder="Atıf / dipnot metni" value={citeText} onChange={(event) => setCiteText(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setCiteOpen(false); }} className="min-w-0 flex-1 rounded border border-neutral-300 bg-transparent px-2 py-1 dark:border-neutral-700" />
              <button type="submit" disabled={!citeText.trim()} className="rounded border px-2 disabled:opacity-40 dark:border-neutral-700">Ekle</button>
            </form>
            {citableItems.length ? <><p className="mt-2 text-[11px] text-neutral-500">Kaynakçadan seç</p><ul className="mt-1 max-h-40 overflow-y-auto">{citableItems.map((item, index) => <li key={index}><button type="button" title={item} onClick={() => insertCitation(item)} className="block w-full truncate rounded px-1 py-1 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800">{item}</button></li>)}</ul></> : null}
          </div> : null}
        </div>
        <button type="button" onClick={() => setDetailsOpen(true)} className={toolClass}>Kaynakça</button>
        <span className="max-w-48 truncate text-xs text-neutral-500" aria-live="polite">{activeSection ? `Düzenlenen: ${activeSection.title}` : "Biçim için düzenlenebilir bir bölüme tıklayın"}</span>
        <span className="ml-auto text-xs text-neutral-500">{template.status === "demo" ? "DEMO · resmî şablon değildir" : template.status === "generic" ? "Genel taslak" : template.universityName}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-2 dark:border-neutral-800">
        <span className="mr-1 max-w-40 truncate text-xs font-medium text-neutral-700 dark:text-neutral-200" title={template.universityName}>{template.universityName}</span>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Uzaklaştır" disabled={zoom <= 0.5} onMouseDown={keepSelection} onClick={() => stepZoom(-1)} className={toolClass}>−</button>
          <label className="text-xs text-neutral-500">Yakınlaştır <select aria-label="Yakınlaştır" value={zoomChoice} onChange={(event) => setZoomChoice(event.target.value)} className="ml-1 rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 dark:border-neutral-700"><option value="fit">Genişliğe sığdır</option>{ZOOM_LEVELS.map((level) => <option key={level} value={level}>%{level}</option>)}</select></label>
          <button type="button" aria-label="Yakınlaştır artır" disabled={zoom >= 1.5} onMouseDown={keepSelection} onClick={() => stepZoom(1)} className={toolClass}>+</button>
        </div>
        {THESIS_PAGED_LAYOUT ? <span className="text-xs text-neutral-500" data-thesis-total-pages={totalPages}>{totalPages} sayfa</span> : null}
        {missingFields.length ? <span className="text-xs text-amber-700" title={missingFields.map((key) => template.placeholders[key]?.label || key).join(", ")}>{missingFields.length} eksik tez bilgisi</span> : null}
        {warning ? <span role="alert" className="text-xs text-red-700">{warning}</span> : null}
        {indexWarning ? <span role="alert" className="text-xs text-amber-700">{indexWarning}</span> : null}
        {model.validation.errors.length + model.validation.warnings.length ? <span role="status" className="text-xs text-amber-700" title={[...model.validation.errors, ...model.validation.warnings].map((issue) => issue.message).join("\n")}>{model.validation.errors.length + model.validation.warnings.length} belge uyarısı</span> : null}
        {message ? <span role="status" className="max-w-60 truncate text-xs text-neutral-500" title={message}>{message}</span> : null}
        <div className="ml-auto flex gap-2"><button type="button" onClick={print} className="rounded border px-2 py-1 text-xs dark:border-neutral-700">Yazdır</button><button type="button" disabled={Boolean(exporting)} onClick={() => void exportFile("pdf")} className="rounded border px-2 py-1 text-xs dark:border-neutral-700">{exporting === "pdf" ? "Hazırlanıyor…" : "PDF"}</button><button type="button" disabled={Boolean(exporting)} onClick={() => void exportFile("docx")} className="rounded border px-2 py-1 text-xs dark:border-neutral-700">{exporting === "docx" ? "Hazırlanıyor…" : "Word"}</button></div>
      </div>
    </div>
    <div className="flex min-h-0 flex-1">
      <div ref={viewportRef} className="min-w-0 flex-1 overflow-auto px-4 py-7">
        <div ref={papersRef} onPointerDownCapture={trackSectionPointer} className="flex w-max min-w-full flex-col gap-7">
          {pageGroups.map((group, index) => <ThesisSectionPages key={`${model.templateId}:${group.id}`} group={group} pages={pageModel[index].pages} values={model.values} zoom={zoom} bodyRefs={bodyRefs} onSectionFocus={setActiveSectionId} onTextChange={onTextChange} onPageCount={onPageCount} footnotes={footnoteViews[group.id]} />)}
        </div>
      </div>
      {detailsOpen ? <aside className="w-80 shrink-0 overflow-y-auto border-l border-neutral-200 bg-white p-4 text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100" aria-label="Tez bilgileri">
        <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold">Tez bilgileri</h3><button type="button" onClick={() => setDetailsOpen(false)} aria-label="Tez bilgilerini kapat" className="rounded px-2 py-1 text-lg">×</button></div>
        <div className="space-y-5">
          <section><label className="block text-xs font-medium">Şablon<select aria-label="Tez şablonu" value={template.id} onChange={(event) => changeTemplate(event.target.value)} className="mt-1 block w-full rounded border border-neutral-300 bg-white p-2 text-sm text-neutral-900">{THESIS_TEMPLATE_REGISTRY.map((entry) => <option key={entry.id} value={entry.id}>{entry.displayName || `${entry.universityName} · ${entry.language.toUpperCase()}`}</option>)}</select></label>{template.status === "official" ? <p className="mt-2 text-[11px] leading-snug text-neutral-500">Resmî kaynak: {template.source?.documentName || template.source?.url}</p> : <p className="mt-2 text-[11px] text-amber-700">Demo şablonlar test verisidir; resmî üniversite kuralı değildir.</p>}</section>
          <section className="border-t border-neutral-200 pt-4 dark:border-neutral-800"><h4 className="mb-3 text-[11px] font-semibold tracking-wide text-neutral-600 dark:text-neutral-300">TEZ BİLGİLERİ</h4><div className="grid gap-3"><label className="block text-xs font-medium">Tez başlığı *<input aria-label="Tez başlığı" className="mt-1 block w-full min-w-0 rounded border border-neutral-300 bg-transparent p-2 text-sm dark:border-neutral-700" value={plainTitle} onChange={(event) => onTitleChange(event.target.value)} placeholder="Tez başlığını yazın" /></label>{metadataInput("THESIS_TITLE_EN")}</div></section>
          {metadataGroups.slice(1, -1).map(([heading, keys]) => metadataSection(heading, keys))}
          <section className="border-t border-neutral-200 pt-4 dark:border-neutral-800"><h4 className="mb-3 text-[11px] font-semibold tracking-wide text-neutral-600 dark:text-neutral-300">BELGE AYARLARI</h4>{numberingChoices.length ? <label className="block text-xs font-medium">Şekil/tablo numaralandırma<select aria-label="Şekil ve tablo numaralandırma" value={thesis.captionNumbering || numberingChoices[0].id} onChange={(event) => saveThesis({ captionNumbering: event.target.value })} className="mt-1 block w-full rounded border border-neutral-300 bg-white p-2 text-sm text-neutral-900">{numberingChoices.map((choice) => <option key={choice.id} value={choice.id}>{choice.label}</option>)}</select></label> : null}</section>
          {metadataSection("TAAHHÜTNAME", ["USED_PROGRAMS"])}
          {extraMetadataFields.length ? metadataSection("DİĞER BİLGİLER", extraMetadataFields.map(([key]) => key)) : null}
          <section className="border-t border-neutral-200 pt-4 text-xs dark:border-neutral-800"><h4 className="mb-3 text-[11px] font-semibold tracking-wide text-neutral-600 dark:text-neutral-300">İSTEĞE BAĞLI BÖLÜMLER</h4>{optionalSections.map((section) => <label key={section.id} className="block py-1"><input type="checkbox" checked={thesisEnabledSections(thesis).includes(section.id)} onChange={() => toggleOptional(section.id)} /> {section.title}</label>)}</section>
          <section className="border-t border-neutral-200 pt-4 text-xs dark:border-neutral-800"><h4 className="mb-3 text-[11px] font-semibold tracking-wide text-neutral-600 dark:text-neutral-300">KAYNAKÇA</h4><p className="mb-2 font-medium">Kaynakça maddeleri</p><div className="grid gap-2">{bibliographyItems.map((item, index) => <input key={index} className="w-full min-w-0 rounded border border-neutral-300 bg-transparent p-2 text-sm dark:border-neutral-700" aria-label={`Kaynakça maddesi ${index + 1}`} value={item} onChange={(event) => setBibliography(bibliographyItems.map((entry, i) => i === index ? event.target.value : entry))} />)}<button type="button" className="w-fit rounded border px-2 py-1" onClick={() => setBibliography([...bibliographyItems, ""])}>+ Kaynak ekle</button></div></section>
        </div>
      </aside> : null}
    </div>
  </div>;
}
