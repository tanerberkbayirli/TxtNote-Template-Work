import test from 'node:test';
import assert from 'node:assert/strict';
import { clampResizeRect, DRAG_THRESHOLD_PX, pageLocalRect, patchesForRects } from '../thesis/layoutInteraction.js';

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
