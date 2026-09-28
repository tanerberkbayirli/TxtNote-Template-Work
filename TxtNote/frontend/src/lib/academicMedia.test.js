import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { figureHtml } from "./academicMedia.js";

describe("figureHtml", () => {
  it("wraps a data URL and caption", () => {
    const html = figureHtml("data:image/jpeg;base64,abc", "Şekil 1");
    assert.match(html, /academic-figure/);
    assert.match(html, /Şekil 1/);
    assert.match(html, /contenteditable="false"/);
  });
});
