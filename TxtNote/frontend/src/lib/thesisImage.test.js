import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Görev 5B: ThesisEditor must reuse the AcademicEditor image pipeline. The old
// handler read the full-size file with FileReader and inserted a raw <figure>,
// which pushed multi-MB data URLs through every save and froze the UI.
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("ThesisEditor inserts images through the shared academicMedia pipeline", () => {
  const source = read("../features/editor/ThesisEditor.jsx");
  assert.match(source, /import \{[^}]*figureHtml[^}]*imageDimensions[^}]*readImageAsDataUrl[^}]*\} from "..\/..\/lib\/academicMedia\.js"/);
  // A photo kept as PNG was a 4 MB data URL re-processed on every keystroke (Checkpoint 1).
  assert.match(source, /await readImageAsDataUrl\(file, THESIS_IMAGE_MAX_EDGE, \{ opaqueAsJpeg: true \}\)/);
  assert.match(source, /const THESIS_IMAGE_MAX_EDGE = 1200;/);
  assert.match(source, /insertHtml\(figureHtml\(dataUrl, "", size\)\)/);
  assert.doesNotMatch(source, /FileReader/);
});

test("image controls convert zoomed screen pixels to layout pixels", () => {
  const source = read("../features/editor/AcademicImageControls.jsx");
  assert.match(source, /function zoomOf\(el\)/);
  assert.match(source, /width:r\.width\/scale/);
  assert.match(source, /\/drag\.current\.scale/);
});

test("academicMedia can store opaque PNG/WebP as the smaller JPEG", () => {
  const source = read("./academicMedia.js");
  assert.match(source, /export function readImageAsDataUrl\(file, maxEdge = 1600, \{ opaqueAsJpeg = false \} = \{\}\)/);
  assert.match(source, /jpeg\.length < url\.length \? jpeg : url/);
  // Screenshots and diagrams compress well as PNG and keep sharp, lossless text.
  assert.match(source, /url\.length < PHOTO_PNG_CHARS \|\| !isOpaque/);
});
