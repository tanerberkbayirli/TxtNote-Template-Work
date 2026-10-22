import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { bibliographyItemsFromResearch, normalizeBibliographyItems } from "../../lib/academicBibliography.js";
import { endnotesFromHtml } from "../../lib/academicDocument.js";
import { figureHtml, imageDimensions, readImageAsDataUrl } from "../../lib/academicMedia.js";
import { htmlToPlainText } from "../../lib/richText.js";
import { appendAuthoredReference, authoredReferences, escapeWritingText, normalizeWritingHeading } from "../../lib/thesisWriting.js";
import { FORMAT_COLORS, FORMAT_HIGHLIGHTS } from "../../config/format.js";
import { trustedStyleNonce } from "../../lib/cspStyles.js";
import { buildThesisCss, buildThesisPrintHtml, compileThesisDocument, groupThesisSections, thesisWordBaselineProbes } from "../../../../../engine/src/engine.js";
import { LIST_SPACE_AFTER_PT } from "../../../../../engine/src/blockGap.js";
import { measureMirroredIndentsCss } from "../../../../../engine/src/paragraphMirror.js";
import { validateThesisPageCounts } from "../../../../../engine/src/contentConformance.js";
import { measureParagraphTabsCss } from "../../../../../engine/src/paragraphTabs.js";
import { layoutWordJustification } from "../../../../../engine/src/wordLineLayout.js";
import { layoutShortParagraphKeeps } from "../../../../../engine/src/shortParagraphs.js";
import { missingRenderedFonts } from "../../../../../engine/src/renderedFonts.js";
import { measureWordBaselineCss } from "../../../../../engine/src/wordBaseline.js";
import { buildThesisPageModel, pageMetrics, thesisPagedCss } from "../../../../../engine/src/pageLayout.js";
import { measureElasticSpecialPages, measurePositionedSpecialPages, measureSpecialPageFit } from "../../../../../engine/src/specialPageFit.js";
import { THESIS_TEMPLATE_REGISTRY, resolveThesisTemplate } from "../../../../../engine/src/registry.js";
import { thesisMetadataPanel } from "../../../../../engine/src/metadataPanel.js";
import { measurePresentationGeometry } from '../../../../../engine/src/presentationGeometry.js';
import { orderedThesisSections, thesisEnabledSections, setThesisTextFormat, setThesisTextOverride, thesisMetadataValue, thesisTextFormat, thesisSectionConditionMet, updateThesisMetadata, updateThesisNoteSection } from "../../../../../engine/src/document.js";
import { THESIS_PAGE_FOOTNOTES, THESIS_PAGED_LAYOUT, ThesisSectionPages } from "./ThesisSectionPages";
import { confirmCommittedPagination, decorateThesisSources, generatedIndexPageTargets, INDEX_ITERATION_CAP, missingGeneratedIndexPages, renderedIndexPages, resolveGeneratedIndexes, waitForStableEquationLayout } from "../../../../../engine/src/generatedIndex.js";
import { layoutFirstPageReserves, layoutThesisFootnotes, sectionEndnoteViews } from "../../../../../engine/src/footnotes.js";
import { addLayoutElement, normalizeThesisLayout } from "../../../../../engine/src/layoutDocument.js";
import { setDocumentFormatMode } from "../../../../../engine/src/contentModel.js";
import { importThesisWordFile } from "../../../../../engine/src/importDocx.js";
import { WordImportReport, WordImportReview } from "./WordImportReview.jsx";
import { applyLayoutPage, applyLayoutTypography, resolveLayoutTypography } from "../../../../../engine/src/layoutProperties.js";
import { useLayoutInteraction } from "./useLayoutInteraction.js";
import LayoutSelectionOverlay from "./LayoutSelectionOverlay.jsx";
import LayoutInspector from "./LayoutInspector.jsx";
import PageLayoutInspector from "./PageLayoutInspector.jsx";
import LayoutRulers from "./LayoutRulers.jsx";
import { layoutTableContinuations, tableContinuationRows } from "../../../../../engine/src/tableContinuation.js";
import { layoutImportedShapeLines } from "../../../../../engine/src/docx/drawingWrap.js";
import { layoutImportedDrawingAnchors } from "../../../../../engine/src/docx/drawingAnchors.js";
import { layoutImportedFloatingTables } from "../../../../../engine/src/docx/floatingTables.js";
import { textAlignmentPatch, toggleLayoutDecoration } from "../../../../../engine/src/layoutInteraction.js";
import { applyTransformExceptions } from "../../../../../engine/src/transformExceptions.js";
import ThesisRibbon from "./ThesisRibbon.jsx";
import ThesisNavigation from "./ThesisNavigation.jsx";
import ThesisStatusBar from "./ThesisStatusBar.jsx";
import "./ThesisEditor.css";
import "./thesisWorkspace.css";
import "./thesisRibbonPanels.css";
import {PdfImportSetup, PdfImportReview, PdfImportReport} from './PdfImportReview.jsx';
import { sourceScriptFontRequests } from '../../../../../engine/src/docx/scriptFonts.js';
import { ensureSourceScriptFonts } from '../../lib/sourceScriptFonts.js';

// Tailwind's reset removes list markers; the stored ul/ol structure is unchanged.
const EDITOR_CSS = ".thesis-paper.thesis-editor-surface{background:#fff;box-shadow:0 8px 28px rgba(0,0,0,.13);overflow:visible}.thesis-editor-surface .rich-text-body{caret-color:#111}.thesis-body .rich-text-body ul{list-style:disc;padding-left:24pt;margin:0 0 " + LIST_SPACE_AFTER_PT + "pt}.thesis-body .rich-text-body ol{list-style:decimal;padding-left:24pt;margin:0 0 " + LIST_SPACE_AFTER_PT + "pt}.thesis-body .rich-text-body li{white-space:pre-wrap}";
const ZOOM_LEVELS = [50, 75, 100, 125, 150];
const EMPTY_THESIS = Object.freeze({});
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

