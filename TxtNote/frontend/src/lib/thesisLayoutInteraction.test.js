import test from 'node:test';
import assert from 'node:assert/strict';
import { clampResizeRect, DRAG_THRESHOLD_PX, pageLocalRect, patchesForRects, textAlignmentPatch, toggleLayoutDecoration, layoutHitTarget } from '../../../../engine/src/layoutInteraction.js';
import { normalizeLayoutTextStyle } from '../../../../engine/src/layoutDocument.js';

test('engine alignment defaults to the existing frame without changing geometry or template indents', () => {
  for (const layoutMode of ['flow', 'absolute', 'anchored']) {
    const item = { id: 'text', type: 'text', editableLayout: true, editableContent: true,
      layoutMode, xMm: 48, yMm: 56, widthMm: 96, style: { leftIndentMm: 10 } };
    for (const align of ['left', 'center', 'right', 'center']) {
      assert.deepEqual(textAlignmentPatch(item, align), { id: item.id, style: { align } });
    }
  }
});

test('engine hit testing selects visible content through empty overlapping frames', () => {
  const rect = { left: 10, right: 30, top: 10, bottom: 20 };
  const text = { id: 'text', type: 'text', paintRects: [rect] };
  const image = { id: 'image', type: 'image' };
  const underneath = { id: 'underneath', type: 'text', paintRects: [{ ...rect, left: 40, right: 60 }] };
  assert.equal(layoutHitTarget([text, image], { x: 20, y: 15 }), text);
  assert.equal(layoutHitTarget([text, image], { x: 50, y: 15 }), image);
  assert.equal(layoutHitTarget([text, underneath], { x: 50, y: 15 }), underneath);
  assert.equal(layoutHitTarget([text], { x: 50, y: 15 }), text);
  assert.equal(layoutHitTarget([image, text], { x: 20, y: 15 }), image);
  assert.equal(layoutHitTarget([{ type: 'group' }, { type: 'spacer' }], { x: 20, y: 15 }), null);
});

test('text alignment reaches page edges and preserves writing-area and box modes', () => {
  const item = { id: 'cover:text', type: 'text', editableLayout: true, editableContent: true, xMm: 70, yMm: 82, widthMm: 60,
    page: { widthMm: 210, margins: { leftMm: 35, rightMm: 25 } } };
  for (const align of ['left', 'center', 'right', 'justify']) {
    const patch = textAlignmentPatch(item, align, 'page');
    assert.equal(patch.xMm, 0);
    assert.equal(patch.widthMm, 210);
    assert.equal(patch.yMm, 82);
    assert.equal(patch.style.align, align);
    const content = textAlignmentPatch(item, align, 'content');
    assert.equal(content.xMm, 35);
    assert.equal(content.widthMm, 150);
    assert.deepEqual(textAlignmentPatch(item, align, 'box'), { id: item.id, style: { align } });
  }
  assert.equal(textAlignmentPatch({ ...item, locked: true }, 'right'), null);
  assert.equal(textAlignmentPatch({ ...item, editableLayout: false }, 'right'), null);
  assert.deepEqual(textAlignmentPatch({ ...item, editableContent: false }, 'right'), { id: item.id, style: { align: 'right' } });
  assert.equal(textAlignmentPatch({ ...item, page: {} }, 'right', 'page'), null);
  assert.equal(textAlignmentPatch(item, 'invalid'), null);
  assert.equal(textAlignmentPatch({ ...item, yMm: undefined, measuredGeometry: { yMm: 95 } }, 'left', 'page').yMm, 95);
});

test('alignment never accumulates a positioned block baseline paint offset', () => {
  let item = { id: 'cover:text', type: 'text', editableLayout: true, editableContent: true,
    layoutMode: 'absolute', xMm: 40, yMm: 30, widthMm: 145, wordBaseline: true,
    page: { widthMm: 210, margins: { leftMm: 40, rightMm: 25 } } };
  for (const align of ['right', 'center', 'left', 'center', 'right', 'center']) {
    const patch = textAlignmentPatch({ ...item, canonical: item, measuredGeometry: { yMm: item.yMm - 1.075 } }, align, 'page');
    assert.equal(patch.yMm, 30);
    assert.equal(patch.xMm + patch.widthMm / 2, 105);
    item = { ...item, ...patch };
  }
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
