import assert from 'node:assert/strict';
import { chromium } from '../../../../tools/node_modules/playwright/index.mjs';
import { thesisSourceHtml } from '../../../../../TxtNote/frontend/src/thesis/sourceHtml.js';

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
try {
  const page = await browser.newPage({ viewport: { width: 600, height: 400 } });
  await page.setContent(`<!doctype html><style>
    #editor { width: 190px; font: 16px Arial; text-align: justify; white-space: pre-wrap; }
    #editor p { margin: 0; }
    [data-thesis-mirror] { white-space: pre; }
  </style><div id="editor" contenteditable="true"><p>Alpha <strong>beta</strong> gamma&nbsp;delta epsilon zeta eta theta iota kappa lambda mu.</p></div>`);
  const root = page.locator('#editor');
  const initialText = await root.innerText();
  const initialLayout = await page.evaluate(() => {
    const p = document.querySelector('#editor p');
    const range = document.createRange();
    const result = [];
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      for (const match of node.data.matchAll(/\S+/g)) {
        range.setStart(node, match.index); range.setEnd(node, match.index + match[0].length);
        result.push({ text: match[0], top: Math.round(range.getBoundingClientRect().top) });
      }
    }
    return result;
  });
  await page.evaluate(() => {
    const p = document.querySelector('#editor p');
    const selection = getSelection();
    const range = document.createRange();
    const beta = p.querySelector('strong').firstChild;
    range.setStart(p.firstChild, 2); range.setEnd(beta, 2);
    selection.removeAllRanges(); selection.addRange(range);
    const wrapSpaces = () => {
      const textNodes = [];
      const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      for (const text of textNodes) {
        if (!text.data.includes(' ')) continue;
        const fragment = document.createDocumentFragment();
        let start = 0;
        for (const match of text.data.matchAll(/ /g)) {
          fragment.append(document.createTextNode(text.data.slice(start, match.index)));
          const span = document.createElement('span');
          span.setAttribute('data-thesis-mirror', 'gap');
          span.textContent = ' ';
          fragment.append(span);
          start = match.index + 1;
        }
        fragment.append(document.createTextNode(text.data.slice(start)));
        text.replaceWith(fragment);
      }
    };
    const offsetAt = (node, nodeOffset) => {
      const r = document.createRange(); r.selectNodeContents(p); r.setEnd(node, nodeOffset); return r.toString().length;
    };
    const offset = () => offsetAt(selection.anchorNode, selection.anchorOffset);
    const restorePoint = (value) => {
      let left = value;
      const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const text = walker.currentNode;
        if (left <= text.length) { const r = document.createRange(); r.setStart(text, left); r.collapse(true); selection.removeAllRanges(); selection.addRange(r); return; }
        left -= text.length;
      }
    };
    const restorePair = (anchor, focus) => {
      restorePoint(anchor);
      const anchorNode = selection.anchorNode, anchorOffset = selection.anchorOffset;
      restorePoint(focus);
      selection.setBaseAndExtent(anchorNode, anchorOffset, selection.anchorNode, selection.anchorOffset);
    };
    const selected = selection.toString();
    const anchor = offset(), focus = (() => { const r = document.createRange(); r.selectNodeContents(p); r.setEnd(selection.focusNode, selection.focusOffset); return r.toString().length; })();
    wrapSpaces(); restorePair(anchor, focus);
    p.dataset.selectedText = selection.toString();
    const betaText = p.querySelector('strong').firstChild;
    const caret = document.createRange(); caret.setStart(betaText, 2); caret.collapse(true); selection.removeAllRanges(); selection.addRange(caret);
    p.dataset.reflow = 'ready';
    p.addEventListener('input', () => {
      const caretOffset = offset();
      for (const span of p.querySelectorAll('[data-thesis-mirror]')) span.replaceWith(...span.childNodes);
      p.normalize(); wrapSpaces(); restorePoint(caretOffset);
    });
    p.addEventListener('paste', (event) => {
      event.preventDefault();
      document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
    });
    p.dataset.originalSelection = selected;
  });
  assert.equal(await root.innerText(), initialText);
  assert.ok(new Set(initialLayout.map(item => item.top)).size > 1, 'fixture text must wrap to multiple lines');
  assert.deepEqual(await root.evaluate(el => el.querySelectorAll('[data-thesis-mirror]').length), 10);
  assert.equal(await root.locator('p').getAttribute('data-selected-text'), 'pha be');
  const saved = thesisSourceHtml(await root.evaluate(el => el.innerHTML));
  assert.ok(!saved.includes('data-thesis-mirror'));
  assert.match(saved, /Alpha <strong>beta<\/strong> gamma/);

  const lineSnapshot = () => page.evaluate(() => {
    const p = document.querySelector('#editor p'), range = document.createRange(), items = [];
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) for (const match of walker.currentNode.data.matchAll(/[\p{L}\p{N}]+/gu)) {
      range.setStart(walker.currentNode, match.index); range.setEnd(walker.currentNode, match.index + match[0].length);
      items.push({ text: match[0], top: Math.round(range.getBoundingClientRect().top) });
    }
    const rows = [...new Set(items.map(item => item.top))].sort((a, b) => a - b);
    return items.map(item => `${item.text}@${rows.indexOf(item.top)}`);
  });
  const baselineWrappedLines = await lineSnapshot();
  await root.locator('[data-thesis-mirror]').evaluateAll(nodes => nodes.forEach(node => { node.style.marginRight = '-8px'; }));
  const adjustedWrappedLines = await lineSnapshot();
  await root.locator('[data-thesis-mirror]').evaluateAll(nodes => nodes.forEach(node => { node.style.marginRight = ''; }));

  await page.keyboard.insertText('X');
  const afterInsert = await root.innerText();
  assert.match(afterInsert, /beXta/);
  assert.equal(await root.evaluate(el => el.querySelectorAll('[data-thesis-mirror]').length), 10);
  await page.evaluate(() => {
    const data = new DataTransfer(); data.setData('text/plain', ' pasted');
    document.querySelector('#editor p').dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  });
  const afterPaste = await root.innerText();
  assert.match(afterPaste, /beX pastedta/);
  await page.keyboard.press('Control+Z');
  assert.equal(await root.innerText(), afterInsert);
  await page.keyboard.press('Control+Z');
  const afterUndo = await root.innerText();
  const report = {
    initialText,
    initialLineCount: new Set(initialLayout.map(item => item.top)).size,
    baselineWrappedLines,
    adjustedWrappedLines,
    perGapMarginChangedWrapping: adjustedWrappedLines.join('|') !== baselineWrappedLines.join('|'),
    wrappers: await root.evaluate(el => el.querySelectorAll('[data-thesis-mirror]').length),
    selectionAfterInsert: afterInsert,
    textAfterPaste: afterPaste,
    textAfterUndo: afterUndo,
    undoRestoredOriginal: afterUndo === initialText,
    sourceHasNoPresentationWrappers: !saved.includes('data-thesis-mirror'),
    strongRunPreserved: await root.locator('strong').innerText(),
    nbspRetained: await root.evaluate(el => el.innerText.includes('\u00a0')),
  };
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
