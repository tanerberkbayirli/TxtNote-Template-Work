import test from 'node:test';
import assert from 'node:assert/strict';
import { clampResizeRect, DRAG_THRESHOLD_PX, pageLocalRect, patchesForRects, textAlignmentPatch, toggleLayoutDecoration } from '../thesis/layoutInteraction.js';
import { normalizeLayoutTextStyle } from '../thesis/layoutDocument.js';

test('text alignment uses the selected page writing area and preserves box mode', () => {
  const item = { id: 'cover:text', type: 'text', editableLayout: true, editableContent: true, xMm: 70, yMm: 82, widthMm: 60,
    page: { widthMm: 210, margins: { leftMm: 35, rightMm: 25 } } };
  for (const align of ['left', 'center', 'right', 'justify']) {
    const patch = textAlignmentPatch(item, align);
    assert.equal(patch.xMm, 35);
    assert.equal(patch.widthMm, 150);
    assert.equal(patch.yMm, 82);
    assert.equal(patch.style.align, align);
    assert.deepEqual(textAlignmentPatch(item, align, 'box'), { id: item.id, style: { align } });
  }
  assert.equal(textAlignmentPatch({ ...item, locked: true }, 'right'), null);
  assert.equal(textAlignmentPatch({ ...item, editableLayout: false }, 'right'), null);
  assert.equal(textAlignmentPatch({ ...item, editableContent: false }, 'right'), null);
  assert.equal(textAlignmentPatch({ ...item, page: {} }, 'right'), null);
  assert.equal(textAlignmentPatch(item, 'invalid'), null);
  assert.equal(textAlignmentPatch({ ...item, yMm: undefined, measuredGeometry: { yMm: 95 } }, 'left').yMm, 95);
});

test('decoration commands preserve other lines and normalize either toggle order', () => {
  assert.equal(toggleLayoutDecoration('line-through', 'underline'), 'underline line-through');
  assert.equal(toggleLayoutDecoration('underline line-through', 'underline'), 'line-through');
  assert.equal(toggleLayoutDecoration('line-through', 'underline', false), 'line-through');
  assert.equal(toggleLayoutDecoration('underline', 'line-through'), 'underline line-through');
  assert.equal(normalizeLayoutTextStyle({ decoration: 'line-through underline' }).decoration, 'underline line-through');
  assert.equal(normalizeLayoutTextStyle({ decoration: 'line-through bad-token' }).decoration, undefined);
});

test('thesis layout interaction lifecycle helpers', async (t) => {
  await t.test('keeps the dragged corner fixed and preserves aspect ratio when requested', () => {
    const start = { id: 'box', xMm: 10, yMm: 12, widthMm: 20, heightMm: 10 };
    assert.deepEqual(clampResizeRect(start, 'se', 10, 5, true), { ...start, widthMm: 30, heightMm: 15 });
    assert.deepEqual(clampResizeRect(start, 'nw', 40, 40), { ...start, xMm: 29, yMm: 21, widthMm: 1, heightMm: 1 });
  });

  await t.test('converts a measured stack y coordinate to its physical page coordinate', () => {
    assert.deepEqual(pageLocalRect({ id: 'x', xMm: 8, yMm: 325, widthMm: 10, heightMm: 5 }, 1, 315), { id: 'x', xMm: 8, yMm: 10, widthMm: 10, heightMm: 5, pageIndex: 1 });
  });

  await t.test('emits one patch per changed object and ignores unchanged geometry', () => {
    const before = [{ id: 'a', xMm: 1, yMm: 2, widthMm: 3, heightMm: 4 }, { id: 'b', xMm: 5, yMm: 6, widthMm: 7, heightMm: 8 }];
    const after = [{ ...before[0] }, { ...before[1], xMm: 9 }];
    assert.deepEqual(patchesForRects(before, after), [{ id: 'b', xMm: 9, yMm: 6, widthMm: 7, heightMm: 8 }]);
    assert.equal(DRAG_THRESHOLD_PX, 3);
  });
});
