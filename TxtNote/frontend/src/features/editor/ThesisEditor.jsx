import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { bibliographyItemsFromResearch, normalizeBibliographyItems } from "../../lib/academicBibliography.js";
import { figureHtml, imageDimensions, readImageAsDataUrl } from "../../lib/academicMedia.js";
import { htmlToPlainText } from "../../lib/richText.js";
import { trustedStyleNonce } from "../../lib/cspStyles.js";
import { buildThesisCss, buildThesisPrintHtml, compileThesisDocument, groupThesisSections } from "../../thesis/engine.js";
import { buildThesisPageModel, pageMetrics, thesisPagedCss } from "../../thesis/pageLayout.js";
import { THESIS_TEMPLATE_REGISTRY, resolveThesisTemplate } from "../../thesis/registry.js";
import { THESIS_METADATA_ALIASES, THESIS_METADATA_FIELDS, orderedThesisSections, thesisEnabledSections, thesisMetadataValue, thesisSectionConditionMet, updateThesisMetadata, updateThesisNoteSection } from "../../thesis/document.js";
import { THESIS_PAGE_FOOTNOTES, THESIS_PAGED_LAYOUT, ThesisSectionPages } from "./ThesisSectionPages";
import { decorateThesisSources, INDEX_ITERATION_CAP, renderedIndexPages, resolveGeneratedIndexes } from "../../thesis/generatedIndex.js";
import { layoutThesisFootnotes } from "../../thesis/footnotes.js";
import { addLayoutElement, normalizeThesisLayout } from "../../thesis/layoutDocument.js";
import { applyLayoutPage, applyLayoutTypography, resolveLayoutTypography } from "../../thesis/layoutProperties.js";
import { useLayoutInteraction } from "./useLayoutInteraction.js";
import LayoutSelectionOverlay from "./LayoutSelectionOverlay.jsx";
import LayoutInspector from "./LayoutInspector.jsx";
import PageLayoutInspector from "./PageLayoutInspector.jsx";
import LayoutRulers from "./LayoutRulers.jsx";

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
  const [pageSettingsOpen, setPageSettingsOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [warningsOpen, setWarningsOpen] = useState(false);
  const [rulersVisible, setRulersVisible] = useState(true);
  const [rulerUnit, setRulerUnit] = useState("mm");
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
  const warning = resolved?.fallback ? resolved.reason : thesis.fallback ? thesis.fallbackReason : "";
  const missingFields = model ? [...new Set(model.sections.flatMap((section) => section.missingPlaceholders))] : [];
  const validationIssues = model ? [...model.validation.errors, ...model.validation.warnings] : [];
  const documentWidth = model ? Math.max(...model.sections.map((section) => pageMetrics(section.rules.page).widthPx)) : 794;
  const zoom = zoomChoice === "fit" ? Math.min(1.25, Math.max(0.1, (viewportWidth - 48) / documentWidth)) : Number(zoomChoice) / 100;
  const stepZoom = (direction) => {
    const percentage = Math.round(zoom * 100);
    const next = direction > 0 ? ZOOM_LEVELS.find((level) => level > percentage) : ZOOM_LEVELS.findLast((level) => level < percentage);
    setZoomChoice(String(next ?? (direction > 0 ? 150 : 50)));
  };
  const commitLayout = useCallback((next, reason = "action") => onResearchDataChange?.({ ...researchData, thesis: next }, reason), [researchData, onResearchDataChange]);
  const interaction = useLayoutInteraction({ rootRef: papersRef, model, thesis, onThesisChange: commitLayout, zoom });
  const layoutState = normalizeThesisLayout(thesis.layout);
  const layoutSectionId = interaction.selectedElements[0]?.sectionId || activeSectionId || model?.sections[0]?.id;
  const layoutSection = model?.sections.find((entry) => entry.id === layoutSectionId);
  const pageTypography = useMemo(() => layoutSection ? resolveLayoutTypography(layoutSection.rules.body, layoutSectionId, thesis.layout) : {}, [layoutSection?.rules.body, layoutSectionId, thesis.layout]);
  const addFrame = (type) => {
    if (!layoutSection) return;
    const page = layoutSection.rules.page;
    interaction.commitThesis(addLayoutElement(thesis, { type, sectionId: layoutSectionId, layoutMode: "absolute", xMm: page.margins.leftMm, yMm: page.margins.topMm,
      widthMm: Math.min(100, page.widthMm - page.margins.leftMm - page.margins.rightMm), heightMm: type === "text" ? 20 : 1,
      ...(type === "text" ? { content: "Metin çerçevesi", style: layoutSection.rules.body } : { thicknessPt: 0.75, lengthPercent: 100 }),
    }), "action");
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
  // The observer/listeners live as long as the paginated root exists; content or zoom changes only
  // reset the fixed-point state (via paginationRef) and re-sync the observed flows.
  const latestSourceModel = useRef(sourceModel);
  latestSourceModel.current = sourceModel;
  const paginationRef = useRef(null);
  const paginationActive = Boolean(sourceModel) && THESIS_PAGED_LAYOUT;
  useLayoutEffect(() => {
    const root = papersRef.current;
    if (!paginationActive || !root) return undefined;
    let frame = 0, iterations = 0, previous = "", disposed = false, settled = false;
    // Last serialized values applied to state; avoids re-stringifying the current state each pass.
    let appliedPages = null, appliedNotes = null;
    const probe = () => {
      if (disposed) return;
      const groups = groupThesisSections(latestSourceModel.current.sections);
      // A frame budget keeps typing responsive in long, note-heavy groups: an incomplete
      // pass (later pages still to re-lay) continues next frame and is not an iteration.
      const { views: notes, incomplete } = THESIS_PAGE_FOOTNOTES ? layoutThesisFootnotes(root, groups, footnoteState.current, performance.now() + 24) : { views: {} };
      const notesText = JSON.stringify(notes);
      const applyNotes = () => { if (notesText !== appliedNotes) { appliedNotes = notesText; setFootnoteViews(notes); } };
      if (incomplete) {
        applyNotes();
        frame = requestAnimationFrame(probe);
        return;
      }
      const next = renderedIndexPages(root, groups);
      const pagesText = JSON.stringify(next);
      const signature = `${pagesText}|${notesText}`;
      if (signature === previous) { settled = true; return; }
      if (iterations++ >= INDEX_ITERATION_CAP) {
        setIndexWarning("Dizin/dipnot sayfalaması kararlı hale gelmedi; son ölçülmüş sonuç kullanılıyor.");
        return;
      }
      previous = signature;
      if (pagesText !== appliedPages) { appliedPages = pagesText; setIndexResolution(next); }
      applyNotes();
      frame = requestAnimationFrame(probe);
    };
    const restart = () => { cancelAnimationFrame(frame); if (settled) { iterations = 0; previous = ""; settled = false; } frame = requestAnimationFrame(probe); };
    const observer = new ResizeObserver(restart);
    const observeFlows = () => { observer.disconnect(); root.querySelectorAll(".thesis-page-flow").forEach((flow) => observer.observe(flow)); };
    // Content/zoom change: start a fresh fixed point (even mid-run) and pick up added/removed flows.
    paginationRef.current = () => { iterations = 0; previous = ""; settled = false; observeFlows(); restart(); };
    observeFlows();
    restart();
    root.addEventListener("load", restart, true);
    document.fonts.ready.then(() => { if (!disposed) restart(); });
    return () => { disposed = true; paginationRef.current = null; cancelAnimationFrame(frame); observer.disconnect(); root.removeEventListener("load", restart, true); };
  }, [paginationActive]);
  useLayoutEffect(() => {
    if (!paginationActive) return;
    setIndexWarning("");
    paginationRef.current?.();
  }, [sourceModel, zoom, paginationActive]);

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
      const [{ buildThesisDocx, buildThesisPdf }, { buildThesisLayoutPdf }, { academicFileStem, downloadBlob }, { collectThesisBlockPageBreaks }] = await Promise.all([
        import("../../thesis/export.js"), import("../../thesis/layoutPdf.js"), import("../../lib/academicExport.js"),
        import("../../thesis/exportPagination.js"),
      ]);
      // The PDF is drawn from the editor's own paged layout; engines without it keep the model-based writer.
      const blob = kind === "pdf"
        ? (THESIS_PAGED_LAYOUT && papersRef.current ? await buildThesisLayoutPdf({ root: papersRef.current, groups: pageGroups, title: model.title, language: model.language, templateId: model.templateId, documentLayout: model.documentLayout }) : await buildThesisPdf(model))
        : await buildThesisDocx(model, { blockPageBreaks: collectThesisBlockPageBreaks(papersRef.current, pageGroups), captionAlignments: Object.fromEntries([...(papersRef.current?.querySelectorAll("[data-thesis-caption-auto]") || [])].map((node) => [node.dataset.thesisAnchor, node.dataset.thesisCaptionAuto])) });
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
    if (!file) return;
    try {
      // Photographic PNGs become JPEG: kept as PNG, a 12 MP photo was a 4 MB data URL and
      // every later keystroke re-processed and re-saved it (~0.5 s per key). The opacity
      // scan runs once, only for PNGs over 1 MB, on the downscaled canvas (~130 ms).
      const dataUrl = await readImageAsDataUrl(file, THESIS_IMAGE_MAX_EDGE, { opaqueAsJpeg: true });
      const size = await imageDimensions(dataUrl).catch(() => null);
      if (body) body.insertHtml(figureHtml(dataUrl, "", size));
      else if (layoutSection) {
        const page = layoutSection.rules.page;
        const maxWidthMm = page.widthMm - page.margins.leftMm - page.margins.rightMm;
        const naturalWidth = size?.width && size?.height ? Math.min(100, maxWidthMm) : Math.min(60, maxWidthMm);
        const naturalHeight = size?.width && size?.height ? naturalWidth * size.height / size.width : 45;
        const next = addLayoutElement(thesis, { type: "image", sectionId: layoutSectionId, source: dataUrl, layoutMode: "absolute", xMm: page.margins.leftMm, yMm: page.margins.topMm, widthMm: naturalWidth, heightMm: naturalHeight, lockAspectRatio: true });
        interaction.commitThesis(next, "action");
      } else setMessage("Görsel eklemek için bir bölüm seçin.");
    } catch (error) { setMessage(error?.message || "Görsel eklenemedi."); }
  };

  if (!model) return <div className="flex h-full items-center justify-center text-sm text-neutral-500">Tez şablonu yükleniyor…</div>;

  return <div className="flex h-full min-h-0 flex-col bg-[#e9eaec] dark:bg-neutral-950">
    <style nonce={trustedStyleNonce()} data-thesis-styles>{css + EDITOR_CSS}</style>
    <input ref={imageInputRef} type="file" accept="image/*" aria-label="Görsel dosyası" className="hidden" onChange={(event) => { void insertImage(event.target.files?.[0]); event.target.value = ""; }} />
    <div className="shrink-0 border-b border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setDetailsOpen((open) => !open)} aria-expanded={detailsOpen} className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium dark:border-neutral-700">Tez bilgileri</button>
        <button type="button" className={toolClass} onClick={() => setPageSettingsOpen((open) => !open)} aria-expanded={pageSettingsOpen}>Sayfa düzeni</button>
        <div className="relative">
          <button type="button" className={toolClass} aria-expanded={addMenuOpen} onClick={() => setAddMenuOpen((open) => !open)}>Ekle</button>
          {addMenuOpen && <div role="menu" aria-label="Ekle" className="absolute left-0 top-full z-40 mt-1 w-48 rounded-lg border border-neutral-200 bg-white p-1 text-sm text-neutral-900 shadow-xl dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100">
            <button type="button" role="menuitem" onClick={() => { addFrame("text"); setAddMenuOpen(false); }} className="block w-full rounded px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800">Metin çerçevesi</button>
            <button type="button" role="menuitem" onClick={() => { addFrame("separator"); setAddMenuOpen(false); }} className="block w-full rounded px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800">Çizgi</button>
            <button type="button" role="menuitem" onClick={() => { imageInputRef.current?.click(); setAddMenuOpen(false); }} className="block w-full rounded px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800">Görsel</button>
          </div>}
        </div>
        <button type="button" aria-label="Geri al" disabled={!interaction.canUndo} onClick={interaction.undo} className={toolClass}>Geri al</button>
        <button type="button" aria-label="Yinele" disabled={!interaction.canRedo} onClick={interaction.redo} className={toolClass}>Yinele</button>
        {activeSection && <span className="max-w-44 truncate text-xs text-neutral-500" aria-live="polite">{activeSection.title}</span>}
      </div>
      {activeSection && <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-2 dark:border-neutral-800" aria-label="Metin biçimlendirme araçları">
        <select aria-label="Paragraf biçimi" defaultValue="" onMouseDown={() => activeBody()?.rememberSelection?.()} onChange={(event) => { const value = event.target.value; event.target.value = ""; if (value !== "") run((body) => body.setBlockType(Number(value))); }} className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-900 dark:border-neutral-700">
          <option value="" disabled>Paragraf biçimi</option><option value="0">Normal</option>{Object.keys(activeSection.rules.headings || template.typography.headings).map((level) => <option key={level} value={level}>Başlık {level}</option>)}
        </select>
        <div className="flex items-center rounded-md border border-neutral-300 dark:border-neutral-700">{[["B", "bold", "Kalın"], ["I", "italic", "İtalik"], ["U", "underline", "Altı çizili"]].map(([label, style, name]) => <button key={style} type="button" title={name} aria-label={name} onMouseDown={keepSelection} onClick={() => run((body) => body.toggleStyle(style))} className={`min-w-8 px-2 py-1.5 text-xs ${style === "bold" ? "font-bold" : style === "italic" ? "italic" : "underline"}`}>{label}</button>)}</div>
        <select aria-label="Hizalama" defaultValue="" onMouseDown={() => activeBody()?.rememberSelection?.()} onChange={(event) => { const align = event.target.value; event.target.value = ""; if (align) run((body) => body.applyAlign(align)); }} className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-900 dark:border-neutral-700"><option value="">Hizalama</option><option value="left">Sol</option><option value="center">Orta</option><option value="right">Sağ</option><option value="justify">İki yana</option></select>
        <button type="button" aria-label="Madde işaretli liste" onMouseDown={keepSelection} onClick={() => run((body) => body.toggleList(false))} className={toolClass}>• Liste</button><button type="button" aria-label="Numaralı liste" onMouseDown={keepSelection} onClick={() => run((body) => body.toggleList(true))} className={toolClass}>1. Liste</button><button type="button" onMouseDown={keepSelection} onClick={() => run((body) => body.insertTable(2, 2, ""))} className={toolClass}>Tablo</button><button type="button" onMouseDown={rememberSelection} onClick={() => imageInputRef.current?.click()} className={toolClass}>Görsel</button>
        <div className="relative"><button type="button" aria-expanded={citeOpen} onMouseDown={rememberSelection} onClick={() => setCiteOpen((open) => !open)} className={toolClass}>Atıf</button>{citeOpen && <div role="dialog" aria-label="Atıf ekle" className="absolute left-0 top-full z-30 mt-1 w-72 rounded-md border border-neutral-200 bg-white p-2 text-xs text-neutral-900 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"><form className="flex gap-1" onSubmit={(event) => { event.preventDefault(); insertCitation(citeText); }}><input autoFocus aria-label="Atıf / dipnot metni" placeholder="Atıf / dipnot metni" value={citeText} onChange={(event) => setCiteText(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setCiteOpen(false); }} className="min-w-0 flex-1 rounded border border-neutral-300 bg-transparent px-2 py-1 dark:border-neutral-700" /><button type="submit" disabled={!citeText.trim()} className="rounded border px-2 disabled:opacity-40 dark:border-neutral-700">Ekle</button></form>{citableItems.length ? <><p className="mt-2 text-[11px] text-neutral-500">Kaynakçadan seç</p><ul className="mt-1 max-h-40 overflow-y-auto">{citableItems.map((item, index) => <li key={index}><button type="button" title={item} onClick={() => insertCitation(item)} className="block w-full truncate rounded px-1 py-1 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800">{item}</button></li>)}</ul></> : null}</div>}</div>
      </div>}
      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-2 dark:border-neutral-800">
        <div className="flex items-center gap-1"><button type="button" aria-label="Uzaklaştır" disabled={zoom <= 0.5} onMouseDown={keepSelection} onClick={() => stepZoom(-1)} className={toolClass}>−</button><label className="text-xs text-neutral-500">Yakınlaştır <select aria-label="Yakınlaştır" value={zoomChoice} onChange={(event) => setZoomChoice(event.target.value)} className="ml-1 rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 dark:border-neutral-700"><option value="fit">Genişliğe sığdır</option>{ZOOM_LEVELS.map((level) => <option key={level} value={level}>%{level}</option>)}</select></label><button type="button" aria-label="Yakınlaştır artır" disabled={zoom >= 1.5} onMouseDown={keepSelection} onClick={() => stepZoom(1)} className={toolClass}>+</button></div>
        {THESIS_PAGED_LAYOUT ? <span className="text-xs text-neutral-500" data-thesis-total-pages={totalPages}>{totalPages} sayfa</span> : null}
        {(warning || missingFields.length || indexWarning || model.validation.errors.length + model.validation.warnings.length) ? <details open={warningsOpen} onToggle={(event) => setWarningsOpen(event.currentTarget.open)} className="relative"><summary className="cursor-pointer list-none rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-800">{validationIssues.length ? <span role="status" title={validationIssues.map((issue) => issue.message).join("\n")}>{validationIssues.length} belge uyarısı</span> : <>{missingFields.length + (warning ? 1 : 0) + (indexWarning ? 1 : 0)} uyarı</>}</summary><div className="absolute left-0 top-full z-30 grid w-80 gap-2 rounded-lg border border-amber-200 bg-white p-3 text-xs text-amber-900 shadow-lg">{warning && <p role="alert">{warning}</p>}{missingFields.length > 0 && <p>{missingFields.length} eksik tez bilgisi: {missingFields.map((key) => template.placeholders[key]?.label || key).join(", ")}</p>}{indexWarning && <p role="alert">{indexWarning}</p>}{[...model.validation.errors, ...model.validation.warnings].map((issue, index) => <p key={index}>{issue.message}</p>)}</div></details> : null}
        {message && <span role="status" className="max-w-56 truncate text-xs text-neutral-500" title={message}>{message}</span>}
        <div className="ml-auto flex gap-2"><button type="button" onClick={print} className="rounded border px-2 py-1 text-xs dark:border-neutral-700">Yazdır</button><button type="button" disabled={Boolean(exporting)} onClick={() => void exportFile("pdf")} className="rounded border px-2 py-1 text-xs dark:border-neutral-700">{exporting === "pdf" ? "Hazırlanıyor…" : "PDF"}</button><button type="button" disabled={Boolean(exporting)} onClick={() => void exportFile("docx")} className="rounded border px-2 py-1 text-xs dark:border-neutral-700">{exporting === "docx" ? "Hazırlanıyor…" : "Word"}</button></div>
      </div>
    </div>    <div className="flex min-h-0 flex-1">
      <div ref={viewportRef} className="min-w-0 flex-1 overflow-auto px-4 py-7">
        <div ref={papersRef} onPointerDownCapture={trackSectionPointer} aria-label="Belge sayfaları" className="flex w-max min-w-full flex-col gap-7 outline-none">
          {pageGroups.map((group, index) => {
            const sheet = <ThesisSectionPages key={`${model.templateId}:${group.id}`} group={group} pages={pageModel[index].pages} values={model.values} zoom={zoom} bodyRefs={bodyRefs} onSectionFocus={setActiveSectionId} onTextChange={onTextChange} onPageCount={onPageCount} footnotes={footnoteViews[group.id]} />;
            const guides = layoutState.guides.filter((guide) => !guide.sectionId || guide.sectionId === group.id);
            return rulersVisible ? <div key={`${model.templateId}:${group.id}`} className="mx-auto"><LayoutRulers page={group.rules.page} zoom={zoom} unit={rulerUnit} guides={guides} onGuidesChange={(next) => interaction.commitThesis({ ...thesis, layout: { ...layoutState, guides: [...layoutState.guides.filter((guide) => guide.sectionId && guide.sectionId !== group.id), ...next.map((guide) => ({ ...guide, sectionId: group.id }))] } }, "action")}>{sheet}</LayoutRulers></div> : sheet;
          })}
        </div>
      </div>
      {!detailsOpen && (pageSettingsOpen || interaction.selectedElements.length > 0) ? <div className="w-80 shrink-0 overflow-y-auto border-l border-neutral-200 bg-white" data-thesis-editor-only="true">
        {pageSettingsOpen && layoutSection ? <><div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2"><button type="button" onClick={() => setRulersVisible((visible) => !visible)} aria-pressed={rulersVisible} className={toolClass}>Cetveller {rulersVisible ? "açık" : "kapalı"}</button><label className="ml-auto text-xs text-neutral-500">Birim <select aria-label="Cetvel birimi" value={rulerUnit} onChange={(event) => setRulerUnit(event.target.value)} className="ml-1 rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900"><option value="mm">mm</option><option value="cm">cm</option><option value="pt">pt</option></select></label></div><PageLayoutInspector page={layoutSection.rules.page} sectionId={layoutSectionId} typography={pageTypography} pageScopeSupported={pageGroups.find((g) => g.sections.some((s) => s.id === layoutSectionId))?.sections.length === 1 && (pageCounts[layoutSectionId] || 1) <= 1} onApply={(patch, scope) => { try { interaction.commitThesis(applyLayoutPage(thesis, patch, { scope, sectionId: layoutSectionId, pageIndex: 0 }), "action"); setMessage("Sayfa düzeni uygulandı."); } catch (error) { setMessage(error.message); } }} onApplyTypography={(patch, scope) => { try { interaction.commitThesis(applyLayoutTypography(thesis, patch, { scope, sectionId: layoutSectionId }), "action"); setMessage("Metin biçimi uygulandı."); } catch (error) { setMessage(error.message); } }} /></> : <LayoutInspector elements={interaction.selectedElements} geometry={Array.isArray(interaction.geometry) ? Object.fromEntries(interaction.geometry.map((item) => [item.id, item])) : interaction.geometry} onPatch={interaction.patchElements} onAction={interaction.performAction} />}
      </div> : null}
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
    <LayoutSelectionOverlay {...interaction.overlayProps} onPatch={interaction.patchElements} onOpenInspector={() => { setDetailsOpen(false); setPageSettingsOpen(false); }} />
  </div>;
}
