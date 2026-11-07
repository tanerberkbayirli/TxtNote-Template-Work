/**
 * Rich-text note body. contentEditable with right-click format menu.
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { citationWithSpacing, escapeWritingText } from '../../lib/thesisWriting.js';
import { citationAnalysisText, citationInsertionOffset, citationTextPosition } from '../../lib/citationPlacement.js';

import { createTextHistory } from "../../lib/textHistory";
import { paragraphAtCaret } from "../../lib/paragraphAtCaret.js";
import { AcademicImageControls } from "./AcademicImageControls";
import { BODY_PLACEHOLDER } from "../../config/strings";
import { coerceSizeId, FORMAT_COLORS, FORMAT_HIGHLIGHTS, normalizeHex } from "../../config/format";
import { useIsomorphicLayoutEffect } from "../../hooks/useIsomorphicLayoutEffect";
import {
  applyMarkupAtCaret,
  applyCodeAtCaret,
  applyCodeOpenAtCaret,
  applyMathAtCaret,
  applyMathOpenAtCaret,
  applySentenceBreakAtCaret,
  deleteSelectionAcrossBlocks,
  ensureHtml,
  htmlToPlainText,
  insertMarkupAtSelection,
  insertHtmlAtSelection,
  insertBlockHtmlAtSelection,
  insertNodeAtSelection,
  wrapSelectionWithLink,
  insertPlainAtCaret,
  isCaretAtBodyStart,
  focusEditableStart,
} from "../../lib/richText";
import {
  bindCodeBlockEvents,
  beginCodeEdit,
  convertRawCodeInRoot,
  createAcademicCodeElement,
  createCodeElement,
  ensureCodeCaretPads,
  flattenCodeBlocksForAcademic,
  isCodeBlockEl,
  isEventInCodeBlock,
  renderCodeInRoot,
} from "../../lib/codeBlock";
import {
  bindMathFormulaClicks,
  beginMathEdit,
  convertRawMathInRoot,
  createMathElement,
  ensureMathCaretPads,
  firstMeaningfulChild,
  isEventInMathBlock,
  isMathFormulaEl,
  placeCaretAfterMath,
  renderMathInRoot,
} from "../../lib/mathFormula";
import { cn } from "../../lib/cn";
import { isSearchFlashMutating, unwrapNoteSearchFlashes } from "../../lib/noteSearch";
import { applyFormatHotkey, isSelectAllHotkey } from "./formatHotkeys";
import { FormatContextMenu } from "./FormatContextMenu";
import { useFormatMenu } from "./useFormatMenu";
import { isEventInAcademicBlock } from "../../lib/academicCite";
import { htmlWithoutPageGaps, moveCaretAcrossPageGap, snapSelectionOutOfLockedNodes, snapSelectionOutOfPageGaps } from "../../lib/academicLayout";
import {
  decorateAcademicDom,
  ensureTableCaretPads,
  endnoteHtml,
  footnoteHtml,
  headingHtml,
  pageBreakHtml,
  placeCaretAfterTable,
  tableHtml,
  tocHtml,
  xrefHtml,
} from "../../lib/academicDocument";
import {
  isCaretAtAlignBlockStart,
  mergeAlignBlockWithPrevious,
  splitAlignBlockAtCaret,
} from "../../lib/richTextAlign";
import { sameThesisEditorProjection, thesisSourceHtml } from "../../../../../engine/src/sourceHtml.js";

/** Where a citation goes for the caret `range` (citationPlacement.js rules): the collapsed DOM range plus the space/full-stop flags. */
function citationSpot(root, range, placement) {
  if (!range || !root.contains(range.startContainer)) return null;
  const element = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
  const block = element?.closest?.('p,h1,h2,h3,h4,h5,h6,li,td,th') || root;
  const doc = root.ownerDocument;
  const head = doc.createRange(); head.selectNodeContents(block); head.setEnd(range.startContainer, range.startOffset);
  const { offset, space, stop } = citationInsertionOffset(citationAnalysisText(block), head.toString().length, placement);
  const target = citationTextPosition(block, offset);
  const at = doc.createRange(); at.setStart(target.node, target.offset); at.collapse(true);
  return { at, space, stop };
}

/** A collapsed range has no box at an element boundary: fall back to the edge of the neighbouring character or element. */
function collapsedRangeRect(at) {
  const own = at.getClientRects()[0];
  if (own && own.height) return { left: own.left, top: own.top, height: own.height };
  const { startContainer: node, startOffset: offset } = at;
  const probe = node.ownerDocument.createRange();
  if (node.nodeType === 3 && offset > 0) { probe.setStart(node, offset - 1); probe.setEnd(node, offset); }
  else if (node.nodeType === 3 && offset < node.length) { probe.setStart(node, offset); probe.setEnd(node, offset + 1); }
  else {
    const before = node.childNodes?.[offset - 1], after = node.childNodes?.[offset];
    if (!before && !after) return null;
    probe.selectNode(before || after);
    const box = probe.getBoundingClientRect();
    return box.height ? { left: before ? box.right : box.left, top: box.top, height: box.height } : null;
  }
  const rects = probe.getClientRects();
  const box = node.nodeType === 3 && offset > 0 ? rects[rects.length - 1] : rects[0];
  if (!box || !box.height) return null;
  return { left: node.nodeType === 3 && offset > 0 ? box.right : box.left, top: box.top, height: box.height };
}

