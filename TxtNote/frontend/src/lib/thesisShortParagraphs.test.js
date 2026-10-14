import test from "node:test";
import assert from "node:assert/strict";
import { thesisSourceHtml } from "../../../../engine/src/sourceHtml.js";
import { thesisPagedCss } from "../../../../engine/src/pageLayout.js";
import { countLines, visualLineCount, layoutShortParagraphKeeps, KEEP_LINES_ATTRIBUTE } from "../../../../engine/src/shortParagraphs.js";

// Task 7: a three-line paragraph stays whole (Word widow/orphan control); the mark is presentation state only.
test("the keep-lines mark never reaches saved HTML", () => {
  assert.equal(thesisSourceHtml('<p data-thesis-keep-lines="">Metin</p>'), "<p>Metin</p>");
  assert.equal(thesisSourceHtml('<p class="a" data-thesis-keep-lines data-x="1">Metin</p>').includes("keep-lines"), false);
});

test("the paged flow keeps marked paragraphs together", () => {
  const css = thesisPagedCss([]).join ? thesisPagedCss([]).join("\n") : String(thesisPagedCss([]));
  assert.match(css, /\[data-thesis-keep-lines\]\{break-inside:avoid !important\}/);
});

const box = (top, left = 0, width = 50, height = 20) => ({ top, bottom: top + height, left, width, height });

test("lines are counted from stacked rectangles, inline fragments of one line merge, block boxes of children add nothing", () => {
  const lines = (tops) => tops.flatMap((top) => [box(top), box(top + 2, 60, 30, 16)]);
  assert.equal(countLines(lines([0, 24, 48])), 3);
  assert.equal(countLines(lines([0, 24, 300, 324])), 4);
  assert.equal(countLines([]), 0);
  assert.equal(countLines([box(0, 0, 0, 20)]), 0);
});

test("visual lines come from text nodes only", () => {
  const rects = new Map([["a", [box(0), box(24)]], ["b", [box(48)]]]);
  let current = null;
  const doc = {
    createRange: () => ({ selectNodeContents: (node) => { current = node; }, getClientRects: () => rects.get(current.nodeValue) }),
    createTreeWalker: () => { const nodes = [{ nodeValue: "a" }, { nodeValue: "  " }, { nodeValue: "b" }]; let i = 0; return { nextNode: () => nodes[i++] || null }; },
  };
  assert.equal(visualLineCount({ ownerDocument: doc }), 3);
});

test("only controlled two- or three-line paragraphs are marked", () => {
  const nodes = [[3, "2", "2"], [4, "2", "2"], [3, "1", "1"], [2, "2", "2"]].map(([lines, orphans, widows]) => {
    const attrs = new Map();
    return { lines, closest: () => null, querySelector: () => null, hasAttribute: (n) => attrs.has(n), setAttribute: (n, v) => attrs.set(n, v), removeAttribute: (n) => attrs.delete(n), attrs, style: { orphans, widows } };
  });
  const root = { querySelectorAll: () => nodes, ownerDocument: { defaultView: { getComputedStyle: (node) => node.style } } };
  assert.equal(layoutShortParagraphKeeps(root, (node) => node.lines), "2");
  assert.deepEqual(nodes.map((n) => n.attrs.has(KEEP_LINES_ATTRIBUTE)), [true, false, false, true]);
  // A paragraph that grew loses its mark; a block-wrapping item is never a candidate.
  nodes[0].lines = 4;
  nodes[3].querySelector = () => ({});
  assert.equal(layoutShortParagraphKeeps(root, (node) => node.lines), "0");
  assert.equal(nodes[0].attrs.has(KEEP_LINES_ATTRIBUTE), false);
});

test("a controlled single line keeps its terminal-leading guard on the same page", () => {
  const nodes = [[1, '2', '2'], [0, '2', '2'], [1, '1', '1']].map(([lines, orphans, widows]) => {
    const attrs = new Map();
    return {lines, closest:()=>null, querySelector:()=>null, hasAttribute:n=>attrs.has(n), setAttribute:(n,v)=>attrs.set(n,v), removeAttribute:n=>attrs.delete(n), attrs, style:{orphans,widows}};
  });
  const root={querySelectorAll:()=>nodes,ownerDocument:{defaultView:{getComputedStyle:n=>n.style}}};
  assert.equal(layoutShortParagraphKeeps(root,n=>n.lines),'1');
  assert.deepEqual(nodes.map(n=>n.attrs.has(KEEP_LINES_ATTRIBUTE)),[true,false,false]);
});
