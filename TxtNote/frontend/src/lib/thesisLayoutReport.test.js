import assert from 'node:assert/strict';
import { test } from 'node:test';
import { layoutLandmarkIndex, layoutPageBoxes, layoutPageReport } from '../thesis/layoutReport.js';

const text = (overrides = {}) => ({ type: 'text', text: 'Evidence', x: 20, top: 120,
  width: 30, baseline: 130, style: { fontFamily: '"Times New Roman", serif', fontSize: '16px' },
  exportedFont: 'TimesNewRomanPSMT', landmark: { id: 'body:paragraph:1', kind: 'paragraph', sectionId: 'body' }, ...overrides });
const report = (ops, boxes = []) => layoutPageReport({ ops, boxes, pageTop: 100, mmPerPx: .25,
  page: 2, groupId: 'body', label: '1', widthMm: 210, heightMm: 297 });

test('report uses page-local mm, pt and painted font identity without changing operations', () => {
  const ops = [text(), text({ top: 140, baseline: 150, text: 'Second line' })];
  const before = structuredClone(ops);
  const page = report(ops);
  assert.deepEqual(ops, before);
  assert.equal(page.textOps[0].yMm, 5);
  assert.equal(page.textOps[0].baselineMm, 7.5);
  assert.equal(page.landmarks[0].fontSizePt, 12);
  assert.deepEqual(page.landmarks[0].exportedFonts, ['TimesNewRomanPSMT']);
  assert.equal(page.landmarks[0].linePitchMm, 5);
  assert.equal(page.landmarks[0].lineCount, 2);
  assert.equal(page.firstBodyBaselineMm, 7.5);
  assert.equal(page.lastBodyBaselineMm, 12.5);
});

test('row and footnote containers inherit text metrics while body baselines exclude their text', () => {
  for (const kind of ['table-row', 'footnote-area', 'special-block']) {
    const parent = { id: `body:${kind}:1`, kind, sectionId: 'body' };
    const page = report([text({ landmark: { ...text().landmark, ancestors: [parent] } })],
      [{ ...parent, left: 10, top: 110, width: 80, height: 40 }]);
    const mark = page.landmarks.find(mark => mark.id === parent.id);
    assert.equal(mark.text, 'Evidence');
    assert.equal(mark.fontFamily, 'Times New Roman');
    assert.equal(mark.firstBaselineMm, 7.5);
    assert.equal(mark.yMm, 2.5);
    assert.equal(mark.heightMm, 10);
    assert.equal(page.firstBodyBaselineMm, null);
    assert.equal(page.lastBodyBaselineMm, null);
  }
});

test('spanning boxes appear on both pages, clipped to sheets rather than the inter-page gap', () => {
  const boxes = [{ id: 'body:table-row:1', top: 90, left: 0, width: 20, height: 150 }];
  assert.deepEqual(layoutPageBoxes(boxes, 0, 100), [{ ...boxes[0], height: 10 }]);
  assert.deepEqual(layoutPageBoxes(boxes, 120, 100), [{ ...boxes[0], top: 120, height: 100 }]);
  assert.deepEqual(layoutPageBoxes([{ ...boxes[0], top: 101, height: 10 }], 0, 100), []);
  assert.equal(boxes[0].height, 150);
});

test('empty page has explicit null baselines and no fabricated geometry', () => {
  const page = report([]);
  assert.deepEqual(page.landmarks, []);
  assert.equal(page.firstBodyBaselineMm, null);
  assert.equal(page.lastBodyBaselineMm, null);
});

test('anchored IDs are deterministic and duplicate anchors cannot merge distinct elements', () => {
  const element = (tag, attrs = {}, parentElement = null) => ({ parentElement,
    matches: selector => selector.split(',').includes(tag),
    hasAttribute: key => Object.hasOwn(attrs, key), getAttribute: key => attrs[key] ?? null,
    closest: selector => selector === '[data-thesis-flow-section]' ? { getAttribute: () => 'body' } : null });
  const row = element('tr');
  const first = element('p', { 'data-layout-id': 'anchor' }, row);
  const second = element('p', { 'data-layout-id': 'anchor' });
  const stack = { querySelectorAll: () => [row, first, second] };
  const a = layoutLandmarkIndex(stack, 'body'), b = layoutLandmarkIndex(stack, 'body');
  assert.equal(a.forElement(first).id, 'body:paragraph:anchor');
  assert.equal(a.forElement(second).id, 'body:paragraph:anchor:instance:2');
  assert.equal(a.forElement(first).ancestors[0].kind, 'table-row');
  assert.deepEqual(a.forElement(first), b.forElement(first));
  assert.deepEqual(a.forElement(second), b.forElement(second));
});

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