/**
 * @param {{
 *   content: string,
 *   onContentChange: (html: string, reason?: string) => void,
 *   onFocus?: () => void,
 *   onBlur?: () => void,
 *   onMoveToTitle?: () => void,
 *   className?: string,
 * }} props
 */
export const RichTextBody = forwardRef(({
  content,
  onContentChange,
  onFocus,
  onBlur,
  onMoveToTitle,
  className,
  compact = false,
  academic = false,
  paragraphSemantics = false,
  emptyHeadingOnInsert = false,
  // false: image controls position against the page surface (a paged thesis flow is fragmented).
  positionedFrame = true,
  onFormatChange,
  ariaLabel = "Not içeriği",
}, ref) => {
  const bodyRef = useRef(null);
  // null, not `content`: the first layout pass has to write the saved note into
  // the empty div, otherwise reopening a note shows a blank page.
  const lastContentRef = useRef(null);
  const isInternalChange = useRef(false);
  const [isEmpty, setIsEmpty] = useState(() => !htmlToPlainText(content).trim());

  const history = useMemo(() => createTextHistory({ limit: 100, windowMs: 500 }), []);
  const historyRestoring = useRef(false);

  const fitBody = useCallback(() => {
    const body = bodyRef.current;
    if (!body) return;
    if (academic) {
      body.style.height = "";
      return;
    }
    body.style.height = "auto";
    body.style.height = `${body.scrollHeight}px`;
  }, [academic]);

  const emitChange = useCallback((reason = "input") => {
    const body = bodyRef.current;
    if (!body) return;
    unwrapNoteSearchFlashes(body);
    if (academic) decorateAcademicDom(body, { captions: !paragraphSemantics, explicitHeadings: paragraphSemantics, headingNumbers: !paragraphSemantics, preserveImportedTables: paragraphSemantics });
    const raw = htmlWithoutPageGaps(body.innerHTML);
    const html = paragraphSemantics ? thesisSourceHtml(raw) : raw;
    if (!historyRestoring.current) {
      history.commit({ html, sel: currentOffsets(body) }, { typing: reason === "input" });
    }
    isInternalChange.current = true;
    lastContentRef.current = html;
    setIsEmpty(!htmlToPlainText(html).trim());
    onContentChange(html, reason);
    fitBody();
  }, [academic, paragraphSemantics, onContentChange, fitBody]);

  const {
    menu,
    activeFormat,
    applyPatch,
    applyAlign,
    toggleStyle,
    toggleStyleFromMenu,
    clearLineDecorations,
    clearLineDecorationsFromMenu,
    closeMenu,
    handleContextMenu,
    handleMouseUp,
    rememberAll,
    rememberLiveSelection,
    peekRange,
    withRange,
  } = useFormatMenu(bodyRef, emitChange);

  useEffect(() => { onFormatChange?.(activeFormat); }, [activeFormat, onFormatChange]);

  const stepHistory = useCallback((direction) => {
    const body = bodyRef.current;
    if (!body) return false;
    const state = direction < 0 ? history.undo() : history.redo();
    if (!state) return false;
    body.innerHTML = ensureHtml(state.html, academic ? { plainCode: true } : undefined);
    convertRawMathInRoot(body);
    convertRawCodeInRoot(body, academic ? { plain: true } : undefined);
    if (academic) flattenCodeBlocksForAcademic(body);
    ensureMathCaretPads(body);
    ensureCodeCaretPads(body);
    body.focus({ preventScroll: true });
    restoreSelectionTextOffsets(body, state.sel);
    historyRestoring.current = true;
    try { emitChange("history"); } finally { historyRestoring.current = false; }
    const afterWidgets = academic ? renderMathInRoot(body) : Promise.all([renderMathInRoot(body), renderCodeInRoot(body)]);
    Promise.resolve(afterWidgets).then(() => { if (bodyRef.current === body) fitBody(); });
    return true;
  }, [academic, emitChange, fitBody, history]);

  // Selection before the next edit, so Undo puts the caret back where the user was.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return undefined;
    const remember = () => history.setSelection(currentOffsets(body));
    body.addEventListener("keyup", remember);
    body.addEventListener("mouseup", remember);
    body.addEventListener("focus", remember);
    return () => {
      body.removeEventListener("keyup", remember);
      body.removeEventListener("mouseup", remember);
      body.removeEventListener("focus", remember);
    };
  }, [history]);

  useImperativeHandle(ref, () => ({
    /** size: preset id ("body", "pt12"), a number (13.5) or "pt13.5" — clamped 1–400, rounded to 0.5. */
    applySize: (size) => { const id = coerceSizeId(size); if (id) applyPatch({ size: id }); },
    /** color: preset id ("red") or "#rrggbb". */
    applyTextColor: (color) => { const next = FORMAT_COLORS.some((c) => c.id === color) ? color : normalizeHex(color); if (next) applyPatch({ color: next }); },
    /** color: preset id ("yellow"), "#rrggbb", or empty/"none" to remove. */
    applyHighlight: (color) => applyPatch({ highlight: FORMAT_HIGHLIGHTS.some((c) => c.id === color) ? color : normalizeHex(color) || "none" }),
    clearFormatting: () => applyPatch({ clearFormatting: true }),
    /** Paragraph indent level is source markup, measured in 5 mm steps by all thesis renderers. */
    changeIndent: (direction) => {
      const delta = direction === "increase" || direction === 1 ? 1 : direction === "decrease" || direction === -1 ? -1 : 0;
      if (!delta) return;
      withRange((root, range) => {
        if (!range) return;
        let paragraphs = [...root.querySelectorAll("p,h1,h2,h3,h4,h5,h6,blockquote")]
          .filter((node) => {
            try { return range.collapsed ? node.contains(range.startContainer) : range.intersectsNode(node); }
            catch { return false; }
          });
        if (!paragraphs.length && !root.querySelector("table,figure,img,ul,ol,pre,.academic-figure,.academic-table-wrap,.math-formula,.academic-code,.code-block")) {
          const inlineOnly = [...root.childNodes].every((node) => node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && /^(SPAN|A|B|STRONG|I|EM|U|S|DEL|BR)$/.test(node.tagName)));
          if (inlineOnly && root.childNodes.length) {
            const offsets = selectionTextOffsets(root, range);
            const paragraph = root.ownerDocument.createElement("p");
            while (root.firstChild) paragraph.appendChild(root.firstChild);
            root.appendChild(paragraph);
            paragraphs = [paragraph];
            restoreSelectionTextOffsets(root, offsets);
          }
        }
        for (const paragraph of paragraphs) {
          const current = Math.max(0, Math.min(8, Number(paragraph.getAttribute("data-txt-indent")) || 0));
          const next = Math.max(0, Math.min(8, current + delta));
          if (next) paragraph.setAttribute("data-txt-indent", String(next));
          else paragraph.removeAttribute("data-txt-indent");
        }
      });
    },
    applyAlign,
    toggleStyle,
    clearLineDecorations,
    rememberSelection: rememberLiveSelection,
    insertHtml: (html) => {
      withRange((root) => insertHtmlAtSelection(html, root));
      const body = bodyRef.current;
      if (body) {
        if (academic) decorateAcademicDom(body, { captions: !paragraphSemantics, explicitHeadings: paragraphSemantics, headingNumbers: !paragraphSemantics, preserveImportedTables: paragraphSemantics });
        fitBody();
      }
      emitChange("insert");
    },
    insertInlineCitation: (text) => {
      withRange((root, range) => {
        if (!range) return;
        const element = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
        const block = element.closest?.('p,h1,h2,h3,h4,h5,h6,li,td,th') || root;
        const before = document.createRange(); before.selectNodeContents(block); before.setEnd(range.startContainer, range.startOffset);
        const endElement = range.endContainer.nodeType === 1 ? range.endContainer : range.endContainer.parentElement;
        const endBlock = endElement.closest?.('p,h1,h2,h3,h4,h5,h6,li,td,th') || root;
        const after = document.createRange(); after.selectNodeContents(endBlock); after.setStart(range.endContainer, range.endOffset);
        insertHtmlAtSelection(escapeWritingText(citationWithSpacing(text, before.toString(), after.toString())), root);
      });
      emitChange('insert');
    },
    insertHeading: (level) => {
      withRange((root) => {
        const selected = window.getSelection()?.toString().trim();
        insertHtmlAtSelection(headingHtml(level, selected || (emptyHeadingOnInsert ? "" : "Yeni başlık")), root);
        decorateAcademicDom(root, { captions: !paragraphSemantics, explicitHeadings: paragraphSemantics, headingNumbers: !paragraphSemantics, preserveImportedTables: paragraphSemantics });
      });
      emitChange("insert");
    },
    /** Normal / heading for the block at the caret; same markup as insertHeading. */
    setBlockType: (level, paragraphStyle = "") => {
      const target = Math.min(6, Math.max(0, Number(level) || 0));
      withRange((root, range) => {
        const anchor = range?.startContainer;
        const element = anchor?.nodeType === 1 ? anchor : anchor?.parentElement;
        const heading = paragraphSemantics ? paragraphAtCaret(root, range) : element?.closest?.("h1,h2,h3,h4,h5,h6");
        if (heading && heading !== root && root.contains(heading)) {
          const doc = root.ownerDocument;
          const next = doc.createElement(target ? `h${target}` : "p");
          if (target) {
            for (const { name, value } of [...heading.attributes]) {
              if (name !== "class" && name !== "data-academic-heading" && name !== "data-number" && name !== "data-thesis-number" && name !== "data-thesis-style") next.setAttribute(name, value);
            }
            const kept = [...heading.classList].filter((name) => !/^academic-h\d?$/.test(name));
            next.className = [...kept, "academic-h", `academic-h${target}`].join(" ");
            next.setAttribute("data-academic-heading", String(target));
          }
          // A named paragraph style (template typography.paragraphStyles) is source markup on a plain <p>.
          if (!target && paragraphStyle) next.setAttribute("data-thesis-style", paragraphStyle);
          const caret = range ? { node: range.startContainer, offset: range.startOffset } : null;
          while (heading.firstChild) next.appendChild(heading.firstChild);
          if (!next.firstChild) next.appendChild(doc.createElement("br"));
          heading.replaceWith(next);
          const selection = doc.getSelection();
          const place = doc.createRange();
          if (caret && caret.node !== heading && next.contains(caret.node)) place.setStart(caret.node, Math.min(caret.offset, caret.node.nodeType === 3 ? caret.node.length : caret.node.childNodes.length));
          else place.selectNodeContents(next);
          place.collapse(caret ? true : false);
          selection?.removeAllRanges();
          selection?.addRange(place);
          decorateAcademicDom(root, { captions: !paragraphSemantics, explicitHeadings: paragraphSemantics, headingNumbers: !paragraphSemantics, preserveImportedTables: paragraphSemantics });
          return;
        }
        if (!target) return;
        const selected = window.getSelection()?.toString().trim();
        const inserted = insertBlockHtmlAtSelection(headingHtml(target, selected || (emptyHeadingOnInsert ? "" : "Yeni başlık")), root);
        // Keep typing out of the new heading: continue in the text after it, or in a new paragraph.
        const doc = root.ownerDocument;
        const next = inserted?.nextSibling;
        let caretAt = null;
        if (next?.nodeType === 3 && next.data.replace(/[\s\u200B]/g, "")) caretAt = next;
        else if (inserted && (!next || (next.nodeType === 3 && !next.nextSibling))) {
          const paragraph = doc.createElement("p");
          paragraph.appendChild(doc.createElement("br"));
          next?.remove();
          inserted.after(paragraph);
          caretAt = paragraph;
        }
        if (caretAt) {
          const caret = doc.createRange();
          caret.setStart(caretAt, 0);
          caret.collapse(true);
          doc.getSelection()?.removeAllRanges();
          doc.getSelection()?.addRange(caret);
        }
        decorateAcademicDom(root, { captions: !paragraphSemantics, explicitHeadings: paragraphSemantics, headingNumbers: !paragraphSemantics, preserveImportedTables: paragraphSemantics });
      });
    },
    /** Bullet / numbered list as real ul/ol + li markup (browser list command, toggles off too). */
    toggleList: (ordered = false) => {
      withRange((root) => {
        const doc = root.ownerDocument;
        const sel = doc.getSelection();
        // The list command moves the line and resets the caret to its start. The text
        // itself is unchanged, so a caret inside text is put back by character index.
        let index = -1;
        if (sel?.rangeCount && sel.isCollapsed && sel.anchorNode?.nodeType === 3 && sel.anchorOffset > 0) {
          const before = doc.createRange();
          before.setStart(root, 0);
          before.setEnd(sel.anchorNode, sel.anchorOffset);
          index = before.toString().length;
        }
        const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
        const listAt = (node) => (node?.nodeType === 1 ? node : node?.parentElement)?.closest("ul,ol");
        const list = listAt(range?.startContainer);
        const tag = ordered ? "OL" : "UL";
        if (list && root.contains(list) && list.tagName !== tag && listAt(range.endContainer) === list) {
          // WebView2's native UL/OL conversion raises a style-src-attr violation
          // even on a text-only list under production CSP. Move the
          // existing items instead: their formatting and selection stay intact.
          const next = doc.createElement(tag.toLowerCase());
          for (const { name, value } of [...list.attributes]) {
            if (name !== "style" && name !== "start" && name !== "reversed" && name !== "type") next.setAttribute(name, value);
          }
          const start = { node: range.startContainer, offset: range.startOffset };
          const end = { node: range.endContainer, offset: range.endOffset };
          while (list.firstChild) next.appendChild(list.firstChild);
          list.replaceWith(next);
          const restored = doc.createRange();
          restored.setStart(start.node === list ? next : start.node, start.offset);
          restored.setEnd(end.node === list ? next : end.node, end.offset);
          sel.removeAllRanges();
          sel.addRange(restored);
        } else {
          doc.execCommand(ordered ? "insertOrderedList" : "insertUnorderedList", false);
        }
        if (index < 0 || !sel) return;
        const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (index <= node.length) {
            const range = doc.createRange();
            range.setStart(node, index);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            return;
          }
          index -= node.length;
        }
      });
    },
    insertParagraph: () => {
      withRange((root, range) => {
        const anchor = range?.startContainer;
        const element = anchor?.nodeType === 1 ? anchor : anchor?.parentElement;
        const block = element?.closest?.("h1,h2,h3,h4,h5,h6,p,blockquote,li,div");
        const paragraph = root.ownerDocument.createElement("p");
        paragraph.appendChild(root.ownerDocument.createElement("br"));
        if (block && block !== root && root.contains(block)) block.parentNode.insertBefore(paragraph, block.nextSibling);
        else root.appendChild(paragraph);
        const selection = root.ownerDocument.getSelection();
        const caret = root.ownerDocument.createRange();
        caret.selectNodeContents(paragraph);
        caret.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(caret);
      });
      emitChange("insert");
    },
    /** A linked citation at the end of the caret's sentence: before its full stop ("before") or after it ("after", footnotes). */
    insertCitation: (html, placement = "before") => {
      withRange((root, range) => {
        const spot = citationSpot(root, range, placement);
        if (!spot) return;
        const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(spot.at);
        insertHtmlAtSelection(`${spot.space ? " " : ""}${html}${spot.stop ? "." : ""}`, root);
      });
      emitChange('insert');
    },
    /** Viewport box of the point insertCitation would use now, without moving focus or the selection (null without a caret here). */
    citationCaretRect: (placement = "before") => {
      const root = bodyRef.current;
      const spot = root && citationSpot(root, peekRange(), placement);
      return spot ? collapsedRangeRect(spot.at) : null;
    },
    insertFootnote: (text) => {
      withRange((root) => insertHtmlAtSelection(footnoteHtml(text), root));
      emitChange("insert");
    },
    insertEndnote: (text) => {
      withRange((root) => insertHtmlAtSelection(endnoteHtml(text), root));
      emitChange("insert");
    },
    insertToc: () => {
      withRange((root) => insertHtmlAtSelection(tocHtml(), root));
      emitChange("insert");
    },
    insertPageBreak: () => {
      withRange((root) => insertHtmlAtSelection(pageBreakHtml(), root));
      emitChange("insert");
    },
    insertXref: (target) => {
      if (!target?.id) return;
      withRange((root) => insertHtmlAtSelection(xrefHtml(target.id, target.kind, target.label), root));
      emitChange("insert");
    },
    insertTable: (rows, cols, caption) => {
      withRange((root) => {
        const inserted = insertBlockHtmlAtSelection(tableHtml(rows, cols, caption), root);
        decorateAcademicDom(root, { captions: !paragraphSemantics, explicitHeadings: paragraphSemantics, headingNumbers: !paragraphSemantics, preserveImportedTables: paragraphSemantics });
        ensureTableCaretPads(root);
        placeCaretAfterTable(inserted, root);
      });
      emitChange("insert");
    },
    /** Caption kind of a figure (template captionKinds, e.g. "photo"); "" is a plain figure. Source markup, so it is saved. */
    setFigureKind: (figure, kind) => {
      const body = bodyRef.current;
      if (!body || !figure || !body.contains(figure)) return;
      if (kind) figure.setAttribute("data-caption-kind", kind); else figure.removeAttribute("data-caption-kind");
      emitChange("format");
    },
    /** Numbered (or not) display equation `math` (a `.math-formula--block` of this body); `data-eq-numbered` is source markup. */
    setEquationNumbered: (math, numbered) => {
      const body = bodyRef.current;
      if (!body || !math || !body.contains(math)) return;
      if (numbered) math.setAttribute("data-eq-numbered", "true"); else math.removeAttribute("data-eq-numbered");
      emitChange("format");
    },
    toggleEquationNumber: () => {
      const body = bodyRef.current;
      if (!body) return;
      const sel = window.getSelection();
      const node = sel?.anchorNode?.nodeType === 1 ? sel.anchorNode : sel?.anchorNode?.parentElement;
      const math = node?.closest?.(".math-formula--block, .math-formula[data-display='block']") || body.querySelector(".math-formula--block");
      if (!math) return;
      const on = math.getAttribute("data-eq-numbered") === "true";
      if (on) math.removeAttribute("data-eq-numbered");
      else math.setAttribute("data-eq-numbered", "true");
      decorateAcademicDom(body, { captions: !paragraphSemantics, explicitHeadings: paragraphSemantics, headingNumbers: !paragraphSemantics, preserveImportedTables: paragraphSemantics });
      emitChange("format");
    },
    xrefTargets: () => {
      const body = bodyRef.current;
      if (!body) return [];
      decorateAcademicDom(body, { captions: !paragraphSemantics, explicitHeadings: paragraphSemantics, headingNumbers: !paragraphSemantics, preserveImportedTables: paragraphSemantics });
      const items = [];
      body.querySelectorAll("h1.academic-h, h2.academic-h, h3.academic-h").forEach((node) => {
        if (node.hasAttribute("data-unnumbered") || node.closest(".academic-toc")) return;
        const id = node.getAttribute("data-academic-id");
        const number = node.getAttribute("data-number");
        if (!id) return;
        items.push({ id, kind: "heading", label: `${number ? `${number} ` : ""}${node.textContent}`.trim() });
      });
      body.querySelectorAll("[data-academic-id][data-kind]").forEach((node) => {
        const kind = node.getAttribute("data-kind");
        const id = node.getAttribute("data-academic-id");
        const number = node.getAttribute("data-number");
        if (!id || !kind) return;
        const label =
          kind === "figure"
            ? `Şekil ${number}`
            : kind === "table"
              ? `Tablo ${number}`
              : kind === "equation"
                ? `Denklem (${number})`
                : node.textContent?.trim();
        items.push({ id, kind, label });
      });
      return items;
    },
    insertLink: (href, text) => {
      withRange((root) => wrapSelectionWithLink(href, text, root));
    },
    insertFormula: (display = true, numbered = false) => {
      withRange((root) => {
        const el = createMathElement("", display);
        if (display && numbered) el.setAttribute("data-eq-numbered", "true");
        insertNodeAtSelection(el, root);
        beginMathEdit(el);
      });
      const body = bodyRef.current;
      if (body) fitBody();
    },
    insertCode: (language = "auto") => {
      withRange((root) => {
        if (academic) {
          const el = createAcademicCodeElement("");
          insertNodeAtSelection(el, root);
          ensureCodeCaretPads(root);
          const sel = window.getSelection();
          if (sel) {
            const inner = el.firstChild || el.appendChild(document.createTextNode(""));
            const range = document.createRange();
            range.setStart(inner, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }
          return;
        }
        const el = createCodeElement("", language);
        insertNodeAtSelection(el, root);
        beginCodeEdit(el);
      });
      const body = bodyRef.current;
      if (body) fitBody();
    },
    getHtml: () => paragraphSemantics ? thesisSourceHtml(htmlWithoutPageGaps(bodyRef.current?.innerHTML ?? "")) : htmlWithoutPageGaps(bodyRef.current?.innerHTML ?? ""),
    openFormatMenu: (event) => handleContextMenu(event),
    undo: () => stepHistory(-1),
    redo: () => stepHistory(1),
    canUndo: () => history.canUndo(),
    canRedo: () => history.canRedo(),
    activeFormat,
  }), [stepHistory, history, activeFormat, applyAlign, applyPatch, clearLineDecorations, emitChange, emptyHeadingOnInsert, paragraphSemantics, fitBody, handleContextMenu, rememberLiveSelection, toggleStyle, withRange]);

  useIsomorphicLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    if (isInternalChange.current && (content === lastContentRef.current || (paragraphSemantics && sameThesisEditorProjection(content, lastContentRef.current)))) {
      lastContentRef.current = content;
      isInternalChange.current = false;
      return;
    }
    if (content !== lastContentRef.current) {
      body.innerHTML = ensureHtml(content, academic ? { plainCode: true } : undefined);
      lastContentRef.current = content;
      history.reset({ html: content, sel: null });
      setIsEmpty(!htmlToPlainText(content).trim());
      convertRawMathInRoot(body);
      convertRawCodeInRoot(body, academic ? { plain: true } : undefined);
      if (academic) flattenCodeBlocksForAcademic(body);
      ensureMathCaretPads(body);
      ensureCodeCaretPads(body);
      fitBody();
      const afterWidgets = academic ? renderMathInRoot(body) : Promise.all([renderMathInRoot(body), renderCodeInRoot(body)]);
      Promise.resolve(afterWidgets).then(() => {
        if (bodyRef.current === body) fitBody();
      });
    }
    isInternalChange.current = false;
  }, [content, fitBody]);

  useEffect(() => {
    window.addEventListener("resize", fitBody);
    return () => window.removeEventListener("resize", fitBody);
  }, [fitBody]);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return undefined;
    const unbindMath = bindMathFormulaClicks(body, {
      onChange: () => emitChange("input"),
      onFit: fitBody,
    });
    if (academic) return () => unbindMath();
    const unbindCode = bindCodeBlockEvents(body, {
      onChange: () => emitChange("input"),
      onFit: fitBody,
    });
    return () => {
      unbindMath();
      unbindCode();
    };
  }, [academic, emitChange, fitBody]);

  // Deleting or typing over a multi-line selection: Chromium would merge the blocks
  // with `<span style>` (a CSP violation); join them in the DOM instead.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return undefined;
    const onBeforeInput = (event) => {
      if (!MULTI_BLOCK_EDITS.has(event.inputType) || !deleteSelectionAcrossBlocks(body)) return;
      event.preventDefault();
      if (event.inputType === "insertText" && event.data) document.execCommand("insertText", false, event.data);
      else emitChange("input");
    };
    body.addEventListener("beforeinput", onBeforeInput);
    return () => body.removeEventListener("beforeinput", onBeforeInput);
  }, [emitChange]);

  // Shorthand is rewritten right after the keystroke that completes it:
  // "  " → ". ", **, _, ~~ or [TAB] into formatting, and ##math## / ##code## into blocks.
  const handleInput = useCallback((event) => {
    if (isSearchFlashMutating()) return;
    if (isEventInAcademicBlock(event)) {
      emitChange();
      return;
    }
    if (event.target.closest?.(".academic-code")) {
      emitChange();
      return;
    }
    if (isEventInCodeBlock(event) || isEventInMathBlock(event)) return;
    const body = bodyRef.current;
    if (body) snapSelectionOutOfLockedNodes(body);
    if (academic && body) snapSelectionOutOfPageGaps(body);
    if (body && selectionClosest(body, "table")) {
      emitChange();
      return;
    }
    if (body) {
      applySentenceBreakAtCaret(body);
      applyMarkupAtCaret(body);
      const mathChanged = applyMathAtCaret(body) || convertRawMathInRoot(body);
      const codeChanged =
        applyCodeAtCaret(body, academic ? { plain: true } : undefined) ||
        convertRawCodeInRoot(body, academic ? { plain: true } : undefined);
      if (mathChanged || codeChanged) {
        emitChange();
        const afterWidgets = academic
          ? renderMathInRoot(body)
          : Promise.all([renderMathInRoot(body), renderCodeInRoot(body)]);
        Promise.resolve(afterWidgets).then(() => {
          if (bodyRef.current === body) fitBody();
        });
        return;
      }
    }
    emitChange();
  }, [academic, emitChange, fitBody]);

  const handlePaste = useCallback(
    (event) => {
      if (isEventInCodeBlock(event) || isEventInMathBlock(event) || isEventInAcademicBlock(event)) return;
      const body = bodyRef.current;
      if (academic && body) snapSelectionOutOfPageGaps(body);
      const plain = event.clipboardData?.getData("text/plain");
      if (!plain) return;

      event.preventDefault();
      insertMarkupAtSelection(plain, body ? { root: body, plainCode: academic } : { plainCode: academic });
      if (body) {
        convertRawMathInRoot(body);
        convertRawCodeInRoot(body, academic ? { plain: true } : undefined);
        if (academic) flattenCodeBlocksForAcademic(body);
        ensureMathCaretPads(body);
        ensureCodeCaretPads(body);
        const sel = window.getSelection();
        const caretInText =
          sel?.anchorNode?.nodeType === Node.TEXT_NODE && body.contains(sel.anchorNode);
        if (!caretInText) {
          const blocks = body.querySelectorAll(".math-formula, .code-block, .academic-code");
          const last = blocks[blocks.length - 1];
          if (last) placeCaretAfterMath(last);
        }
      }
      emitChange("paste");
      if (body) {
        const afterWidgets = academic
          ? renderMathInRoot(body)
          : Promise.all([renderMathInRoot(body), renderCodeInRoot(body)]);
        Promise.resolve(afterWidgets).then(() => {
          if (bodyRef.current === body) {
            ensureMathCaretPads(body);
            ensureCodeCaretPads(body);
            fitBody();
          }
        });
      }
    },
    [academic, emitChange, fitBody],
  );

  const handleKeyDown = useCallback(
    (event) => {
      const body = bodyRef.current;
      if (!body) return;
      if ((event.ctrlKey || event.metaKey) && !event.altKey) {
        const k = event.key.toLowerCase();
        if (k === "z" || k === "y") {
          event.preventDefault();
          stepHistory(k === "y" || event.shiftKey ? 1 : -1);
          return;
        }
      }
      if (event.target.closest?.(".academic-code")) {
        if (event.key === "Tab") {
          event.preventDefault();
          insertPlainAtCaret("\t");
          emitChange("input");
          return;
        }
        if (event.key === "Enter" && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          insertPlainAtCaret("\n");
          emitChange("input");
        }
        return;
      }
      snapSelectionOutOfLockedNodes(body);
      if (selectionClosest(body, "table")) return;
      if (isEventInCodeBlock(event) || isEventInMathBlock(event) || isEventInAcademicBlock(event)) return;

      if (isSelectAllHotkey(event)) rememberAll();
      // Like the toolbar: selectionchange can still be queued behind a Shift+Arrow selection.
      if (event.ctrlKey || event.metaKey) rememberLiveSelection();
      if (applyFormatHotkey(event, toggleStyle)) return;

      if (academic && (event.key === "Backspace" || event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        snapSelectionOutOfPageGaps(body);
        const backward = event.key !== "ArrowRight";
        if (moveCaretAcrossPageGap(body, backward)) {
          event.preventDefault();
          return;
        }
      }

      if (event.key === "Enter" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (event.isComposing || event.keyCode === 229) return;
        // execCommand below fires no beforeinput, so a multi-line selection is removed here.
        deleteSelectionAcrossBlocks(body);
        if (applyMathOpenAtCaret(body) || applyCodeOpenAtCaret(body, academic ? { plain: true } : undefined)) {
          event.preventDefault();
          emitChange("input");
          fitBody();
          return;
        }
        // Inside a list item the browser splits the item; Enter on an empty item leaves the list.
        const item = event.shiftKey ? null : selectionClosest(body, "li");
        if (item) {
          if (item.textContent.replace(/[\s\u200B]/g, "") || item.querySelector("img, table, figure, .math-formula")) return;
          event.preventDefault();
          item.replaceChildren(document.createElement("br"));
          const caret = document.createRange();
          caret.setStart(item, 0);
          caret.collapse(true);
          window.getSelection()?.removeAllRanges();
          window.getSelection()?.addRange(caret);
          document.execCommand(item.closest("ul, ol")?.tagName === "OL" ? "insertOrderedList" : "insertUnorderedList", false);
          emitChange("input");
          return;
        }
        event.preventDefault();
        if (paragraphSemantics) {
          const before = selectionClosest(body, "p,div,h1,h2,h3,h4,h5,h6,blockquote");
          const classes = before && before !== body ? [...before.classList].filter((name) => !/^academic-h|^fmt-size-/.test(name)).join(" ") : "";
          document.execCommand("defaultParagraphSeparator", false, "p");
          if (!before || before === body || before.tagName === "DIV") document.execCommand("formatBlock", false, "p");
          document.execCommand(event.shiftKey ? "insertLineBreak" : "insertParagraph", false);
          if (!event.shiftKey) {
            const next = selectionClosest(body, "p,div,h1,h2,h3,h4,h5,h6,blockquote");
            if (next && next !== body) {
              if (/^H[1-6]$/.test(next.tagName)) document.execCommand("formatBlock", false, "p");
              const paragraph = selectionClosest(body, "p");
              if (paragraph && classes) paragraph.className = classes;
            }
          }
          emitChange("input");
          return;
        }
        if (!event.shiftKey && splitAlignBlockAtCaret(body)) {
          emitChange("input");
          return;
        }
        insertPlainAtCaret(event.shiftKey || academic ? "\n" : "\n\n");
        emitChange("input");
        return;
      }

      if (event.key === "ArrowUp" && isCaretAtBodyStart(body)) {
        event.preventDefault();
        onMoveToTitle?.();
        return;
      }

      if (event.key === "Backspace" && isCaretAtAlignBlockStart(body) && !isCaretAtBodyStart(body)) {
        if (mergeAlignBlockWithPrevious(body)) {
          event.preventDefault();
          emitChange("input");
          return;
        }
      }

      if (event.key === "Backspace" && isCaretAtBodyStart(body)) {
        const first = firstMeaningfulChild(body);
        if (isMathFormulaEl(first) || isCodeBlockEl(first)) {
          event.preventDefault();
          first.remove();
          ensureMathCaretPads(body);
          ensureCodeCaretPads(body);
          emitChange("input");
          return;
        }
        event.preventDefault();
        onMoveToTitle?.();
      }
    },
    [academic, paragraphSemantics, stepHistory, emitChange, fitBody, onMoveToTitle, rememberAll, rememberLiveSelection, toggleStyle],
  );

  return (
    <>
      <div style={academic && positionedFrame ? { position: "relative" } : undefined}>
      <div
        ref={bodyRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        data-placeholder={BODY_PLACEHOLDER}
        data-empty={isEmpty ? "true" : undefined}
        onInput={handleInput}
        onPaste={handlePaste}
        onClick={(event) => {
          const link = event.target?.closest?.("a.academic-link");
          if (link && (event.ctrlKey || event.metaKey)) {
            const href = link.getAttribute("href");
            if (href) {
              event.preventDefault();
              window.open(href, "_blank", "noopener,noreferrer");
            }
            return;
          }
          if (academic && bodyRef.current) snapSelectionOutOfLockedNodes(bodyRef.current);
        }}
        onKeyDown={handleKeyDown}
        onMouseUp={(event) => {
          if (isEventInCodeBlock(event) || isEventInMathBlock(event) || isEventInAcademicBlock(event)) return;
          handleMouseUp(event);
        }}
        onContextMenu={(event) => {
          if (isEventInCodeBlock(event) || isEventInMathBlock(event) || isEventInAcademicBlock(event)) return;
          handleContextMenu(event);
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        className={cn(
          "rich-text-body block w-full border-0 bg-transparent outline-none",
          academic ? "overflow-visible" : "overflow-hidden",
          compact ? "min-h-16 px-0 pb-3 pt-1 text-[15px] leading-8" : "min-h-full px-6 pb-24 pt-1 text-[15px] leading-8 sm:px-10",
          "text-neutral-800 caret-neutral-900",
          "dark:text-neutral-200 dark:caret-neutral-100",
          className,
        )}
      />

      {academic && <AcademicImageControls rootRef={bodyRef} onChange={emitChange} />}
      </div>
      <FormatContextMenu
        isOpen={menu.isOpen}
        position={{ x: menu.x, y: menu.y }}
        activeFormat={activeFormat}
        showAlign
        showPoints={academic}
        onPickSize={(size) => applyPatch({ size })}
        onPickColor={(color) => applyPatch({ color })}
        onPickAlign={applyAlign}
        onToggleStyle={toggleStyleFromMenu}
        onClearLines={clearLineDecorationsFromMenu}
        onClose={closeMenu}
      />
    </>
  );
});

/** Focus helper used when handing off from the title field. */
RichTextBody.focusStart = focusEditableStart;
RichTextBody.displayName = "RichTextBody";

/** Native edits that first delete the selection (typing replaces it). */
const MULTI_BLOCK_EDITS = new Set([
  "deleteContentBackward", "deleteContentForward", "deleteWordBackward", "deleteWordForward",
  "deleteSoftLineBackward", "deleteSoftLineForward", "deleteHardLineBackward", "deleteHardLineForward",
  "deleteByCut", "insertText",
]);

function selectionClosest(root, selector) {
  const sel = window.getSelection();
  if (!sel?.anchorNode || (root && !root.contains(sel.anchorNode))) return null;
  const el = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
  return el?.closest?.(selector) ?? null;
}

function currentOffsets(root) {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !root.contains(sel.anchorNode)) return null;
  return selectionTextOffsets(root, sel.getRangeAt(0));
}

function selectionTextOffsets(root, range) {
  const offset = (container, position) => {
    const before = root.ownerDocument.createRange();
    before.selectNodeContents(root);
    before.setEnd(container, position);
    return before.toString().length;
  };
  try { return { start: offset(range.startContainer, range.startOffset), end: offset(range.endContainer, range.endOffset) }; }
  catch { return null; }
}

function restoreSelectionTextOffsets(root, offsets) {
  if (!offsets) return;
  const doc = root.ownerDocument;
  const nodes = [];
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) nodes.push(node);
  const point = (position) => {
    let remaining = position;
    for (const node of nodes) {
      if (remaining <= node.data.length) return [node, remaining];
      remaining -= node.data.length;
    }
    const last = nodes.at(-1);
    return last ? [last, last.data.length] : [root, root.childNodes.length];
  };
  const [startNode, startOffset] = point(offsets.start);
  const [endNode, endOffset] = point(offsets.end);
  const range = doc.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  const selection = doc.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

