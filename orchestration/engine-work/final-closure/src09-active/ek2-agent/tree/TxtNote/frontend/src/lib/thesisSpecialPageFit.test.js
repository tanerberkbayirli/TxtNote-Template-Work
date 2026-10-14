import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateSpecialPageFit, reflowPositionedSpecialPage, specialPageFitWarnings } from "../thesis/specialPageFit.js";

const MM = 96 / 25.4;
const box = (id, fixed, top, bottom, left = 0, right = 500) => ({ id, fixed, top, bottom, left, right });
const content = { top: 0, bottom: 1000 };

describe("special page fit", () => {
  it("pushes later source anchors down only when expanded text reaches them", () => {
    const title = { ...box("title", true, 100, 450), nominalHeight: 100 };
    const label = { ...box("label", true, 400, 500), nominalHeight: 100 };
    const name = { ...box("name", true, 520, 600), nominalHeight: 80 };
    assert.deepEqual(reflowPositionedSpecialPage([name, title, label]), { title: 0, label: 50, name: 30 });
    assert.deepEqual(reflowPositionedSpecialPage([{ ...title, bottom: 200 }, label, name]), { title: 0, label: 0, name: 0 });
    assert.equal(reflowPositionedSpecialPage([title, { ...label, left: 600, right: 800 }]).label, 0);
  });

  it("preserves intentional source containment and pushes an anchor below flowing text", () => {
    assert.deepEqual(reflowPositionedSpecialPage([
      { ...box("frame", true, 0, 800), nominalHeight: 800 },
      { ...box("title", true, 100, 200), nominalHeight: 100 },
    ]), { frame: 0, title: 0 });
    assert.deepEqual(reflowPositionedSpecialPage([
      box("flowing", false, 100, 450), { ...box("label", true, 400, 500), nominalHeight: 100 },
    ]), { label: 50 });
  });
  it("is ok when flowing content ends above the next fixed block and the bottom margin", () => {
    const fit = evaluateSpecialPageFit({ contentBox: content, blocks: [box("0", false, 0, 300), box("1", true, 400, 500)] });
    assert.deepEqual(fit, { overflowMm: 0, overlaps: [], status: "ok" });
  });

  it("reports overflow in mm without altering the blocks", () => {
    const blocks = [box("0", false, 0, 1000 + 10 * MM)];
    const fit = evaluateSpecialPageFit({ contentBox: content, blocks });
    assert.equal(fit.status, "overflow");
    assert.equal(fit.overflowMm, 10);
    assert.equal(blocks[0].bottom, 1000 + 10 * MM);
  });

  it("reports flowing content that grew into a fixed block as overlap", () => {
    const fit = evaluateSpecialPageFit({ contentBox: content, blocks: [box("0", false, 0, 450), box("1", true, 400, 500)] });
    assert.equal(fit.status, "overlap");
    assert.deepEqual(fit.overlaps, [{ a: "0", b: "1", overlapMm: Math.round(50 / MM * 10) / 10 }]);
  });

  it("reports two positioned text blocks that collide and is independent of block order", () => {
    const blocks = [box("title", true, 100, 450), box("label", true, 400, 500)];
    const fit = evaluateSpecialPageFit({ contentBox: content, blocks });
    assert.equal(fit.status, "overlap");
    assert.equal(fit.overlaps.length, 1);
    assert.equal(fit.overlaps[0].overlapMm, Math.round(50 / MM * 10) / 10);
    assert.equal(evaluateSpecialPageFit({ contentBox: content, blocks: [...blocks].reverse() }).status, "overlap");
  });

  it("does not report a fixed block above the flowing one, a block beside it, or containment", () => {
    assert.equal(evaluateSpecialPageFit({ contentBox: content, blocks: [box("0", false, 100, 300), box("1", true, 0, 100)] }).status, "ok");
    assert.equal(evaluateSpecialPageFit({ contentBox: content, blocks: [box("0", false, 0, 300, 0, 200), box("1", true, 0, 300, 300, 500)] }).status, "ok");
    assert.equal(evaluateSpecialPageFit({ contentBox: content, blocks: [box("0", false, 100, 200, 50, 300), box("1", true, 0, 400, 0, 500)] }).status, "ok");
  });

  it("checks fixed blocks against the page edge, not the bottom margin", () => {
    const pageBox = { top: -100, bottom: 1100 };
    assert.equal(evaluateSpecialPageFit({ contentBox: content, pageBox, blocks: [box("0", true, 1020, 1060)] }).status, "ok");
    assert.equal(evaluateSpecialPageFit({ contentBox: content, pageBox, blocks: [box("0", true, 1020, 1100 + 5 * MM)] }).overflowMm, 5);
  });

  it("lets overflow win over overlap and words Turkish advisory messages", () => {
    const fit = evaluateSpecialPageFit({ contentBox: content, blocks: [box("0", false, 0, 1000 + 12.4 * MM), box("1", true, 900, 950, 100, 700)] });
    assert.equal(fit.status, "overflow");
    assert.equal(specialPageFitWarnings(fit, "Kapak", "cover")[0], "Kapak sayfasında içerik 12,4 mm taşıyor: Kapak");
    assert.equal(specialPageFitWarnings(fit, "Kapak").length, 2);
    assert.deepEqual(specialPageFitWarnings({ status: "ok" }, "Kapak"), []);
  });
});
