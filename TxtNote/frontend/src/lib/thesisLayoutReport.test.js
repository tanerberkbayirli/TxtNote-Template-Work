import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutPageReport } from '../thesis/layoutReport.js';

test('layout report uses the painted baseline and physical page origin, with stable landmark IDs', () => {
  const op = (text, baseline, x = 30) => ({ type: 'text', text, x, top: baseline - 8, width: 20, baseline,
    style: { fontFamily: '"Times New Roman"', fontSize: '16px' }, exportedFont: 'TimesNewRoman',
    landmark: { id: 'body:heading:chapter-1', kind: 'heading', sectionId: 'body' } });
  const page = layoutPageReport({ ops: [op('Heading', 220), op('continued', 235)],
    pageTop: 200, mmPerPx: .25, page: 2, groupId: 'body', label: '1', widthMm: 210, heightMm: 297 });
  assert.equal(page.landmarks[0].id, 'body:heading:chapter-1');
  assert.equal(page.landmarks[0].firstBaselineMm, 5);
  assert.equal(page.landmarks[0].lastBaselineMm, 8.75);
  assert.equal(page.landmarks[0].linePitchMm, 3.75);
  assert.equal(page.landmarks[0].fontSizePt, 12);
  assert.equal(page.textOps[0].xMm, 7.5);
  assert.equal(page.textOps[0].exportedFont, 'TimesNewRoman');
});

test('layout report retains non-text table-row and footnote-area geometry', () => {
  const page = layoutPageReport({ ops: [], boxes: [{ id: 's:table-row:1', kind: 'table-row', sectionId: 's',
    left: 120, top: 430, width: 600, height: 20 }], pageTop: 400, mmPerPx: .25,
    page: 2, groupId: 's', widthMm: 210, heightMm: 297 });
  assert.equal(page.landmarks[0].xMm, 30);
  assert.equal(page.landmarks[0].yMm, 7.5);
  assert.equal(page.landmarks[0].heightMm, 5);
  assert.equal(page.landmarks[0].firstBaselineMm, null);
  assert.equal(page.firstBodyBaselineMm, null);
});
