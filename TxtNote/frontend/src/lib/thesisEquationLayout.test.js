import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { equationLayoutSignature, waitForStableEquationLayout } from "../thesis/generatedIndex.js";

function equationRoot(fonts = undefined) {
  const document = { fonts, defaultView: { getComputedStyle: (node) => node.computedStyle } };
  const node = (tagName, rect, attributes = {}, computedStyle = {}) => ({
    ownerDocument: document,
    tagName,
    textContent: tagName === "SPAN" ? "E=mc2" : "Paragraph",
    attributes,
    computedStyle: { marginTop: "0px", marginBottom: "0px", paddingTop: "0px", paddingBottom: "0px", lineHeight: "27.6px", fontSize: "12pt", top: "0px", ...computedStyle },
    getAttribute(name) { return this.attributes[name] ?? null; },
    querySelector(selector) { return this.children?.[selector] || null; },
    getBoundingClientRect() { return { ...rect }; },
  });
  const previous = node("P", { left: 10, top: 20, right: 200, bottom: 45, width: 190, height: 25 }, {}, { marginBottom: "27.6px" });
  const equation = node("SPAN", { left: 10, top: 50, right: 200, bottom: 80, width: 190, height: 30 }, {
    "data-latex": "E = mc^2", "data-thesis-eq": "(3.1)", "data-thesis-eq-side": "right",
    "data-thesis-eq-pad-before": "27.581", "data-thesis-eq-pad-after": "27.6", "data-thesis-eq-drop": "6.475",
  }, { marginTop: "-27.581px", marginBottom: "-27.6px" });
  const next = node("P", { left: 10, top: 100, right: 200, bottom: 125, width: 190, height: 25 }, {}, { marginTop: "27.6px" });
  equation.children = {
    ".katex-html": node("SPAN", { left: 20, top: 54, right: 120, bottom: 76, width: 100, height: 22 }),
    "[data-thesis-eq-probe]": node("SPAN", { left: 20, top: 56, right: 80, bottom: 72, width: 60, height: 16 }),
  };
  previous.nextElementSibling = equation; equation.previousElementSibling = previous; equation.nextElementSibling = next; next.previousElementSibling = equation;
  const root = { ownerDocument: document, querySelectorAll: () => [equation], getBoundingClientRect: () => ({ left: 0, top: 0, right: 220, bottom: 400 }) };
  return { root, equation, next };
}

describe("generic thesis equation export readiness", () => {
  it("signs equation measurement attributes and adjacent block geometry", () => {
    const { root, equation, next } = equationRoot({ status: "loaded" });
    const original = equationLayoutSignature(root);
    equation.attributes["data-thesis-eq-drop"] = "8.475";
    assert.notEqual(equationLayoutSignature(root), original, "a changed measured drop must invalidate readiness");
    equation.attributes["data-thesis-eq-drop"] = "6.475";
    next.getBoundingClientRect = () => ({ left: 10, top: 102, right: 200, bottom: 127, width: 190, height: 25 });
    assert.notEqual(equationLayoutSignature(root), original, "a moved neighbouring paragraph must invalidate readiness");
    next.getBoundingClientRect = () => ({ left: 10, top: 100, right: 200, bottom: 125, width: 190, height: 25 });
    equation.children[".katex-html"].getBoundingClientRect = () => ({ left: 20, top: 55, right: 120, bottom: 77, width: 100, height: 22 });
    assert.notEqual(equationLayoutSignature(root), original, "changed KaTeX render geometry must invalidate readiness");
  });

  it("remeasures only after fonts finish, then waits for consecutive stable frames", async () => {
    let resolveFonts;
    const fonts = { status: "loading", ready: new Promise((resolve) => { resolveFonts = resolve; }) };
    const { root } = equationRoot(fonts);
    let frameCount = 0, prepareCount = 0, state = "before-fonts";
    const signature = await waitForStableEquationLayout(root, {
      stableFrames: 2,
      maxFrames: 10,
      nextFrame: () => {
        frameCount += 1;
        if (frameCount === 2) { fonts.status = "loaded"; state = "remeasured"; resolveFonts(); }
        return Promise.resolve();
      },
      prepare: () => { assert.equal(fonts.status, "loaded"); prepareCount += 1; },
      readSnapshot: () => state,
    });
    assert.equal(signature, "remeasured");
    assert.equal(prepareCount, 1);
    assert.ok(frameCount >= 5, "the same state must persist across multiple frames");
  });

  it("fails within the frame budget instead of allowing an unstable export", async () => {
    const { root } = equationRoot();
    let snapshots = 0, frames = 0;
    await assert.rejects(waitForStableEquationLayout(root, {
      stableFrames: 2, maxFrames: 4, nextFrame: () => { frames += 1; return Promise.resolve(); }, readSnapshot: () => String(++snapshots),
    }), /did not stabilize within 4 animation frames; PDF export cancelled/);
    assert.equal(frames, 4);
    assert.equal(snapshots, 3, "the first frame remeasures the DOM; three later states were inspected");
  });
});
