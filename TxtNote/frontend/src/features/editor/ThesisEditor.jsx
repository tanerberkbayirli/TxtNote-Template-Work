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
import { confirmCommittedPagination, decorateThesisSources, generatedIndexPageTargets, INDEX_ITERATION_CAP, missingGeneratedIndexPages, renderedIndexPages, resolveGeneratedIndexes, waitForStableEquationLayout } from "../../thesis/generatedIndex.js";
import { layoutThesisFootnotes } from "../../thesis/footnotes.js";
import { addLayoutElement, normalizeThesisLayout } from "../../thesis/layoutDocument.js";
import { applyLayoutPage, applyLayoutTypography, resolveLayoutTypography } from "../../thesis/layoutProperties.js";
import { useLayoutInteraction } from "./useLayoutInteraction.js";
import LayoutSelectionOverlay from "./LayoutSelectionOverlay.jsx";
import LayoutInspector from "./LayoutInspector.jsx";
import PageLayoutInspector from "./PageLayoutInspector.jsx";
import LayoutRulers from "./LayoutRulers.jsx";
import { layoutTableContinuations, tableContinuationRows } from "../../thesis/tableContinuation.js";
import { applyTransformExceptions } from "../../thesis/transformExceptions.js";
import ThesisRibbon from "./ThesisRibbon.jsx";
import ThesisNavigation from "./ThesisNavigation.jsx";
import ThesisStatusBar from "./ThesisStatusBar.jsx";
import "./ThesisEditor.css";

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

function collectThesisHeadings(root) {
  if (!root) return [];
  return [...root.querySelectorAll(".thesis-flow-section h1, .thesis-flow-section h2, .thesis-flow-section h3, .thesis-flow-section h4")].flatMap((node) => {
    const section = node.closest("[data-thesis-flow-section]");
    const text = node.textContent?.trim();
    return section && text ? [{ sectionId: section.dataset.thesisFlowSection, id: node.getAttribute("data-academic-id"), text, level: Number(node.tagName.slice(1)) }] : [];
  });
}

