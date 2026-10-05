import { memo, useCallback, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { registerCustomFormatRules } from "../../config/format.js";
import { footnotesFromHtml } from "../../lib/academicDocument.js";
import { focusEditableStart } from "../../lib/richText.js";
import { resolveChromeText, resolvePageNumberStyle } from "../../thesis/engine.js";
import { chapterStartPageIndexes, flowPagePitchPx, pageCountFromFlowHeight, pageMetrics, pageStackHeightPx, thesisGroupHasPageContent } from "../../thesis/pageLayout.js";
import { pageFootnotesSupported } from "../../thesis/footnotes.js";
import { cssLineBaselineOffset, emptyParagraphPitchMm, wordBaselineProbe } from "../../thesis/wordBaseline.js";
import { RichTextBody } from "./RichTextBody";

/** Pages come from the browser's fragmentation engine; engines without multicol row wrapping keep the Task 6 continuous surface. */
export const THESIS_PAGED_LAYOUT = typeof CSS !== "undefined" && typeof CSS.supports === "function"
  && CSS.supports("column-wrap", "wrap") && CSS.supports("column-height", "1px");
/** Notes at the bottom of their reference's physical page; otherwise the legacy section-end list. */
export const THESIS_PAGE_FOOTNOTES = THESIS_PAGED_LAYOUT && pageFootnotesSupported();

/** Continuous fallback: chrome is drawn once on the single surface. */
function PageChrome({ section, values }) {
  const { page, body } = section.rules;
  const { margins, header, footer } = page;
  const headerText = header?.firstPage === "omit" ? "" : resolveChromeText(header?.content, values);
  const footerText = footer?.firstPage === "omit" ? "" : resolveChromeText(footer?.content, values);
  const font = { fontFamily: body.fontFamily, fontSize: "10pt", lineHeight: 1.1, color: "#000" };
  return <>
    {headerText ? <div className="absolute" style={{ ...font, left: `${margins.leftMm}mm`, top: `${(header?.distanceMm || 0) + (header?.heightMm || 0) / 2}mm`, width: `${page.widthMm - margins.leftMm - margins.rightMm}mm` }}>{headerText}</div> : null}
    {footerText ? <div className="absolute" style={{ ...font, left: `${margins.leftMm}mm`, bottom: `${footer?.distanceMm || 0}mm`, width: `${page.widthMm - margins.leftMm - margins.rightMm}mm` }}>{footerText}</div> : null}
  </>;
}

/** Header, footer and page number of one physical sheet. Never part of the editable document. */
function SheetChrome({ rules, values, page }) {
  const { page: rule, body } = rules;
  const { margins, header, footer } = rule;
  const chromeValues = { ...values, NUMPAGES: page.totalPages };
  const headerText = page.showHeader ? resolveChromeText(page.headerContent ?? header?.content, chromeValues) : "";
  const footerText = page.showFooter ? resolveChromeText(page.footerContent ?? footer?.content, chromeValues) : "";
  const box = { left: `${margins.leftMm}mm`, width: `${rule.widthMm - margins.leftMm - margins.rightMm}mm`, fontFamily: body.fontFamily, fontWeight: 400, fontStyle: "normal", lineHeight: 1.1, color: "#000" };
  const wordChrome = Boolean(rules.lineSpacing?.rule || rule.differentFirstPage || header?.firstContent !== undefined || header?.evenContent !== undefined || footer?.firstContent !== undefined || footer?.evenContent !== undefined);
  const chromeProbe = wordChrome ? wordBaselineProbe({ fontFamily: body.fontFamily, fontSizePt: 10, fontWeight: 400 }, { mode: "word", baseline: "word", singleLineEm: 1 }, 1.1) : null;
  const chromeBaselinePx = chromeProbe ? cssLineBaselineOffset({ fontFamily: body.fontFamily, fontSize: "10pt", fontWeight: 400, fontStyle: "normal", lineHeight: 1.1 }) : null;
  const chromeShiftMm = chromeProbe && Number.isFinite(chromeBaselinePx) ? chromeProbe.targetPt * 25.4 / 72 - chromeBaselinePx * 25.4 / 96 : 0;
  const topMm = (header?.distanceMm || 0) + (header?.heightMm || 0) / 2;
  // Trailing blank footer paragraphs (Word keeps them below the text): each is one body-font single line (measured: the number moves up one line pitch per blank paragraph).
  const blankMm = (footer?.trailingBlankLines || 0) * emptyParagraphPitchMm(body, rules.lineSpacing);
  const bottomMm = (footer?.distanceMm || 0) + blankMm;
  // A number on the same edge as header/footer text stays nearest the paper edge; the text moves one line inward.
  const shift = (edge) => (page.label && page.numberPosition === edge ? 6 : 0);
  return <>
    {headerText ? <div className="thesis-page-header absolute" style={{ ...box, fontSize: "10pt", top: `${topMm + shift("top") + chromeShiftMm}mm` }}>{headerText}</div> : null}
    {footerText ? <div className="thesis-page-footer absolute" style={{ ...box, fontSize: "10pt", bottom: `${bottomMm + shift("bottom") - chromeShiftMm}mm` }}>{footerText}</div> : null}
  {page.label ? (() => {
    const number = rule.numbering || {};
    const numberStyle = resolvePageNumberStyle(body, number);
    const fontSizePt = numberStyle.fontSizePt;
    const numberBox = Number.isFinite(page.numberXmm) && Number.isFinite(page.numberWidthMm)
      ? { left: `${page.numberXmm}mm`, width: `${page.numberWidthMm}mm` }
      : number.centerOnPage && number.align === "center" ? { left: "0mm", width: `${rule.widthMm}mm` }
      : { left: `${margins.leftMm}mm`, width: `${rule.widthMm - margins.leftMm - margins.rightMm}mm` };
    const baselineTopMm = page.numberBaselineFromTopMm;
    const fontFamily = numberStyle.fontFamily;
    const cssBaselinePx = Number.isFinite(baselineTopMm)
      ? cssLineBaselineOffset({ fontFamily, fontSize: `${fontSizePt}pt`, fontWeight: numberStyle.fontWeight || 400, fontStyle: numberStyle.italic ? "italic" : "normal", lineHeight: 1 })
      : null;
    if (Number.isFinite(baselineTopMm) && !Number.isFinite(cssBaselinePx)) throw new Error(`Could not measure the page-number font baseline for ${fontFamily}`);
    const baselineStyle = Number.isFinite(baselineTopMm)
      ? { top: `${baselineTopMm - cssBaselinePx * 25.4 / 96}mm`, lineHeight: 1 }
      : (page.numberPosition === "top" ? { top: `${topMm}mm` } : { bottom: `${bottomMm}mm` });
    return <div className="thesis-page-number absolute" style={{ ...box, ...numberBox, fontFamily, fontSize: `${fontSizePt}pt`, fontWeight: numberStyle.fontWeight || 400, fontStyle: numberStyle.italic ? "italic" : "normal", textAlign: page.numberAlign, ...baselineStyle }}>{page.label}</div>;
  })() : null}
  </>;
}

/** Page-bottom notes of one sheet. Same DOM as footnoteAreaNodes (the measuring twin); never editable. */
function FootnoteArea({ groupId, rule, items, top }) {
  return <div className="thesis-footnote-area" data-thesis-footnote-group={groupId} style={{ top: `${top}px` }}>
    {rule.separator.enabled ? <div className="thesis-footnote-separator" /> : null}
    <ol className="thesis-footnote-list">{items.map((item, index) => <li key={index} className={item.continued ? "thesis-footnote thesis-footnote-continued" : "thesis-footnote"}>
      {item.continued ? null : <><sup className="thesis-footnote-label">{item.label}</sup>{" "}</>}{item.text}
    </li>)}</ol>
  </div>;
}

/**
 * Template-owned HTML (section titles, special pages, generated indexes). React re-injects
 * innerHTML for every new prop object, which would drop the anchors that
 * decorateThesisSources adds to it; identical HTML therefore keeps its DOM.
 */
const TEXT_NODES = "h1, p.thesis-fixed";
const nodeText = (node) => node.innerText.replace(/[\u00a0]/g, " ").replace(/\r\n?/g, "\n").replace(/\n$/, "");
const fixedLines = (root) => [...root.querySelectorAll('p.thesis-fixed[data-thesis-text="fixed"]')].map((node) => nodeText(node).replace(/^ $/, ""));

/**
 * Template-owned text the writer may replace in this document: the section title heading and its fixed paragraphs.
 * Text edits are plain text, committed on blur as a document-local override (never written to the template).
 */
function EditableStaticHtml({ html, sectionId, onTextOverride, onStaticFocus }) {
  const rootRef = useRef(null);
  const editRef = useRef(null);
  useLayoutEffect(() => {
    registerCustomFormatRules(html);
    for (const node of rootRef.current.querySelectorAll(TEXT_NODES)) {
      if (node.closest("[data-layout-id],[data-thesis-block]")) continue;
      node.setAttribute("contenteditable", "plaintext-only");
      node.setAttribute("data-thesis-text", node.tagName === "H1" ? "title" : "fixed");
      node.setAttribute("spellcheck", "false");
    }
  }, [html]);
  const host = (event) => event.target.closest?.("[data-thesis-text]");
  const snapshot = (node) => node.getAttribute("data-thesis-text") === "title" ? nodeText(node).replace(/\s+/g, " ").trim() : fixedLines(rootRef.current).join("\n");
  // Text typed since focus, or null. Taking it ends the edit, so the caller commits it together with a format change.
  const takePending = (node) => {
    const edit = editRef.current;
    editRef.current = null;
    if (!edit) return null;
    const kind = node.getAttribute("data-thesis-text");
    const text = snapshot(node);
    return text === edit.original ? null : { kind, text: kind === "title" && !text ? undefined : text };
  };
  const finish = (node) => {
    const pending = takePending(node);
    if (pending) onTextOverride?.(sectionId, pending.kind, pending.text);
  };
  return <div ref={rootRef} data-thesis-static-root=""
    onFocus={(event) => {
      const node = host(event);
      if (!node) return;
      editRef.current = { original: snapshot(node), nodeText: nodeText(node) };
      onStaticFocus?.(sectionId, node.getAttribute("data-thesis-text"), () => takePending(node));
    }}
    onBlur={(event) => { const node = host(event); if (node) finish(node); }}
    onKeyDown={(event) => {
      const node = host(event);
      if (!node) return;
      if (event.key === "Escape") { event.preventDefault(); node.innerText = editRef.current?.nodeText ?? node.innerText; editRef.current = null; node.blur(); }
      else if (event.key === "Enter" && node.getAttribute("data-thesis-text") === "title") { event.preventDefault(); node.blur(); }
    }}
    dangerouslySetInnerHTML={{ __html: html }} />;
}

const StaticHtml = memo(function StaticHtml({ html, sectionId, onTextOverride, onStaticFocus }) {
  return onTextOverride ? <EditableStaticHtml html={html} sectionId={sectionId} onTextOverride={onTextOverride} onStaticFocus={onStaticFocus} /> : <div dangerouslySetInnerHTML={{ __html: html }} />;
});

function caretPointFromClient(x, y) {
  const position = document.caretPositionFromPoint?.(x, y);
  if (position?.offsetNode) return { node: position.offsetNode, offset: position.offset };
  const range = document.caretRangeFromPoint?.(x, y);
  return range ? { node: range.startContainer, offset: range.startOffset } : null;
}

function ThesisSectionPagesView({ group, pages, values, zoom, bodyRefs, onSectionFocus, onFormatChange, onTextChange, onTextOverride, onStaticFocus, onPageCount, onChapterStarts, footnotes }) {
  const section = group.sections[0];
  const articleRef = useRef(null);
  const flowRef = useRef(null);
  const [surfaceHeight, setSurfaceHeight] = useState(0);
  const page = group.rules.page;
  const metrics = pageMetrics(page);
  const emptyFlow = !thesisGroupHasPageContent(group);
  const count = Math.max(1, pages.length);
  const stackHeight = THESIS_PAGED_LAYOUT ? (emptyFlow ? metrics.heightPx : pageStackHeightPx(count, metrics)) : Math.max(metrics.heightPx, surfaceHeight);
  const pageNotes = THESIS_PAGE_FOOTNOTES && group.rules.footnotes?.placement === "pageBottom";

  // Clicks in a margin or between sheets put the caret on the nearest line of that page
  // (not the document start) and never scroll.
  const focusBodyFromPaper = (event) => {
    const target = event.target;
    if (target.closest("button, input, textarea, select, a")) return;
    const flowSection = target.closest(".thesis-flow-section");
    const editor = flowSection
      ? flowSection.querySelector('[contenteditable="true"]')
      : articleRef.current?.querySelector('[contenteditable="true"]');
    if (target.closest("[contenteditable]")) {
      if (editor && !editor.textContent?.trim()) focusEditableStart(editor);
      return;
    }
    const flow = flowRef.current;
    if (flow) {
      const box = flow.getBoundingClientRect();
      const point = caretPointFromClient(Math.min(Math.max(event.clientX, box.left + 1), box.right - 1), event.clientY);
      const host = point && (point.node.nodeType === 1 ? point.node : point.node.parentElement)?.closest('[contenteditable="true"]');
      if (host && articleRef.current.contains(host) && host.textContent?.trim()) {
        host.focus({ preventScroll: true });
        try { document.getSelection()?.collapse(point.node, point.offset); } catch { /* keep the focused caret */ }
        return;
      }
    }
    if (!editor) return;
    if (!editor.textContent?.trim()) focusEditableStart(editor);
    else editor.focus({ preventScroll: true });
  };

  // Special pages keep their own block editing; generated indexes have no template text to replace.
  // The callback stays identical across renders: a new prop would make React re-inject the static HTML and drop the edit hooks.
  const overrideRef = useRef(onTextOverride);
  overrideRef.current = onTextOverride;
  const staticFocusRef = useRef(onStaticFocus);
  staticFocusRef.current = onStaticFocus;
  const focusStatic = useCallback((...args) => staticFocusRef.current?.(...args), []);
  const commitOverride = useCallback((sectionId, kind, text) => overrideRef.current?.(sectionId, kind, text), []);
  const overrideText = (item) => !item.specialPage && item.mode !== "generated" && onTextOverride ? commitOverride : undefined;
  const renderBody = (item, notes = item.editable ? footnotesFromHtml(item.editableHtml) : []) => <div className="thesis-body">
    {item.editable ? <>
      {item.prefixHtml ? <StaticHtml html={item.prefixHtml} sectionId={item.id} onTextOverride={overrideText(item)} onStaticFocus={focusStatic} /> : null}
      <RichTextBody ref={(instance) => { bodyRefs.current[item.id] = instance; }} compact academic paragraphSemantics emptyHeadingOnInsert positionedFrame={!THESIS_PAGED_LAYOUT} className="thesis-content" content={item.editableHtml}
        onContentChange={(html, reason) => onTextChange(item, html, reason)} onFocus={() => onSectionFocus(item.id)} onFormatChange={(format) => onFormatChange?.(item.id, format)} ariaLabel={`${item.title} metni`} />
      {notes.length && !pageNotes ? <ol className="academic-footnote-list" contentEditable={false}>{notes.map((note) => <li key={note.index}><sup>{note.index}</sup> {note.text}</li>)}</ol> : null}
      {item.suffixHtml ? <StaticHtml html={item.suffixHtml} /> : null}
    </> : <StaticHtml html={item.html} sectionId={item.id} onTextOverride={overrideText(item)} onStaticFocus={focusStatic} />}
  </div>;

  useLayoutEffect(() => {
    const flow = flowRef.current;
    const article = articleRef.current;
    if (!flow || !article) return undefined;
    if (!THESIS_PAGED_LAYOUT) {
      setSurfaceHeight(article.offsetHeight);
      const observer = new ResizeObserver(([entry]) => setSurfaceHeight(entry.borderBoxSize?.[0]?.blockSize ?? article.offsetHeight));
      observer.observe(article);
      return () => observer.disconnect();
    }
    // Only the unscaled flow height is read; the browser has already fragmented the
    // content, so a keystroke costs one comparison unless the page count changes.
    let reported = 0;
    const report = (height, sync) => {
      const next = emptyFlow ? 0 : pageCountFromFlowHeight(height, metrics);
      if (next === reported) return;
      reported = next;
      // Sync so a new sheet is painted in the same frame as the text that needs it.
      if (sync) flushSync(() => onPageCount(group.id, next));
      else onPageCount(group.id, next);
    };
    report(flow.offsetHeight, false);
    const observer = new ResizeObserver(([entry]) => report(entry.borderBoxSize?.[0]?.blockSize ?? flow.offsetHeight, true));
    observer.observe(flow);
    // numbering.omitOnChapterStart: which pages open a chapter is measured from the rendered flow (re-read when the content changes).
    let frame = 0, mutations = null;
    const omit = Boolean(group.rules.page.numbering?.omitOnChapterStart) && onChapterStarts && !emptyFlow;
    const readStarts = () => { frame = 0; onChapterStarts(group.id, chapterStartPageIndexes(flow, metrics)); };
    if (omit) {
      readStarts();
      mutations = new MutationObserver(() => { if (!frame) frame = requestAnimationFrame(readStarts); });
      mutations.observe(flow, { childList: true, subtree: true, characterData: true });
    } else onChapterStarts?.(group.id, null);
    return () => { observer.disconnect(); mutations?.disconnect(); if (frame) cancelAnimationFrame(frame); };
  }, [group.id, emptyFlow, metrics.contentHeightPx, metrics.rowGapPx, onPageCount, onChapterStarts, group.rules.page.numbering?.omitOnChapterStart]);

  return <div className="thesis-display-frame mx-auto shrink-0" style={{ width: `${metrics.widthPx * zoom}px`, height: `${stackHeight * zoom}px` }}>
    <div className="thesis-page-stack" style={{ width: `${page.widthMm}mm`, height: `${stackHeight}px`, transform: `scale(${zoom})`, transformOrigin: "top left" }}>
      {THESIS_PAGED_LAYOUT ? <div className="thesis-sheets" aria-hidden="true">
        {emptyFlow ? <div className="thesis-sheet-placeholder" data-thesis-placeholder="" data-export-ignore="" style={{ position: "absolute", left: 0, top: 0, background: "#fff", boxShadow: "0 8px 28px rgba(0,0,0,.13)", overflow: "hidden", pointerEvents: "none", width: `${page.widthMm}mm`, height: `${page.heightMm}mm` }} /> : null}
        {pages.map((entry) => <div key={entry.index} className="thesis-sheet" data-thesis-page={entry.physicalIndex + 1} data-thesis-page-label={entry.label || undefined}
          style={{ top: `${entry.index * flowPagePitchPx(metrics)}px`, width: `${page.widthMm}mm`, height: `${page.heightMm}mm` }}>
          <SheetChrome rules={group.rules} values={values} page={entry} />
        </div>)}
      </div> : null}
      {pageNotes ? <>
        <div className="thesis-footnote-area" data-thesis-footnote-group={group.id} data-thesis-footnote-measure="" data-export-ignore="" aria-hidden="true" />
        <div className="thesis-footnote-layer" aria-label="Dipnotlar">
          {pages.map((entry) => footnotes?.pages?.[entry.index] ? <FootnoteArea key={entry.index} groupId={group.id} rule={group.rules.footnotes} items={footnotes.pages[entry.index].items}
            top={entry.index * flowPagePitchPx(metrics) + metrics.topMarginPx + Math.floor((metrics.contentHeightPx - metrics.trailingLeadingPx) * 64) / 64 - footnotes.pages[entry.index].height} /> : null)}
        </div>
      </> : null}
      <article ref={articleRef} className="thesis-paper thesis-editor-surface" data-thesis-section={section.id} data-thesis-empty-flow={emptyFlow ? "true" : undefined} data-thesis-odd-page-pad={pages.some((entry) => entry.blank) ? "true" : undefined} data-thesis-layout={THESIS_PAGED_LAYOUT ? "paged" : "continuous"} data-thesis-page-count={THESIS_PAGED_LAYOUT ? (emptyFlow ? 0 : count) : undefined} aria-label={`${section.title}, A4 belge alanı`} onClick={focusBodyFromPaper}>
        {THESIS_PAGED_LAYOUT ? null : <PageChrome section={section} values={values} />}
        <div ref={flowRef} className="thesis-page-flow" data-thesis-empty-flow={emptyFlow ? "true" : undefined}>
          {THESIS_PAGED_LAYOUT && !emptyFlow && pages.some((entry) => entry.blank) ? <div aria-hidden="true" data-thesis-odd-page-spacer="" data-export-ignore="" /> : null}
          {group.sections.map((item) => <section key={item.id} className="thesis-flow-section" data-thesis-flow-section={item.id} data-thesis-section-mode={item.mode} data-thesis-fixed-content={item.fixedContent ? "true" : undefined} data-thesis-special-page={item.specialPage ? item.type : undefined}>{renderBody(item)}</section>)}
          {pageNotes ? Array.from({ length: footnotes?.tail || 0 }, (_, index) => <div key={`tail-${index}`} className="thesis-footnote-tail" aria-hidden="true" />) : null}
        </div>
      </article>
    </div>
  </div>;
}

// Content signature of a render input, cached per object: the engine rebuilds every group on each keystroke, but only the edited one changes.
const signatures = new WeakMap();
const signature = (value) => {
  if (!value || typeof value !== "object") return value;
  let known = signatures.get(value);
  if (known === undefined) { known = JSON.stringify(value); signatures.set(value, known); }
  return known;
};
const STABLE_PROPS = ["zoom", "bodyRefs", "onSectionFocus", "onFormatChange", "onTextChange", "onTextOverride", "onStaticFocus", "onPageCount", "onChapterStarts"];
const SIGNED_PROPS = ["group", "pages", "values", "footnotes"];
export const ThesisSectionPages = memo(ThesisSectionPagesView, (previous, next) =>
  STABLE_PROPS.every((key) => previous[key] === next[key]) && SIGNED_PROPS.every((key) => signature(previous[key]) === signature(next[key])));