export function ThesisEditor({ title, content, researchData, onTitleChange, onContentChange, onResearchDataChange, onDocumentChange, templateRegistry }) {
  const thesis = researchData?.thesis && typeof researchData.thesis === "object" ? researchData.thesis : EMPTY_THESIS;
  const selectionKey = JSON.stringify([thesis.templateId, thesis.selection?.universityId, thesis.selection?.instituteId, thesis.selection?.degreeType, thesis.selection?.language]);
  const [resolution, setResolution] = useState(null);
  const resolved = resolution?.key === selectionKey ? resolution.result : null;
  const [exporting, setExporting] = useState("");
  const exportBusyRef = useRef(false);
  const [message, setMessage] = useState("");
  const [ribbonTab, setRibbonTab] = useState("Giriş");
  const detailsOpen = ribbonTab === "Tez bilgileri";
  const setDetailsOpen = next => setRibbonTab(current => (typeof next === "function" ? next(current === "Tez bilgileri") : next) ? "Tez bilgileri" : current === "Tez bilgileri" ? "Giriş" : current);
  const [zoomChoice, setZoomChoice] = useState("fit");
  const [viewportWidth, setViewportWidth] = useState(900);
  const [activeSectionId, setActiveSectionId] = useState("");
  const pageSettingsOpen = ribbonTab === "Sayfa ayarları";
  const setPageSettingsOpen = next => setRibbonTab(current => (typeof next === "function" ? next(current === "Sayfa ayarları") : next) ? "Sayfa ayarları" : current === "Sayfa ayarları" ? "Giriş" : current);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [warningsOpen, setWarningsOpen] = useState(false);
  const [rulersVisible, setRulersVisible] = useState(false);
  const [rulerUnit, setRulerUnit] = useState("mm");
  const workspaceTabs = { outline: "Yazım planı", sources: "Kaynaklar", guide: "Rehber" };
  const workspacePanel = Object.keys(workspaceTabs).find(key => workspaceTabs[key] === ribbonTab) || null;
  const lastWorkspacePanel = useRef("outline");
  if (workspacePanel) lastWorkspacePanel.current = workspacePanel;
  const setWorkspacePanel = panel => setRibbonTab(workspaceTabs[panel] || "Giriş");
  const navigationOpen = workspacePanel === 'outline';
  const setNavigationOpen = next => setRibbonTab(current => (typeof next === "function" ? next(current === "Yazım planı") : next) ? "Yazım planı" : current === "Yazım planı" ? "Giriş" : current);
  const [activeFormat, setActiveFormat] = useState({});
  // Template-owned text (section title / fixed paragraph) the toolbar currently targets instead of a body: { sectionId, kind, take }.
  const [activeStatic, setActiveStatic] = useState(null);
  // Measured physical pages per page group. Presentation only; never written to the note.
  const [pageCounts, setPageCounts] = useState({});
  const [indexResolution, setIndexResolution] = useState({});
  const [indexWarning, setIndexWarning] = useState("");
  const [paginationReady, setPaginationReady] = useState(false);
  const paginationEpochRef = useRef(0);
  const paginationReadyEpochRef = useRef(-1);
  const committedPaginationStateRef = useRef({ indexResolution, footnoteViews: {} });
  // Page-bottom notes per group/page, derived from the current pagination. Never written to the note.
  const [footnoteViews, setFootnoteViews] = useState({});
  const footnoteState = useRef({});
  const bodyRefs = useRef({});
  const papersRef = useRef(null);
  const viewportRef = useRef(null);
  const imageInputRef = useRef(null);
  const wordInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const [pdfFile,setPdfFile] = useState(null);
  const importAbortRef = useRef(null);
  const [pendingImport, setPendingImport] = useState(null);
  useEffect(() => () => importAbortRef.current?.abort(), []);
  const importWord = async (file) => {
    if (!file || exportBusyRef.current || exporting) return;
    importAbortRef.current?.abort();
    const controller = new AbortController(); importAbortRef.current = controller;
    setExporting("import"); setMessage("Word belgesi okunuyor…");
    try {
      const next = await importThesisWordFile(file, { title, content, researchData }, { useWorker: true, signal: controller.signal });
      if (controller.signal.aborted) return;
      setPendingImport(next); setMessage("");
    } catch (error) { if (error.name !== "AbortError") setMessage(error.message || "Word belgesi içe aktarılamadı"); }
    finally { if (!controller.signal.aborted) setExporting(""); }
  };
  const importPdf = async (options) => {
    if (exportBusyRef.current || exporting) return;
    const file=pdfFile;setPdfFile(null);if(!file)return;
    importAbortRef.current?.abort();
    const controller=new AbortController();importAbortRef.current=controller;
    setExporting('import');setMessage('PDF belgesi okunuyor…');
    try {
      const {importThesisPdfFile}=await import('../../../../../engine/src/importPdf.js');
      const next=await importThesisPdfFile(file,{title,content,researchData},{...options,signal:controller.signal,
        onProgress:p=>{if(!controller.signal.aborted)setMessage(`${p.stage} · ${p.page}/${p.total}`);}});
      if(!controller.signal.aborted){setPendingImport(next);setMessage('');}
    }catch(error){if(error.name!=='AbortError')setMessage(error.message||'PDF içe aktarılamadı');}
    finally{if(!controller.signal.aborted)setExporting('');}
  };
  // Caption kind (template captionKinds) the next inserted image gets; "" = plain figure.
  const imageKindRef = useRef("");
  // The figure last clicked in the pages: its caption kind can be changed while the template has kinds.
  const [pickedFigure, setPickedFigure] = useState(null);
  // The display equation last clicked: its number can be switched on/off while the template numbers equations.
  const [pickedEquation, setPickedEquation] = useState(null);

  useEffect(() => {
    let live = true;
    const selection = { ...thesis.selection, templateId: thesis.templateId };
    void resolveThesisTemplate(selection, templateRegistry).then((result) => { if (live) setResolution({ key: selectionKey, result }); });
    return () => { live = false; };
  }, [selectionKey]);

  const template = resolved?.template;
  const plainTitle = useMemo(() => htmlToPlainText(title), [title]);
  const bibliographyItems = useMemo(() => normalizeBibliographyItems(bibliographyItemsFromResearch(researchData)), [researchData?.docBibliographyItems, researchData?.docBibliography]);
  const compilationInput = useMemo(() => ({template,thesis,plainTitle,content,bibliographyItems}),[template,thesis,plainTitle,content,bibliographyItems]);
  const [renderInput,setRenderInput] = useState(compilationInput);
  const typingChangeRef = useRef(false);
  const compilePendingRef = useRef(false);
  compilePendingRef.current = renderInput !== compilationInput;
  useLayoutEffect(() => {
    if (renderInput === compilationInput) return;
    paginationEpochRef.current += 1;
    paginationReadyEpochRef.current = -1;
    setPaginationReady(false);
    // The contentEditable already contains the authored keystroke and saving is
    // immediate. Reconcile/recompile after a short typing pause, so each key does
    // not synchronously parse the entire thesis before its first paint.
    const typing = typingChangeRef.current;
    typingChangeRef.current = false;
    if (!typing || renderInput.template !== compilationInput.template) { setRenderInput(compilationInput); return; }
    const timer = setTimeout(() => setRenderInput(compilationInput),200);
    return () => clearTimeout(timer);
  },[compilationInput,renderInput]);
  const sourceModel = useMemo(() => renderInput.template ? compileThesisDocument(renderInput.template, renderInput.thesis, renderInput.plainTitle, renderInput.content, renderInput.bibliographyItems) : null, [renderInput]);
  const scriptFonts = useMemo(() => sourceScriptFontRequests(sourceModel?.nativeDocument), [sourceModel]);
  const scriptFontKey = JSON.stringify(scriptFonts);
  const scriptFontPending = useRef(false);
  const [scriptFontRevision, setScriptFontRevision] = useState(0);
  const [scriptFontError, setScriptFontError] = useState(null);
  useLayoutEffect(() => {
    let alive = true;
    scriptFontPending.current = scriptFonts.length > 0;
    setScriptFontError(null);
    if (scriptFontPending.current) {
      if (papersRef.current) papersRef.current.dataset.thesisPaginationReady = 'false';
      ensureSourceScriptFonts(scriptFonts).catch(error => { if (alive) setScriptFontError(error.message); }).finally(() => {
        if (alive) { scriptFontPending.current = false; setScriptFontRevision(value => value + 1); }
      });
    }
    return () => { alive = false; };
  }, [scriptFontKey]);
  // No model while the template of a switch is still resolving (the stale model would be read against an undefined template).
  const model = useMemo(() => sourceModel && template ? resolveGeneratedIndexes(sourceModel, indexResolution.pages || {}, indexResolution.counts) : null, [sourceModel, indexResolution, template]);
  const generatedPageTargets = useMemo(() => sourceModel ? generatedIndexPageTargets(sourceModel) : [], [sourceModel]);
  const pageGroups = useMemo(() => model ? groupThesisSections(model.sections) : [], [model]);
  const endnoteViews = useMemo(() => model ? sectionEndnoteViews(model.sections, endnotesFromHtml) : {}, [model]);
  const [chapterStarts, setChapterStarts] = useState({});
  const pageModel = useMemo(() => buildThesisPageModel(pageGroups, pageCounts, chapterStarts), [pageGroups, pageCounts, chapterStarts]);
  const totalPages = pageModel.reduce((sum, entry) => sum + entry.pages.length, 0);
  useLayoutEffect(() => { committedPaginationStateRef.current = { indexResolution, footnoteViews }; }, [indexResolution, footnoteViews]);
  const onChapterStarts = useCallback((groupId, starts) => setChapterStarts((current) => {
    const before = current[groupId];
    if (!starts && !before) return current;
    if (starts && before && starts.size === before.size && [...starts].every((index) => before.has(index))) return current;
    const next = { ...current };
    if (starts) next[groupId] = starts; else delete next[groupId];
    return next;
  }), []);
  const onPageCount = useCallback((groupId, count) => setPageCounts((current) => current[groupId] === count ? current : { ...current, [groupId]: count }), []);
  const css = useMemo(() => model ? buildThesisCss(model) + (THESIS_PAGED_LAYOUT ? thesisPagedCss(pageGroups) : "") : "", [model, pageGroups]);
  // Opt-in Word line placement: measure this browser's baseline of every text style (paint-only offsets).
  const baselineProbes = useMemo(() => model ? thesisWordBaselineProbes(model) : [], [model]);
  const baselineProbeKey = baselineProbes.map((probe) => probe.id).join(",");
  const [mirrorCss, setMirrorCss] = useState("");
  const [tabsCss, setTabsCss] = useState("");
  const [baselineCss, setBaselineCss] = useState("");
  const [specialPositionsCss, setSpecialPositionsCss] = useState("");
  useLayoutEffect(() => {
    let alive = true;
    const measure = () => {
      if (alive && papersRef.current && model) setSpecialPositionsCss(measurePositionedSpecialPages(papersRef.current, model).css);
    };
    measure();
    document.fonts?.ready?.then(measure);
    document.fonts?.addEventListener?.("loadingdone", measure);
    return () => { alive = false; document.fonts?.removeEventListener?.("loadingdone", measure); };
  }, [model, zoomChoice]);
  const [fontWarnings,setFontWarnings]=useState([]);
  useEffect(()=>{
    let alive=true,timer=0;
    const run=()=>{timer=0;if(alive&&papersRef.current){const next=missingRenderedFonts(papersRef.current).map(name=>({code:'missing-font',message:`${name} yazı tipi bu cihazda bulunamadı; satır kırılımları doğrulanamaz. Fontu kurup belgeyi yeniden açın.`}));setFontWarnings(previous=>JSON.stringify(previous)===JSON.stringify(next)?previous:next);}};
    // Advisory walk over the whole document: coalesced so typing does not pay for it on every keystroke.
    const inspect=()=>{clearTimeout(timer);timer=setTimeout(run,250);};
    document.fonts?.ready?.then(inspect);document.fonts?.addEventListener?.('loadingdone',inspect);
    return ()=>{alive=false;clearTimeout(timer);document.fonts?.removeEventListener?.('loadingdone',inspect);};
  },[model]);
  // Advisory only: special pages that outgrow their page are reported, never clipped or blocked.
  const [fitWarnings, setFitWarnings] = useState([]);
  useEffect(() => {
    let alive = true, frame = 0;
    const inspect = () => {
      if (!alive || !papersRef.current) return;
      const messages = measureSpecialPageFit(papersRef.current, pageGroups, pageMetrics).flatMap((item) => item.messages.map((message) => ({ code: "special-page-fit", message })));
      setFitWarnings((previous) => (JSON.stringify(previous) === JSON.stringify(messages) ? previous : messages));
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(inspect); };
    schedule();
    document.fonts?.ready?.then(schedule);
    document.fonts?.addEventListener?.("loadingdone", schedule);
    return () => { alive = false; cancelAnimationFrame(frame); document.fonts?.removeEventListener?.("loadingdone", schedule); };
  }, [model, pageGroups, specialPositionsCss]);
  useLayoutEffect(() => {
    if (!baselineProbes.length) { setBaselineCss(""); return undefined; }
    let alive = true;
    const measure = () => { if (alive) setBaselineCss(measureWordBaselineCss(baselineProbes)); };
    measure();
    document.fonts?.ready?.then(measure);
    document.fonts?.addEventListener?.("loadingdone", measure);
    return () => { alive = false; document.fonts?.removeEventListener?.("loadingdone", measure); };
  }, [baselineProbeKey]);
  useLayoutEffect(() => {
    const root = papersRef.current;
    if (!root || !model) return undefined;
    let alive = true;
    const measure = () => { if (alive) { setTabsCss(measureParagraphTabsCss(root, model)); layoutWordJustification(root,model); setMirrorCss(measureMirroredIndentsCss(root, model)); } };
    measure();
    document.fonts?.ready?.then(measure);
    document.fonts?.addEventListener?.("loadingdone", measure);
    return () => { alive = false; document.fonts?.removeEventListener?.("loadingdone", measure); };
  }, [model]);
  const warning = resolved?.fallback ? resolved.reason : thesis.fallback ? thesis.fallbackReason : "";
  const missingFields = model ? [...new Set(model.sections.flatMap((section) => section.missingPlaceholders))] : [];
  const documentWidth = model ? Math.max(...model.sections.map((section) => pageMetrics(section.rules.page).widthPx)) : 794;
  // Template resolution precedes the first compiled render. Attach the observer
  // only once the actual canvas exists, including after a note/template switch.
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    let frame;
    const measure = () => setViewportWidth(viewport.clientWidth);
    measure();
    const observer = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); });
    observer.observe(viewport);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [model?.templateId]);
  const zoom = zoomChoice === "fit" ? Math.min(1.25, Math.max(0.1, (viewportWidth - 48) / documentWidth)) : Number(zoomChoice) / 100;
  const canStepZoom = (direction) => {
    const percentage = Math.round(zoom * 100);
    return direction > 0 ? ZOOM_LEVELS.some((level) => level > percentage) : ZOOM_LEVELS.some((level) => level < percentage);
  };
  const stepZoom = (direction) => {
    if (!canStepZoom(direction)) return;
    const percentage = Math.round(zoom * 100);
    const next = direction > 0 ? ZOOM_LEVELS.find((level) => level > percentage) : ZOOM_LEVELS.findLast((level) => level < percentage);
    if (next !== undefined) setZoomChoice(String(next));
  };
  const commitLayout = useCallback((next, reason = "action") => onResearchDataChange?.({ ...researchData, thesis: next }, reason), [researchData, onResearchDataChange]);
  const interaction = useLayoutInteraction({ rootRef: papersRef, model, thesis, onThesisChange: commitLayout, zoom });
  const layoutState = normalizeThesisLayout(thesis.layout);
  const layoutSectionId = interaction.selectedElements[0]?.sectionId || activeStatic?.sectionId || activeSectionId || model?.sections[0]?.id;
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
  const captionKinds = Object.entries(template?.captionKinds || {});
  const metadataPanel = template ? thesisMetadataPanel(template, model?.sections || []) : { fields: [], hasPrimaryTitle: false };
  const metadataFields = metadataPanel.fields;
  const validationIssues = model ? [...model.validation.errors, ...model.validation.warnings, ...validateThesisPageCounts(model, pageCounts), ...fontWarnings, ...fitWarnings, ...(scriptFontError ? [{ code: 'source-script-font', message: scriptFontError }] : [])].filter(issue => !template.placeholders?.[issue.field] || metadataFields.some(([key]) => key === issue.field) || (issue.field === "THESIS_TITLE" && metadataPanel.hasPrimaryTitle)) : [];
  const metadataByKey = new Map(metadataFields);
  const groupedKeys = new Set(metadataGroups.flatMap(([, keys]) => keys));
  const extraMetadataFields = metadataFields.filter(([key]) => !groupedKeys.has(key));
  const metadataInput = (key) => {
    const definition = metadataByKey.get(key);
    if (!definition) return null;
    const label = key === "CO_ADVISOR_NAME" || key === "CO_ADVISOR_TITLE" ? `${definition.label} (isteğe bağlı)` : key === "USED_PROGRAMS" ? "Kullanılan program (varsa)" : definition.label;
    return <label key={key} className="block text-xs font-medium">{label}{definition.required ? " *" : ""}<input data-thesis-metadata-field={key} aria-label={`${definition.label}${definition.required ? " *" : ""}`} type={definition.type === "number" ? "number" : definition.type === "date" ? "date" : "text"} className="mt-1 block w-full min-w-0 rounded border border-neutral-300 bg-transparent p-2 text-sm dark:border-neutral-700" value={thesisMetadataValue(thesis, key) ?? definition.defaultValue ?? ""} onChange={(event) => setValue(key, event.target.value)} />{metadataHints[key] ? <span aria-hidden="true" className="mt-1 block text-[11px] font-normal leading-snug text-neutral-500">{metadataHints[key]}</span> : null}</label>;
  };
  const metadataSection = (heading, keys, extraClass = "") => keys.some(key => metadataByKey.has(key)) ? <section key={heading} className={`border-t border-neutral-200 pt-4 dark:border-neutral-800 ${extraClass}`}><h4 className="mb-3 text-[11px] font-semibold tracking-wide text-neutral-600 dark:text-neutral-300">{heading}</h4><div className="grid gap-3">{keys.map(metadataInput)}</div></section> : null;

  useLayoutEffect(() => { if (model && papersRef.current) decorateThesisSources(papersRef.current, model); }, [model, zoom]);
  // No heading markup is rewritten while an IME composition is running (transformExceptions.js); it catches up afterwards.
  useEffect(() => {
    const root = papersRef.current;
    if (!root) return undefined;
    const start = () => { root.__thesisComposing = true; };
    const end = () => { root.__thesisComposing = false; if (model) { applyTransformExceptions(root, model); layoutWordJustification(root,model); } };
    root.addEventListener("compositionstart", start, true);
    root.addEventListener("compositionend", end, true);
    return () => { root.removeEventListener("compositionstart", start, true); root.removeEventListener("compositionend", end, true); };
  }, [model]);

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
    let frame = 0, resizeFrame = 0, iterations = 0, previous = "", disposed = false, settled = false, failed = false, confirming = false, confirmFailures = 0;
    // Consecutive rejected confirmations (the committed state or a fresh measurement differs from the settled one) without any change of the settled signature: bounded, so a measurement that never repeats ends with the visible warning instead of an endless frame loop.
    const CONFIRM_FAILURE_CAP = 300;
    const MATH_WAIT_MS = 30000;
    let mathWaitSince = null;
    // Last serialized values applied to state; avoids re-stringifying the current state each pass.
    let appliedPages = null, appliedNotes = null;
    const measure = () => {
      const groups = groupThesisSections(latestSourceModel.current.sections);
      layoutWordJustification(root,latestSourceModel.current);
      const floatingTables = layoutImportedFloatingTables(root, groups, latestSourceModel.current.nativeDocument);
      const shapeLines = layoutImportedShapeLines(root, groups, latestSourceModel.current.nativeDocument);
      const keepLines = layoutShortParagraphKeeps(root);
      const continuations = layoutTableContinuations(root, groups, latestSourceModel.current);
      const firstReserves = layoutFirstPageReserves(root, groups, footnoteState.current);
      layoutImportedDrawingAnchors(root, groups, latestSourceModel.current.nativeDocument);
      const { views: notes, incomplete } = THESIS_PAGE_FOOTNOTES ? layoutThesisFootnotes(root, groups, footnoteState.current, performance.now() + 24) : { views: {} };
      if (incomplete) return { incomplete: true, groups, continuations, notes };
      setTabsCss(measureParagraphTabsCss(root, latestSourceModel.current));
      setMirrorCss(measureMirroredIndentsCss(root, latestSourceModel.current));
      const indexes = renderedIndexPages(root, groups);
      return { incomplete: false, groups, continuations, notes, indexes,
        signature: `${JSON.stringify(indexes)}|${JSON.stringify(notes)}|${JSON.stringify(continuations)}|${keepLines}|${firstReserves}|${shapeLines}|${floatingTables}` };
    };
    const probe = () => {
      if (disposed) return;
      if (compilePendingRef.current || scriptFontPending.current) { frame = requestAnimationFrame(probe); return; }
      // Font loading can begin again after fonts.ready resolved (a newly inserted
      // run introduces another face). Do not spend the fixed-point budget on
      // provisional glyph metrics or confirm an earlier ready generation.
      if (document.fonts?.status === "loading") { frame = requestAnimationFrame(probe); return; }
      // A frame budget keeps typing responsive in long, note-heavy groups: an incomplete
      // pass (later pages still to re-lay) continues next frame and is not an iteration.
      // Continuation caption rows of split tables change the flow, so they are settled before notes and indexes.
      const current = measure();
      const notesText = JSON.stringify(current.notes);
      const applyNotes = () => { if (notesText !== appliedNotes) { appliedNotes = notesText; setFootnoteViews(current.notes); } };
      if (current.incomplete) {
        applyNotes();
        frame = requestAnimationFrame(probe);
        return;
      }
      const next = current.indexes;
      const pagesText = JSON.stringify(next);
      const signature = current.signature;
      if (signature === previous) {
        if (settled || failed || confirming) return;
        const missingTargets = missingGeneratedIndexPages(latestSourceModel.current, next.pages);
        if (missingTargets.length) {
          if (iterations++ >= INDEX_ITERATION_CAP) {
            failed = true;
            paginationReadyEpochRef.current = -1;
            setPaginationReady(false);
            setIndexWarning(`Dizindeki ${missingTargets.length} öğenin sayfa numarası hesaplanamadı; dışa aktarma engellendi. İçeriği gözden geçirip yeniden deneyin.`);
            return;
          }
          frame = requestAnimationFrame(probe);
          return;
        }
        // Fonts still loading will fire loadingdone and restart the pagination (their metrics change the layout): confirming now would publish a "ready" epoch that is invalidated moments later, mid-export. Wait for them first.
        if (document.fonts?.status === "loading") { frame = requestAnimationFrame(probe); return; }
        if (root.querySelector(".math-formula__render--error")) {
          failed = true;
          paginationReadyEpochRef.current = -1;
          setPaginationReady(false);
          setIndexWarning("Denklem görünümü yüklenemedi; sayfalama doğrulanamadı. Belgeyi yeniden açıp tekrar deneyin.");
          return;
        }
        // Formulas whose KaTeX module/stylesheet/fonts are still being fetched (slow or CPU-limited machines) change their size and load their fonts only once rendered; publishing "ready" before that is invalidated moments later. Bounded, so a formula that never renders cannot hold pagination back.
        if (root.querySelector(".math-formula__render--pending")) {
          mathWaitSince ??= performance.now();
          if (performance.now() - mathWaitSince < MATH_WAIT_MS) { frame = requestAnimationFrame(probe); return; }
          failed = true;
          paginationReadyEpochRef.current = -1;
          setPaginationReady(false);
          setIndexWarning("Denklem görünümü yüklenemedi; sayfalama doğrulanamadı. Bağlantıyı kontrol edip belgeyi yeniden açın.");
          return;
        } else mathWaitSince = null;
        confirming = true;
        const generation = paginationEpochRef.current;
        const targets = generatedIndexPageTargets(latestSourceModel.current);
        const expectedRenderedPages = Object.fromEntries(targets.map((target) => [target, next.pages[target]?.indexLabel ?? next.pages[target]?.label ?? ""]));
        const readRenderedPages = () => Object.fromEntries([...(root.querySelectorAll("[data-thesis-generated] li[data-index-target]") || [])].flatMap((row) => {
          const pageNode = row.querySelector(".thesis-index-page");
          return pageNode && targets.includes(row.dataset.indexTarget) ? [[row.dataset.indexTarget, pageNode.textContent.trim()]] : [];
        }));
        const expectedState = { indexResolution: next, footnoteViews: current.notes, renderedPages: expectedRenderedPages };
        void confirmCommittedPagination({
          expectedState,
          expectedMeasurement: signature,
          readCommittedState: () => ({ ...committedPaginationStateRef.current, renderedPages: readRenderedPages() }),
          readMeasurement: () => measure().signature ?? null,
          isCurrent: (candidate) => !disposed && !compilePendingRef.current && paginationEpochRef.current === candidate && document.fonts?.status !== "loading" && !root.querySelector(".math-formula__render--pending,.math-formula__render--error"),
          generation,
        }).then((ready) => {
          confirming = false;
          if (disposed || generation !== paginationEpochRef.current) return;
          if (ready) {
            settled = true;
            confirmFailures = 0;
            paginationReadyEpochRef.current = generation;
            setPaginationReady(true);
            return;
          }
          if (++confirmFailures > CONFIRM_FAILURE_CAP) {
            failed = true;
            paginationReadyEpochRef.current = -1;
            setPaginationReady(false);
            setIndexWarning("Dizin/dipnot sayfalaması kararlı hale gelmedi (ölçüm doğrulanamadı); dışa aktarma engellendi. İçeriği gözden geçirip yeniden deneyin.");
            return;
          }
          frame = requestAnimationFrame(probe);
        });
        return;
      }
      if (iterations++ >= INDEX_ITERATION_CAP) {
        failed = true;
        paginationReadyEpochRef.current = -1;
        setPaginationReady(false);
        setIndexWarning("Dizin/dipnot sayfalaması kararlı hale gelmedi; dışa aktarma engellendi. İçeriği gözden geçirip yeniden deneyin.");
        return;
      }
      previous = signature;
      confirmFailures = 0;
      if (pagesText !== appliedPages) { appliedPages = pagesText; setIndexResolution(next); }
      applyNotes();
      frame = requestAnimationFrame(probe);
    };
    const restart = (invalidate = true, resetBudget = false) => {
      cancelAnimationFrame(frame);
      if (invalidate) {
        paginationEpochRef.current += 1;
        paginationReadyEpochRef.current = -1;
        setPaginationReady(false);
      }
      if (settled || failed || resetBudget) {
        iterations = 0; previous = ""; settled = false; failed = false; confirming = false; confirmFailures = 0;
        appliedPages = null; appliedNotes = null;
      } else if (invalidate) confirming = false;
      setIndexWarning("");
      frame = requestAnimationFrame(probe);
    };
    const observedSizes = new WeakMap();
    const observer = new ResizeObserver((entries) => {
      let changed = false;
      for (const entry of entries) {
        const size = `${entry.contentRect.width}:${entry.contentRect.height}`;
        const previousSize = observedSizes.get(entry.target);
        observedSizes.set(entry.target, size);
        if (previousSize !== undefined && previousSize !== size) changed = true;
      }
      if (!changed) return;
      // ResizeObserver runs before paint. React/layout writes here can resize an
      // observed flow in the same delivery cycle, producing observer-loop errors.
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        if (disposed) return;
        if (settled) { restart(true, true); return; }
        if (failed) return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(probe);
      });
    });
    const observeFlows = () => { observer.disconnect(); root.querySelectorAll(".thesis-page-flow").forEach((flow) => observer.observe(flow)); };
    // Content/zoom change: start a fresh fixed point (even mid-run) and pick up added/removed flows.
    paginationRef.current = () => { observeFlows(); restart(true, true); };
    observeFlows();
    restart(true, true);
    const onLoad = () => restart(true, true);
    root.addEventListener("load", onLoad, true);
    document.fonts.ready.then(() => { if (!disposed) restart(true, true); });
    document.fonts.addEventListener?.("loadingdone", onLoad);
    document.fonts.addEventListener?.("loading", onLoad);
    return () => { disposed = true; paginationRef.current = null; cancelAnimationFrame(frame); cancelAnimationFrame(resizeFrame); observer.disconnect(); root.removeEventListener("load", onLoad, true); document.fonts.removeEventListener?.("loadingdone", onLoad); document.fonts.removeEventListener?.("loading", onLoad); };
  }, [paginationActive]);
  useLayoutEffect(() => {
    if (!paginationActive) return;
    paginationRef.current?.();
  }, [sourceModel, zoom, paginationActive, tabsCss, specialPositionsCss, scriptFontRevision]);

  const saveThesis = (patch) => onResearchDataChange?.({ ...researchData, thesis: { ...thesis, ...patch } });
  const setValue = (key, value) => onResearchDataChange?.({ ...researchData, thesis: updateThesisMetadata(thesis, key, value) });
  const setBibliography = (items) => onResearchDataChange?.({ ...researchData, docBibliographyItems: items });
  const toggleOptional = (id) => {
    const enabled = new Set(thesisEnabledSections(thesis));
    if (enabled.has(id)) enabled.delete(id); else enabled.add(id);
    saveThesis({ enabledSections: [...enabled] });
  };
  const changeTemplate = (id) => {
    const entry = (templateRegistry || THESIS_TEMPLATE_REGISTRY).find((item) => item.id === id);
    if (!entry) return;
    saveThesis({ templateId: entry.id, templateVersion: entry.templateVersion, selection: { universityId: entry.universityId, instituteId: entry.instituteId, degreeType: entry.degreeType, language: entry.language } });
  };
  const changeFormatMode = (mode) => onResearchDataChange?.({ ...researchData, thesis: setDocumentFormatMode(thesis, mode) }, "action");
  const onTextOverride = (sectionId, kind, text) => onResearchDataChange?.({ ...researchData, thesis: setThesisTextOverride(thesis, sectionId, kind, text) });
  const onTextChange = (section, html, reason) => {
    const current = { content, researchData };
    const next = updateThesisNoteSection(current, section, html);
    if (next === current) return;
    typingChangeRef.current = reason === "input";
    paginationReadyEpochRef.current = -1;
    setPaginationReady(false);
    if (next.content !== content) onContentChange(next.content, reason);
    else onResearchDataChange?.(next.researchData, reason);
  };
  // The one toolbar drives the editable section that last had focus (the first one before any focus).
  // Static and generated sections have no editor instance; clicking one keeps the previous target.
  const bodySection = model?.sections.find((section) => section.id === activeSectionId && section.editable) || model?.sections.find((section) => section.editable) || null;
  const activeLayoutText = interaction.selectedElements.length === 1 && interaction.selectedElements[0]?.type === "text"
    ? interaction.selectedElements[0] : null;
  const layoutTextSection = activeLayoutText && model?.sections.find((section) => section.id === activeLayoutText.sectionId);
  const activeSection = (activeLayoutText && layoutTextSection) || (activeStatic && model?.sections.find((section) => section.id === activeStatic.sectionId)) || bodySection;
  const activeBody = () => (activeStatic || !activeSection ? null : bodyRefs.current[activeSection.id] || null);
  // Formatting of template-owned text applies to the whole title / paragraph block and is stored per document (staticFormat.js).
  const staticFormat = activeStatic ? thesisTextFormat(thesis, activeStatic.sectionId, activeStatic.kind) || {} : null;
  const applyStaticFormat = (change) => {
    const target = activeStatic;
    if (!target) return;
    let next = thesis;
    const pending = target.take?.();
    if (pending) next = setThesisTextOverride(next, target.sectionId, pending.kind, pending.text);
    next = setThesisTextFormat(next, target.sectionId, target.kind, change(thesisTextFormat(next, target.sectionId, target.kind) || {}));
    if (next !== thesis) onResearchDataChange?.({ ...researchData, thesis: next });
  };
  const staticTarget = () => ({
    toggleStyle: (key) => applyStaticFormat((format) => ({ ...format, [key]: !format[key] })),
    applyTextColor: (color) => applyStaticFormat(({ color: _old, ...rest }) => color === "black" ? rest : { ...rest, color }),
    applyHighlight: (color) => applyStaticFormat(({ highlight: _old, ...rest }) => !color || color === "none" ? rest : { ...rest, highlight: color }),
    applySize: (size) => { const pt = Number(String(size).replace(/^pt/, "")); if (Number.isFinite(pt)) applyStaticFormat((format) => ({ ...format, sizePt: pt })); },
    clearFormatting: () => applyStaticFormat(() => ({})),
  });
  const layoutTextFormat = activeLayoutText ? (() => {
    const computed = getComputedStyle(activeLayoutText.element);
    const storedStyle = thesis.layout?.elements?.[activeLayoutText.id]?.style
      || thesis.layout?.additions?.find((item) => item.id === activeLayoutText.id)?.style
      || {};
    const effective = { ...(activeLayoutText.canonical?.style || activeLayoutText.style || {}), ...storedStyle };
    const px = Number.parseFloat(computed.fontSize);
    const rgb = computed.color.match(/\d+/g)?.slice(0, 3).map(Number);
    const color = effective.color || (rgb?.length === 3 ? `#${rgb.map((part) => part.toString(16).padStart(2, "0")).join("")}` : "#000000");
    const decoration = effective.decoration || computed.textDecorationLine || computed.textDecoration || "";
    return {
      bold: Number.parseInt(effective.fontWeight ?? computed.fontWeight, 10) >= 600,
      italic: effective.italic ?? computed.fontStyle === "italic",
      underline: decoration.includes("underline"),
      strike: decoration.includes("line-through"),
      decoration,
      color,
      highlight: effective.highlight || "",
      align: effective.align || computed.textAlign,
      sizePt: effective.fontSizePt ?? (Number.isFinite(px) ? Math.round(px * 0.75 * 2) / 2 : undefined),
      block: "",
    };
  })() : null;
  const layoutTextTarget = () => {
    const target = activeLayoutText;
    if (!target) return {};
    const base = target.canonical?.style || target.style || {};
    const storedStyle = thesis.layout?.elements?.[target.id]?.style
      || thesis.layout?.additions?.find((item) => item.id === target.id)?.style
      || {};
    const patchStyle = (change) => {
      const current = { ...base, ...(target.style || {}), ...storedStyle };
      const next = change(current);
      if (next) interaction.patchElements([{ id: target.id, style: next }]);
    };
    const presetColor = (value) => FORMAT_COLORS.find((item) => item.id === value)?.swatch || value;
    const removeStyleOverride = (key) => {
      const normalized = normalizeThesisLayout(thesis.layout);
      const hasOverride = Boolean(normalized.elements[target.id]?.style && key in normalized.elements[target.id].style)
        || Boolean(normalized.additions.find((item) => item.id === target.id)?.style && key in normalized.additions.find((item) => item.id === target.id).style);
      if (!hasOverride) return;
      const elements = { ...normalized.elements };
      const strip = (entry) => {
        if (!entry?.style || !(key in entry.style)) return entry;
        const style = { ...entry.style }; delete style[key];
        if (Object.keys(style).length) return { ...entry, style };
        const { style: _style, ...rest } = entry;
        return Object.keys(rest).length ? rest : null;
      };
      if (elements[target.id]) {
        const clean = strip(elements[target.id]);
        if (clean) elements[target.id] = clean; else delete elements[target.id];
      }
      const additions = normalized.additions.map((item) => strip(item)).filter(Boolean);
      interaction.commitThesis({ ...thesis, layout: { ...normalized, elements, additions } }, "action");
    };
    return {
      toggleStyle: (key) => patchStyle((style) => {
        if (key === "bold") return { ...style, fontWeight: layoutTextFormat?.bold ? 400 : 700 };
        if (key === "italic") return { ...style, italic: !layoutTextFormat?.italic };
        if (key === "underline" || key === "strike") {
          const line = key === "underline" ? "underline" : "line-through";
          return { ...style, decoration: toggleLayoutDecoration(layoutTextFormat?.decoration, line) };
        }
        return null;
      }),
      applyTextColor: (value) => patchStyle((style) => ({ ...style, color: value === "black" ? "#000000" : presetColor(value) })),
      applyHighlight: (value) => {
        if (!value || value === "none") { removeStyleOverride("highlight"); return; }
        const highlight = FORMAT_HIGHLIGHTS.find((item) => item.id === value)?.id || value;
        patchStyle((style) => ({ ...style, highlight }));
      },
      applySize: (value) => { const pt = Number(String(value).replace(/^pt/i, "")); if (Number.isFinite(pt) && pt >= 1 && pt <= 400) patchStyle((style) => ({ ...style, fontSizePt: Math.round(pt * 2) / 2 })); },
      applyAlign: (align, scope) => {
        const patch = textAlignmentPatch(target, align, scope);
        if (patch) interaction.patchElements([patch]);
      },
      undo: () => interaction.undo(),
      redo: () => interaction.redo(),
      clearFormatting: () => {
        const normalized = normalizeThesisLayout(thesis.layout);
        const formatKeys = ["fontWeight", "italic", "decoration", "color", "fontSizePt", "align", "highlight"];
        const hasOverride = formatKeys.some((key) => key in (normalized.elements[target.id]?.style || {}) || key in (normalized.additions.find((item) => item.id === target.id)?.style || {}));
        if (!hasOverride) return;
        const elements = { ...normalized.elements };
        const prior = elements[target.id];
        const resetStyle = (style) => {
          const next = { ...(style || {}) };
          for (const key of formatKeys) delete next[key];
          return next;
        };
        if (prior?.style) {
          const style = resetStyle(prior.style);
          if (Object.keys(style).length) elements[target.id] = { ...prior, style };
          else { const { style: _style, ...rest } = prior; if (Object.keys(rest).length) elements[target.id] = rest; else delete elements[target.id]; }
        }
        const additions = normalized.additions.map((item) => item.id === target.id && item.style ? { ...item, style: resetStyle(item.style) } : item);
        interaction.commitThesis({ ...thesis, layout: { ...normalized, elements, additions } }, "action");
      },
    };
  };
  const ribbonFormat = layoutTextFormat || (staticFormat ? {
    ...staticFormat,
    sizePt: staticFormat.sizePt ?? (activeStatic.kind === "title" ? activeSection?.rules.headings?.[1]?.fontSizePt : activeSection?.rules.body?.fontSizePt),
    block: "",
  } : activeFormat);
  // Take the live caret/selection first; selectionchange can still be queued behind fast typing.
  const runSaved = (command) => {
    if (activeLayoutText) { command(layoutTextTarget()); return; }
    if (activeStatic) { command(staticTarget()); return; }
    const body = activeBody();
    if (!body) return;
    command(body);
  };
  const rememberSelection = () => activeBody()?.rememberSelection?.();
  const keepSelection = (event) => { rememberSelection(); event.preventDefault(); };
  const trackSectionPointer = (event) => {
    setPickedFigure(event.target.closest?.("figure.academic-figure") || null);
    setPickedEquation(event.target.closest?.(".math-formula--block") || null);
  };
  const bibliographySection = model?.sections.find(section => section.type === 'bibliography');
  const authoredSources = authoredReferences(bibliographySection?.editableHtml);
  const numericCitations = template?.bibliography?.citationStyle === 'numeric';
  const canInsertCitation = Boolean(activeSectionId && activeSection?.editable && !activeStatic && !interaction.selectedElements.length && activeBody());
  const citableItems = [...authoredSources.map(item => item.text), ...bibliographyItems.map(item => item.trim()).filter(Boolean)];
  const openWorkspace = panel => setWorkspacePanel(panel);
  const openDetails = () => setRibbonTab("Tez bilgileri");
  const changePageSettings = next => {
    const value = typeof next === 'function' ? next(pageSettingsOpen) : next;
    setPageSettingsOpen(value);
  };
  const navigateTo = (sectionId, headingId) => {
    const sectionNode = papersRef.current?.querySelector(`[data-thesis-flow-section="${CSS.escape(sectionId)}"]`);
    const headingNode = headingId ? sectionNode?.querySelector(`[data-thesis-anchor="${CSS.escape(headingId)}"]`) : null;
    const target = headingNode || sectionNode?.querySelector('h1, .rich-text-body') || sectionNode;
    const editable = sectionNode?.querySelector('.rich-text-body[contenteditable="true"]');
    interaction.selectIds([]); setActiveStatic(null); setActiveSectionId(sectionId);
    const selectedSection = model.sections.find(section => section.id === sectionId);
    if (selectedSection?.mode === 'generated') setMessage('Bu dizin başlıklardan ve sayfa düzeninden otomatik hazırlanır. Değişiklikleri ilgili metin bölümünde yapın.');
    else if (selectedSection?.mode === 'static') setMessage('Bu sayfanın bilgilerini Tez bilgileri panelinden tamamlayabilirsiniz.');
    setRibbonTab("Giriş");
    requestAnimationFrame(() => {
      target?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      if (editable) {
        editable.focus({preventScroll: true});
        const range = document.createRange();
        range.selectNodeContents(headingNode && editable.contains(headingNode) ? headingNode : editable);
        range.collapse(true);
        window.getSelection()?.removeAllRanges(); window.getSelection()?.addRange(range);
        bodyRefs.current[sectionId]?.rememberSelection?.();
      }
    });
  };
  const addHeading = (sectionId, level, text, options = {}) => {
    const section = model.sections.find(item => item.id === sectionId && item.editable);
    const root = papersRef.current?.querySelector(`[data-thesis-flow-section="${CSS.escape(sectionId)}"] .rich-text-body[contenteditable="true"]`);
    const body = bodyRefs.current[sectionId];
    if (!section || !root || !body || !text.trim()) return false;
    interaction.selectIds([]); setActiveStatic(null); setActiveSectionId(sectionId);
    root.focus({preventScroll: true});
    const before = [...root.querySelectorAll(`h${level}`)].find(node => options.beforeTitles?.some(title => normalizeWritingHeading(node.textContent) === normalizeWritingHeading(title)));
    const range = document.createRange();
    if (before) range.setStartBefore(before);
    else range.selectNodeContents(root);
    range.collapse(Boolean(before));
    window.getSelection()?.removeAllRanges(); window.getSelection()?.addRange(range); body.rememberSelection();
    body.insertHtml(`<h${level}>${escapeWritingText(text.trim())}</h${level}><p><br></p>`);
    const selectedNode = window.getSelection()?.anchorNode;
    (selectedNode?.nodeType === 1 ? selectedNode : selectedNode?.parentElement)?.scrollIntoView({block: 'center', behavior: 'smooth'});
    setMessage('Başlık eklendi. İçindekiler otomatik güncelleniyor.');
    setRibbonTab("Giriş");
    return true;
  };
  const addSource = text => {
    if (!bibliographySection) return false;
    if (htmlToPlainText(bibliographySection.editableHtml).trim()) {
      const html = appendAuthoredReference(bibliographySection.editableHtml, text, numericCitations);
      if (html === null) {setMessage('Önce mevcut kaynakçanın numara sırasını düzenleyin.'); return false;}
      onTextChange(bibliographySection, html, 'action');
    } else setBibliography([...bibliographyItems.filter(item => item.trim()), text]);
    setMessage('Kaynak kaynakçaya eklendi. Metinde atıf yapacağınız yeri seçebilirsiniz.');
    return true;
  };
  const insertSourceCitation = (text, mode = 'inline') => {
    if (!canInsertCitation || !text.trim()) return;
    if (mode === 'footnote') activeBody().insertFootnote(text.trim());
    else activeBody().insertInlineCitation(text.trim());
    setMessage(mode === 'footnote' ? 'Kaynak atfı dipnot olarak eklendi.' : 'Atıf seçtiğiniz konuma eklendi.');
  };
  const checkDocument = () => {
    setWarningsOpen(true);
    setMessage(validationIssues.length || missingFields.length || warning || indexWarning ? 'Belge uyarılarını inceleyin; eksik bilgileri Tez bilgileri panelinden tamamlayabilirsiniz.' : 'Mevcut otomatik kontrollerde uyarı bulunmadı. Son çıktıyı da gözden geçirin.');
  };
  const insertCitation = (text) => {
    const value = String(text || "").trim();
    if (!value) return;
    activeBody()?.insertFootnote(value);
  };

  /** Measured indent (unscaled px) of each index row's title after its label, for Word's hanging indent. */
  const thesisIndexHangs = (root) => Object.fromEntries([...(root?.querySelectorAll("li[data-index-target]") || [])].flatMap((row) => {
    const text = row.querySelector(".thesis-index-text"), title = row.querySelector(".thesis-index-title");
    if (!text || !title || getComputedStyle(text).display !== "flex") return [];
    const scale = new DOMMatrixReadOnly(getComputedStyle(row.closest(".thesis-page-stack")).transform).a || 1;
    return [[row.dataset.indexTarget, (title.getBoundingClientRect().left - text.getBoundingClientRect().left) / scale]];
  }));
  const exportFile = async (kind) => {
    if (!model || exporting || exportBusyRef.current || !["pdf", "docx"].includes(kind)) return;
    const exportGeneration = paginationEpochRef.current;
    const assertPaginationReady = () => {
      if (scriptFontError) throw new Error(scriptFontError);
      if (scriptFontPending.current) throw new Error('Kaynak belgenin yazı tipi yükleniyor; tamamlanınca tekrar deneyin.');
      if (paginationActive && (paginationReadyEpochRef.current !== exportGeneration || exportGeneration !== paginationEpochRef.current)) {
        throw new Error(indexWarning || "Sayfalama henüz son ölçüm ve dizin eşlemesiyle doğrulanmadı; dışa aktarma engellendi.");
      }
    };
    try { assertPaginationReady(); } catch (error) { setMessage(error.message); return; }
    exportBusyRef.current = true;
    const formatName = kind === "pdf" ? "PDF" : "Word";
    setExporting(kind); setMessage(`${formatName} dışa aktarımı başlatılıyor…`);
    try {
      const [{ buildThesisDocx, buildThesisPdf }, { buildThesisLayoutPdf }, { academicFileStem, downloadBlob }, { collectThesisBlockPageBreaks }] = await Promise.all([
        import("../../../../../engine/src/export.js"), import("../../../../../engine/src/layoutPdf.js"), import("../../lib/academicExport.js"),
        import("../../../../../engine/src/exportPagination.js"),
      ]);
      assertPaginationReady();
      setMessage(`${formatName} belgesi hazırlanıyor… Büyük belgelerde bu işlem zaman alabilir.`);
      await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
      const equationRoot = papersRef.current;
      if (kind === "pdf" && THESIS_PAGED_LAYOUT && equationRoot?.querySelector(".thesis-body .math-formula--block")) {
        await waitForStableEquationLayout(equationRoot, { prepare: () => decorateThesisSources(equationRoot, model) });
      }
      assertPaginationReady();
      // The PDF is drawn from the editor's own paged layout; engines without it keep the model-based writer.
      const blob = kind === "pdf"
        ? (THESIS_PAGED_LAYOUT && papersRef.current ? await buildThesisLayoutPdf({ root: papersRef.current, groups: pageGroups, title: model.title, language: model.language, templateId: model.templateId, documentLayout: model.documentLayout, systemFonts: model.systemFonts || [], onLayoutReport: (report) => { papersRef.current.__thesisLayoutReport = report; } }) : await buildThesisPdf(model))
        : await buildThesisDocx(model, { presentationGeometry: measurePresentationGeometry(papersRef.current), totalPages, specialPagePositions: measurePositionedSpecialPages(papersRef.current, model).positions, blockPageBreaks: collectThesisBlockPageBreaks(papersRef.current, pageGroups), captionAlignments: Object.fromEntries([...(papersRef.current?.querySelectorAll("[data-thesis-caption-auto][data-thesis-anchor]") || [])].map((node) => [node.dataset.thesisAnchor, node.dataset.thesisCaptionAuto])), captionHangs: Object.fromEntries([...(papersRef.current?.querySelectorAll("[data-thesis-caption-hang][data-thesis-anchor]") || [])].map((node) => [node.dataset.thesisAnchor, Number(node.dataset.thesisCaptionHang)])), indexHangs: thesisIndexHangs(papersRef.current), ...(() => { const elastic = measureElasticSpecialPages(papersRef.current); return { elasticSpacers: elastic.spacers, elasticContentMm: elastic.contentMm }; })(), tableContinuations: tableContinuationRows(papersRef.current) });
      assertPaginationReady();
      setMessage(`${formatName} dosyası hazır; indirme başlatılıyor…`);
      const path = await downloadBlob(blob, `${academicFileStem(plainTitle || "tez")}.${kind}`);
      // Fields that could not be kept live (missing cross-reference targets, broken Word fields) are named, never silent.
      const fieldNotes = blob.exportIssues ? [...new Set([...blob.exportIssues.fieldIssues.filter((record) => record.code !== "field-unknown-preserved").map((record) => record.message), ...blob.exportIssues.fieldAudit.dangling.map((entry) => `Kırık alan hedefi: ${entry.target}`)])] : [];
      setMessage((path ? `Kaydedildi: ${path}` : `${formatName} hazır; indirme tarayıcıya gönderildi.`) + (fieldNotes.length ? ` Uyarı: ${fieldNotes.slice(0, 3).join("; ")}${fieldNotes.length > 3 ? ` (+${fieldNotes.length - 3})` : ""}` : ""));
    } catch (error) { setMessage(`${formatName} dışa aktarılamadı. ${error?.message || "Yeniden deneyin."}`); }
    finally { exportBusyRef.current = false; setExporting(""); }
  };

  const print = () => {
    if (!model || exporting || exportBusyRef.current) return;
    const generation = paginationEpochRef.current;
    const ready = !paginationActive || paginationReadyEpochRef.current === generation;
    if (!ready) { setMessage(indexWarning || "Sayfalama henüz doğrulanmadı; yazdırma/dışa aktarma engellendi."); return; }
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;width:0;height:0;border:0;visibility:hidden";
    frame.srcdoc = buildThesisPrintHtml(model, { nonce: trustedStyleNonce() });
    frame.onload = async () => {
      if (paginationActive && (generation !== paginationEpochRef.current || paginationReadyEpochRef.current !== generation)) {
        frame.remove(); setMessage("Sayfalama yazdırma sırasında değişti; sayfa eşlemesi yeniden doğrulanmalı."); return;
      }
      await frame.contentDocument?.fonts?.ready;
      const tabStyle = frame.contentDocument.createElement("style");
      tabStyle.nonce = trustedStyleNonce();
      tabStyle.textContent = measureParagraphTabsCss(frame.contentDocument.body, model);
      frame.contentDocument.head.append(tabStyle);
      frame.contentWindow?.focus(); frame.contentWindow?.print(); setTimeout(() => frame.remove(), 30000);
    };
    document.body.appendChild(frame);
  };

  // Same image pipeline as AcademicTools: downscaled data URL + academic figure markup.
  // The page column is ~600 CSS px, so 1200 px (2x) is enough; a smaller data URL keeps
  // every save (localStorage/IndexedDB/sync checksum) of the whole note fast.
  const insertImage = async (file, kind = "") => {
    const body = activeBody();
    if (!file) return;
    try {
      // Photographic PNGs become JPEG: kept as PNG, a 12 MP photo was a 4 MB data URL and
      // every later keystroke re-processed and re-saved it (~0.5 s per key). The opacity
      // scan runs once, only for PNGs over 1 MB, on the downscaled canvas (~130 ms).
      const dataUrl = await readImageAsDataUrl(file, THESIS_IMAGE_MAX_EDGE, { opaqueAsJpeg: true });
      const size = await imageDimensions(dataUrl).catch(() => null);
      if (body) body.insertHtml(figureHtml(dataUrl, "", size, kind));
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

  // Stable handlers for the memoized page components: they always call the latest closures, so unchanged pages skip re-rendering on every keystroke.
  const live = useRef(null);
  live.current = {
    onSectionFocus: (id) => { interaction.selectIds([]); setActiveStatic(null); setActiveSectionId(id); setActiveFormat(bodyRefs.current[id]?.activeFormat || {}); },
    onFormatChange: (id, format) => { if (activeSectionId === id) setActiveFormat(format || {}); },
    onTextChange,
    onTextOverride,
    onStaticFocus: (sectionId, kind, take) => { interaction.selectIds([]); setActiveStatic({ sectionId, kind, take }); },
  };
  const pageHandlers = useMemo(() => ({
    onSectionFocus: (...args) => live.current.onSectionFocus(...args),
    onFormatChange: (...args) => live.current.onFormatChange(...args),
    onTextChange: (...args) => live.current.onTextChange(...args),
    onTextOverride: (...args) => live.current.onTextOverride(...args),
    onStaticFocus: (...args) => live.current.onStaticFocus(...args),
  }), []);
  // After a template switch the previous model lingers for a render while the new template resolves asynchronously: wait for both.
  if (!model || !template) return <div className="flex h-full items-center justify-center text-sm text-neutral-500">Tez şablonu yükleniyor…</div>;

  const ribbonPanelContent = <>
    <ThesisNavigation template={template} ribbon hidden={!workspacePanel} panel={workspacePanel || lastWorkspacePanel.current} onPanelChange={openWorkspace} sections={model.sections} sectionGroups={pageGroups} activeSectionId={activeSectionId} headings={(model.indexSources || []).filter(item => item.kind === 'toc').map(item => ({sectionId:item.sectionId, id:item.anchor, text:[item.label,item.title].filter(Boolean).join(' '), level:item.level, unnumbered:item.unnumbered}))}
        key={model.templateId} onDetails={openDetails} onCheck={checkDocument} missingCount={missingFields.length} onAddHeading={addHeading} onNavigate={navigateTo} onClose={() => setWorkspacePanel(null)}
        sourcesProps={{items:bibliographyItems, authored:authoredSources, authoredHtml:Boolean(htmlToPlainText(bibliographySection?.editableHtml).trim()), bibliographyId:bibliographySection?.id, numeric:numericCitations, canInsert:canInsertCitation, onAdd:addSource, onUpdate:(index,text) => setBibliography(bibliographyItems.map((item,i) => i === index ? text : item)), onRemove:index => setBibliography(bibliographyItems.filter((_,i) => i !== index)), onCite:insertSourceCitation, onPickPosition:() => {navigateTo(model.sections.find(section=>section.id===activeSectionId&&section.editable)?.id || model.sections.find(section=>section.type==='mainContent')?.id);setWorkspacePanel(null);}}}/>
    {(pageSettingsOpen || ribbonTab === "Öğe") ? <div className="thesis-ribbon-inspector" data-thesis-editor-only="true">
        {pageSettingsOpen && layoutSection ? <><div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2"><button type="button" onClick={() => setRulersVisible((visible) => !visible)} aria-pressed={rulersVisible} className={toolClass}>Cetveller {rulersVisible ? "açık" : "kapalı"}</button><label className="ml-auto text-xs text-neutral-500">Birim <select aria-label="Cetvel birimi" value={rulerUnit} onChange={(event) => setRulerUnit(event.target.value)} className="ml-1 rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900"><option value="mm">mm</option><option value="cm">cm</option><option value="pt">pt</option></select></label></div><PageLayoutInspector page={layoutSection.rules.page} sectionId={layoutSectionId} sectionTitle={layoutSection.title} typography={pageTypography} pageScopeSupported={pageGroups.find((g) => g.sections.some((s) => s.id === layoutSectionId))?.sections.length === 1 && (pageCounts[layoutSectionId] || 1) <= 1} onApply={(patch, scope) => { try { interaction.commitThesis(applyLayoutPage(thesis, patch, { scope, sectionId: layoutSectionId, pageIndex: 0 }), "action"); setMessage("Sayfa düzeni uygulandı."); } catch (error) { setMessage(error.message); } }} onApplyTypography={(patch, scope) => { try { interaction.commitThesis(applyLayoutTypography(thesis, patch, { scope, sectionId: layoutSectionId }), "action"); setMessage("Metin biçimi uygulandı."); } catch (error) { setMessage(error.message); } }} /></> : <LayoutInspector elements={interaction.selectedElements} geometry={Array.isArray(interaction.geometry) ? Object.fromEntries(interaction.geometry.map((item) => [item.id, item])) : interaction.geometry} onPatch={interaction.patchElements} onAction={interaction.performAction} />}
      </div> : null}
      {detailsOpen ? <aside className="thesis-details-panel thesis-ribbon-details text-neutral-900 dark:text-neutral-100" aria-label="Tez bilgileri">
        <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold">Tez bilgileri</h3><button type="button" onClick={() => setDetailsOpen(false)} aria-label="Tez bilgilerini kapat" className="rounded px-2 py-1 text-lg">×</button></div>
        <div className="space-y-5">
          <section><label className="block text-xs font-medium">Belge biçimi<select aria-label="Belge biçimi" value={thesis.document?.formatMode || "template"} onChange={(event) => changeFormatMode(event.target.value)} className="mt-1 block w-full rounded border border-neutral-300 bg-white p-2 text-sm text-neutral-900"><option value="template">Üniversite şablonuna uyarla</option><option value="source">Kaynak biçimini koru</option></select></label><p className="mt-2 text-[11px] leading-snug text-neutral-500">Kaynak biçimi, belgedeki kayıtlı biçim ve bölüm ayarlarını kullanır. Seçiminiz kaynak verisini silmez.</p></section>
          <section><label className="block text-xs font-medium">Şablon<select aria-label="Tez şablonu" value={template.id} onChange={(event) => changeTemplate(event.target.value)} className="mt-1 block w-full rounded border border-neutral-300 bg-white p-2 text-sm text-neutral-900">{(templateRegistry || THESIS_TEMPLATE_REGISTRY).map((entry) => <option key={entry.id} value={entry.id}>{entry.displayName || `${entry.universityName} · ${entry.language.toUpperCase()}`}</option>)}</select></label>{template.status === "official" ? <p className="mt-2 text-[11px] leading-snug text-neutral-500">Resmî kaynak: {template.source?.documentName || template.source?.url}</p> : <p className="mt-2 text-[11px] text-amber-700">Genel taslak: resmî üniversite kuralı içermez.</p>}</section>
          {template.source?.usage?.length ? <details className="text-xs leading-relaxed" data-thesis-source-usage><summary className="cursor-pointer font-medium">Şablon kullanım notları</summary><ul className="mt-2 list-disc space-y-2 pl-4">{template.source.usage.map((note, index) => <li key={index}>{note}</li>)}</ul></details> : null}
          {metadataPanel.hasPrimaryTitle || metadataByKey.has("THESIS_TITLE_EN") ? <section className="border-t border-neutral-200 pt-4 dark:border-neutral-800"><h4 className="mb-3 text-[11px] font-semibold tracking-wide text-neutral-600 dark:text-neutral-300">TEZ BİLGİLERİ</h4><div className="grid gap-3">{metadataPanel.hasPrimaryTitle ? <label className="block text-xs font-medium">Tez başlığı *<input data-thesis-metadata-field="THESIS_TITLE" aria-label="Tez başlığı" className="mt-1 block w-full min-w-0 rounded border border-neutral-300 bg-transparent p-2 text-sm dark:border-neutral-700" value={plainTitle || (template.language === "en" ? thesisMetadataValue(thesis, "THESIS_TITLE_EN") || "" : "")} onChange={(event) => onTitleChange(event.target.value)} placeholder="Tez başlığını yazın" /></label> : null}{metadataInput("THESIS_TITLE_EN")}</div></section> : null}
          {metadataGroups.slice(1, -1).map(([heading, keys]) => metadataSection(heading, keys))}
          {numberingChoices.length ? <section className="border-t border-neutral-200 pt-4 dark:border-neutral-800"><h4 className="mb-3 text-[11px] font-semibold tracking-wide text-neutral-600 dark:text-neutral-300">BELGE AYARLARI</h4>{numberingChoices.length ? <label className="block text-xs font-medium">Şekil/tablo numaralandırma<select aria-label="Şekil ve tablo numaralandırma" value={thesis.captionNumbering || numberingChoices[0].id} onChange={(event) => saveThesis({ captionNumbering: event.target.value })} className="mt-1 block w-full rounded border border-neutral-300 bg-white p-2 text-sm text-neutral-900">{numberingChoices.map((choice) => <option key={choice.id} value={choice.id}>{choice.label}</option>)}</select></label> : null}</section> : null}
          {metadataSection("TAAHHÜTNAME", ["USED_PROGRAMS"])}
          {extraMetadataFields.length ? metadataSection("DİĞER BİLGİLER", extraMetadataFields.map(([key]) => key)) : null}
          {optionalSections.length ? <section className="border-t border-neutral-200 pt-4 text-xs dark:border-neutral-800"><h4 className="mb-3 text-[11px] font-semibold tracking-wide text-neutral-600 dark:text-neutral-300">İSTEĞE BAĞLI BÖLÜMLER</h4>{optionalSections.map((section) => <label key={section.id} className="block py-1"><input type="checkbox" checked={thesisEnabledSections(thesis).includes(section.id)} onChange={() => toggleOptional(section.id)} /> {section.title}</label>)}</section> : null}
          {bibliographySection ? <section className="border-t border-neutral-200 pt-4 text-xs dark:border-neutral-800"><h4 className="mb-2 font-semibold">KAYNAKLAR</h4><p className="mb-2 text-neutral-500">Kaynak ekleme ve atıfları ayrı çalışma panelinden yönetin.</p><button type="button" className="thesis-primary-button" onClick={() => openWorkspace('sources')}>Kaynakları aç · {citableItems.length}</button></section> : null}
        </div>
      </aside> : null}
  </>;

  return <div className="thesis-editor-workspace flex h-full min-h-0 flex-col bg-[#e9eaec] dark:bg-neutral-950">
    <style nonce={trustedStyleNonce()} data-thesis-styles>{css + EDITOR_CSS}</style>
    <style nonce={trustedStyleNonce()} data-thesis-measured-styles>{baselineCss + tabsCss + mirrorCss + specialPositionsCss}</style>
    <input ref={imageInputRef} type="file" accept="image/*" aria-label="Görsel dosyası" className="hidden" onChange={(event) => { void insertImage(event.target.files?.[0], imageKindRef.current); event.target.value = ""; }} />
    <input ref={wordInputRef} type="file" accept=".docx,.doc" aria-label="Word dosyası" className="hidden" onChange={(event) => { void importWord(event.target.files?.[0]); event.target.value = ""; }} />
    <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf" aria-label="PDF dosyası" className="hidden" onChange={e=>{setPdfFile(e.target.files?.[0]||null);e.target.value='';}} />
    {pdfFile?<PdfImportSetup file={pdfFile} onCancel={()=>setPdfFile(null)} onStart={options=>void importPdf(options)}/>:null}
    {exporting === "import" ? <button type="button" className="border p-2 text-xs" onClick={() => { importAbortRef.current?.abort(); setExporting(""); setMessage("İçe aktarma iptal edildi."); }}>İçe aktarmayı iptal et</button> : null}
    {pendingImport?.researchData.thesis.document.source.format==='pdf'?<PdfImportReview note={pendingImport} onChange={setPendingImport} onCancel={()=>setPendingImport(null)} onApply={next=>{onDocumentChange(next);setPendingImport(null);setMessage('PDF içeriği aktarıldı. Kalan bildirimler aktarım raporunda.');}}/>:pendingImport ? <WordImportReview note={pendingImport} onChange={setPendingImport} onCancel={() => setPendingImport(null)} onApply={() => { onDocumentChange(pendingImport); setPendingImport(null); setMessage("Word belgesi içe aktarıldı. Aktarım raporunu inceleyebilirsiniz."); }} /> : null}
    <WordImportReport document={thesis.document} />
    <PdfImportReport document={thesis.document}/>
    <ThesisRibbon tab={ribbonTab} setTab={setRibbonTab} panelContent={ribbonPanelContent} title={plainTitle} activeSection={activeSectionId || activeStatic || activeLayoutText ? activeSection : null} template={template}
      actions={{ runSaved, keepSelection, saveSelection: rememberSelection, activeFormat: ribbonFormat, canFormatText: !interaction.selectedElements.length || Boolean(activeLayoutText?.editableLayout && !activeLayoutText?.locked), isStaticTarget: Boolean(activeStatic || activeLayoutText), isLayoutTextTarget: Boolean(activeLayoutText), canTextUndo: activeLayoutText ? interaction.canUndo : Boolean(!activeStatic && activeBody()?.canUndo?.()), canTextRedo: activeLayoutText ? interaction.canRedo : Boolean(!activeStatic && activeBody()?.canRedo?.()), canInsertInline: canInsertCitation }}
      detailsOpen={detailsOpen} setDetailsOpen={next => { const value = typeof next === 'function' ? next(detailsOpen) : next; if (value) openDetails(); else setDetailsOpen(false); }} pageSettingsOpen={pageSettingsOpen} setPageSettingsOpen={changePageSettings}
      workspacePanel={workspacePanel} onOpenWorkspace={openWorkspace} onCheckDocument={checkDocument} sourceCount={citableItems.length}
      canUndo={interaction.canUndo} canRedo={interaction.canRedo} onUndo={interaction.undo} onRedo={interaction.redo}
      onImport={onDocumentChange ? () => wordInputRef.current?.click() : undefined} onImportPdf={onDocumentChange?()=>pdfInputRef.current?.click():undefined} exporting={exporting} onExport={(kind) => void exportFile(kind)} onPrint={print} paginationReady={!paginationActive || paginationReady}
      zoomChoice={zoomChoice} setZoomChoice={setZoomChoice} zoom={zoom} stepZoom={stepZoom} canStepZoom={canStepZoom} zoomLevels={ZOOM_LEVELS} totalPages={totalPages}
      warningCount={(warning ? 1 : 0) + missingFields.length + (indexWarning ? 1 : 0) + validationIssues.length} warningsOpen={warningsOpen} setWarningsOpen={setWarningsOpen}
      validationIssues={validationIssues} missingFields={missingFields.map((key) => template.placeholders[key]?.label || key)} warning={warning} indexWarning={indexWarning} message={message}
      onImage={(kind = "") => { imageKindRef.current = kind; imageInputRef.current?.click(); }} captionKinds={captionKinds} pickedFigure={pickedFigure}
      onFigureKind={(kind) => { const figure = pickedFigure; const owner = figure?.closest("[data-thesis-flow-section]")?.getAttribute("data-thesis-flow-section"); if (figure?.isConnected && owner) bodyRefs.current[owner]?.setFigureKind(figure, kind); }}
      pickedEquation={pickedEquation} onEquationNumber={() => { const math = pickedEquation; const owner = math?.closest("[data-thesis-flow-section]")?.getAttribute("data-thesis-flow-section"); if (math?.isConnected && owner) bodyRefs.current[owner]?.setEquationNumbered(math, math.getAttribute("data-eq-numbered") !== "true"); }}
      citableItems={citableItems} onInsertCitation={insertCitation}
      onAddFrame={addFrame} rulersVisible={rulersVisible} setRulersVisible={setRulersVisible} rulerUnit={rulerUnit} setRulerUnit={setRulerUnit}
      navigationOpen={navigationOpen} setNavigationOpen={setNavigationOpen} canNavigate={Boolean(model.sections.length)} fontFamily={activeLayoutText ? (activeLayoutText.style?.fontFamily || getComputedStyle(activeLayoutText.element).fontFamily) : (activeSection?.rules.body.fontFamily || template.typography.body?.fontFamily)} page={layoutSection?.rules.page} />
    <div className="thesis-workspace-body flex min-h-0 flex-1">
      <div ref={viewportRef} className="min-w-0 flex-1 overflow-auto px-4 py-7">
        <div ref={papersRef} lang={model.language} data-thesis-template-id={model.templateId} data-thesis-pagination-ready={paginationActive ? (paginationReady ? "true" : "false") : "fallback"} data-thesis-pagination-map={JSON.stringify(indexResolution.pages || {})} data-thesis-pagination-targets={JSON.stringify(generatedPageTargets)} onPointerDownCapture={trackSectionPointer} aria-label="Belge sayfaları" className="flex w-max min-w-full flex-col gap-7 outline-none">
        {pageGroups.map((group, index) => {
            const sheet = <ThesisSectionPages key={`${model.templateId}:${group.id}`} group={group} pages={pageModel[index].pages} values={model.values} zoom={zoom} bodyRefs={bodyRefs} onSectionFocus={pageHandlers.onSectionFocus} onFormatChange={pageHandlers.onFormatChange} onTextChange={pageHandlers.onTextChange} onTextOverride={pageHandlers.onTextOverride} onStaticFocus={pageHandlers.onStaticFocus} onPageCount={onPageCount} onChapterStarts={onChapterStarts} footnotes={footnoteViews[group.id]} endnotes={Object.fromEntries(group.sections.map((section) => [section.id, endnoteViews[section.id] || []]))} />;
            const guides = layoutState.guides.filter((guide) => !guide.sectionId || guide.sectionId === group.id);
            return rulersVisible ? <div key={`${model.templateId}:${group.id}`} className="mx-auto"><LayoutRulers page={group.rules.page} zoom={zoom} unit={rulerUnit} guides={guides} onGuidesChange={(next) => interaction.commitThesis({ ...thesis, layout: { ...layoutState, guides: [...layoutState.guides.filter((guide) => guide.sectionId && guide.sectionId !== group.id), ...next.map((guide) => ({ ...guide, sectionId: group.id }))] } }, "action")}>{sheet}</LayoutRulers></div> : sheet;
          })}
        </div>
      </div>

    </div>
    <ThesisStatusBar pageSize={template.page.size || ""} papersRef={papersRef} title={plainTitle} totalPages={totalPages} zoom={zoom} zoomChoice={zoomChoice} setZoomChoice={setZoomChoice} stepZoom={stepZoom} keepSelection={keepSelection} saveSelection={rememberSelection} />
    <LayoutSelectionOverlay {...interaction.overlayProps} onPatch={interaction.patchElements} onOpenInspector={() => setRibbonTab("Öğe")} />
  </div>;
}
