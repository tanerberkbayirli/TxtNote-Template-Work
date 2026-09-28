import { memo, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { footnotesFromHtml } from "../../lib/academicDocument.js";
import { focusEditableStart } from "../../lib/richText.js";
import { resolveChromeText } from "../../thesis/engine.js";
import { flowPagePitchPx, pageCountFromFlowHeight, pageMetrics, pageStackHeightPx, thesisGroupHasPageContent } from "../../thesis/pageLayout.js";
import { pageFootnotesSupported } from "../../thesis/footnotes.js";
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
  const font = { fontFamily: body.fontFamily, fontSize: "10pt", lineHeight: 1.1, color: "#111" };
  return <>
    {headerText ? <div className="absolute" style={{ ...font, left: `${margins.leftMm}mm`, top: `${(header?.distanceMm || 0) + (header?.heightMm || 0) / 2}mm`, width: `${page.widthMm - margins.leftMm - margins.rightMm}mm` }}>{headerText}</div> : null}
    {footerText ? <div className="absolute" style={{ ...font, left: `${margins.leftMm}mm`, bottom: `${footer?.distanceMm || 0}mm`, width: `${page.widthMm - margins.leftMm - margins.rightMm}mm` }}>{footerText}</div> : null}
  </>;
}

/** Header, footer and page number of one physical sheet. Never part of the editable document. */
function SheetChrome({ rules, values, page }) {
  const { page: rule, body } = rules;
  const { margins, header, footer } = rule;
  const headerText = page.showHeader ? resolveChromeText(header?.content, values) : "";
  const footerText = page.showFooter ? resolveChromeText(footer?.content, values) : "";
  const box = { left: `${margins.leftMm}mm`, width: `${rule.widthMm - margins.leftMm - margins.rightMm}mm`, fontFamily: body.fontFamily, lineHeight: 1.1, color: "#111" };
  const topMm = (header?.distanceMm || 0) + (header?.heightMm || 0) / 2;
  const bottomMm = footer?.distanceMm || 0;
  // A number on the same edge as header/footer text stays nearest the paper edge; the text moves one line inward.
  const shift = (edge) => (page.label && page.numberPosition === edge ? 6 : 0);
  return <>
    {headerText ? <div className="thesis-page-header absolute" style={{ ...box, fontSize: "10pt", top: `${topMm + shift("top")}mm` }}>{headerText}</div> : null}
    {footerText ? <div className="thesis-page-footer absolute" style={{ ...box, fontSize: "10pt", bottom: `${bottomMm + shift("bottom")}mm` }}>{footerText}</div> : null}
    {page.label ? <div className="thesis-page-number absolute" style={{ ...box, fontFamily: rule.numbering?.style?.fontFamily || body.fontFamily, fontSize: `${rule.numbering?.style?.fontSizePt || body.fontSizePt}pt`, textAlign: page.numberAlign, ...(page.numberPosition === "top" ? { top: `${topMm}mm` } : { bottom: `${bottomMm}mm` }) }}>{page.label}</div> : null}
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
const StaticHtml = memo(function StaticHtml({ html }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
});

function caretPointFromClient(x, y) {
  const position = document.caretPositionFromPoint?.(x, y);
  if (position?.offsetNode) return { node: position.offsetNode, offset: position.offset };
  const range = document.caretRangeFromPoint?.(x, y);
  return range ? { node: range.startContainer, offset: range.startOffset } : null;
}

export function ThesisSectionPages({ group, pages, values, zoom, bodyRefs, onSectionFocus, onTextChange, onPageCount, footnotes }) {
  const section = group.sections[0];
  const articleRef = useRef(null);
  const flowRef = useRef(null);
  const [surfaceHeight, setSurfaceHeight] = useState(0);
  const page = group.rules.page;
  const metrics = pageMetrics(page);
  const emptyFlow = !thesisGroupHasPageContent(group);
  const count = Math.max(1, pages.length);
  const stackHeight = THESIS_PAGED_LAYOUT ? (emptyFlow ? 64 : pageStackHeightPx(count, metrics)) : Math.max(metrics.heightPx, surfaceHeight);
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

  const renderBody = (item, notes = item.editable ? footnotesFromHtml(item.editableHtml) : []) => <div className="thesis-body">
    {item.editable ? <>
      {item.prefixHtml ? <StaticHtml html={item.prefixHtml} /> : null}
      <RichTextBody ref={(instance) => { bodyRefs.current[item.id] = instance; }} compact academic paragraphSemantics emptyHeadingOnInsert positionedFrame={!THESIS_PAGED_LAYOUT} className="thesis-content" content={item.editableHtml}
        onContentChange={(html, reason) => onTextChange(item, html, reason)} onFocus={() => onSectionFocus(item.id)} ariaLabel={`${item.title} metni`} />
      {notes.length && !pageNotes ? <ol className="academic-footnote-list" contentEditable={false}>{notes.map((note) => <li key={note.index}><sup>{note.index}</sup> {note.text}</li>)}</ol> : null}
      {item.suffixHtml ? <StaticHtml html={item.suffixHtml} /> : null}
    </> : <StaticHtml html={item.html} />}
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
    return () => observer.disconnect();
  }, [group.id, emptyFlow, metrics.contentHeightPx, metrics.rowGapPx, onPageCount]);

  return <div className="thesis-display-frame mx-auto shrink-0" style={{ width: `${metrics.widthPx * zoom}px`, height: `${stackHeight * zoom}px` }}>
    <div className="thesis-page-stack" style={{ width: `${page.widthMm}mm`, height: `${stackHeight}px`, transform: `scale(${zoom})`, transformOrigin: "top left" }}>
      {THESIS_PAGED_LAYOUT ? <div className="thesis-sheets" aria-hidden="true">
        {pages.map((entry) => <div key={entry.index} className="thesis-sheet" data-thesis-page={entry.physicalIndex + 1} data-thesis-page-label={entry.label || undefined}
          style={{ top: `${entry.index * metrics.stridePx}px`, width: `${page.widthMm}mm`, height: `${page.heightMm}mm` }}>
          <SheetChrome rules={group.rules} values={values} page={entry} />
        </div>)}
      </div> : null}
      {pageNotes ? <>
        <div className="thesis-footnote-area" data-thesis-footnote-group={group.id} data-thesis-footnote-measure="" data-export-ignore="" aria-hidden="true" />
        <div className="thesis-footnote-layer" aria-label="Dipnotlar">
          {pages.map((entry) => footnotes?.pages?.[entry.index] ? <FootnoteArea key={entry.index} groupId={group.id} rule={group.rules.footnotes} items={footnotes.pages[entry.index].items}
            top={entry.index * flowPagePitchPx(metrics) + metrics.topMarginPx + Math.floor(metrics.contentHeightPx * 64) / 64 - footnotes.pages[entry.index].height} /> : null)}
        </div>
      </> : null}
      <article ref={articleRef} className="thesis-paper thesis-editor-surface" data-thesis-section={section.id} data-thesis-empty-flow={emptyFlow ? "true" : undefined} data-thesis-layout={THESIS_PAGED_LAYOUT ? "paged" : "continuous"} data-thesis-page-count={THESIS_PAGED_LAYOUT ? (emptyFlow ? 0 : count) : undefined} aria-label={`${section.title}, A4 belge alanı`} onClick={focusBodyFromPaper}>
        {THESIS_PAGED_LAYOUT ? null : <PageChrome section={section} values={values} />}
        <div ref={flowRef} className="thesis-page-flow" data-thesis-empty-flow={emptyFlow ? "true" : undefined}>
          {group.sections.map((item) => <section key={item.id} className="thesis-flow-section" data-thesis-flow-section={item.id} data-thesis-section-mode={item.mode} data-thesis-fixed-content={item.fixedContent ? "true" : undefined} data-thesis-special-page={item.specialPage ? item.type : undefined}>{renderBody(item)}</section>)}
          {pageNotes ? Array.from({ length: footnotes?.tail || 0 }, (_, index) => <div key={`tail-${index}`} className="thesis-footnote-tail" aria-hidden="true" />) : null}
        </div>
      </article>
    </div>
  </div>;
}
