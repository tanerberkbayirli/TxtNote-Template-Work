import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from '../../../../tools/node_modules/playwright/index.mjs';
import { plainThesisText, thesisSourceHtml } from '../../../../../TxtNote/frontend/src/thesis/sourceHtml.js';
import { wordJustifyFitBudget, wordJustifyLineFits, wordJustifyLines } from './wordJustifyModel.js';

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
try {
  const page = await browser.newPage({ viewport: { width: 600, height: 400 } });
  await page.setContent(`<!doctype html><style>
    #editor { width: 190px; font: 16px Arial; white-space: pre-wrap; }
    #editor p { margin: 0; }
    thesis-line { display: block; white-space: pre-wrap; font-kerning: none; }
    thesis-line[data-justify="true"] { text-align: justify; text-align-last: justify; }
  </style><div id="editor" contenteditable="true"><p>Alpha <strong>beta</strong> gamma&nbsp;delta epsilon zeta eta theta iota kappa lambda mu.</p></div>`);
  const root = page.locator('#editor'), paragraph = root.locator('p');
  const sourceBefore = thesisSourceHtml(await root.evaluate(el => el.innerHTML));
  const semanticTextBefore = plainThesisText(sourceBefore);
  const paragraphCountBefore = (sourceBefore.match(/<p\b/gi) || []).length;
  const strongRunTextBefore = await paragraph.locator('strong').textContent();
  await page.addScriptTag({ content: [
    `window.wordJustifyFitBudget = ${wordJustifyFitBudget.toString()};`,
    `window.wordJustifyLineFits = ${wordJustifyLineFits.toString()};`,
    `window.wordJustifyLines = ${wordJustifyLines.toString()};`,
  ].join('\n') });
  await page.evaluate(() => {
    const p = document.querySelector('#editor p');
    const beta = p.querySelector('strong').firstChild;
    const selection = getSelection(), range = document.createRange();
    selection.setBaseAndExtent(beta, 2, p.firstChild, 2);
    const offsetAt = (node, offset) => { const r = document.createRange(); r.selectNodeContents(p); r.setEnd(node, offset); return r.toString().length; };
    const pointAt = (offset) => {
      let left = offset;
      const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) { const node = walker.currentNode; if (left <= node.length) return { node, offset: left }; left -= node.length; }
      const last = p.lastChild; return { node: last, offset: last?.textContent?.length || 0 };
    };
    const saveSelection = () => ({ anchor: offsetAt(selection.anchorNode, selection.anchorOffset), focus: offsetAt(selection.focusNode, selection.focusOffset) });
    const restoreSelection = ({ anchor, focus }) => { const a = pointAt(anchor), f = pointAt(focus); selection.setBaseAndExtent(a.node, a.offset, f.node, f.offset); };
    const unwrap = () => {
      for (const line of p.querySelectorAll(':scope > thesis-line')) line.replaceWith(...line.childNodes);
      p.normalize();
    };
    const applyModel = () => {
      const text = p.textContent || '';
      const tokens = [...text.matchAll(/[^ \t\r\n]+/g)].map(match => ({ text: match[0], start: match.index, end: match.index + match[0].length }));
      if (!tokens.length) return [];
      const style = getComputedStyle(p), canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
      ctx.font = style.font; if ('fontKerning' in ctx) ctx.fontKerning = 'none';
      const widths = tokens.map(token => ctx.measureText(token.text).width * 0.75);
      const spacePt = ctx.measureText(' ').width * 0.75;
      const measurePt = p.getBoundingClientRect().width * 0.75;
      const lines = window.wordJustifyLines(tokens.map((token, i) => ({ ...token, width: widths[i] })), {
        availableWidth: measurePt, spaceWidth: spacePt, breakBefore: tokens.map((_, i) => i > 0),
      });
      const lineSpecs = lines.map((line, i) => {
        const first = tokens[line.start], last = tokens[line.end - 1];
        return { start: first.start, end: i + 1 < lines.length ? tokens[lines[i + 1].start].start : text.length, line, isLast: i + 1 === lines.length };
      });
      const locate = (offset) => {
        let left = offset;
        const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) { const node = walker.currentNode; if (left <= node.length) return { node, offset: left }; left -= node.length; }
        throw new Error(`cannot locate text offset ${offset}`);
      };
      for (const spec of [...lineSpecs].reverse()) {
        const a = locate(spec.start), b = locate(spec.end), r = document.createRange();
        r.setStart(a.node, a.offset); r.setEnd(b.node, b.offset);
        const fragment = r.extractContents(), line = document.createElement('thesis-line');
        line.append(fragment);
        if (!spec.isLast) {
          line.dataset.justify = 'true';
          const overflowPt = Math.max(0, spec.line.naturalWidth - measurePt);
          const gaps = Math.max(1, spec.line.end - spec.line.start - 1);
          const compressedPt = Math.min(overflowPt, 0.25 * gaps * spacePt, 0.36 * (widths[spec.line.end - 1] + spacePt) - 0.04 * Math.max(0, gaps - 1));
          line.style.wordSpacing = `${-Math.max(0, compressedPt) / gaps}pt`;
        }
        r.insertNode(line);
      }
      return lineSpecs;
    };
    const reflow = () => { const saved = saveSelection(); unwrap(); const specs = applyModel(); restoreSelection(saved); return specs; };
    const specs = reflow();
    window.proofSelectionText = selection.toString();
    window.proofSelectionBackward = offsetAt(selection.anchorNode, selection.anchorOffset) > offsetAt(selection.focusNode, selection.focusOffset);
    const boundaryOffset = specs[1].start, boundary = pointAt(boundaryOffset), boundaryRange = document.createRange();
    boundaryRange.setStart(boundary.node, boundary.offset); boundaryRange.collapse(true); selection.removeAllRanges(); selection.addRange(boundaryRange);
    reflow();
    window.proofCollapsedBoundaryPreserved = selection.isCollapsed && offsetAt(selection.anchorNode, selection.anchorOffset) === boundaryOffset;
    const caret = document.createRange(); caret.setStart(p.querySelector('strong').firstChild, 1); caret.collapse(true); selection.removeAllRanges(); selection.addRange(caret);
    p.addEventListener('input', reflow);
    p.addEventListener('paste', event => { event.preventDefault(); document.execCommand('insertText', false, event.clipboardData.getData('text/plain')); });
  });
  const initialText = await root.locator('p').textContent();
  console.log('stage: model applied');
  const initialVisualText = await root.innerText();
  const initialLines = await paragraph.locator(':scope > thesis-line').count();
  assert.ok(initialLines > 1);
  assert.equal(await page.evaluate(() => window.proofSelectionText), 'pha be');
  assert.equal(await page.evaluate(() => window.proofSelectionBackward), true);
  assert.equal(await page.evaluate(() => window.proofCollapsedBoundaryPreserved), true);
  const transientMarkup = await root.evaluate(el => el.innerHTML);
  const clean = thesisSourceHtml(transientMarkup);
  const semanticTextAfter = plainThesisText(clean);
  const paragraphCountAfter = (clean.match(/<p\b/gi) || []).length;
  assert.equal(clean, sourceBefore);
  assert.equal(semanticTextAfter, semanticTextBefore);
  assert.equal(paragraphCountAfter, paragraphCountBefore);
  assert.ok(!clean.includes('thesis-line'));
  assert.match(clean, /<strong>beta<\/strong>/);
  console.log('stage: actual serializer/source equality passed');

  await page.keyboard.insertText('X');
  console.log('stage: typing passed');
  const afterTyping = await root.innerText();
  assert.match(afterTyping, /bXeta/);
  await page.evaluate(() => {
    const data = new DataTransfer(); data.setData('text/plain', ' pasted');
    document.querySelector('#editor p').dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  });
  console.log('stage: synthetic paste passed');
  const afterPaste = await root.innerText();
  assert.match(afterPaste, /bX pastedeta/);
  await page.keyboard.press('Control+Z');
  console.log('stage: undo 1');
  assert.equal(await root.innerText(), afterTyping);
  await page.keyboard.press('Control+Z');
  console.log('stage: undo 2');
  const afterUndo = await root.innerText();
  assert.equal(await root.locator('p').textContent(), initialText);
  const undoRestoredOriginal = await root.locator('p').textContent() === initialText;
  await page.keyboard.press('Control+Y');
  console.log('stage: redo 1');
  assert.equal(await root.innerText(), afterTyping);
  await page.keyboard.press('Control+Y');
  console.log('stage: redo 2');
  const afterRedo = await root.innerText();
  assert.equal(afterRedo, afterPaste);
  const richRunPreserved = await root.locator('strong').innerText();
  const strongRunPreservedAfterEditing = await root.locator('strong').count() === 1;
  const nbspPreserved = await root.evaluate(el => el.innerText.includes('\u00a0'));

  const savedAfterPaste = thesisSourceHtml(await root.evaluate(el => el.innerHTML));
  const savedSemanticText = plainThesisText(savedAfterPaste);
  await page.setContent(`<!doctype html><div id="reopened">${savedAfterPaste}</div>`);
  console.log('stage: reopened');
  const reopened = page.locator('#reopened');
  assert.equal(await reopened.locator('p').count(), paragraphCountBefore);
  const reopenedHtml = await reopened.evaluate(el => el.innerHTML);
  assert.equal(thesisSourceHtml(reopenedHtml), savedAfterPaste);
  assert.equal(plainThesisText(reopenedHtml), savedSemanticText);

  const report = {
    chrome: browser.version(),
    interactionLimits: ['Paste was dispatched with a synthetic ClipboardEvent and handled as plain text; OS clipboard integration was not exercised.', 'IME composition was not simulated.', 'No real Word run was used, so this is an editor mechanism proof, not Word acceptance.'],
    sourceClean: { semanticHtmlEqualBeforeAfter: clean === sourceBefore, semanticTextEqualBeforeAfter: semanticTextAfter === semanticTextBefore, paragraphCountBefore: paragraphCountBefore, paragraphCountAfter: paragraphCountAfter, sourceHtmlBefore: sourceBefore, sourceHtmlAfter: clean },
    initialText,
    initialVisualText,
    initialModelLines: initialLines,
    backwardSelectionRestored: await page.evaluate(() => window.proofSelectionBackward),
    collapsedBoundaryRestored: await page.evaluate(() => window.proofCollapsedBoundaryPreserved),
    richRunTextBefore: strongRunTextBefore,
    richRunTextAfterEditing: richRunPreserved,
    strongRunPreservedAfterEditing,
    nbspPreserved,
    typedText: afterTyping,
    pastedText: afterPaste,
    undoRestoredOriginal,
    transientLineWrappersStrippedFromSource: !clean.includes('thesis-line'),
    redoRestoredPastedText: afterRedo === afterPaste,
    saveReopenParagraphCount: await reopened.locator('p').count(),
    saveReopenSemanticTextEqual: plainThesisText(reopenedHtml) === savedSemanticText,
  };
  await writeFile(new URL('./model-line-editor-proof.json', import.meta.url), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
