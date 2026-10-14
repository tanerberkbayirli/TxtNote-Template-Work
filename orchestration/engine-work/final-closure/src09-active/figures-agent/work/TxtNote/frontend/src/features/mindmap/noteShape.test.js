import assert from "node:assert/strict";
import { test } from "node:test";
import { FLOWCHART_SHAPES, NOTE_SHAPE } from "./constants.js";
import { documentPath, isPolygonalNote, resolveNoteShape, shapePoints } from "./noteShape.js";

test("her akış diyagramı sembolü tanınır, bilinmeyen dikdörtgene düşer", () => {
  assert.equal(FLOWCHART_SHAPES.length, 5);
  for (const shape of FLOWCHART_SHAPES) assert.equal(resolveNoteShape(shape), shape);
  assert.equal(resolveNoteShape("nope"), NOTE_SHAPE.RECTANGLE);
});

test("karar eşkenar dörtgeni dört tepe noktasına sahiptir", () => {
  assert.deepEqual(shapePoints(NOTE_SHAPE.DIAMOND, 200, 100, 0), [
    [100, 0],
    [200, 50],
    [100, 100],
    [0, 50],
  ]);
});

test("paralelkenar sağa yatık ve kutu içinde kalır", () => {
  const points = shapePoints(NOTE_SHAPE.PARALLELOGRAM, 200, 100, 0);
  assert.equal(points.length, 4);
  assert.ok(points[0][0] > points[3][0]);
  for (const [x, y] of points) assert.ok(x >= 0 && x <= 200 && y >= 0 && y <= 100);
});

test("oval ve dikdörtgen çokgen değildir, belge ve diğerleri çokgendir", () => {
  assert.equal(isPolygonalNote(NOTE_SHAPE.OVAL), false);
  assert.equal(isPolygonalNote(NOTE_SHAPE.RECTANGLE), false);
  assert.equal(isPolygonalNote(NOTE_SHAPE.DIAMOND), true);
  assert.equal(isPolygonalNote(NOTE_SHAPE.DOCUMENT), true);
});

test("belge yolu kapalı ve dalgalı alt kenar içerir", () => {
  const path = documentPath(176, 128);
  assert.match(path, /^M/);
  assert.equal((path.match(/Q/g) ?? []).length, 2);
  assert.ok(path.endsWith("Z"));
});