export function ThesisEditor({ title, content, researchData, onTitleChange, onContentChange, onResearchDataChange, templateRegistry }) {
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
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [activeFormat, setActiveFormat] = useState({});
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
  const generatedPageTargets = useMemo(() => sourceModel ? generatedIndexPageTargets(sourceModel) : [], [sourceModel]);
  const pageGroups = useMemo(() => model ? groupThesisSections(model.sections) : [], [model]);
  const [chapterStarts, setChapterStarts] = useState({});
  const pageModel = useMemo(() => buildThesisPageModel(pageGroups, pageCounts, chapterStarts), [pageGroups, pageCounts, chapterStarts]);
  const totalPages = pageModel.reduce((sum, entry) => sum + entry.pages.length, 0);
  const thesisWordCount = `${plainTitle} ${[...(papersRef.current?.querySelectorAll('[contenteditable="true"]') || [])].map((node) => node.innerText || node.textContent || "").join(" ")}`.trim().split(/\s+/u).filter(Boolean).length;
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
  const validationIssues = model ? [...model.validation.errors, ...model.validation.warnings] : [];
  const documentWidth = model ? Math.max(...model.sections.map((section) => pageMetrics(section.rules.page).widthPx)) : 794;
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
  const captionKinds = Object.entries(template?.captionKinds || {});
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
  // No heading markup is rewritten while an IME composition is running (transformExceptions.js); it catches up afterwards.
  useEffect(() => {
    const root = papersRef.current;
    if (!root) return undefined;
    const start = () => { root.__thesisComposing = true; };
    const end = () => { root.__thesisComposing = false; if (model) applyTransformExceptions(root, model); };
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
    let frame = 0, iterations = 0, previous = "", disposed = false, settled = false, failed = false, confirming = false;
    // Last serialized values applied to state; avoids re-stringifying the current state each pass.
    let appliedPages = null, appliedNotes = null;
    const measure = () => {
      const groups = groupThesisSections(latestSourceModel.current.sections);
      const continuations = layoutTableContinuations(root, groups, latestSourceModel.current);
      const { views: notes, incomplete } = THESIS_PAGE_FOOTNOTES ? layoutThesisFootnotes(root, groups, footnoteState.current, performance.now() + 24) : { views: {} };
      if (incomplete) return { incomplete: true, groups, continuations, notes };
      const indexes = renderedIndexPages(root, groups);
      return { incomplete: false, groups, continuations, notes, indexes,
        signature: `${JSON.stringify(indexes)}|${JSON.stringify(notes)}|${JSON.stringify(continuations)}` };
    };
    const probe = () => {
      if (disposed) return;
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
          isCurrent: (candidate) => !disposed && paginationEpochRef.current === candidate,
          generation,
        }).then((ready) => {
          confirming = false;
          if (disposed || generation !== paginationEpochRef.current) return;
          if (ready) {
            settled = true;
            paginationReadyEpochRef.current = generation;
            setPaginationReady(true);
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
        iterations = 0; previous = ""; settled = false; failed = false; confirming = false;
        appliedPages = null; appliedNotes = null;
      } else if (invalidate) confirming = false;
      setIndexWarning("");
      frame = requestAnimationFrame(probe);
    };
    const observer = new ResizeObserver(() => {
      if (settled) { restart(true, true); return; }
      if (failed) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(probe);
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
    return () => { disposed = true; paginationRef.current = null; cancelAnimationFrame(frame); observer.disconnect(); root.removeEventListener("load", onLoad, true); document.fonts.removeEventListener?.("loadingdone", onLoad); };
  }, [paginationActive]);
  useLayoutEffect(() => {
    if (!paginationActive) return;
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
    const entry = (templateRegistry || THESIS_TEMPLATE_REGISTRY).find((item) => item.id === id);
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
  const runSaved = (command) => { const body = activeBody(); if (!body) return; command(body); };
  const rememberSelection = () => activeBody()?.rememberSelection?.();
  const keepSelection = (event) => { rememberSelection(); event.preventDefault(); };
  const trackSectionPointer = (event) => {
    setPickedFigure(event.target.closest?.("figure.academic-figure") || null);
    setPickedEquation(event.target.closest?.(".math-formula--block") || null);
    const flow = event.target.closest?.(".thesis-flow-section");
    if (flow && flow.getAttribute("data-thesis-section-mode") !== "editable") { setActiveSectionId(""); setCiteOpen(false); }
  };
  const citableItems = bibliographyItems.map((item) => item.trim()).filter(Boolean);
  const insertCitation = (text) => {
    const value = String(text || "").trim();
    if (!value) return;
    activeBody()?.insertFootnote(value);
    setCiteText(""); setCiteOpen(false);
  };

  /** Measured indent (unscaled px) of each index row's title after its label, for Word's hanging indent. */
  const thesisIndexHangs = (root) => Object.fromEntries([...(root?.querySelectorAll("li[data-index-target]") || [])].flatMap((row) => {
    const text = row.querySelector(".thesis-index-text"), title = row.querySelector(".thesis-index-title");
    if (!text || !title || getComputedStyle(text).display !== "flex") return [];
    const scale = new DOMMatrixReadOnly(getComputedStyle(row.closest(".thesis-page-stack")).transform).a || 1;
    return [[row.dataset.indexTarget, (title.getBoundingClientRect().left - text.getBoundingClientRect().left) / scale]];
  }));
  const exportFile = async (kind) => {
    if (!model) return;
    const exportGeneration = paginationEpochRef.current;
    const assertPaginationReady = () => {
      if (paginationActive && (paginationReadyEpochRef.current !== exportGeneration || exportGeneration !== paginationEpochRef.current)) {
        throw new Error(indexWarning || "Sayfalama henüz son ölçüm ve dizin eşlemesiyle doğrulanmadı; dışa aktarma engellendi.");
      }
    };
    try { assertPaginationReady(); } catch (error) { setMessage(error.message); return; }
    setExporting(kind); setMessage("");
    try {
      const [{ buildThesisDocx, buildThesisPdf }, { buildThesisLayoutPdf }, { academicFileStem, downloadBlob }, { collectThesisBlockPageBreaks }] = await Promise.all([
        import("../../thesis/export.js"), import("../../thesis/layoutPdf.js"), import("../../lib/academicExport.js"),
        import("../../thesis/exportPagination.js"),
      ]);
      assertPaginationReady();
      const equationRoot = papersRef.current;
      if (kind === "pdf" && THESIS_PAGED_LAYOUT && equationRoot?.querySelector(".thesis-body .math-formula--block")) {
        await waitForStableEquationLayout(equationRoot, { prepare: () => decorateThesisSources(equationRoot, model) });
      }
      assertPaginationReady();
      // The PDF is drawn from the editor's own paged layout; engines without it keep the model-based writer.
      const blob = kind === "pdf"
        ? (THESIS_PAGED_LAYOUT && papersRef.current ? await buildThesisLayoutPdf({ root: papersRef.current, groups: pageGroups, title: model.title, language: model.language, templateId: model.templateId, documentLayout: model.documentLayout, systemFonts: model.systemFonts || [] }) : await buildThesisPdf(model))
        : await buildThesisDocx(model, { blockPageBreaks: collectThesisBlockPageBreaks(papersRef.current, pageGroups), captionAlignments: Object.fromEntries([...(papersRef.current?.querySelectorAll("[data-thesis-caption-auto][data-thesis-anchor]") || [])].map((node) => [node.dataset.thesisAnchor, node.dataset.thesisCaptionAuto])), captionHangs: Object.fromEntries([...(papersRef.current?.querySelectorAll("[data-thesis-caption-hang][data-thesis-anchor]") || [])].map((node) => [node.dataset.thesisAnchor, Number(node.dataset.thesisCaptionHang)])), indexHangs: thesisIndexHangs(papersRef.current), tableContinuations: tableContinuationRows(papersRef.current) });
      assertPaginationReady();
      const path = await downloadBlob(blob, `${academicFileStem(plainTitle || "tez")}.${kind}`);
      setMessage(path ? `Kaydedildi: ${path}` : `${kind.toUpperCase()} indirildi.`);
    } catch (error) { setMessage(error?.message || "Dışa aktarma başarısız."); }
    finally { setExporting(""); }
  };

  const print = () => {
    if (!model) return;
    const generation = paginationEpochRef.current;
    const ready = !paginationActive || paginationReadyEpochRef.current === generation;
    if (!ready) { setMessage(indexWarning || "Sayfalama henüz doğrulanmadı; yazdırma/dışa aktarma engellendi."); return; }
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;width:0;height:0;border:0;visibility:hidden";
    frame.srcdoc = buildThesisPrintHtml(model, { nonce: trustedStyleNonce() });
    frame.onload = () => {
      if (paginationActive && (generation !== paginationEpochRef.current || paginationReadyEpochRef.current !== generation)) {
        frame.remove(); setMessage("Sayfalama yazdırma sırasında değişti; sayfa eşlemesi yeniden doğrulanmalı."); return;
      }
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

  if (!model) return <div className="flex h-full items-center justify-center text-sm text-neutral-500">Tez şablonu yükleniyor…</div>;

  return <div className="flex h-full min-h-0 flex-col bg-[#e9eaec] dark:bg-neutral-950">
    <style nonce={trustedStyleNonce()} data-thesis-styles>{css + EDITOR_CSS + baselineCss}</style>
    <input ref={imageInputRef} type="file" accept="image/*" aria-label="Görsel dosyası" className="hidden" onChange={(event) => { void insertImage(event.target.files?.[0], imageKindRef.current); event.target.value = ""; }} />
    <ThesisRibbon title={plainTitle} activeSection={activeSection} template={template}
      actions={{ runSaved, keepSelection, saveSelection: rememberSelection, activeFormat }}
      detailsOpen={detailsOpen} setDetailsOpen={setDetailsOpen} pageSettingsOpen={pageSettingsOpen} setPageSettingsOpen={setPageSettingsOpen}
      canUndo={interaction.canUndo} canRedo={interaction.canRedo} onUndo={interaction.undo} onRedo={interaction.redo}
      exporting={exporting} onExport={(kind) => void exportFile(kind)} onPrint={print} paginationReady={!paginationActive || paginationReady}
      zoomChoice={zoomChoice} setZoomChoice={setZoomChoice} zoom={zoom} stepZoom={stepZoom} canStepZoom={canStepZoom} zoomLevels={ZOOM_LEVELS} totalPages={totalPages}
      warningCount={(warning ? 1 : 0) + missingFields.length + (indexWarning ? 1 : 0) + validationIssues.length} warningsOpen={warningsOpen} setWarningsOpen={setWarningsOpen}
      validationIssues={validationIssues} missingFields={missingFields.map((key) => template.placeholders[key]?.label || key)} warning={warning} indexWarning={indexWarning} message={message}
      onImage={(kind = "") => { imageKindRef.current = kind; imageInputRef.current?.click(); }} captionKinds={captionKinds} pickedFigure={pickedFigure}
      onFigureKind={(kind) => { const figure = pickedFigure; const owner = figure?.closest("[data-thesis-flow-section]")?.getAttribute("data-thesis-flow-section"); if (figure?.isConnected && owner) bodyRefs.current[owner]?.setFigureKind(figure, kind); }}
      pickedEquation={pickedEquation} onEquationNumber={() => { const math = pickedEquation; const owner = math?.closest("[data-thesis-flow-section]")?.getAttribute("data-thesis-flow-section"); if (math?.isConnected && owner) bodyRefs.current[owner]?.setEquationNumbered(math, math.getAttribute("data-eq-numbered") !== "true"); }}
      citableItems={citableItems} onInsertCitation={insertCitation} citeText={citeText} setCiteText={setCiteText} citeOpen={citeOpen} setCiteOpen={setCiteOpen}
      onAddFrame={addFrame} rulersVisible={rulersVisible} setRulersVisible={setRulersVisible} rulerUnit={rulerUnit} setRulerUnit={setRulerUnit}
      navigationOpen={navigationOpen} setNavigationOpen={setNavigationOpen} canNavigate={Boolean(model.sections.length)} fontFamily={activeSection?.rules.body.fontFamily || template.typography.body?.fontFamily} page={layoutSection?.rules.page} />
    <div className="flex min-h-0 flex-1">
      {navigationOpen ? <ThesisNavigation sections={model.sections.map((section) => ({ id: section.id, title: section.title }))} headings={collectThesisHeadings(papersRef.current)} onClose={() => setNavigationOpen(false)} onNavigate={(sectionId, headingId) => {
        const sectionNode = papersRef.current?.querySelector(`[data-thesis-flow-section="${CSS.escape(sectionId)}"]`);
        const headingNode = headingId ? sectionNode?.querySelector(`[data-academic-id="${CSS.escape(headingId)}"]`) : null;
        const target = headingNode || sectionNode;
        target?.scrollIntoView({ block: "center", behavior: "smooth" });
        setActiveSectionId(sectionId);
        sectionNode?.querySelector('[contenteditable="true"]')?.focus({ preventScroll: true });
      }} /> : null}
      <div ref={viewportRef} className="min-w-0 flex-1 overflow-auto px-4 py-7">
        <div ref={papersRef} data-thesis-pagination-ready={paginationActive ? (paginationReady ? "true" : "false") : "fallback"} data-thesis-pagination-map={JSON.stringify(indexResolution.pages || {})} data-thesis-pagination-targets={JSON.stringify(generatedPageTargets)} onPointerDownCapture={trackSectionPointer} aria-label="Belge sayfaları" className="flex w-max min-w-full flex-col gap-7 outline-none">
        {pageGroups.map((group, index) => {
            const sheet = <ThesisSectionPages key={`${model.templateId}:${group.id}`} group={group} pages={pageModel[index].pages} values={model.values} zoom={zoom} bodyRefs={bodyRefs} onSectionFocus={(id) => { setActiveSectionId(id); setActiveFormat(bodyRefs.current[id]?.activeFormat || {}); }} onFormatChange={(id, format) => { if (activeSectionId === id) setActiveFormat(format || {}); }} onTextChange={onTextChange} onPageCount={onPageCount} onChapterStarts={onChapterStarts} footnotes={footnoteViews[group.id]} />;
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
          <section><label className="block text-xs font-medium">Şablon<select aria-label="Tez şablonu" value={template.id} onChange={(event) => changeTemplate(event.target.value)} className="mt-1 block w-full rounded border border-neutral-300 bg-white p-2 text-sm text-neutral-900">{(templateRegistry || THESIS_TEMPLATE_REGISTRY).map((entry) => <option key={entry.id} value={entry.id}>{entry.displayName || `${entry.universityName} · ${entry.language.toUpperCase()}`}</option>)}</select></label>{template.status === "official" ? <p className="mt-2 text-[11px] leading-snug text-neutral-500">Resmî kaynak: {template.source?.documentName || template.source?.url}</p> : <p className="mt-2 text-[11px] text-amber-700">Genel taslak: resmî üniversite kuralı içermez.</p>}</section>
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
    <ThesisStatusBar wordCount={thesisWordCount} totalPages={totalPages} zoom={zoom} zoomChoice={zoomChoice} setZoomChoice={setZoomChoice} stepZoom={stepZoom} keepSelection={keepSelection} saveSelection={rememberSelection} />
    <LayoutSelectionOverlay {...interaction.overlayProps} onPatch={interaction.patchElements} onOpenInspector={() => { setDetailsOpen(false); setPageSettingsOpen(false); }} />
  </div>;
}
