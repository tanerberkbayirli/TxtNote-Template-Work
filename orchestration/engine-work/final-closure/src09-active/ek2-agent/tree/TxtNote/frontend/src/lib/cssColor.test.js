import assert from "node:assert/strict";
import { test } from "node:test";
import {
  needsColorSanitizing,
  oklabToRgb,
  oklchToRgb,
  replaceUnsupportedCssColors,
} from "./cssColor.js";

test("oklab white and black map to sRGB", () => {
  assert.deepEqual(oklabToRgb(1, 0, 0), [255, 255, 255]);
  assert.deepEqual(oklabToRgb(0, 0, 0), [0, 0, 0]);
});

test("oklch() becomes rgb() html2canvas can parse", () => {
  const white = oklchToRgb("oklch(1 0 0)");
  assert.equal(white, "rgb(255, 255, 255)");
  const gray = oklchToRgb("oklch(0.5 0 0)");
  assert.match(gray, /^rgb\(/);
  assert.equal(needsColorSanitizing("oklch(0.7 0.12 45)"), true);
  assert.equal(needsColorSanitizing("rgb(17, 17, 17)"), false);
});

test("replaceUnsupportedCssColors strips oklch from stylesheets", () => {
  const css = ".x{color:oklch(0.21 0.006 285.885);background:oklch(1 0 0)}";
  const next = replaceUnsupportedCssColors(css);
  assert.equal(next.includes("oklch"), false);
  assert.match(next, /rgb\(/);
});

test("light-dark keeps the light side for print", () => {
  const next = replaceUnsupportedCssColors("color:light-dark(#111,#eee)");
  assert.match(next, /#111/);
  assert.equal(next.includes("light-dark"), false);
});
